var pickup = require('../entities/pickup.js');
var block = require('../entities/block.js');
var thug = require('../entities/thug.js');
var player = require('../entities/player.js');
var dataAccessFunctions = require('../../shared/data_access/dataAccessFunctions.js');
var dataAccess = require('../../shared/data_access/dataAccess.js');
var mapEngine = require('./mapEngine.js');
const logEngine = require('../../shared/engines/logEngine.js');

var secondsSinceLastServerSync = syncServerWithDbInterval - 2;
var secondsSinceOnlineTimestampUpdate = 0;
var secondsSinceStaleRequestCheck = 0;
var currentStreamingDay = new Date().getUTCDate();

var changeTeams = function(playerId){
	var playerList = player.getPlayerList();
 	console.log("change teams: " + playerList[playerId]);
	if (playerList[playerId]){
		if (playerList[playerId].holdingBag){
		
			if (playerList[playerId].team == "white"){
				bagBlue.captured = false;
				updateMisc.bagBlue = bagBlue;
			}
			else if (playerList[playerId].team == "black"){
				bagRed.captured = false;
				updateMisc.bagRed = bagRed;
			}
			playerList[playerId].holdingBag = false;
			updatePlayerList.push({id:playerList[playerId].id,property:"holdingBag",value:playerList[playerId].holdingBag});				
		}
		if (playerList[playerId].team == "white"){
			playerList[playerId].team = "black";
			updatePlayerList.push({id:SOCKET_LIST[playerId].id,property:"team",value:playerList[playerId].team});
			SOCKET_LIST[playerId].emit('addToChat', 'CHANGING TO THE OTHER TEAM.');
		}
		else if (playerList[playerId].team == "black"){
			playerList[playerId].team = "white";
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
		if (playerList[i].team == "white"){
			whitePlayers++;
			whiteTotalScore += playerList[i].rating;
		}
		else if (playerList[i].team == "black"){
			blackPlayers++;
			blackTotalScore += playerList[i].rating;
		}
	}
	
	if (team == "white"){
		enemyTeamAvgRating = whiteTotalScore / whitePlayers;
	}
	else if (team == "black"){
		enemyTeamAvgRating = blackTotalScore / blackPlayers;		
	}
	if (enemyTeamAvgRating == undefined || enemyTeamAvgRating == null || isNaN(enemyTeamAvgRating)){enemyTeamAvgRating = -1;}
	return enemyTeamAvgRating;
}

function calculateEndgameStats(){
	getAllPlayersFromDB(function(mongoRes){
		if (mongoRes){
			//Get CURRENT player rating and experience from mongo (before any stats from this game are added)
			updatePlayersRatingAndExpWithMongoRes(mongoRes);		
			var whiteAverageRating = calculateTeamAvgRating("white");
			var blackAverageRating = calculateTeamAvgRating("black");
			
			if (whiteAverageRating == -1 && blackAverageRating != -1)
				whiteAverageRating = blackAverageRating;
			if (blackAverageRating == -1 && whiteAverageRating != -1)
				blackAverageRating = whiteAverageRating;
			
			
					
			//Calculate progress made, and send to client (and then update user's DB stats)
			var playerList = player.getPlayerList();
			for (var p in playerList){
				if (playerList[p].team == "none")
					continue;
				
				var gamesLostInc = 0;
				var gamesWonInc = 0;
				var ptsGained = 0;
				
				SOCKET_LIST[p].emit('sendLog', "Player in endgame loop...");

				var enemyAverageRating = playerList[p].team == "white" ? blackAverageRating : whiteAverageRating;
				if ((playerList[p].team == "white" && whiteScore > blackScore) || (playerList[p].team == "black" && whiteScore < blackScore)){
					//win
					gamesWonInc++;
					ptsGained = Math.round(matchWinLossRatingBonus + (enemyAverageRating - playerList[p].rating)/enemySkillDifferenceDivider);
					if (ptsGained < 1){ptsGained = 1;}		
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

				SOCKET_LIST[p].emit('endGameProgressResults', endGameProgressResults);
				SOCKET_LIST[p].emit('sendLog', "engGameResults:");
				SOCKET_LIST[p].emit('sendLog', endGameProgressResults);

				//update user's DB stats
				dataAccessFunctions.dbUserUpdate("inc", playerList[p].cognitoSub, {kills:playerList[p].kills, deaths:playerList[p].deaths, captures:playerList[p].captures, steals:playerList[p].steals, returns:playerList[p].returns, cash: playerList[p].cashEarnedThisGame, experience: playerList[p].cashEarnedThisGame, gamesWon:gamesWonInc, gamesLost:gamesLostInc, gamesPlayed: 1, rating: ptsGained});
			}
		}
		else {
			logg("ERROR: calculateEndGameStats failed!!!");
		}
	});
}

function updatePlayersRatingAndExpWithMongoRes(mongoRes){
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
		if (playerList[p].team == "white" || playerList[p].team == "black")
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
	var potentialX = 10;
	var potentialY = 10;
	for (var w = 0; w < 50; w++){
		if (team == "white") {			
			potentialX = randomInt(spawnXminWhite,spawnXmaxWhite);			
			potentialY = randomInt(spawnYminWhite,spawnYmaxWhite);
		}
		else if (team == "black") {			
			potentialX = randomInt(spawnXminBlack,spawnXmaxBlack);			
			potentialY = randomInt(spawnYminBlack,spawnYmaxBlack);
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

function checkForGameOver(){
	//GAME IS OVER, GAME END, ENDGAME GAMEOVER GAME OVER	
	if (gameOver == false){	
		//End by time
		if ((secondsLeft <= 0 && minutesLeft <= 0) && (gameSecondsLength > 0 || gameMinutesLength > 0) && whiteScore != blackScore){ 
			endGame();
		}
		//End by score
		else if (scoreToWin > 0 && (whiteScore >= scoreToWin || blackScore >= scoreToWin)){
			endGame();
		}
	}
}

function endGame(){
	gameOver = true;
	logg("GAME OVER! Whites:" + whiteScore + " Blacks:" + blackScore);
	calculateEndgameStats();
	nextGameTimer = timeBeforeNextGame;			
	updateMisc.nextGameTimer = nextGameTimer;
	updateMisc.gameOver = true; //send gameover to all clients
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
	if (team == "white"){
		whiteScore++;
		bagBlue.captured = false;
		bagBlue.x = bagBlue.homeX;
		bagBlue.y = bagBlue.homeY;
		updateMisc.bagBlue = bagBlue;
	}
	else if (team == "black"){
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
	if (team == "white"){
		whiteScore++;
	}
	else if (team == "black"){
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
		if (playerList[p].team == "white"){moreWhitePlayers++;}
		else if (playerList[p].team == "black"){moreWhitePlayers--;}
	}
	
	//Then get the parties, ordered by party size
	var parties = [];	
	/*
	[
		{
			partyId: "123456",
			partySize: 2,
			playerIds: ["1234","5678"]
		},
		{
			partyId: "123456",
			partySize: 1,
			playerIds: ["1234"]
		}

	]
	*/	
	var playerList = player.getPlayerList();
	for (var l in playerList){
		if (playerList[l].team != "none"){ //only process spectators
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
				playerList[parties[q].playerIds[r]].team = "white";
				moreWhitePlayers++;
				playerList[parties[q].playerIds[r]].respawn();
			}
		}
		else {
			for (var r = 0; r < parties[q].playerIds.length; r++){
				if (typeof playerList[parties[q].playerIds[r]] === 'undefined')
					continue;
				playerList[parties[q].playerIds[r]].team = "black";
				moreWhitePlayers--;
				playerList[parties[q].playerIds[r]].respawn();
			}
		}
	}
}

function restartGame(){

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

	assignSpectatorsToTeam(true);
	
	/////////REBALANCE TEAMS////////////////////////////////////////////////////
	var playerList = player.getPlayerList();
	var moreWhitePlayers = 0; 
	for (var p in playerList){
		if (playerList[p].team == "white"){moreWhitePlayers++;}
		else if (playerList[p].team == "black"){moreWhitePlayers--;}
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
			if (playerList[inGameParties[gp].playerIds[0]].team == "white"){
				whiteParties.push(inGameParties[gp]);
			}
			else if (playerList[inGameParties[gp].playerIds[0]].team == "black"){
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
		
		logg("REBALANCING TEAMS2.1: Parties in game, asc size:");
		console.log(biggerTeamsParties);

		
		//Assign players to new teams if it makes them more balanced
		for (var q = 0; q < biggerTeamsParties.length; q++){
			var howClose = Math.abs(Math.abs(moreWhitePlayers) - biggerTeamsParties[q].partySize*2);
			logg("REBALANCING TEAMS2.2: ANALYZING THIS PARTY:");
			console.log(biggerTeamsParties[q]);
			logg("REBALANCING TEAMS2.3: THIS PARTY CAN MAKE THE TEAMS THIS CLOSE: " + howClose + ". IS THAT BETTER THAN CURRENT DISPARITY: " + Math.abs(moreWhitePlayers));
			if (howClose < Math.abs(moreWhitePlayers)){
				
				if (moreWhitePlayers < 0){
					for (var r = 0; r < biggerTeamsParties[q].playerIds.length; r++){
					
						logg("REBALANCING TEAMS3: ADDING THIS GUY: " + biggerTeamsParties[q].playerIds[r] + " FROM THIS PARTY " + biggerTeamsParties[q].partyId);
					
						if (typeof playerList[biggerTeamsParties[q].playerIds[r]] === 'undefined')
							continue;
						playerList[biggerTeamsParties[q].playerIds[r]].team = "white";
						moreWhitePlayers -= 2;
					}
				}
				else {
					for (var r = 0; r < biggerTeamsParties[q].playerIds.length; r++){
						logg("REBALANCING TEAMS3: ADDING THIS GUY: " + biggerTeamsParties[q].playerIds[r] + " FROM THIS PARTY " + biggerTeamsParties[q].partyId + " [" + q + "," + r);
						if (typeof playerList[biggerTeamsParties[q].playerIds[r]] === 'undefined')
							continue;
						playerList[biggerTeamsParties[q].playerIds[r]].team = "black";
						moreWhitePlayers -=2;
					}
				}				
				
				
				
			}
			logg("REBALANCING TEAMS - PARTY ADDED, ARE WE EVEN NOW? moreWhitePlayers:" + Math.abs(moreWhitePlayers));
			if (Math.abs(moreWhitePlayers) <= 1){
				break;
			}			
		}
	}
	
	
	
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
	}	
	
	if (!isWebServer)
		dataAccessFunctions.dbGameServerUpdate();
		
}//End restartGame

function ensureCorrectThugCount(){
	var expectedWhiteThugs = 0;
	var expectedBlackThugs = 0;
	var whiteThugs = 0;
	var blackThugs = 0;
	var playerList = player.getPlayerList();
	var thugList = thug.getThugList();
	
	for (var p in playerList){
		if (playerList[p].team == "white"){
			expectedBlackThugs++;
		}
		else if (playerList[p].team == "black"){
			expectedWhiteThugs++;
		}
	}	
	for (var t in thugList){
		if (thugList[t].team == "white"){
			whiteThugs++;
		}
		else if (thugList[t].team == "black"){
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
			if (thugList[t].team == "white"){
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
			if (thugList[t].team == "black"){
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
		var coords = getSafeCoordinates("white");
		thug.createThug(Math.random(), "white", coords.x, coords.y);	
		whiteThugs++;
	}
	while (blackThugs < expectedBlackThugs){
		var coords = getSafeCoordinates("black");
		thug.createThug(Math.random(), "black", coords.x, coords.y);			
		blackThugs++;
	}
}


//------------------------------------------------------------------------------
//EVERY 1 SECOND
setInterval( 
	function(){
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
			
		//Server monitoring
		secondsSinceLastServerSync++;
		if (secondsSinceLastServerSync > syncServerWithDbInterval){
			if (isWebServer){
				dataAccessFunctions.checkForUnhealthyServers();
			}
			else {
				dataAccessFunctions.syncGameServerWithDatabase();
			}			
			if (pregame == true && getNumPlayersInGame() >= 4){
				restartGame();
			}

			secondsSinceLastServerSync = 0;
		}		
		
		//Remove stale requests
		secondsSinceStaleRequestCheck++;
		if (secondsSinceStaleRequestCheck > staleRequestCheckInterval){
			if (isWebServer){
				dataAccessFunctions.removeStaleFriendRequests();
				dataAccessFunctions.removeStalePartyRequests();
			}
			secondsSinceStaleRequestCheck = 0;
		}
		
		//Set Player onlineTimestamp
		secondsSinceOnlineTimestampUpdate++;
		if (secondsSinceOnlineTimestampUpdate > updateOnlineTimestampInterval){
			dataAccessFunctions.updateOnlineTimestampForUsers();
			secondsSinceOnlineTimestampUpdate = 0;
		}
		
		//Check if next UTC day for updating log file folder (reinitialize stream)
		if (currentStreamingDay != new Date().getUTCDate()){
			logEngine.reinitStream();
			currentStreamingDay = new Date().getUTCDate();
		}		

	},
	1000/1 //Ticks per second
);

//TIMER1 - EVERY FRAME timer1 tiemer1 tiemr1
//------------------------------------------------------------------------------
setInterval(
	function(){
		if (pause == true)
			return;

		player.runPlayerEngines();
		thug.runThugEngines();
			
		if (gametype == "ctf"){
			moveBags();
		}
		
		for (var i in SOCKET_LIST){			
			var socket = SOCKET_LIST[i];			
			socket.emit('update', updatePlayerList, updateThugList, updatePickupList, updateNotificationList, updateEffectList, updateMisc);
		}
		updatePlayerList = [];
		updateThugList = [];
		updatePickupList = [];
		updateNotificationList = [];
		updateEffectList = []; 	//1=shot, 2=blood, 3=boost, 4=smash, 5=body, 6=notification?
		updateMisc = {};		
		
		checkForGameOver();
	},
	1000/60 //FPS frames per second
);

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
	log("Attempting to join game...");
	var socket = SOCKET_LIST[getSocketIdFromCognitoSub(cognitoSub)];
	if (!socket){
		log("ERROR!!! Socket not yet connected to game server, or cognitoSub has not been set on socket!");
		return;
	}
	socket.team = team;
	socket.partyId = partyId;
	var players = getNumPlayersInGame();
	if (players >= maxPlayers){ //Another redundant maxplayers check couldn't hurt, right?
		socket.emit('signInResponse',{success:false,message:"SERVER FULL. Try again later, or try a different server."});								
	}
	else {
		log("!!!!Player signing into game server - socketID: " + socket.id + " cognitoSub: " + cognitoSub + " username: " + username + " team: " + team + " partyId: " + partyId);
		player.connect(socket, cognitoSub, username, team, partyId);
		dataAccessFunctions.dbGameServerUpdate();
		socket.emit('signInResponse',{success:true,id:socket.id, mapWidth:mapWidth, mapHeight:mapHeight, whiteScore:whiteScore, blackScore:blackScore});
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
	miscPack.gameOver = gameOver;
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
