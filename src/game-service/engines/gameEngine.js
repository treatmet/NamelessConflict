var pickup = require('../entities/pickup.js');
var block = require('../entities/block.js');
var thug = require('../entities/thug.js');
var player = require('../entities/player.js');
var dataAccessFunctions = require('../../shared/data_access/dataAccessFunctions.js');
var dataAccess = require('../../shared/data_access/dataAccess.js');
var mapEngine = require('./mapEngine.js');

var secondsSinceLastServerSync = syncServerWithDbInterval - 2;

var changeTeams = function(playerId){
	var playerList = player.getPlayerList();
 	console.log("change teams: " + playerList[playerId]);
	if (playerList[playerId]){
		if (playerList[playerId].holdingBag){
		
			if (playerList[playerId].team == 1){
				bagBlue.captured = false;
				updateMisc.bagBlue = bagBlue;
			}
			else if (playerList[playerId].team == 2){
				bagRed.captured = false;
				updateMisc.bagRed = bagRed;
			}
			playerList[playerId].holdingBag = false;
			updatePlayerList.push({id:playerList[playerId].id,property:"holdingBag",value:playerList[playerId].holdingBag});				
		}
		if (playerList[playerId].team == 1){
			playerList[playerId].team = 2;
			updatePlayerList.push({id:SOCKET_LIST[playerId].id,property:"team",value:playerList[playerId].team});
			SOCKET_LIST[playerId].emit('addToChat', 'CHANGING TO THE OTHER TEAM.');
		}
		else if (playerList[playerId].team == 2){
			playerList[playerId].team = 1;
			updatePlayerList.push({id:SOCKET_LIST[playerId].id,property:"team",value:playerList[playerId].team});
			SOCKET_LIST[playerId].emit('addToChat', 'CHANGING TO THE OTHER TEAM.');
		}
		SOCKET_LIST[playerId].team = playerList[playerId].team;
		playerList[playerId].respawn();			
		dataAccessFunctions.dbGameServerUpdate();
		
		//Abandon party
		if (playerList[playerId].partyId == playerList[playerId].cognitoSub){ //Leaving a party that user is the leader of (disband ALL party members' partyId)
			for (var p in playerList){
				if (playerList[p].partyId == playerList[playerId].partyId){
					playerList[p].partyId = playerList[p].cognitoSub;
				}
			}
			dataAccess.dbUpdateAwait("RW_USER", "set", {partyId: playerList[playerId].partyId}, {partyId:""}, async function(err, userRes){
			});	
		}
		else { //Leaving someone else's party
			playerList[playerId].partyId = playerList[playerId].cognitoSub;
			dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: playerList[playerId].cognitoSub}, {partyId:""}, async function(err, userRes){
			});	
		}
	}
}


function calculateTeamAvgRating(team){
	var blackPlayers = 0;
	var blackTotalScore = 0;
	var whitePlayers = 0;
	var whiteTotalScore = 0;
	var enemyTeamAvgRating = 0;
	var playerList = player.getPlayerList();
	for (var i in playerList){
		if (playerList[i].team == 1){
			whitePlayers++;
			whiteTotalScore += playerList[i].rating;
		}
		else if (playerList[i].team == 2){
			blackPlayers++;
			blackTotalScore += playerList[i].rating;
		}
	}
	
	if (team == 1){
		enemyTeamAvgRating = whiteTotalScore / whitePlayers;
	}
	else if (team == 2){
		enemyTeamAvgRating = blackTotalScore / blackPlayers;		
	}
	if (enemyTeamAvgRating == undefined || enemyTeamAvgRating == null || isNaN(enemyTeamAvgRating)){enemyTeamAvgRating = -1;}
	return enemyTeamAvgRating;
}

function calculateEndgameStats(){
	logg("---CALCULATING ENDGAME STATS!---");
	console.log(player.getPlayerList());
	getAllPlayersFromDB(function(mongoRes){
		//Get CURRENT player rating and experience from mongo (before any stats from this game are added)
		updatePlayersRatingAndExpWithMongoRes(mongoRes);		
		console.log(player.getPlayerList());
		var whiteAverageRating = calculateTeamAvgRating(1);
		var blackAverageRating = calculateTeamAvgRating(2);
		
		if (whiteAverageRating == -1 && blackAverageRating != -1)
			whiteAverageRating = blackAverageRating;
		if (blackAverageRating == -1 && whiteAverageRating != -1)
			blackAverageRating = whiteAverageRating;
		
		
				
		//Calculate progress made, and send to client (and then update user's DB stats)
		var playerList = player.getPlayerList();
		for (var p in playerList){
			if (playerList[p].team == 0)
				continue;
			
			var gamesLostInc = 0;
			var gamesWonInc = 0;
			var ptsGained = 0;
			
			SOCKET_LIST[p].emit('sendLog', "Player in endgame loop...");

			var enemyAverageRating = playerList[p].team == 1 ? blackAverageRating : whiteAverageRating;
			if ((playerList[p].team == 1 && whiteScore > blackScore) || (playerList[p].team == 2 && whiteScore < blackScore)){
				//win
				gamesWonInc++;
				ptsGained = Math.round(matchWinLossRatingBonus + (enemyAverageRating - playerList[p].rating)/enemySkillDifferenceDivider);
				if (ptsGained < 3){ptsGained = 3;}		
				if (ptsGained > 50){ptsGained = 50;} //Gain cap		
				logg(playerList[p].name + " had " + playerList[p].rating + " pts, and beat a team with " + enemyAverageRating + " pts. He gained " + ptsGained);
				playerList[p].cashEarnedThisGame+=winCash; //Not sending this update to the clients because it is only used for server-side experience calculation, not displaying on scoreboard
			}
			else {
				//loss
				gamesLostInc++;
				ptsGained = Math.round(-matchWinLossRatingBonus + (enemyAverageRating - playerList[p].rating)/enemySkillDifferenceDivider);
				if (ptsGained > -1){ptsGained = -1;}		
				if (ptsGained < -20){ptsGained = -20;} //Loss cap		
				logg(playerList[p].name + " had " + playerList[p].rating + " pts, and lost to a team with " + enemyAverageRating + " pts. He lost " + ptsGained);
				playerList[p].cashEarnedThisGame+=loseCash; //Not sending this update to the clients because it is only used for server-side experience calculation, not displaying on scoreboard
			}
			//Prevent player from having sub zero ranking
			if (playerList[p].rating + ptsGained < 0){
				ptsGained += Math.abs(playerList[p].rating + ptsGained);
			}

			//Trigger client's end of game progress results report
			var endGameProgressResults = {};
			endGameProgressResults.originalRating = playerList[p].rating;
			endGameProgressResults.ratingDif = ptsGained;
			endGameProgressResults.originalExp = playerList[p].experience;
			endGameProgressResults.expDif = playerList[p].cashEarnedThisGame;

			var rankProgressInfo = getRankFromRating(playerList[p].rating);
			endGameProgressResults.rank = rankProgressInfo.rank;
			endGameProgressResults.nextRank = rankProgressInfo.nextRank;
			endGameProgressResults.previousRank = rankProgressInfo.previousRank;
			endGameProgressResults.rankFloor = rankProgressInfo.floor;
			endGameProgressResults.rankCeiling = rankProgressInfo.ceiling;

			var experienceProgressInfo = getLevelFromExperience(playerList[p].experience);
			endGameProgressResults.level = experienceProgressInfo.level;
			endGameProgressResults.experienceFloor = experienceProgressInfo.floor;
			endGameProgressResults.experienceCeiling = experienceProgressInfo.ceiling;		
			log(playerList[p].name + "'s endGameProgressResults:");
			console.log(endGameProgressResults);
			SOCKET_LIST[p].emit('endGameProgressResults', endGameProgressResults);
			SOCKET_LIST[p].emit('sendLog', "endGameResults:");
			SOCKET_LIST[p].emit('sendLog', endGameProgressResults);

			//update user's DB stats
			dataAccessFunctions.dbUserUpdate("inc", playerList[p].cognitoSub, {kills:playerList[p].kills, deaths:playerList[p].deaths, captures:playerList[p].captures, steals:playerList[p].steals, returns:playerList[p].returns, cash: playerList[p].cashEarnedThisGame, experience: playerList[p].cashEarnedThisGame, gamesWon:gamesWonInc, gamesLost:gamesLostInc, gamesPlayed: 1, rating: ptsGained});
		}
	});
}

