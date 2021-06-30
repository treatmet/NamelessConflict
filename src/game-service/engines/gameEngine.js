var pickup = require('../entities/pickup.js');
var block = require('../entities/block.js');
var thug = require('../entities/thug.js');
var player = require('../entities/player.js');
var dataAccessFunctions = require('../../shared/data_access/dataAccessFunctions.js');
var dataAccess = require('../../shared/data_access/dataAccess.js');
var mapEngine = require('./mapEngine.js');
const { request } = require('express');

var secondsSinceLastServerSync = syncServerWithDbInterval - 2;

dataAccessFunctions.getHordeGlobalBest(function(best){
	hordeGlobalBest = best.kills;
	hordeGlobalBestNames = best.names;
});;

var resetGameSettingsToStandard = function(){
	boostAmount = 18;
	playerMaxSpeed = 5;
	playerAcceleration = 1;
	diagMovementScale = (2/3);
	voteGametype = true;
	voteMap = true;
	minutesLeft = 9;
	secondsLeft = 99;
	scoreToWin = 3;
	nextGameTimer = 20;
	timeBeforeNextGame = 45; //newGameTimer
	gameMinutesLength = 5;
	gameSecondsLength = 0;
	map = "longest";
	gametype = "ctf";
	freeForAll = false;
	maxPlayers = 14;
	maxEnergyMultiplier = 1;
	rechargeDelayTime = 120; //Double for breaking under zero energy
	healDelayTime = 300;
	healRate = 7; //Milisecond delay between heal tick after player already started healing (Higher number is slower heal)
	respawnTimeLimit = 3 * 60;
	slayerRespawnTimeLimit = 3 * 60; //seconds (translated to frames)
	ctfRespawnTimeLimit = 5 * 60; //seconds (translated to frames)
	bagDrag = 0.85;
	cloakingEnabled = true;
	cloakDrainSpeed = 0.12;
	cloakDrag = 0.5; //Walking speed multiplier when cloaked
	cloakInitializeSpeed = 0.02;
	cloakDeinitializeSpeed = 0.1;
	playerMaxHealth = 175;
	bootOnAfk = true;
	AfkFramesAllowed = 120 * 60; //seconds (translated to frames) //timeout
	damageScale = 1;
	pistolDamage = 10;
	pistolSideDamage = 6; //Stacks on above
	pistolBackDamage = 10; //Stacks AGAIN on above
	DPDamage = 12;
	DPSideDamage = DPDamage/2; //Stacks on above
	DPBackDamage = DPDamage/2; //Stacks AGAIN on above
	mgDamage = 9; 
	mgSideDamage = mgDamage/2; //Stacks on above
	mgBackDamage = mgDamage/2; //Stacks AGAIN on above
	SGDamage = 30;
	SGSideDamage = SGDamage/2;
	SGBackDamage = SGDamage/2;
	LaserDamage = 250;
	friendlyFireDamageScale = 0.5;
	boostDamage = 34;
	cloakBonusDamage = 20;
	startingWeapon = 1;
	bulletRange = 19 * 75;
	laserRange = 22 * 75;
	SGRange = 310;
	SGCloseRangeDamageScale = 4;
	SGPushSpeed = 12;
	laserPushSpeed = 36;
	laserOffsetX = 9;
	MGPushSpeed = 2;
	speedCap = 45;
	pistolFireRateLimiter = true;	
	pistolFireRate = 12;
	DPFireRate = 12;
	MGFireRate = 5;
	SGFireRate = 50;
	laserFireRate = 50;
	laserMaxCharge = 150;
	DPClipSize = 15;
	MGClipSize = 60;
	SGClipSize = 6;
	laserClipSize = 5;
	maxSGAmmo = SGClipSize*3;
	maxDPAmmo = DPClipSize*3;
	maxMGAmmo = MGClipSize*2;
	maxLaserAmmo = 10;
	infiniteAmmo = false;
	staggerScale = 0.60;
	staggerTime = 20;
	damagePushScale = 2;
	pushMaxSpeed = 35;
	allowBagWeapons = false;
	spawnOpposingThug = true; //Whether or not to spawn an opposing thug for each player who enters the game
	thugSightDistance = 600;
	thugHealth = 80;
	thugDamage = 50;
	thugSpeed = 4;
	thugAttackDelay = 30;
	thugLimit = 2; //Limit on how many thugs can appear before ALL thugs are wiped off map (for performance concerns)
	threatSpawnRange = 500;
	pushStrength = 15; //Push block strength
	serverPassword = "";
	privateServer = false;
	console.log("I'm setting " + port + " customServer to false");
	customServer = false;
	pregameIsHorde = true;
	serverName = "Ranked " + port.substring(2,4);
	bannedCognitoSubs = [];
	createdByCognitoSub = "";
	mapEngine.initializeBlocks();
	mapEngine.initializePickups();
	gameServerSync();
}

