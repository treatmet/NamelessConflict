var Pickup = require(absAppDir + '/app_code/entities/pickup.js');
var Block = require(absAppDir + '/app_code/entities/block.js');
var Thug = require(absAppDir + '/app_code/entities/thug.js');
var Player = require(absAppDir + '/app_code/entities/player.js');
var dataAccessFunctions = require(absAppDir + '/app_code/data_access/dataAccessFunctions.js');
var dataAccess = require(absAppDir + '/app_code/data_access/dataAccess.js');

var secondsSinceLastServerSync = syncServerWithDbInterval - 2;
var secondsSinceOnlineTimestampUpdate = 0;
var secondsSinceStaleRequestCheck = 0;
var currentStreamingDay = new Date().getUTCDate();

var getRankFromRating = function(rating){
	const rankings = [
		{rank:"bronze1",rating:0},
		{rank:"bronze2",rating:100},
		{rank:"bronze3",rating:200},
		{rank:"silver1",rating:300},
		{rank:"silver2",rating:500},
		{rank:"silver3",rating:700},
		{rank:"gold1",rating:1000},
		{rank:"gold2",rating:1300},
		{rank:"gold3",rating:1600},
		{rank:"diamond",rating:2000},
		{rank:"diamond2",rating:9999}
	];

	for (var r in rankings){
		var rPlus = parseInt(r)+1;
		var rMinus = parseInt(r)-1;
		if (rating < rankings[rPlus].rating){
			log(rankings[r].rank + " is his rank");
			var response = {rank:rankings[r].rank, floor:rankings[r].rating, previousRank:"bronze1", nextRank:"diamond2", ceiling:9999};
			if (rankings[rPlus]){
				response.nextRank = rankings[rPlus].rank;
				response.ceiling = rankings[rPlus].rating;
			}
			if (rankings[rMinus]){
				response.previousRank = rankings[rMinus].rank;
			}
			return response;
		}		
	}
	return {rank:"bronze1", floor:0, nextRank:"bronze2", ceiling:100};
}

var getLevelFromExperience = function(experience){
	var pointsBetweenThisLevelAndNext = 2500;
	var additionalPointsBetweenLevels = 2500; //This never gets updated. It is whats added to pointsBetweenLevels, which increases the higher the level.
	var pointsForLevel = 0;
	var experienceProgressInfo = {};

	for (var x = 1; x < 99; x++){
		experienceProgressInfo.level = x;
		experienceProgressInfo.floor = pointsForLevel;
		experienceProgressInfo.ceiling = pointsForLevel + pointsBetweenThisLevelAndNext;

		if (experience < experienceProgressInfo.ceiling){
			return experienceProgressInfo;
		}

		pointsForLevel += pointsBetweenThisLevelAndNext;
		pointsBetweenThisLevelAndNext += additionalPointsBetweenLevels;
	}

	return {
		level: 99,
		floor: experience,
		ceiling: (experience + 1000000)
	};
}