function updatePlayersRatingAndExpWithMongoRes(mongoRes){
	if (!mongoRes){
		mongoRes = [];		
	}
	
	var pCount = 0;
	var totalPlayers = getNumPlayersInGame();
	var playerList = player.getPlayerList();

	for (var p in playerList){
		pCount++;
		for (var r in mongoRes){
			if (playerList[p].cognitoSub == mongoRes[r].cognitoSub){		
				playerList[p].rating = mongoRes[r].rating;
				playerList[p].experience = mongoRes[r].experience;				
				logg("[" + pCount + "/" + totalPlayers + "] Got player[" + playerList[p].id + "] from db. Rating:" + playerList[p].rating + " Experience:" + playerList[p].experience);
				break;
			}
		}
	}	
}

var getNumPlayersInGame = function(){
	var totalPlayers = 0;
	var playerList = player.getPlayerList();

	for (var p in playerList){
		totalPlayers++;
	}
	
	return totalPlayers;
}

function getNumTeamPlayersInGame(){ //getCurrentPlayers in game actual players
	var totalPlayers = 0;
	var playerList = player.getPlayerList();

	for (var p in playerList){
		if (playerList[p].team != 0)
		totalPlayers++;
	}
	
	return totalPlayers;
}

function spawnSafely(entity){
	var coords = getSafeCoordinates(entity.team);
	entity.x = coords.x;
	entity.y = coords.y;
}

function getEntityById(id){
	if (player.getPlayerById(id)){
		return player.getPlayerById(id);
	}
	else if (thug.getThugById(id)){
		return thug.getThugById(id);
	}
	else if (block.getBlockById(id)){
		return block.getBlockById(id);
	}
	else {
		return 0;
	}
}

function getSafeCoordinates(team){
	var potentialX = mapWidth/2;
	var potentialY = mapHeight/2;
	if (team === 0){
		return {x:potentialX,y:potentialY};
	}

	for (var w = 0; w < 100; w++){
		if (gametype == "ctf"){
			if (team == 1) {			
				potentialX = randomInt(spawnXminWhite,spawnXmaxWhite);			
				potentialY = randomInt(spawnYminWhite,spawnYmaxWhite);
			}
			else if (team == 2) {			
				potentialX = randomInt(spawnXminBlack,spawnXmaxBlack);			
				potentialY = randomInt(spawnYminBlack,spawnYmaxBlack);
			}
		}
		else {
			potentialX = randomInt(0,mapWidth);			
			potentialY = randomInt(0,mapHeight);
		}

		if (!block.isSafeCoords(potentialX, potentialY)){continue;}
		if (!thug.isSafeCoords(potentialX, potentialY, team)){continue;}
		if (!player.isSafeCoords(potentialX, potentialY, team)){continue;}
		break;
	}
	return {x:potentialX,y:potentialY};
}

function processEntityPush(entity){
	if (entity.pushSpeed > 0){
		var subtractPushSpeed = Math.floor(entity.pushSpeed / 10); 
		entity.pushSpeed -= subtractPushSpeed;
		if (entity.pushSpeed > pushMaxSpeed){entity.pushSpeed = pushMaxSpeed;}
		
		if(entity.pushDir == 1){
			entity.y -= entity.pushSpeed;
		}
		else if(entity.pushDir == 3){
			entity.x += entity.pushSpeed;
		}
		else if(entity.pushDir == 5){
			entity.y += entity.pushSpeed;
		}
		else if(entity.pushDir == 7){
			entity.x -= entity.pushSpeed;
		}
		else if(entity.pushDir == 2){
			entity.x += (entity.pushSpeed) * (2/3);
			entity.y -= (entity.pushSpeed) * (2/3);
		}
		else if(entity.pushDir == 4){
			entity.x += (entity.pushSpeed) * (2/3);
			entity.y += (entity.pushSpeed) * (2/3);
		}
		else if(entity.pushDir == 6){
			entity.x -= (entity.pushSpeed) * (2/3);
			entity.y += (entity.pushSpeed) * (2/3);
		}
		else if(entity.pushDir == 8){
			entity.x -= (entity.pushSpeed) * (2/3);
			entity.y -= (entity.pushSpeed) * (2/3);
		}						
		entity.pushSpeed--;

		if (player.getPlayerById(entity.id)){
			updatePlayerList.push({id:entity.id,property:"x",value:entity.x});
			updatePlayerList.push({id:entity.id,property:"y",value:entity.y});
		}
		else if (thug.getThugById(entity.id)){
			updateThugList.push({id:entity.id,property:"x",value:entity.x});
			updateThugList.push({id:entity.id,property:"y",value:entity.y});
		}
	}
}
//checkIfIsGameOver
function checkForGameOver(){
	//GAME IS OVER, GAME END, ENDGAME GAMEOVER GAME OVER	
	if (gameOver == false){	
		//End by time
		if ((secondsLeft <= 0 && minutesLeft <= 0) && (gameSecondsLength > 0 || gameMinutesLength > 0) && whiteScore != blackScore){ 
			if (gametype == "ctf"){
				if (whiteScore == blackScore - 1 && (bagBlue.x != bagBlue.homeX || bagBlue.y != bagBlue.homeY)){
					//Chance for last capture
				}
				else if (blackScore == whiteScore - 1 && (bagRed.x != bagRed.homeX || bagRed.y != bagRed.homeY)){
					//Chance for last capture
				}
				else {
					endGame(); //End game on time ctf
				}
			}
			else {
				endGame(); //End game on time slayer
			}
		}
		//End by score
		else if (scoreToWin > 0 && (whiteScore >= scoreToWin || blackScore >= scoreToWin)){
			endGame();
		}
	}
}