var changeTeams = function(playerId, requestedTeam = false){
	var playerList = player.getPlayerList();
	 console.log("change teams: " + playerList[playerId]);
	 console.log("requestedTeam:" + requestedTeam);
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
		if (requestedTeam === 0){
			playerList[playerId].team = 0;
			playerList[playerId].manualSpectate = true;
			playerList[playerId].health = 0;
			updatePlayerList.push({id:SOCKET_LIST[playerId].id,property:"team",value:playerList[playerId].team});			
			updatePlayerList.push({id:SOCKET_LIST[playerId].id,property:"health",value:playerList[playerId].health});			
		}
		else if (playerList[playerId].team == 1 || requestedTeam == 2){
			playerList[playerId].team = 2;
			updatePlayerList.push({id:SOCKET_LIST[playerId].id,property:"team",value:playerList[playerId].team});
			SOCKET_LIST[playerId].emit('addToChat', 'CHANGING TO THE OTHER TEAM.');
			if (!(gametype == "elim" && playerList[playerId].health <= 0)){
				playerList[playerId].respawn(true);			
			}
		}
		else {
			playerList[playerId].team = 1;
			updatePlayerList.push({id:SOCKET_LIST[playerId].id,property:"team",value:playerList[playerId].team});
			SOCKET_LIST[playerId].emit('addToChat', 'CHANGING TO THE OTHER TEAM.');
			if (!(gametype == "elim" && playerList[playerId].health <= 0)){
				playerList[playerId].respawn(true);			
			}
		}
		SOCKET_LIST[playerId].team = playerList[playerId].team;

		gameServerSync();
		
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


function compare(a,b) {
	if (a.cashEarnedThisGame < b.cashEarnedThisGame)
	  return 1;
	if (a.cashEarnedThisGame > b.cashEarnedThisGame)
	  return -1;
	return 0;
  }

function calculateEndgameStats(){ //calculate endgame
	logg("---CALCULATING ENDGAME STATS!---");
	var playerList = player.getPlayerList();
	var team1Sorted = [];
	var team2Sorted = [];
	for (var a in playerList){
		if (playerList[a].team == 1){
			team1Sorted.push(playerList[a]);
		}
		else if (playerList[a].team == 2){
			team2Sorted.push(playerList[a]);
		}
	}

	team1Sorted.sort(compare);
	team2Sorted.sort(compare);

	getAllPlayersFromDB(function(mongoRes){
		//Get CURRENT player rating and experience from mongo (before any stats from this game are added)
		updatePlayersRatingAndExpWithMongoRes(mongoRes);		
		var whiteAverageRating = calculateTeamAvgRating(1);
		var blackAverageRating = calculateTeamAvgRating(2);
		
		if (whiteAverageRating == -1 && blackAverageRating != -1)
			whiteAverageRating = blackAverageRating;
		if (blackAverageRating == -1 && whiteAverageRating != -1)
			blackAverageRating = whiteAverageRating;
		
		
				
		//Calculate progress made, and send to client (and then update user's DB stats)
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
				if (ptsGained > 20){ptsGained = 20;} //Gain cap		
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
			updatePlayerList.push({id:playerList[p].id,property:"cashEarnedThisGame",value:playerList[p].cashEarnedThisGame});

			//MVP
			if (team1Sorted[0])
				if (playerList[p].id == team1Sorted[0].id && team1Sorted.length >= 2){ptsGained += 10;}
			if (team2Sorted[0])
				if (playerList[p].id == team2Sorted[0].id && team2Sorted.length >= 2){ptsGained += 10;}

			//Prevent player from having sub zero ranking
			if (playerList[p].rating + ptsGained < 0){
				ptsGained += Math.abs(playerList[p].rating + ptsGained);
			}
			//Eligible for rank up/down this game?
			log("playerList[p].eligibleForRank: " + playerList[p].eligibleForRank);
			if (!playerList[p].eligibleForRank || customServer){
				logg("Player ineligible for rank influence this game");
				ptsGained = 0;				
			}
			if (customServer){
				playerList[p].cashEarnedThisGame =  Math.round(playerList[p].cashEarnedThisGame/2);
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

			console.log("playerList[p].assists");
			console.log(playerList[p].assists);
			//update user's DB stats
			dataAccessFunctions.dbUserUpdate("inc", playerList[p].cognitoSub, {kills:playerList[p].kills, assists:playerList[p].assists, deaths:playerList[p].deaths, captures:playerList[p].captures, steals:playerList[p].steals, returns:playerList[p].returns, cash: playerList[p].cashEarnedThisGame, experience: playerList[p].cashEarnedThisGame, gamesWon:gamesWonInc, gamesLost:gamesLostInc, gamesPlayed: 1, rating: ptsGained});
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
		if (gametype == "ctf" || gametype == "elim"){
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

var isBagHome = function (bag){
	if (bag.x != bag.homeX || bag.y != bag.homeY){
		return false;
	}
	return true;
}

//checkIfIsGameOver //checkIfGameOver
var lastChanceToCapture = true;
function checkForGameOver(){
	//GAME IS OVER, GAME END, ENDGAME GAMEOVER GAME OVER	
	if (gameOver == false){	
		//End by time
		if ((secondsLeft <= 0 && minutesLeft <= 0) && (gameSecondsLength > 0 || gameMinutesLength > 0) && whiteScore != blackScore){ 
			if (gametype == "ctf"){
				if (whiteScore == blackScore - 1 && !isBagHome(bagBlue) && lastChanceToCapture){
					//Chance for last capture, don't end game
				}
				else if (blackScore == whiteScore - 1 && !isBagHome(bagRed) && lastChanceToCapture){
					//Chance for last capture, dont end game
				}
				else {
					endGame(); //End game on time ctf
				}
			}
			else if (gametype == "slayer"){
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
	logg(serverName + " GAME OVER! team1:" + whiteScore + " team2:" + blackScore);
	calculateEndgameStats();
	nextGameTimer = timeBeforeNextGame;			
	updateMisc.nextGameTimer = nextGameTimer;
	updateMisc.gameOver = {
		gameIsOver: gameOver,
		voteMap:voteMap,
		voteGametype:voteGametype,
		voteRebalance:voteRebalance
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
		socket.emit('score', team, whiteScore, blackScore);
	}
}


var sendCapturesToClient = function(socket){
	socket.emit('score', 'reset', whiteScore, blackScore);
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


var checkIfRoundOver = function() { //isRoundOver //checkForRoundOver
	if (pregame && pregameIsHorde){return;}
	if (roundOver == true){return;}
	if (player.getTeamSize(1) <= 0 || player.getTeamSize(2) <= 0){return;}
	
	var playerList = player.getPlayerList();

	var survivingTeam1Players = 0;
	var survivingTeam2Players = 0;
	for (var p in playerList){
		if (playerList[p].health > 0){
			if (playerList[p].team == 1){
				survivingTeam1Players++;
			}
			if (playerList[p].team == 2){
				survivingTeam2Players++;
			}
		}
	}
	if (survivingTeam1Players == 0){
		eliminationRoundWin(2);
	}
	else if (survivingTeam2Players == 0){
		eliminationRoundWin(1);
	}
}

var eliminationRoundWin = function(team) { //endRound //winRound
	if (team == 1){
		whiteScore++;
	}
	else if (team == 2){
		blackScore++;
	}
	roundOver = true;
	nextGameTimer = timeBeforeNextRound;

	for (var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];	
		updateMisc.roundOver = roundOver;
		socket.emit('score', team, whiteScore, blackScore);
	}
}


var assignSpectatorsToTeam = function(assignEvenIfFull){
	//First, get the current team sizes
	var playerList = player.getPlayerList();
	var moreWhitePlayers = getMoreTeam1Players(); 
	
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
	for (var l in playerList){
		if (playerList[l].team != 0 || playerList[l].manualSpectate){ //only process spectators who didn't manually spectate
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
		logg("IF WE ADD YOU[" + parties[q].playerIds[0] + "'s party], IS NEW GAME SIZE(" + newGameZise + ") greater than maxPlayers (" + maxPlayers);
		if (parties[q].partySize + getNumTeamPlayersInGame() > maxPlayers && !assignEvenIfFull){
			logg("Game already full, moving on");
			continue;
		}
			
		if (moreWhitePlayers <= 0){
			for (var r = 0; r < parties[q].playerIds.length; r++){
				if (typeof playerList[parties[q].playerIds[r]] === 'undefined'){
					logg("ERROR!!! Spectating Player does not exist: " + parties[q].playerIds[r]);
					continue;
				}
				logg("Adding to team 1!");
				changeTeams(parties[q].playerIds[r], 1);
				moreWhitePlayers++;
			}
		}
		else {
			for (var r = 0; r < parties[q].playerIds.length; r++){
				if (typeof playerList[parties[q].playerIds[r]] === 'undefined'){
					logg("ERROR!!! Spectating Player does not exist: " + parties[q].playerIds[r]);
					continue;
				}
				logg("Adding to team 2!");
				changeTeams(parties[q].playerIds[r], 2);
				moreWhitePlayers--;
			}
		}
	}
}



function restartGame(){
	if (gametype == "horde" || (pregame && pregameIsHorde)){upsertHordeRecords(false);}
	tabulateVotes();
	assignSpectatorsToTeam(false);
	initializeNewGame();
	gameServerSync();
}

function startNewRound(){ //restartRound //initializeRound //startRound //roundStart
	roundOver = false;
	updateMisc.roundOver = roundOver;
	pickup.clearNonMedPickups();
	assignSpectatorsToTeam(false);
	respawnAllNonSpectators();
	gameServerSync();		
}

function respawnAllNonSpectators(){
	var playerList = player.getPlayerList();
	for (var p in playerList){
		if (playerList[p].team != 0){
			playerList[p].respawn();
		}
	}
}

//Updates gametype, map based on postgame player votes
function tabulateVotes(){
	if (ctfVotes > slayerVotes && ctfVotes > elimVotes && gametype != "ctf"){
		scoreToWin = 3;
		gametype = "ctf";
	}
	else if (slayerVotes > ctfVotes && slayerVotes > elimVotes && gametype != "slayer"){
		scoreToWin = 50;
		gametype = "slayer";
	}
	else if (elimVotes > ctfVotes && elimVotes > slayerVotes && gametype != "elim"){
		scoreToWin = 7;
		
		gametype = "elim";
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
	
	if (voteRebalanceTeamsYes > voteRebalanceTeamsNo){
		rebalanceTeams(true);
	}
	else {
		rebalanceTeams(false);
	}
	
	ctfVotes = 0;
	slayerVotes = 0;
	elimVotes = 0;
	thePitVotes = 0;
	longestVotes = 0;
	crikVotes = 0;
	voteRebalanceTeamsYes = 0;
	voteRebalanceTeamsNo = 0;
	voteMapIds = [];
	voteGametypeIds = [];	
	voteRebalanceTeamsIds = [];
}

var getMoreTeam1Players = function(){
	var moreWhitePlayers = 0;
	var playerList = player.getPlayerList();
	for (var p in playerList){
		if (playerList[p].team == 1){moreWhitePlayers++;}
		else if (playerList[p].team == 2){moreWhitePlayers--;}
	}
	return moreWhitePlayers;
}

function rebalanceTeamsOnScore(playerList){
	var lastTeam = 2;
	var x = 100;
	while (x > 0){
		var highestScore = 0;
		var highestScorer = "";
		for (var p in playerList){ //Get highest score that hasn't been reassigned
			if (playerList[p].cashEarnedThisGame > highestScore && !playerList[p].reassigned){
				highestScore = playerList[p].cashEarnedThisGame;
				highestScorer = playerList[p].id;
			}
		}
		if (highestScorer != "" && typeof playerList[highestScorer] != 'undefined'){
			if (lastTeam == 2){
				playerList[highestScorer].team = 1;
				lastTeam = 1;
			}
			else {
				playerList[highestScorer].team = 2;
				lastTeam = 2;
			}
			playerList[highestScorer].reassigned = true;
		}
		else {
			break;
		}
		x--;
	}
	for (var p in playerList){ //reset reassigned
		playerList[p].reassigned = false;
	}	
}

function rebalanceTeams(rebalanceOnScore = false){
	var playerList = player.getPlayerList();


	console.log("REBALANCING " + player.getPlayerListLength() + " PEEPS ON SCORE? " + rebalanceOnScore);
	if (rebalanceOnScore){
		rebalanceTeamsOnScore(playerList);
	}

	var moreWhitePlayers = getMoreTeam1Players(); 

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
	roundOver = false;
	pregame = false;
	bannedCognitoSubs = [];
	abandoningCognitoSubs = [];

	whiteScore = 0;
	blackScore = 0;
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
	else if (gametype == "elim"){
		respawnTimeLimit = elimRespawnTimeLimit;
		gameMinutesLength = 0;
		gameSecondsLength = 0;
	}

	minutesLeft = gameMinutesLength;
	secondsLeft = gameSecondsLength;

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
	updateMisc.bagRed = bagRed;
	updateMisc.bagBlue = bagBlue;
	updateMisc.mapWidth = mapWidth;
	updateMisc.mapHeight = mapHeight;
	updateMisc.variant = {};
	var mapToSend = (gametype == "horde" || (pregame && pregameIsHorde)) ? "horde" : map;
	updateMisc.variant.map = mapToSend;
	updateMisc.variant.customServer = customServer;
	updateMisc.pregameIsHorde = pregameIsHorde;	
	
	console.log("SENDING " + mapToSend + " pregameisHorde:" + pregameIsHorde);
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
		playerList[i].assists = 0;
		playerList[i].benedicts = 0;
		playerList[i].deaths = 0;
		playerList[i].steals = 0;
		playerList[i].returns = 0;
		playerList[i].captures = 0;			
		playerList[i].eligibleForRank = true;	
		updatePlayerList.push({id:playerList[i].id,property:"cash",value:playerList[i].cash});
		updatePlayerList.push({id:playerList[i].id,property:"cashEarnedThisGame",value:playerList[i].cashEarnedThisGame});
		updatePlayerList.push({id:playerList[i].id,property:"kills",value:playerList[i].kills});
		updatePlayerList.push({id:playerList[i].id,property:"assists",value:playerList[i].assists});
		updatePlayerList.push({id:playerList[i].id,property:"deaths",value:playerList[i].deaths});
		updatePlayerList.push({id:playerList[i].id,property:"steals",value:playerList[i].steals});
		updatePlayerList.push({id:playerList[i].id,property:"returns",value:playerList[i].returns});
		updatePlayerList.push({id:playerList[i].id,property:"captures",value:playerList[i].captures});	
		playerList[i].respawn(true);
	}//End player for loop update


	for(var i in SOCKET_LIST){
		SOCKET_LIST[i].emit('sendClock',secondsLeftPlusZero, minutesLeft);
		SOCKET_LIST[i].emit('gameStart');
		SOCKET_LIST[i].emit('addToChat', getObjectiveText(), 0);
		sendFullGameStatus(SOCKET_LIST[i].id);
	}	



}

function ensureCorrectThugCount(){
	if (!pregame){
		for (var t in thugList){
			for(var i in SOCKET_LIST){
				SOCKET_LIST[i].emit('removeThug', thugList[t].id);
			}			
			delete thugList[t];
		}
		return;
	}

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
		thug.createThug(1, coords.x, coords.y);	
		whiteThugs++;
	}
	while (blackThugs < expectedBlackThugs){
		var coords = getSafeCoordinates(2);
		thug.createThug(2, coords.x, coords.y);			
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
	//dataAccessFunctions.giveUsersItemsByTimestamp();

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
	socket.emit('signInResponse',{success:true,id:socket.id, mapWidth:mapWidth, mapHeight:mapHeight, whiteScore:whiteScore, blackScore:blackScore});
}

function spawnHordeThugs(){
		if (personalHordeMode){
			hordeKills = player.getHighestPlayerHordeKills();
		}
		var randy = randomInt(1,4);
		var spawnX = 0;
		var spawnY = 0;
		if (randy == 1){
				spawnX = 10 * 75;
				spawnY = 5;
		}
		else if (randy == 2){
				spawnX = mapWidth - 5;
				spawnY = 10 * 75;
		}
		else if (randy == 3){
				spawnX = mapWidth - 8 * 75;
				spawnY = mapHeight - 5;
		}
		else if (randy == 4){
				spawnX = 5;
				spawnY = mapHeight - 8 * 75;
		}

		var killsScaling = Math.round((500 - hordeKills)/100); //5
		if (killsScaling < 1){killsScaling = 1;}
		
		var spawnFrequenceyRng = randomInt(1,killsScaling);

		var spawnAmountRng = Math.ceil((hordeKills + 1)/100);
		
		var rand3 = randomInt(1,spawnAmountRng);
		if (spawnFrequenceyRng <= 1){
			for (var x = 0; x < rand3; x++){
				thug.createThug(1, spawnX, spawnY);		
			}
		}
}

function spawnHordePickup(){
	if (pickup.getPickupListLength() < 10){
		var spawnFromEdge = 400;
		var spawnX = randomInt(spawnFromEdge, mapWidth - spawnFromEdge);
		var spawnY = randomInt(spawnFromEdge, mapWidth - spawnFromEdge);

		var randy = randomInt(1,15);
		if (randy <= 1){
			var rand2 = randomInt(2,6);
			var ammoAmount = 0;
			if (rand2 == 2){
				ammoAmount = DPClipSize * 3;
			}
			else if (rand2 == 3){
				ammoAmount = MGClipSize * 2;
			}
			else if (rand2 == 4){
				ammoAmount = SGClipSize * 2;
			}
			else if (rand2 == 5){
				ammoAmount = 75;
			}
			else if (rand2 == 6){
				ammoAmount = laserClipSize;
			}
	
			pickup.createPickup(Math.random(), spawnX, spawnY, rand2, ammoAmount, -1);
		}
	}
}

//Game start
//Disconnect
//Die
//10 seconds since last record

function isEveryoneDead(){
	var everyoneDead = true;
	var playerList = player.getPlayerList();
	for (var p in playerList){ 
		if (playerList[p].health > 0){everyoneDead = false;}
	}
	return everyoneDead;

}

var upsertHordeRecords = function(resetHordeModeCondition, playerId = false){
	var everyoneDead = isEveryoneDead();
	var playerList = player.getPlayerList();
	//Set personal best
	for (var p in playerList){ 
		console.log("playerList[p].hordePersonalBest:" + playerList[p].hordePersonalBest);
		var calcHordeKills = hordeKills;
		if (personalHordeMode){calcHordeKills = playerList[p].hordeKills;}

		if (calcHordeKills > playerList[p].hordePersonalBest && playerList[p].hordePersonalBest.typeOf != "undefined"){
			playerList[p].hordePersonalBest = calcHordeKills;
			console.log("SETTING NEW PERSONAL BEST!");
			dataAccessFunctions.setHordePersonalBest(playerList[p].cognitoSub, calcHordeKills);
		}		
		updatePlayerList.push({id:playerList[p].id,property:"hordePersonalBest",value:playerList[p].hordePersonalBest});		//send only to player!!!
	}

	//Get then Set global best
	dataAccessFunctions.getHordeGlobalBest(function(best){
		hordeGlobalBest = best.kills;
		hordeGlobalBestNames = best.names;
		console.log("Is kills[" + hordeKills + "[ greater than global:" + hordeGlobalBest);
		if (hordeKills > hordeGlobalBest){
			console.log("SETTING NEW HORDE RECORD");
			hordeGlobalBest = hordeKills;
			var names = "";
			for (var p in playerList){
				if (names.length > 0){names += ",";}
				names += playerList[p].name;
			}
			dataAccessFunctions.setHordeGlobalBest(names, hordeKills);
			hordeGlobalBestNames = names;
			updateMisc.hordeGlobalBestNames = hordeGlobalBestNames;
		}
		if (resetHordeModeCondition){
			if (everyoneDead || !personalHordeMode){
				thug.clearThugList();
				pickup.clearPickupList();
				hordeKills = 0;
				updateMisc.hordeKills = hordeKills;
			}
			if (playerId){
				updateMisc.playerDied = playerList[playerId].name;	
			}
			for (var p in playerList){
				if (personalHordeMode && playerList[p].id == playerId){
					playerList[p].hordeKills = 0;
					updatePlayerList.push({id:playerList[p].id,property:"hordeKills",value:playerList[p].hordeKills});
					playerList[p].respawn();
				}
				else if (!personalHordeMode){
					playerList[p].hordeKills = 0;
					updatePlayerList.push({id:playerList[p].id,property:"hordeKills",value:playerList[p].hordeKills});
					playerList[p].respawn();
				}
			}	
		}
		if (everyoneDead){hordeKills = 0;}
	});
}

var resetHordeMode = function(playerId = false){
	upsertHordeRecords(true, playerId);
}



//TIMER1 - EVERY FRAME timer1 tiemer1 tiemr1
//------------------------------------------------------------------------------
const tickLengthMs = 1000/60;
var ticksSinceLastSecond = 0;
var staleCustomGameThresholdTimer = 0;

var gameLoop = function(){
	ticksSinceLastSecond++;
	if (pause == true)
		return;
	
	player.runPlayerEngines();
	thug.runThugEngines();
		
	if (gametype == "ctf"){
		moveBags();
	}

	if (customServer){
		var playerListLength = player.getPlayerListLength();
		if (staleCustomGameThresholdTimer < staleCustomGameThreshold && playerListLength <= 0){
			staleCustomGameThresholdTimer++;
		}
		else if (playerListLength > 0){
			staleCustomGameThresholdTimer = 0;
		}
		else if (staleCustomGameThresholdTimer >= staleCustomGameThreshold){
			resetGameSettingsToStandard();
			staleCustomGameThresholdTimer = 0;
		}
	}
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
		//if (updatePlayerList.length > 0 || updateThugList.length > 0 || updatePickupList.length > 0 || updateNotificationList.length > 0 || Object.keys(updateMisc).length > 0){
			socket.emit('update', updatePlayerList, updateThugList, updatePickupList, updateNotificationList, teamFilteredUpdateEffectList, updateMisc);
		//}
	}

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

	if (gametype == "elim" && !(pregame && pregameIsHorde) && !roundOver){
		checkIfRoundOver();
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
				elimVotes:elimVotes,
				thePitVotes:thePitVotes,
				longestVotes:longestVotes, 
				crikVotes:crikVotes,
				voteRebalanceTeamsYes:voteRebalanceTeamsYes,
				voteRebalanceTeamsNo:voteRebalanceTeamsNo,
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

	//Horde Stuff
	if (gametype == "horde" || (pregame && pregameIsHorde)){
		if (player.getPlayerListLength() > 0){
			if (!isEveryoneDead()){
				spawnHordeThugs();
				if (hordeKills > 5)
					spawnHordeThugs();
				spawnHordePickup();
			}
		}
		else if (thug.getThugListLength() > 0 || pickup.getPickupListLength() > 0){
			resetHordeMode();
		}

	} 
	else if (!pregame && player.getPlayerListLength() <= 0){
		console.log("SETTING BACK TO PREGAME!!!! Because there are " + player.getPlayerListLength() + " players");
		pregame = true;
		mapEngine.initializeBlocks(map);
		mapEngine.initializePickups(map);
		resetHordeMode();
	}

	//Pickup timer stuff
	pickup.clockTick();
	
	if (gameOver == true || (gametype == "elim" && roundOver == true)){
		if (nextGameTimer > 0){
			nextGameTimer--;
			updateMisc.nextGameTimer = nextGameTimer;
		}
		if (nextGameTimer == 0) {
			if (gametype == "elim" && !gameOver){
				startNewRound();
				nextGameTimer = timeBeforeNextRound;
			}
			else {
				restartGame();
				nextGameTimer = timeBeforeNextGame;
			}
			updateMisc.nextGameTimer = nextGameTimer;
		}
	}	
		
	//Repeating game server DB sync
	secondsSinceLastServerSync++;
	if (secondsSinceLastServerSync > syncServerWithDbInterval){
		if (pregame == true){
			if ((gametype == "ctf" || gametype == "slayer" || gametype == "elim") && getNumPlayersInGame() >= 4 && !customServer){
				console.log("Restarting because gametype is " + gametype + " and there are " + getNumPlayersInGame() + " players (need 4)");
				restartGame();
			}
			else if (gametype == "horde" && getNumPlayersInGame() >= 1){
				console.log("Restarting because gametype is " + gametype + " and there are " + getNumPlayersInGame() + " players (need 1)");
				restartGame();
			}
		}
		gameServerSync();
	}
}

function getServerName(){
	if (gametype == "horde"){
		serverName = "Invasion " + port.substring(2,4);
	}
	else if (!customServer){
		serverName = "Ranked " + port.substring(2,4);
	}
	return serverName;
}

function getServerSubName(){
	var serverSubName = "";
	if (maxPlayers%2 != 0)
	{
		maxPlayers++;
	}
	serverSubName += "[" + maxPlayers/2 + "v" + maxPlayers/2;
	if (gametype == "ctf"){
		serverSubName += " Capture]";
	}
	else if (gametype == "slayer"){
		serverSubName += " Deathmatch]";
	}
	else if (gametype == "elim"){
		serverSubName += " Elimination]";
	}
	else if (gametype == "horde"){
		serverSubName = "[" + maxPlayers + " Players]";
	}
	return serverSubName;
}

function getCurrentHighestScore(){
	var currentHighestScore = 0;
	if (blackScore > whiteScore){
		currentHighestScore = blackScore;
	}
	else {
		currentHighestScore = whiteScore;
	}
	return currentHighestScore;
}

function getCurrentUsersForDB(){
	var currentUsers = [];
	var playerList = player.getPlayerList();
	for (var p in playerList){
		if (typeof SOCKET_LIST[playerList[p].id] === 'undefined')
			continue;
		if (typeof playerList[p].team === 'undefined' || playerList[p].team === 0)
			continue;

		currentUsers.push({
			socketId:playerList[p].id,
			cognitoSub:playerList[p].cognitoSub,
			username:playerList[p].name,
			partyId:playerList[p].partyId,
			team:playerList[p].team,
			rating:SOCKET_LIST[playerList[p].id].rating,
			experience:SOCKET_LIST[playerList[p].id].experience
		});
	}
	return currentUsers;
}

var gameServerSync = function(cognitoSubToRemoveFromIncoming = false){
	if ((isLocal && myUrl == "") || (!isLocal && myQueryString.length <= 0)){ //myQueryString is only used in AWS
		logg("WARNING - Unable to get server IP. Retrying in " + syncServerWithDbInterval + " seconds...");
		return;
	}

	var obj = {};
	obj.serverName = getServerName();
	obj.serverSubName = getServerSubName();
	obj.healthCheckTimestamp = new Date();
	obj.matchTime = (gameMinutesLength * 60) + gameSecondsLength;
	obj.currentTimeLeft = (minutesLeft * 60) + secondsLeft;
		if (pregame == true || gameOver == true){obj.currentTimeLeft = obj.matchTime;}
	obj.currentHighestScore = getCurrentHighestScore();
	obj.currentUsers = getCurrentUsersForDB();
	obj.instanceId = instanceId;
	obj.privateServer = privateServer;
	obj.customServer = customServer;	
	obj.gametype = gametype;
	obj.maxPlayers = maxPlayers;
	obj.voteGametype = voteGametype;
	obj.voteMap = voteMap;
	obj.scoreToWin = scoreToWin;
	obj.queryString = myQueryString;
	obj.serverPassword = serverPassword;

	dataAccessFunctions.dbGameServerUpdate(obj, cognitoSubToRemoveFromIncoming);
	secondsSinceLastServerSync = 0;
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
			laserClip:playerList[a].laserClip,	
			DPAmmo:playerList[a].DPAmmo,	
			MGAmmo:playerList[a].MGAmmo,	
			SGAmmo:playerList[a].SGAmmo,	
			reloading:playerList[a].reloading,
			images:{ 1:{}, 2:{} },
			customizations:playerList[a].customizations,			
			
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

		if (playerList[a].id == socketId){
			playa.settings = playerList[a].settings;			
		}

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

	miscPack.hordeGlobalBestNames = hordeGlobalBestNames;
	miscPack.hordeGlobalBest = hordeGlobalBest;	

	miscPack.pregame = pregame;		
	miscPack.pregameIsHorde = pregameIsHorde;		
	miscPack.shopEnabled = shopEnabled;
	
	miscPack.variant = {};
	var mapToSend = (gametype == "horde" || (pregame && pregameIsHorde)) ? "horde" : map;
	miscPack.variant.map = mapToSend;
	miscPack.variant.customServer = customServer;
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

var updateRequestedSettings = function(settings, cb){
/*
	var allowAbleSettings = [		
		"serverName",
		"minutesLeft",
		"secondsLeft",
		"nextGameTimer",
		"gameMinutesLength",
		"gameSecondsLength",
		"map",
		"gametype",
		"maxPlayers",
		"scoreToWin",
		"rechargeDelayTime", //Double for breaking under zero energy
		"healDelayTime",
		"healRate", //Milisecond delay between heal tick after player already started healing (Higher number is slower heal)
		"respawnTimeLimit",
		"slayerRespawnTimeLimit3", //seconds (translated to frames)
		"ctfRespawnTimeLimit5", //seconds (translated to frames)
		"bagDrag",
		"cloakingEnabled",
		"cloakDrainSpeed",
		"cloakDrag", //Walking speed multiplier when cloaked
		"cloakInitializeSpeed",
		"cloakDeinitializeSpeed",
		"playerMaxHealth",
		"bootOnAfk",
		"AfkFramesAllowed", //seconds (translated to frames) //timeout
		"damageScale",
		"pistolDamage",
		"pistolSideDamage", //Stacks on above
		"pistolBackDamage", //Stacks AGAIN on above
		"DPDamage",
		"DPSideDamage", //Stacks on above
		"DPBackDamage", //Stacks AGAIN on above
		"mgDamage", 
		"mgSideDamage", //Stacks on above
		"mgBackDamage", //Stacks AGAIN on above
		"LaserDamage",
		"SGDamage",
		"SGSideDamage",
		"SGBackDamage",
		"friendlyFireDamageScale",
		"boostDamage",
		"cloakBonusDamage",
		"bulletRange",
		"laserRange",
		"SGRange",
		"SGCloseRangeDamageScale",
		"SGPushSpeed",
		"laserPushSpeed",
		"MGPushSpeed",
		"speedCap",
		"boostAmount",
		"playerMaxSpeed",
		"startingWeapon",
		"spawnOpposingThug",
		"timeBeforeNextGame",
		"maxEnergyMultiplier",
		"voteMap",
		"voteGametype",
		"customServer"
	];
	*/

	var allowAbleSettings = [
		"serverName",
		"serverPassword", 
		"gameMinutesLength", 
		"scoreToWin",
		"map",
		"gametype",
		"maxPlayers",
		"voteGametype",
		"voteMap",
		"startingWeapon",
		"maxEnergyMultiplier",
		"cloakingEnabled",
		"boostAmount",
		"playerMaxSpeed",
		"healRate",
		"bagDrag",
		"damageScale",
		"spawnOpposingThug", 
		"timeBeforeNextGame"
	];

	for (var s in settings){
		if (allowAbleSettings.indexOf(settings[s].name) > -1){

			if (settings[s].name == 'serverName' || settings[s].name == 'serverPassword'){
				settings[s].value = "'" + settings[s].value + "'";
			}

			var evalText = settings[s].name + " = " + settings[s].value + ";";
			log("Updating setting: " + evalText);
			try{
				eval(evalText);
			}
			catch(err){

			}
		}
	}
	customServer = true;
	bootOnAfk = false;
	pregameIsHorde = false;
	pregame = true;
	if (serverPassword != ""){
		privateServer = true;
	}

	log(port + " And of course, setting customServer to " + customServer);
	mapEngine.initializeBlocks(map);
	mapEngine.initializePickups(map);
	cb("done");
}



module.exports.getMoreTeam1Players = getMoreTeam1Players;
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
module.exports.updateRequestedSettings = updateRequestedSettings;
module.exports.resetHordeMode = resetHordeMode;
module.exports.upsertHordeRecords = upsertHordeRecords;
module.exports.gameServerSync = gameServerSync;
module.exports.isBagHome = isBagHome;
module.exports.eliminationRoundWin = eliminationRoundWin;
module.exports.checkIfRoundOver = checkIfRoundOver;