var changeTeams = function(playerId){
 	console.log("change teams: " + Player.list[playerId]);
	if (Player.list[playerId]){
		if (Player.list[playerId].holdingBag){
		
			if (Player.list[playerId].team == "white"){
				bagBlue.captured = false;
				updateMisc.bagBlue = bagBlue;
			}
			else if (Player.list[playerId].team == "black"){
				bagRed.captured = false;
				updateMisc.bagRed = bagRed;
			}
			Player.list[playerId].holdingBag = false;
			updatePlayerList.push({id:Player.list[playerId].id,property:"holdingBag",value:Player.list[playerId].holdingBag});				
		}
		if (Player.list[playerId].team == "white"){
			Player.list[playerId].team = "black";
			updatePlayerList.push({id:SOCKET_LIST[playerId].id,property:"team",value:Player.list[playerId].team});
			SOCKET_LIST[playerId].emit('addToChat', 'CHANGING TO THE OTHER TEAM.');
		}
		else if (Player.list[playerId].team == "black"){
			Player.list[playerId].team = "white";
			updatePlayerList.push({id:SOCKET_LIST[playerId].id,property:"team",value:Player.list[playerId].team});
			SOCKET_LIST[playerId].emit('addToChat', 'CHANGING TO THE OTHER TEAM.');
		}
		SOCKET_LIST[playerId].team = Player.list[playerId].team;
		Player.list[playerId].respawn();	
		dataAccessFunctions.dbGameServerUpdate();
		
		//Abandon party
		if (Player.list[playerId].partyId == Player.list[playerId].cognitoSub){ //Leaving a party that user is the leader of (disband ALL party members' partyId)
			for (var p in Player.list){
				if (Player.list[p].partyId == Player.list[playerId].partyId){
					Player.list[p].partyId = Player.list[p].cognitoSub;
				}
			}
			dataAccess.dbUpdateAwait("RW_USER", "set", {partyId: Player.list[playerId].partyId}, {partyId:""}, async function(err, userRes){
			});	
		}
		else { //Leaving someone else's party
			Player.list[playerId].partyId = Player.list[playerId].cognitoSub;
			dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: Player.list[playerId].cognitoSub}, {partyId:""}, async function(err, userRes){
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
	
	for (var i in Player.list){
		if (Player.list[i].team == "white"){
			whitePlayers++;
			whiteTotalScore += Player.list[i].rating;
		}
		else if (Player.list[i].team == "black"){
			blackPlayers++;
			blackTotalScore += Player.list[i].rating;
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
	dataAccessFunctions.getAllPlayersFromDB(function(mongoRes){
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
			for (var p in Player.list){
				if (Player.list[p].team == "none")
					continue;
				
				var gamesLostInc = 0;
				var gamesWonInc = 0;
				var ptsGained = 0;
				
				SOCKET_LIST[p].emit('sendLog', "Player in endgame loop...");

				var enemyAverageRating = Player.list[p].team == "white" ? blackAverageRating : whiteAverageRating;
				if ((Player.list[p].team == "white" && whiteScore > blackScore) || (Player.list[p].team == "black" && whiteScore < blackScore)){
					//win
					gamesWonInc++;
					ptsGained = Math.round(matchWinLossRatingBonus + (enemyAverageRating - Player.list[p].rating)/enemySkillDifferenceDivider);
					if (ptsGained < 1){ptsGained = 1;}		
					logg(Player.list[p].name + " had " + Player.list[p].rating + " pts, and beat a team with " + enemyAverageRating + " pts. He gained " + ptsGained);
					Player.list[p].cashEarnedThisGame+=winCash; //Not sending this update to the clients because it is only used for server-side experience calculation, not displaying on scoreboard
				}
				else {
					//loss
					gamesLostInc++;
					ptsGained = Math.round(-matchWinLossRatingBonus + (enemyAverageRating - Player.list[p].rating)/enemySkillDifferenceDivider);
					if (ptsGained > -1){ptsGained = -1;}		
					if (ptsGained < -20){ptsGained = -20;} //Loss cap		
					logg(Player.list[p].name + " had " + Player.list[p].rating + " pts, and lost to a team with " + enemyAverageRating + " pts. He lost " + ptsGained);
					Player.list[p].cashEarnedThisGame+=loseCash; //Not sending this update to the clients because it is only used for server-side experience calculation, not displaying on scoreboard
				}
				//Prevent player from having sub zero ranking
				if (Player.list[p].rating + ptsGained < 0){
					ptsGained += Math.abs(Player.list[p].rating + ptsGained);
				}

				//Trigger client's end of game progress results report
				var endGameProgressResults = {};
				endGameProgressResults.originalRating = Player.list[p].rating;
				endGameProgressResults.ratingDif = ptsGained;
				endGameProgressResults.originalExp = Player.list[p].experience;
				endGameProgressResults.expDif = Player.list[p].cashEarnedThisGame;

				var rankProgressInfo = getRankFromRating(Player.list[p].rating);
				endGameProgressResults.rank = rankProgressInfo.rank;
				endGameProgressResults.nextRank = rankProgressInfo.nextRank;
				endGameProgressResults.previousRank = rankProgressInfo.previousRank;
				endGameProgressResults.rankFloor = rankProgressInfo.floor;
				endGameProgressResults.rankCeiling = rankProgressInfo.ceiling;

				var experienceProgressInfo = getLevelFromExperience(Player.list[p].experience);
				endGameProgressResults.level = experienceProgressInfo.level;
				endGameProgressResults.experienceFloor = experienceProgressInfo.floor;
				endGameProgressResults.experienceCeiling = experienceProgressInfo.ceiling;		

				SOCKET_LIST[p].emit('endGameProgressResults', endGameProgressResults);
				SOCKET_LIST[p].emit('sendLog', "engGameResults:");
				SOCKET_LIST[p].emit('sendLog', endGameProgressResults);

				//update user's DB stats
				dataAccessFunctions.dbUserUpdate("inc", Player.list[p].cognitoSub, {kills:Player.list[p].kills, deaths:Player.list[p].deaths, captures:Player.list[p].captures, steals:Player.list[p].steals, returns:Player.list[p].returns, cash: Player.list[p].cashEarnedThisGame, experience: Player.list[p].cashEarnedThisGame, gamesWon:gamesWonInc, gamesLost:gamesLostInc, gamesPlayed: 1, rating: ptsGained});
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
	
	for (var p in Player.list){
		pCount++;
		for (var r in mongoRes){
			if (Player.list[p].cognitoSub == mongoRes[r].cognitoSub){		
				Player.list[p].rating = mongoRes[r].rating;
				Player.list[p].experience = mongoRes[r].experience;				
				logg("[" + pCount + "/" + totalPlayers + "] Got player[" + Player.list[p].id + "] from db. Rating:" + Player.list[p].rating + " Experience:" + Player.list[p].experience);
			}
		}
	}	
}

var getNumPlayersInGame = function(){
	var totalPlayers = 0;
	for (var p in Player.list){
		totalPlayers++;
	}
	
	return totalPlayers;
}

function getNumTeamPlayersInGame(){ //getCurrentPlayers in game actual players
	var totalPlayers = 0;
	for (var p in Player.list){
		if (Player.list[p].team == "white" || Player.list[p].team == "black")
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
	if (Player.list[id]){
		return Player.list[id];
	}
	else if (Thug.list[id]){
		return Thug.list[id];
	}
	else if (Block.list[id]){
		return Block.list[id];
	}
	else {
		return 0;
	}
}

function getSafeCoordinates(team){
	var potentialX = 10;
	var potentialY = 10;
	
	if (team == "black"){
		for (var w = 0; w < 50; w++){
			var safeToSpawn = true;

			potentialX = randomInt(spawnXminBlack,spawnXmaxBlack);
			potentialY = randomInt(spawnYminBlack,spawnYmaxBlack);
			for (var i in Block.list){
				if (potentialX >= Block.list[i].x && potentialX <= Block.list[i].x + Block.list[i].width && potentialY >= Block.list[i].y && potentialY <= Block.list[i].y + Block.list[i].height){																		
					safeToSpawn = false;
				}					
			}
			//check for enemies nearby
			for (var i in Player.list){
				if (Player.list[i].team != team && Player.list[i].health > 0 && potentialX >= Player.list[i].x - threatSpawnRange && potentialX <= Player.list[i].x + threatSpawnRange && potentialY >= Player.list[i].y - threatSpawnRange && potentialY <= Player.list[i].y + threatSpawnRange){																		
					safeToSpawn = false;
				}
			}
			for (var i in Thug.list){
				if (Thug.list[i].team != team && Thug.list[i].health > 0 && potentialX >= Thug.list[i].x - threatSpawnRange && potentialX <= Thug.list[i].x + threatSpawnRange && potentialY >= Thug.list[i].y - threatSpawnRange && potentialY <= Thug.list[i].y + threatSpawnRange){																		
					safeToSpawn = false;
				}
			}
			if (!safeToSpawn){
				continue;
			}
			else {
				break;
			}
		}		
	}
	else if (team == "white"){
		for (var w = 0; w < 50; w++){
			var safeToSpawn = true;
			
			potentialX = randomInt(spawnXminWhite,spawnXmaxWhite);			
			potentialY = randomInt(spawnYminWhite,spawnYmaxWhite);
			for (var i in Block.list){
				if (potentialX >= Block.list[i].x && potentialX <= Block.list[i].x + Block.list[i].width && potentialY >= Block.list[i].y && potentialY <= Block.list[i].y + Block.list[i].height){																		
					safeToSpawn = false;
				}
			}
			for (var i in Player.list){
				if (Player.list[i].team != team && Player.list[i].health > 0 && potentialX >= Player.list[i].x - threatSpawnRange && potentialX <= Player.list[i].x + threatSpawnRange && potentialY >= Player.list[i].y - threatSpawnRange && potentialY <= Player.list[i].y + threatSpawnRange){																		
					safeToSpawn = false;
				}
			}
			for (var i in Thug.list){
				if (Thug.list[i].team != team && Thug.list[i].health > 0 && potentialX >= Thug.list[i].x - threatSpawnRange && potentialX <= Thug.list[i].x + threatSpawnRange && potentialY >= Thug.list[i].y - threatSpawnRange && potentialY <= Thug.list[i].y + threatSpawnRange){																		
					safeToSpawn = false;
				}
			}
			if (!safeToSpawn){
				continue;
			}
			else {
				break;
			}
		}
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
		if (Player.list[entity.id]){
			updatePlayerList.push({id:entity.id,property:"x",value:entity.x});
			updatePlayerList.push({id:entity.id,property:"y",value:entity.y});
		}
		else if (Thug.list[entity.id]){
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

//TIMER1 - EVERY FRAME timer1 tiemer1 tiemr1
//------------------------------------------------------------------------------
setInterval(
	function(){
		if (pause == true)
			return;
				
		for (var i in Player.list){
			console.log("ENGINEING " + Player.list[i].id);
			if (Player.list[i].team != "none")
				Player.list[i].engine();
		}		
		for (var i in Thug.list){
			Thug.list[i].engine();
		}	
		
		var secondsLeftPlusZero = "" + secondsLeft;
		if (secondsLeft < 10){
			secondsLeftPlusZero = "0" + secondsLeft;
		}
		
		if (gametype == "ctf"){
			moveBags();
		}
		
		//Send packs to all players
		//updateNotificationList = [];
		//updateEffectList = [];
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
	if (bagBlue.speed > 0){
		for (var i in Block.list){
			if (bagBlue.x > Block.list[i].x && bagBlue.x < Block.list[i].x + Block.list[i].width && bagBlue.y > Block.list[i].y && bagBlue.y < Block.list[i].y + Block.list[i].height){												
				if (Block.list[i].type == "normal" || Block.list[i].type == "red" || Block.list[i].type == "blue"){
					var overlapTop = Math.abs(Block.list[i].y - bagBlue.y);  
					var overlapBottom = Math.abs((Block.list[i].y + Block.list[i].height) - bagBlue.y);
					var overlapLeft = Math.abs(bagBlue.x - Block.list[i].x);
					var overlapRight = Math.abs((Block.list[i].x + Block.list[i].width) - bagBlue.x);			
					if (overlapTop <= overlapBottom && overlapTop <= overlapRight && overlapTop <= overlapLeft){
						bagBlue.y = Block.list[i].y;
						updateMisc.bagBlue = bagBlue;
					}
					else if (overlapBottom <= overlapTop && overlapBottom <= overlapRight && overlapBottom <= overlapLeft){
						bagBlue.y = Block.list[i].y + Block.list[i].height;
						updateMisc.bagBlue = bagBlue;
					}
					else if (overlapLeft <= overlapTop && overlapLeft <= overlapRight && overlapLeft <= overlapBottom){
						bagBlue.x = Block.list[i].x;
						updateMisc.bagBlue = bagBlue;
					}
					else if (overlapRight <= overlapTop && overlapRight <= overlapLeft && overlapRight <= overlapBottom){
						bagBlue.x = Block.list[i].x + Block.list[i].width;
						updateMisc.bagBlue = bagBlue;
					}
				}
				else if (Block.list[i].type == "pushUp"){
					bagBlue.y -= pushStrength;
					if (bagBlue.y < Block.list[i].y){bagBlue.y = Block.list[i].y;}
					updateMisc.bagBlue = bagBlue;
				}
				else if (Block.list[i].type == "pushRight"){
					bagBlue.x += pushStrength;
					if (bagBlue.x > Block.list[i].x + Block.list[i].width){bagBlue.x = Block.list[i].x + Block.list[i].width;}
					updateMisc.bagBlue = bagBlue;
				}
				else if (Block.list[i].type == "pushDown"){
					bagBlue.y += pushStrength;
					if (bagBlue.y > Block.list[i].y + Block.list[i].height){bagBlue.y = Block.list[i].y + Block.list[i].height;}
					updateMisc.bagBlue = bagBlue;
				}
				else if (Block.list[i].type == "pushLeft"){
					bagBlue.x -= pushStrength;
					if (bagBlue.x < Block.list[i].x){bagBlue.x = Block.list[i].x;}
					updateMisc.bagBlue = bagBlue;
				}
				else if (Block.list[i].type == "warp1"){
					bagBlue.x = warp1X;
					bagBlue.y = warp1Y;
					updateMisc.bagBlue = bagBlue;
				}
				else if (Block.list[i].type == "warp2"){
					bagBlue.x = warp2X;
					bagBlue.y = warp2Y;
					updateMisc.bagBlue = bagBlue;
				}
			}// End check if bag is overlapping block
		}//End Block.list loop		
	}
	if (bagRed.speed > 0){
		for (var i in Block.list){
			if (bagRed.x > Block.list[i].x && bagRed.x < Block.list[i].x + Block.list[i].width && bagRed.y > Block.list[i].y && bagRed.y < Block.list[i].y + Block.list[i].height){												
				if (Block.list[i].type == "normal" || Block.list[i].type == "red" || Block.list[i].type == "blue"){
					var overlapTop = Math.abs(Block.list[i].y - bagRed.y);  
					var overlapBottom = Math.abs((Block.list[i].y + Block.list[i].height) - bagRed.y);
					var overlapLeft = Math.abs(bagRed.x - Block.list[i].x);
					var overlapRight = Math.abs((Block.list[i].x + Block.list[i].width) - bagRed.x);			
					if (overlapTop <= overlapBottom && overlapTop <= overlapRight && overlapTop <= overlapLeft){
						bagRed.y = Block.list[i].y;
						updateMisc.bagRed = bagRed;
					}
					else if (overlapBottom <= overlapTop && overlapBottom <= overlapRight && overlapBottom <= overlapLeft){
						bagRed.y = Block.list[i].y + Block.list[i].height;
						updateMisc.bagRed = bagRed;
					}
					else if (overlapLeft <= overlapTop && overlapLeft <= overlapRight && overlapLeft <= overlapBottom){
						bagRed.x = Block.list[i].x;
						updateMisc.bagRed = bagRed;
					}
					else if (overlapRight <= overlapTop && overlapRight <= overlapLeft && overlapRight <= overlapBottom){
						bagRed.x = Block.list[i].x + Block.list[i].width;
						updateMisc.bagRed = bagRed;
					}
				}
				else if (Block.list[i].type == "pushUp"){
					bagRed.y -= pushStrength;
					if (bagRed.y < Block.list[i].y){bagRed.y = Block.list[i].y;}
					updateMisc.bagRed = bagRed;
				}
				else if (Block.list[i].type == "pushRight"){
					bagRed.x += pushStrength;
					if (bagRed.x > Block.list[i].x + Block.list[i].width){bagRed.x = Block.list[i].x + Block.list[i].width;}
					updateMisc.bagRed = bagRed;
				}
				else if (Block.list[i].type == "pushDown"){
					bagRed.y += pushStrength;
					if (bagRed.y > Block.list[i].y + Block.list[i].height){bagRed.y = Block.list[i].y + Block.list[i].height;}
					updateMisc.bagRed = bagRed;
				}
				else if (Block.list[i].type == "pushLeft"){
					bagRed.x -= pushStrength;
					if (bagRed.x < Block.list[i].x){bagRed.x = Block.list[i].x;}
					updateMisc.bagRed = bagRed;
				}
				else if (Block.list[i].type == "warp1"){
					bagRed.x = warp1X;
					bagRed.y = warp1Y;
					updateMisc.bagRed = bagRed;
				}
				else if (Block.list[i].type == "warp2"){
					bagRed.x = warp2X;
					bagRed.y = warp2Y;
					updateMisc.bagRed = bagRed;
				}

			}// End check if bag is overlapping block
		}//End Block.list loop		
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
	for (var p in Player.list){
		if (Player.list[p].team == "white"){moreWhitePlayers++;}
		else if (Player.list[p].team == "black"){moreWhitePlayers--;}
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
	for (var l in Player.list){
		if (Player.list[l].team != "none"){ //only process spectators
			continue;
		}
		var addedToParty = false;
		for (var p = 0; p < parties.length; p++){
			if (typeof Player.list[l].partyId != 'undefined' && Player.list[l].partyId == parties[p].partyId && Player.list[l].partyId.length > 0){
				parties[p].partySize++;
				parties[p].playerIds.push(Player.list[l].id);
				addedToParty = true;
				break;
			}
		}
		if (!addedToParty && typeof Player.list[l].id != 'undefined'){
			var newParty = {partyId: Player.list[l].partyId, partySize: 1, playerIds: [Player.list[l].id]};
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
				if (typeof Player.list[parties[q].playerIds[r]] === 'undefined')
					continue;
				Player.list[parties[q].playerIds[r]].team = "white";
				moreWhitePlayers++;
				Player.list[parties[q].playerIds[r]].respawn();
			}
		}
		else {
			for (var r = 0; r < parties[q].playerIds.length; r++){
				if (typeof Player.list[parties[q].playerIds[r]] === 'undefined')
					continue;
				Player.list[parties[q].playerIds[r]].team = "black";
				moreWhitePlayers--;
				Player.list[parties[q].playerIds[r]].respawn();
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
	
	var moreWhitePlayers = 0; 
	for (var p in Player.list){
		if (Player.list[p].team == "white"){moreWhitePlayers++;}
		else if (Player.list[p].team == "black"){moreWhitePlayers--;}
	}

	logg("REBALANCING TEAMS1: Teams are off by " + Math.abs(moreWhitePlayers));
	
	if (Math.abs(moreWhitePlayers) > 1){
	
		//Get parties
		var inGameParties = [];
		var whiteParties = [];
		var blackParties = [];
		
		for (var l in Player.list){
			var addedToParty = false;
			for (var p = 0; p < inGameParties.length; p++){
				if (typeof Player.list[l].partyId != 'undefined' && Player.list[l].partyId == inGameParties[p].partyId && Player.list[l].partyId.length > 0){
					inGameParties[p].partySize++;
					inGameParties[p].playerIds.push(Player.list[l].id);
					addedToParty = true;
					break;
				}
			}
			if (!addedToParty && typeof Player.list[l].id != 'undefined'){
				var newParty = {partyId: Player.list[l].partyId, partySize: 1, playerIds: [Player.list[l].id]};
				inGameParties.push(newParty);
			}
		}		
		inGameParties.sort(comparePartySize);		
		
		for (var gp = 0; gp < inGameParties.length; gp++){
			if (Player.list[inGameParties[gp].playerIds[0]].team == "white"){
				whiteParties.push(inGameParties[gp]);
			}
			else if (Player.list[inGameParties[gp].playerIds[0]].team == "black"){
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
					
						if (typeof Player.list[biggerTeamsParties[q].playerIds[r]] === 'undefined')
							continue;
						Player.list[biggerTeamsParties[q].playerIds[r]].team = "white";
						moreWhitePlayers -= 2;
					}
				}
				else {
					for (var r = 0; r < biggerTeamsParties[q].playerIds.length; r++){
						logg("REBALANCING TEAMS3: ADDING THIS GUY: " + biggerTeamsParties[q].playerIds[r] + " FROM THIS PARTY " + biggerTeamsParties[q].partyId + " [" + q + "," + r);
						if (typeof Player.list[biggerTeamsParties[q].playerIds[r]] === 'undefined')
							continue;
						Player.list[biggerTeamsParties[q].playerIds[r]].team = "black";
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


	for (var t in Thug.list){
		for(var i in SOCKET_LIST){
			SOCKET_LIST[i].emit('removeThug', Thug.list[t].id);
		}			
		delete Thug.list[t];
	}
	ensureCorrectThugCount();
	mapEngine.initializePickups(map);
	mapEngine.initializeBlocks(map);
	logg("Initializing map: " + map + " Dimensions:" + mapWidth + "," + mapHeight);

	for (var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];	
		gameEngine.sendCapturesToClient(socket);
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
	
	for(var i in Player.list){		
		Player.list[i].cash = startingCash;
		Player.list[i].cashEarnedThisGame = 0;
		Player.list[i].kills = 0;
		Player.list[i].deaths = 0;
		Player.list[i].steals = 0;
		Player.list[i].returns = 0;
		Player.list[i].captures = 0;		
		updatePlayerList.push({id:Player.list[i].id,property:"cash",value:Player.list[i].cash});
		updatePlayerList.push({id:Player.list[i].id,property:"cashEarnedThisGame",value:Player.list[i].cashEarnedThisGame});
		updatePlayerList.push({id:Player.list[i].id,property:"kills",value:Player.list[i].kills});
		updatePlayerList.push({id:Player.list[i].id,property:"deaths",value:Player.list[i].deaths});
		updatePlayerList.push({id:Player.list[i].id,property:"steals",value:Player.list[i].steals});
		updatePlayerList.push({id:Player.list[i].id,property:"returns",value:Player.list[i].returns});
		updatePlayerList.push({id:Player.list[i].id,property:"captures",value:Player.list[i].captures});	
		Player.list[i].respawn();
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
	
	
	for (var p in Player.list){
		if (Player.list[p].team == "white"){
			expectedBlackThugs++;
		}
		else if (Player.list[p].team == "black"){
			expectedWhiteThugs++;
		}
	}	
	for (var t in Thug.list){
		if (Thug.list[t].team == "white"){
			whiteThugs++;
		}
		else if (Thug.list[t].team == "black"){
			blackThugs++;
		}
	}
	
	//Delete all thugs if Thug setting is disabled, or more than "thugLimit" players
	if (!spawnOpposingThug || (expectedWhiteThugs + expectedBlackThugs > thugLimit)){
		for (var t in Thug.list){
			for(var i in SOCKET_LIST){
				SOCKET_LIST[i].emit('removeThug', Thug.list[t].id);
			}			
			delete Thug.list[t];
		}
		return;
	}

	
	while (whiteThugs > expectedWhiteThugs){
		for (var t in Thug.list){
			if (Thug.list[t].team == "white"){
			for(var i in SOCKET_LIST){
				SOCKET_LIST[i].emit('removeThug', Thug.list[t].id);
			}			
			delete Thug.list[t];
			whiteThugs--;
			break;
			}
		}
	}
	while (blackThugs > expectedBlackThugs){
		for (var t in Thug.list){
			if (Thug.list[t].team == "black"){
			for(var i in SOCKET_LIST){
				SOCKET_LIST[i].emit('removeThug', Thug.list[t].id);
			}			
			delete Thug.list[t];
			blackThugs--;
			break;
			}
		}
	}

	while (whiteThugs < expectedWhiteThugs){
		var coords = gameEngine.getSafeCoordinates("white");
		Thug(Math.random(), "white", coords.x, coords.y);	
		whiteThugs++;
	}
	while (blackThugs < expectedBlackThugs){
		var coords = gameEngine.getSafeCoordinates("black");
		Thug(Math.random(), "black", coords.x, coords.y);			
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
		for (var i in Pickup.list){
			if (Pickup.list[i].respawnTime > -1 && gameOver == false){				
				if (Pickup.list[i].respawnTimer > 0){
					Pickup.list[i].respawnTimer--;
					updatePickupList.push(Pickup.list[i]);
				} else if (Pickup.list[i].respawnTimer < 0){Pickup.list[i].respawnTimer = 0;} //Ignore this. This should never be triggered.
			}
		}	
		
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


module.exports.getRankFromRating = getRankFromRating;
module.exports.getLevelFromExperience = getLevelFromExperience;
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