function endGame(){
	gameOver = true;
	logg("GAME OVER! team1:" + whiteScore + " team2:" + blackScore);
	calculateEndgameStats();
	nextGameTimer = timeBeforeNextGame;			
	updateMisc.nextGameTimer = nextGameTimer;
	updateMisc.gameOver = {
		gameIsOver: true,
		voteMap:voteMap,
		voteGametype:voteGametype
	};
}

function moveBags(){
	if (bagRed.speed > 0){
		if (bagRed.direction == 1){
			bagRed.y -= bagRed.speed;
		}
		else if (bagRed.direction == 2){
			bagRed.y -= bagRed.speed * (2/3);
			bagRed.x += bagRed.speed * (2/3);
		}
		else if (bagRed.direction == 3){
			bagRed.x += bagRed.speed;
		}
		else if (bagRed.direction == 4){
			bagRed.y += bagRed.speed * (2/3);
			bagRed.x += bagRed.speed * (2/3);
		}
		else if (bagRed.direction == 5){
			bagRed.y += bagRed.speed;
		}
		else if (bagRed.direction == 6){
			bagRed.y += bagRed.speed * (2/3);
			bagRed.x -= bagRed.speed * (2/3);
		}
		else if (bagRed.direction == 7){
			bagRed.x -= bagRed.speed;
		}
		else if (bagRed.direction == 8){
			bagRed.y -= bagRed.speed * (2/3);
			bagRed.x -= bagRed.speed * (2/3);
		}
		if (bagRed.speed <= 20){//To allow catching up to the thrown bag via boosting and catching it (usually cant grab a bag thrown by yourself)
			bagRed.playerThrowing = 0;			
		}
		updateMisc.bagRed = bagRed;
		bagRed.speed--;
	}
	else if (bagRed.speed <= 0){
		bagRed.speed = 0;
		bagRed.direction = 0;
		bagRed.playerThrowing = 0;			
	}
	
	if (bagBlue.speed > 0){
		if (bagBlue.direction == 1){
			bagBlue.y -= bagBlue.speed;
		}
		else if (bagBlue.direction == 2){
			bagBlue.y -= bagBlue.speed * (2/3);
			bagBlue.x += bagBlue.speed * (2/3);
		}
		else if (bagBlue.direction == 3){
			bagBlue.x += bagBlue.speed;
		}
		else if (bagBlue.direction == 4){
			bagBlue.y += bagBlue.speed * (2/3);
			bagBlue.x += bagBlue.speed * (2/3);
		}
		else if (bagBlue.direction == 5){
			bagBlue.y += bagBlue.speed;
		}
		else if (bagBlue.direction == 6){
			bagBlue.y += bagBlue.speed * (2/3);
			bagBlue.x -= bagBlue.speed * (2/3);
		}
		else if (bagBlue.direction == 7){
			bagBlue.x -= bagBlue.speed;
		}
		else if (bagBlue.direction == 8){
			bagBlue.y -= bagBlue.speed * (2/3);
			bagBlue.x -= bagBlue.speed * (2/3);
		}
		if (bagBlue.speed <= 20){ //To allow catching up to the thrown bag via boosting and catching it (usually cant grab a bag thrown by yourself)
			bagBlue.playerThrowing = 0;			
		}
		updateMisc.bagBlue = bagBlue;
		bagBlue.speed--;
	}
	else if (bagBlue.speed <= 0){
		bagBlue.speed = 0;
		bagBlue.direction = 0;
		bagBlue.playerThrowing = 0;			
	}

	//Check Bag collision with blocks
	var blockList = block.getBlockList();
	if (bagBlue.speed > 0){
		for (var i in blockList){
			if (bagBlue.x > blockList[i].x && bagBlue.x < blockList[i].x + blockList[i].width && bagBlue.y > blockList[i].y && bagBlue.y < blockList[i].y + blockList[i].height){												
				if (blockList[i].type == "normal" || blockList[i].type == "red" || blockList[i].type == "blue"){
					var overlapTop = Math.abs(blockList[i].y - bagBlue.y);  
					var overlapBottom = Math.abs((blockList[i].y + blockList[i].height) - bagBlue.y);
					var overlapLeft = Math.abs(bagBlue.x - blockList[i].x);
					var overlapRight = Math.abs((blockList[i].x + blockList[i].width) - bagBlue.x);			
					if (overlapTop <= overlapBottom && overlapTop <= overlapRight && overlapTop <= overlapLeft){
						bagBlue.y = blockList[i].y;
						updateMisc.bagBlue = bagBlue;
					}
					else if (overlapBottom <= overlapTop && overlapBottom <= overlapRight && overlapBottom <= overlapLeft){
						bagBlue.y = blockList[i].y + blockList[i].height;
						updateMisc.bagBlue = bagBlue;
					}
					else if (overlapLeft <= overlapTop && overlapLeft <= overlapRight && overlapLeft <= overlapBottom){
						bagBlue.x = blockList[i].x;
						updateMisc.bagBlue = bagBlue;
					}
					else if (overlapRight <= overlapTop && overlapRight <= overlapLeft && overlapRight <= overlapBottom){
						bagBlue.x = blockList[i].x + blockList[i].width;
						updateMisc.bagBlue = bagBlue;
					}
				}
				else if (blockList[i].type == "pushUp"){
					bagBlue.y -= pushStrength;
					if (bagBlue.y < blockList[i].y){bagBlue.y = blockList[i].y;}
					updateMisc.bagBlue = bagBlue;
				}
				else if (blockList[i].type == "pushRight"){
					bagBlue.x += pushStrength;
					if (bagBlue.x > blockList[i].x + blockList[i].width){bagBlue.x = blockList[i].x + blockList[i].width;}
					updateMisc.bagBlue = bagBlue;
				}
				else if (blockList[i].type == "pushDown"){
					bagBlue.y += pushStrength;
					if (bagBlue.y > blockList[i].y + blockList[i].height){bagBlue.y = blockList[i].y + blockList[i].height;}
					updateMisc.bagBlue = bagBlue;
				}
				else if (blockList[i].type == "pushLeft"){
					bagBlue.x -= pushStrength;
					if (bagBlue.x < blockList[i].x){bagBlue.x = blockList[i].x;}
					updateMisc.bagBlue = bagBlue;
				}
				else if (blockList[i].type == "warp1"){
					bagBlue.x = warp1X;
					bagBlue.y = warp1Y;
					updateMisc.bagBlue = bagBlue;
				}
				else if (blockList[i].type == "warp2"){
					bagBlue.x = warp2X;
					bagBlue.y = warp2Y;
					updateMisc.bagBlue = bagBlue;
				}
			}// End check if bag is overlapping block
		}//End blockList loop		
	}
	if (bagRed.speed > 0){		
		for (var i in blockList){
			if (bagRed.x > blockList[i].x && bagRed.x < blockList[i].x + blockList[i].width && bagRed.y > blockList[i].y && bagRed.y < blockList[i].y + blockList[i].height){												
				if (blockList[i].type == "normal" || blockList[i].type == "red" || blockList[i].type == "blue"){
					var overlapTop = Math.abs(blockList[i].y - bagRed.y);  
					var overlapBottom = Math.abs((blockList[i].y + blockList[i].height) - bagRed.y);
					var overlapLeft = Math.abs(bagRed.x - blockList[i].x);
					var overlapRight = Math.abs((blockList[i].x + blockList[i].width) - bagRed.x);			
					if (overlapTop <= overlapBottom && overlapTop <= overlapRight && overlapTop <= overlapLeft){
						bagRed.y = blockList[i].y;
						updateMisc.bagRed = bagRed;
					}
					else if (overlapBottom <= overlapTop && overlapBottom <= overlapRight && overlapBottom <= overlapLeft){
						bagRed.y = blockList[i].y + blockList[i].height;
						updateMisc.bagRed = bagRed;
					}
					else if (overlapLeft <= overlapTop && overlapLeft <= overlapRight && overlapLeft <= overlapBottom){
						bagRed.x = blockList[i].x;
						updateMisc.bagRed = bagRed;
					}
					else if (overlapRight <= overlapTop && overlapRight <= overlapLeft && overlapRight <= overlapBottom){
						bagRed.x = blockList[i].x + blockList[i].width;
						updateMisc.bagRed = bagRed;
					}
				}
				else if (blockList[i].type == "pushUp"){
					bagRed.y -= pushStrength;
					if (bagRed.y < blockList[i].y){bagRed.y = blockList[i].y;}
					updateMisc.bagRed = bagRed;
				}
				else if (blockList[i].type == "pushRight"){
					bagRed.x += pushStrength;
					if (bagRed.x > blockList[i].x + blockList[i].width){bagRed.x = blockList[i].x + blockList[i].width;}
					updateMisc.bagRed = bagRed;
				}
				else if (blockList[i].type == "pushDown"){
					bagRed.y += pushStrength;
					if (bagRed.y > blockList[i].y + blockList[i].height){bagRed.y = blockList[i].y + blockList[i].height;}
					updateMisc.bagRed = bagRed;
				}
				else if (blockList[i].type == "pushLeft"){
					bagRed.x -= pushStrength;
					if (bagRed.x < blockList[i].x){bagRed.x = blockList[i].x;}
					updateMisc.bagRed = bagRed;
				}
				else if (blockList[i].type == "warp1"){
					bagRed.x = warp1X;
					bagRed.y = warp1Y;
					updateMisc.bagRed = bagRed;
				}
				else if (blockList[i].type == "warp2"){
					bagRed.x = warp2X;
					bagRed.y = warp2Y;
					updateMisc.bagRed = bagRed;
				}

			}// End check if bag is overlapping block
		}//End blockList loop		
	}
	
	if (bagRed.x > mapWidth){bagRed.x = mapWidth; updateMisc.bagRed = bagRed;}
	if (bagRed.y > mapHeight){bagRed.y = mapHeight; updateMisc.bagRed = bagRed;}
	if (bagRed.x < 0){bagRed.x = 0; updateMisc.bagRed = bagRed;}
	if (bagRed.y < 0){bagRed.y = 0; updateMisc.bagRed = bagRed;}

	if (bagBlue.x > mapWidth){bagBlue.x = mapWidth; updateMisc.bagBlue = bagBlue;}
	if (bagBlue.y > mapHeight){bagBlue.y = mapHeight; updateMisc.bagBlue = bagBlue;}
	if (bagBlue.x < 0){bagBlue.x = 0; updateMisc.bagBlue = bagBlue;}
	if (bagBlue.y < 0){bagBlue.y = 0; updateMisc.bagBlue = bagBlue;}
}

var capture = function(team) {
	if (team == 1){
		whiteScore++;
		bagBlue.captured = false;
		bagBlue.x = bagBlue.homeX;
		bagBlue.y = bagBlue.homeY;
		updateMisc.bagBlue = bagBlue;
	}
	else if (team == 2){
		blackScore++;
		bagRed.captured = false;
		bagRed.x = bagRed.homeX;
		bagRed.y = bagRed.homeY;
		updateMisc.bagRed = bagRed;
	}
	for (var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];	
		socket.emit('capture', team, whiteScore, blackScore);
	}
}

var sendCapturesToClient = function(socket){
	socket.emit('capture', 'reset', whiteScore, blackScore);
}

var killScore = function(team){
	if (team == 1){
		whiteScore++;
	}
	else if (team == 2){
		blackScore++;
	}
	for (var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('killScore', team, whiteScore, blackScore);		
	}
}

var assignSpectatorsToTeam = function(assignEvenIfFull){
	//First, get the current team sizes
	var moreWhitePlayers = 0; 
	for (var p in playerList){
		if (playerList[p].team == 1){moreWhitePlayers++;}
		else if (playerList[p].team == 2){moreWhitePlayers--;}
	}
	
	//Then get the parties, ordered by party size
	var parties = [];	
	/*
	[
		{
			partyId: "123456",
			partySize: 2,
			playerIds: ["1234","5678"],
			avgPartyRanking: 1000
		},
		{
			partyId: "123456",
			partySize: 1,
			playerIds: ["1234"],
			avgPartyRanking: 1200
		}

	]
	*/	
	var playerList = player.getPlayerList();
	for (var l in playerList){
		if (playerList[l].team != 0){ //only process spectators
			continue;
		}
		var addedToParty = false;
		for (var p = 0; p < parties.length; p++){
			if (typeof playerList[l].partyId != 'undefined' && playerList[l].partyId == parties[p].partyId && playerList[l].partyId.length > 0){
				parties[p].partySize++;
				parties[p].playerIds.push(playerList[l].id);
				addedToParty = true;
				break;
			}
		}
		if (!addedToParty && typeof playerList[l].id != 'undefined'){
			var newParty = {partyId: playerList[l].partyId, partySize: 1, playerIds: [playerList[l].id]};
			parties.push(newParty);
		}
	}
	parties.sort(comparePartySize);

		
	logg("ATTEMPTING TO ADD SPECTATORS");
	//Assign team to spectating parties
	for (var q = 0; q < parties.length; q++){
		var newGameZise=parties[q].partySize + getNumTeamPlayersInGame();
		logg("IF WE ADD YOU, IS NEW GAME SIZE(" + newGameZise + ") greater than maxPlayers (" + maxPlayers);
		if (parties[q].partySize + getNumTeamPlayersInGame() > maxPlayers && !assignEvenIfFull)
			continue;
			
		if (moreWhitePlayers <= 0){
			for (var r = 0; r < parties[q].playerIds.length; r++){
				if (typeof playerList[parties[q].playerIds[r]] === 'undefined')
					continue;
				playerList[parties[q].playerIds[r]].team = 1;
				moreWhitePlayers++;
				playerList[parties[q].playerIds[r]].respawn();
			}
		}
		else {
			for (var r = 0; r < parties[q].playerIds.length; r++){
				if (typeof playerList[parties[q].playerIds[r]] === 'undefined')
					continue;
				playerList[parties[q].playerIds[r]].team = 2;
				moreWhitePlayers--;
				playerList[parties[q].playerIds[r]].respawn();
			}
		}
	}
}



function restartGame(){
	tabulateVotes();
	assignSpectatorsToTeam(true);
	rebalanceTeams();
	initializeNewGame();
	dataAccessFunctions.dbGameServerUpdate();		
}

//Updates gametype, map based on postgame player votes
function tabulateVotes(){
	if (ctfVotes > slayerVotes && gametype == "slayer"){
		scoreToWin = 3;
		gametype = "ctf";
	}
	else if (ctfVotes < slayerVotes && gametype == "ctf"){
		scoreToWin = 50;
		gametype = "slayer";
	}
	
	if (thePitVotes > longestVotes && thePitVotes > crikVotes){
		map = "thepit";
	}
	else if (longestVotes > thePitVotes && longestVotes > crikVotes){
		map = "longest";
	}
	else if (crikVotes > thePitVotes && crikVotes > longestVotes){
		map = "crik";
	}
	
	ctfVotes = 0;
	slayerVotes = 0;
	thePitVotes = 0;
	longestVotes = 0;
	crikVotes = 0;
	voteMapIds = [];
	voteGametypeIds = [];	
}

function rebalanceTeams(){
	var playerList = player.getPlayerList();
	var moreWhitePlayers = 0; 
	for (var p in playerList){
		if (playerList[p].team == 1){moreWhitePlayers++;}
		else if (playerList[p].team == 2){moreWhitePlayers--;}
	}

	logg("REBALANCING TEAMS1: Teams are off by " + Math.abs(moreWhitePlayers));
	
	if (Math.abs(moreWhitePlayers) > 1){
	
		//Get parties
		var inGameParties = [];
		var whiteParties = [];
		var blackParties = [];
		
		for (var l in playerList){
			var addedToParty = false;
			for (var p = 0; p < inGameParties.length; p++){
				if (typeof playerList[l].partyId != 'undefined' && playerList[l].partyId == inGameParties[p].partyId && playerList[l].partyId.length > 0){
					inGameParties[p].partySize++;
					inGameParties[p].playerIds.push(playerList[l].id);
					addedToParty = true;
					break;
				}
			}
			if (!addedToParty && typeof playerList[l].id != 'undefined'){
				var newParty = {partyId: playerList[l].partyId, partySize: 1, playerIds: [playerList[l].id]};
				inGameParties.push(newParty);
			}
		}		
		inGameParties.sort(comparePartySize);		
		
		for (var gp = 0; gp < inGameParties.length; gp++){
			if (playerList[inGameParties[gp].playerIds[0]].team == 1){
				whiteParties.push(inGameParties[gp]);
			}
			else if (playerList[inGameParties[gp].playerIds[0]].team == 2){
				blackParties.push(inGameParties[gp]);
			}
		}	
		whiteParties.sort(comparePartySize);
		blackParties.sort(comparePartySize);
		/*
			[
				{
					partyId: "123456",
					partySize: 1,
					playerIds: ["1234"]
				},
				{
					partyId: "123456",
					partySize: 1,
					playerIds: ["1234"]
				}			
			]
		*/
		
		var biggerTeamsParties = blackParties;		
		if (moreWhitePlayers > 0){
			biggerTeamsParties = whiteParties;
		}
		
		logg("REBALANCING TEAMS2.1: Largest team's parties, in asc size:");
		console.log(biggerTeamsParties);

		
		//Assign players to new teams if it makes them more balanced
		for (var q = 0; q < biggerTeamsParties.length; q++){
			var howClose = Math.abs(Math.abs(moreWhitePlayers) - biggerTeamsParties[q].partySize*2);
			logg("REBALANCING TEAMS2.2: ANALYZING THIS PARTY:");
			console.log(biggerTeamsParties[q]);
			logg("REBALANCING TEAMS2.3: THIS PARTY CAN MAKE THE TEAMS THIS CLOSE: " + howClose + ". IS THAT BETTER THAN CURRENT DISPARITY: " + moreWhitePlayers);
			if (howClose < Math.abs(moreWhitePlayers)){
				
				if (moreWhitePlayers < 0){
					for (var r = 0; r < biggerTeamsParties[q].playerIds.length; r++){				
						if (typeof playerList[biggerTeamsParties[q].playerIds[r]] === 'undefined'){
							logg("REBALANCING TEAMS ERROR - PLAYER NOT FOUND IN PARTY");
							continue;
						}

						logg("REBALANCING TEAMS3: ADDING THIS TEAM[" + playerList[biggerTeamsParties[q].playerIds[r]].team + "]GUY: " + biggerTeamsParties[q].playerIds[r] + " FROM THIS PARTY " + biggerTeamsParties[q].partyId + " TO TEAM 1");
						playerList[biggerTeamsParties[q].playerIds[r]].team = 1;
						moreWhitePlayers += 2;
					}
				}
				else {
					for (var r = 0; r < biggerTeamsParties[q].playerIds.length; r++){
						if (typeof playerList[biggerTeamsParties[q].playerIds[r]] === 'undefined'){
							logg("REBALANCING TEAMS ERROR - PLAYER NOT FOUND IN PARTY");
							continue;
						}
						logg("REBALANCING TEAMS3: ADDING THIS TEAM[" + playerList[biggerTeamsParties[q].playerIds[r]].team + "]GUY: " + biggerTeamsParties[q].playerIds[r] + " FROM THIS PARTY " + biggerTeamsParties[q].partyId + " TO TEAM 2");
	
					playerList[biggerTeamsParties[q].playerIds[r]].team = 2;
						moreWhitePlayers -=2;
					}
				}				
				
				
				
			}
			logg("REBALANCING TEAMS - PARTY ADDED, ARE WE EVEN NOW? moreWhitePlayers:" + moreWhitePlayers);
			if (Math.abs(moreWhitePlayers) <= 1){
				break;
			}			
		}
	}
}

function initializeNewGame(){
	gameOver = false;
	pregame = false;

	whiteScore = 0;
	blackScore = 0;
	minutesLeft = gameMinutesLength;
	secondsLeft = gameSecondsLength;
	var secondsLeftPlusZero = secondsLeft.toString();	
	if (secondsLeft < 10){
		secondsLeftPlusZero = "0" + secondsLeft.toString();
	}	
	if (gametype == "slayer"){
		respawnTimeLimit = slayerRespawnTimeLimit;
	}
	else if (gametype == "ctf"){
		respawnTimeLimit = ctfRespawnTimeLimit;
	}

	var thugList = thug.getThugList();
	for (var t in thugList){
		for(var i in SOCKET_LIST){
			SOCKET_LIST[i].emit('removeThug', thugList[t].id);
		}			
	}
	thug.clearThugList();
	ensureCorrectThugCount();
	mapEngine.initializePickups(map);
	mapEngine.initializeBlocks(map);
	logg("Initializing map: " + map + " Dimensions:" + mapWidth + "," + mapHeight);


	for (var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		sendCapturesToClient(socket);
	}
	updateMisc.gameOver = gameOver;	
	updateMisc.bagRed = bagRed;
	updateMisc.bagBlue = bagBlue;
	updateMisc.mapWidth = mapWidth;
	updateMisc.mapHeight = mapHeight;
	updateMisc.variant = {};
	updateMisc.variant.map = map;
	updateMisc.variant.gametype = gametype;
	updateMisc.variant.scoreToWin = scoreToWin;
	if (gameMinutesLength > 0 || gameSecondsLength > 0){
		updateMisc.variant.timeLimit = true;
	}
	else {
		updateMisc.variant.timeLimit = false;
	}
	
	var playerList = player.getPlayerList();
	for(var i in playerList){		
		playerList[i].cash = startingCash;
		playerList[i].cashEarnedThisGame = 0;
		playerList[i].kills = 0;
		playerList[i].deaths = 0;
		playerList[i].steals = 0;
		playerList[i].returns = 0;
		playerList[i].captures = 0;				
		updatePlayerList.push({id:playerList[i].id,property:"cash",value:playerList[i].cash});
		updatePlayerList.push({id:playerList[i].id,property:"cashEarnedThisGame",value:playerList[i].cashEarnedThisGame});
		updatePlayerList.push({id:playerList[i].id,property:"kills",value:playerList[i].kills});
		updatePlayerList.push({id:playerList[i].id,property:"deaths",value:playerList[i].deaths});
		updatePlayerList.push({id:playerList[i].id,property:"steals",value:playerList[i].steals});
		updatePlayerList.push({id:playerList[i].id,property:"returns",value:playerList[i].returns});
		updatePlayerList.push({id:playerList[i].id,property:"captures",value:playerList[i].captures});	
		playerList[i].respawn();
	}//End player for loop update

	for(var i in SOCKET_LIST){
		SOCKET_LIST[i].emit('sendClock',secondsLeftPlusZero, minutesLeft);
		SOCKET_LIST[i].emit('gameStart');
		SOCKET_LIST[i].emit('addToChat', getObjectiveText(), 0);
		sendFullGameStatus(SOCKET_LIST[i].id);
	}	



}

function ensureCorrectThugCount(){
	var expectedWhiteThugs = 0;
	var expectedBlackThugs = 0;
	var whiteThugs = 0;
	var blackThugs = 0;
	var playerList = player.getPlayerList();
	var thugList = thug.getThugList();
	
	for (var p in playerList){
		if (playerList[p].team == 1){
			expectedBlackThugs++;
		}
		else if (playerList[p].team == 2){
			expectedWhiteThugs++;
		}
	}	
	for (var t in thugList){
		if (thugList[t].team == 1){
			whiteThugs++;
		}
		else if (thugList[t].team == 2){
			blackThugs++;
		}
	}
	
	//Delete all thugs if Thug setting is disabled, or more than "thugLimit" players
	if (!spawnOpposingThug || (expectedWhiteThugs + expectedBlackThugs > thugLimit)){
		for (var t in thugList){
			for(var i in SOCKET_LIST){
				SOCKET_LIST[i].emit('removeThug', thugList[t].id);
			}			
			delete thugList[t];
		}
		return;
	}

	
	while (whiteThugs > expectedWhiteThugs){
		for (var t in thugList){
			if (thugList[t].team == 1){
			for(var i in SOCKET_LIST){
				SOCKET_LIST[i].emit('removeThug', thugList[t].id);
			}			
			delete thugList[t];
			whiteThugs--;
			break;
			}
		}
	}
	while (blackThugs > expectedBlackThugs){
		for (var t in thugList){
			if (thugList[t].team == 2){
			for(var i in SOCKET_LIST){
				SOCKET_LIST[i].emit('removeThug', thugList[t].id);
			}			
			delete thugList[t];
			blackThugs--;
			break;
			}
		}
	}

	while (whiteThugs < expectedWhiteThugs){
		var coords = getSafeCoordinates(1);
		thug.createThug(Math.random(), 1, coords.x, coords.y);	
		whiteThugs++;
	}
	while (blackThugs < expectedBlackThugs){
		var coords = getSafeCoordinates(2);
		thug.createThug(Math.random(), 2, coords.x, coords.y);			
		blackThugs++;
	}

}

var getAllPlayersFromDB = function(cb){
	var cognitoSubsInGame = [];
	var playerList = player.getPlayerList();

	for (var i in playerList){
		cognitoSubsInGame.push(playerList[i].cognitoSub);
	}
	
	var searchParams = { cognitoSub: { $in: cognitoSubsInGame } };	
	dataAccess.dbFindAwait("RW_USER", searchParams, async function(err, res){
		if (res && res[0]){
			cb(res);
		}
		else {
			cb(false);
		}
	});		
}

var joinGame = function(cognitoSub, username, team, partyId){
	log("Attempting to join game..." + cognitoSub);

	log("Listing all currently connected sockets");
	for (var s in SOCKET_LIST){
		logg("id:" + SOCKET_LIST[s].id + " cognitoSub:" + SOCKET_LIST[s].cognitoSub);
	}

	var socket = SOCKET_LIST[getSocketIdFromCognitoSub(cognitoSub)];
	if (!socket){
		log("ERROR!!! Socket not yet connected to game server, or cognitoSub has not been set on socket!");
		return;
	}
	socket.team = team;
	socket.partyId = partyId;
	log("!!!!Player signing into game server - socketID: " + socket.id + " cognitoSub: " + cognitoSub + " username: " + username + " team: " + team + " partyId: " + partyId);
	player.connect(socket, cognitoSub, username, team, partyId);
	dataAccessFunctions.dbGameServerUpdate();
	socket.emit('signInResponse',{success:true,id:socket.id, mapWidth:mapWidth, mapHeight:mapHeight, whiteScore:whiteScore, blackScore:blackScore});
}


//TIMER1 - EVERY FRAME timer1 tiemer1 tiemr1
//------------------------------------------------------------------------------
const tickLengthMs = 1000/60;
var previousTick = Date.now();
var ticksSinceLastSecond = 0;
var warnCount = 0;

var gameLoop = function(){
	ticksSinceLastSecond++;
	if (pause == true)
		return;
	
	player.runPlayerEngines();
	thug.runThugEngines();
		
	if (gametype == "ctf"){
		moveBags();
	}

	var veforeTimer = Date.now();
	for (var i in SOCKET_LIST){			
		var socket = SOCKET_LIST[i];			
		const teamFilteredUpdateEffectList = updateEffectList.filter(function(effect){
			if (effect.type != 7){
				return effect;
			}
			else if (effect.type == 7 && (!effect.team || (player.getPlayerById(socket.id) && effect.team == player.getPlayerById(socket.id).team))){
				return effect;
			}
		});
		socket.emit('update', updatePlayerList, updateThugList, updatePickupList, updateNotificationList, teamFilteredUpdateEffectList, updateMisc);
	}
	var msSinceLastTick = Date.now() - previousTick;
	var msSinceEmit = Date.now() - veforeTimer;
	//console.log("Sent " + msSinceLastTick + "ms after last tick. Emit took " + msSinceEmit + "ms");
	updatePlayerList = [];
	updateThugList = [];
	updatePickupList = [];
	updateNotificationList = [];
	updateEffectList = []; 	//1=shot, 2=blood, 3=boost, 4=smash, 5=body, 6=notification?, 7=chat
	updateMisc = {};		

	checkForGameOver();
}

var HighResolutionTimer = function(options) {
    this.timer = false;

    this.total_ticks = 0;

    this.start_time = undefined;
    this.current_time = undefined;

    this.duration = (options.duration) ? options.duration : 1000;
    this.callback = (options.callback) ? options.callback : function() {};

    this.run = function() {
      this.current_time = Date.now();
      if (!this.start_time) { this.start_time = this.current_time; }
      
      this.callback(this);

	  var nextTick = this.duration - (this.current_time - (this.start_time + (this.total_ticks * this.duration) ) );
	  if (nextTick < this.duration - this.duration/2){nextTick = this.duration/2;}

	  this.total_ticks++;

      (function(i) {
        i.timer = setTimeout(function() {
          i.run();
        }, nextTick);
      }(this));

      return this;
    };

    this.stop = function(){
      clearTimeout(this.timer);
      return this;
    };
    
    return this;
};

var _timer = HighResolutionTimer({
    duration: tickLengthMs,
    callback: gameLoop
});
_timer.run();


//------------------------------------------------------------------------------
//EVERY 1 SECOND
const secondLengthMs = 1000;
var previousSecond = Date.now();
var nextSecond = Date.now() + secondLengthMs;
var sloppyTimerWindowMs = 16;

secondIntervalLoop();
function secondIntervalLoop(){
	var now = Date.now();

	if (previousSecond + secondLengthMs - sloppyTimerWindowMs <= now){
		previousSecond = now;
		nextSecond += secondLengthMs;
		while (nextSecond < Date.now()){
			nextSecond += secondLengthMs;
		}

		secondIntervalFunction();
	}
	
	if (Date.now() - previousSecond < secondLengthMs - sloppyTimerWindowMs){ //if the current time is NOT within a very short time from the NEXT time code should be executed
		var aFewMsBeforeNextLoopShouldExecute = (nextSecond - Date.now()) - sloppyTimerWindowMs;
		if (aFewMsBeforeNextLoopShouldExecute < 0){aFewMsBeforeNextLoopShouldExecute = 0;}
			
		setTimeout(secondIntervalLoop, aFewMsBeforeNextLoopShouldExecute); //sloppy timer
	}
	else {
		setImmediate(secondIntervalLoop); //DO IT NOW!!
	}
}


var secondIntervalFunction = function(){
	//log("ticksSinceLastSecond:" + ticksSinceLastSecond + " Time:" + Date.now() + " TargetNextSecond:" + nextSecond + " WARNING_COUNT:" + warnCount);
	warnCount = 0;
	ticksSinceLastSecond = 0;
	if (pause == true)
		return;
			
	//Post game voting updates
	if (gameOver == true){
		for (var i in SOCKET_LIST){
			if (typeof SOCKET_LIST[i].cognitoSub === 'undefined'){
				continue;
			}
			
			var socket = SOCKET_LIST[i];
			
			var votesData = {
				ctfVotes:ctfVotes,
				slayerVotes:slayerVotes,
				thePitVotes:thePitVotes,
				longestVotes:longestVotes, 
				crikVotes:crikVotes,
			};
			
			socket.emit('votesUpdate',votesData);
		}
	}
	
	//Clock shit
	if ((gameMinutesLength > 0 || gameSecondsLength > 0) && !gameOver){
		if (!pregame){
			if (secondsLeft > 0){
				secondsLeft--;
			}
			else {
				if (minutesLeft > 0){
					minutesLeft--;
					secondsLeft = 59;
				}
				else {
					//END GAME
				}			
			}
		}				
		var secondsLeftPlusZero = secondsLeft.toString();	
		if (secondsLeft < 10){
			secondsLeftPlusZero = "0" + secondsLeft.toString();
		}		
		for (var i in SOCKET_LIST){
			if (typeof SOCKET_LIST[i].cognitoSub === 'undefined'){
				continue;
			}

			var socket = SOCKET_LIST[i];
			socket.emit('sendClock',secondsLeftPlusZero, minutesLeft);
		}
	}
	
	//Pickup timer stuff
	pickup.clockTick();
	
	if (gameOver == true){
		if (nextGameTimer > 0){
			nextGameTimer--;
			updateMisc.nextGameTimer = nextGameTimer;
		}
		if (nextGameTimer == 0) {
			restartGame();
			nextGameTimer = timeBeforeNextGame;
			updateMisc.nextGameTimer = nextGameTimer;
		}
	}	
		
	//Repeating game server DB sync
	secondsSinceLastServerSync++;
	if (secondsSinceLastServerSync > syncServerWithDbInterval){
		dataAccessFunctions.syncGameServerWithDatabase();
		secondsSinceLastServerSync = 0;
		if (pregame == true && getNumPlayersInGame() >= 4){
			restartGame();
		}
	}
}



var sendFullGameStatus = function(socketId){
	var playerPack = [];
	var thugPack = [];
	var blockPack = [];
	var pickupPack = [];
	var miscPack = {};

	var playerList = player.getPlayerList();
	for (var a in playerList){		
		var playa = {
			id:playerList[a].id,
			name:playerList[a].name,
			x:playerList[a].x,
			y:playerList[a].y,
			health:playerList[a].health,
			energy:playerList[a].energy,
			cloak:playerList[a].cloak,
			cloakEngaged:playerList[a].cloakEngaged,
			boosting:playerList[a].boosting,
			walkingDir:playerList[a].walkingDir,				
			shootingDir:playerList[a].shootingDir,				
			holdingBag:playerList[a].holdingBag,				
			team:playerList[a].team,	
			weapon:playerList[a].weapon,	
			PClip:playerList[a].DPClip,	
			DPClip:playerList[a].DPClip,	
			MGClip:playerList[a].MGClip,	
			SGClip:playerList[a].SGClip,	
			DPAmmo:playerList[a].DPAmmo,	
			MGAmmo:playerList[a].MGAmmo,	
			SGAmmo:playerList[a].SGAmmo,	
			reloading:playerList[a].reloading,
			images:{ 1:{}, 2:{} },
			customizations:playerList[a].customizations,			
			settings:playerList[a].settings,			
			
			cash:playerList[a].cash,
			cashEarnedThisGame:playerList[a].cashEarnedThisGame,
			kills:playerList[a].kills,
			deaths:playerList[a].deaths,
			steals:playerList[a].steals,
			returns:playerList[a].returns,
			captures:playerList[a].captures,	
			chat:"",
			chatDecay:0,
		};
		playerPack.push(playa);
	}
	var thugList = thug.getThugList();
	for (var b in thugList){
		var thugy = {
			id:thugList[b].id,
			x:thugList[b].x,
			y:thugList[b].y,
			health:thugList[b].health,
			team:thugList[b].team,
			rotation:thugList[b].rotation,
		};
		thugPack.push(thugy);
	}

	blockPack = block.getBlockList();
	pickupPack = pickup.getPickupList();

	var size = Object.size(playerList);			
	miscPack.bagRed = bagRed;
	miscPack.bagBlue = bagBlue;
	miscPack.numPlayers = size;
	miscPack.shop = shop;
	miscPack.gameOver = {
		gameIsOver: gameOver,
		voteMap:voteMap,
		voteGametype:voteGametype
	};

	miscPack.pregame = pregame;		
	miscPack.shopEnabled = shopEnabled;
	
	miscPack.variant = {};
	miscPack.variant.map = map;
	miscPack.variant.gametype = gametype;
	miscPack.variant.scoreToWin = scoreToWin;
	miscPack.mapWidth = mapWidth;
	miscPack.mapHeight = mapHeight;
	miscPack.pcMode = pcMode;
	miscPack.ip = myIP;
	miscPack.port = port;
	
	if (gameMinutesLength > 0 || gameSecondsLength > 0){
		miscPack.variant.timeLimit = true;
	}
	else {
		miscPack.variant.timeLimit = false;
	}
	log("ABOUT TO SEND FULL GAME STATUS. FULL PLAYER PACK:");
	SOCKET_LIST[socketId].emit('sendFullGameStatus', playerPack, thugPack, pickupPack, blockPack, miscPack); //Goes to a single player
}



module.exports.changeTeams = changeTeams;
module.exports.spawnSafely = spawnSafely;
module.exports.getEntityById = getEntityById;
module.exports.getSafeCoordinates = getSafeCoordinates;
module.exports.getNumPlayersInGame = getNumPlayersInGame;
module.exports.processEntityPush = processEntityPush;
module.exports.capture = capture;
module.exports.sendCapturesToClient = sendCapturesToClient;
module.exports.killScore = killScore;
module.exports.ensureCorrectThugCount = ensureCorrectThugCount;
module.exports.restartGame = restartGame;
module.exports.assignSpectatorsToTeam = assignSpectatorsToTeam;
module.exports.joinGame = joinGame;
module.exports.sendFullGameStatus = sendFullGameStatus;
