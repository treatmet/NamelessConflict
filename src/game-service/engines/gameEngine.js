var pickup = require('../entities/pickup.js');
var block = require('../entities/block.js');
var thug = require('../entities/thug.js');
var player = require('../entities/player.js');
var grenade = require('../entities/grenade.js');
var dataAccessFunctions = require('../../shared/data_access/dataAccessFunctions.js');
var dataAccess = require('../../shared/data_access/dataAccess.js');
var mapEngine = require('./mapEngine.js');

const { request } = require('express');
const { ElastiCache } = require('aws-sdk');

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
	AfkFramesAllowed = 60 * 60; //seconds (translated to frames) //timeout
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
	LaserDamage = 175;
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
	threatSpawnRange = 500;
	pushStrength = 15; //Push block strength
	serverPassword = "";
	privateServer = false;
	console.log("I'm setting " + port + " customServer to false");
	customServer = false;
	pregameIsHorde = true;
	serverName = "RANKED " + port.substring(2,4);
	bannedCognitoSubs = [];
	createdByCognitoSub = "";
	mapEngine.initializeBlocks();
	mapEngine.initializePickups();
	gameServerSync();
}

var changeTeams = function(playerId, requestedTeam = false){
	var playerList = player.getPlayerList();
	 console.log("change teams: " + playerList[playerId].id);
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
			playerList[playerId].updatePropAndSend("holdingBag", false);
		}
		if (requestedTeam === 0 && playerList[playerId].team != 0){
			playerList[playerId].updatePropAndSend("team", 0);
			playerList[playerId].manualSpectate = true;
			playerList[playerId].updatePropAndSend("health", 0);
		}
		else if ((requestedTeam == 2 || requestedTeam == false) && playerList[playerId].team != 2){
			console.log("CHANGING TO TEAM 2");
			playerList[playerId].updatePropAndSend("team", 2);
			SOCKET_LIST[playerId].emit('addToChat', 'CHANGING TO THE OTHER TEAM.');
			if (!(gametype == "elim" && playerList[playerId].health <= 0)){
				playerList[playerId].respawn(true);			
			}
		}
		else if ((requestedTeam == 1 || requestedTeam == false) && playerList[playerId].team != 1){
			console.log("CHANGING TO TEAM 1");
			playerList[playerId].updatePropAndSend("team", 1);
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


function getEligibleTeamCount(playerList, team){
	var blackPlayers = 0;
	var whitePlayers = 0;
	
	for (var i in playerList){
		if (playerList[i].team == 1){
			whitePlayers++;
		}
		else if (playerList[i].team == 2){
			blackPlayers++;
		}
	}
	
	if (team == 1){
		return whitePlayers;
	}
	else if (team == 2){
		return blackPlayers;		
	}
	return 0;
}

function calculateAvgRating(playerList, includeNoobs, excludePlayer = false){
	var players = 0;
	var playersTotalScore = 0;

	var team2Players = 0;
	var team1Players = 0;
	var team1TotalScore = 0;
	var team2TotalScore = 0;
	
	for (var i in playerList){
		if (!playerList[i].rating){playerList[i].rating = 0;}
		if ((playerList[i].timeInGame < timeInGameRankingThresh) || (playerList[i].rating < ratingCalcThresh && !includeNoobs) || (excludePlayer && excludePlayer == playerList[i].id)){
			continue;
		}

		players++;
		playersTotalScore += playerList[i].rating;
		if (playerList[i].team == 1){
			team1Players++;
			team1TotalScore += playerList[i].rating;
		}
		else if (playerList[i].team == 2){
			team2Players++;
			team2TotalScore += playerList[i].rating;
		}
	}
	console.log("Calculating avg rating. player length:" + players.length + ". includeNoobs:" + includeNoobs );
	var team1Rating = team1TotalScore / team1Players;
	var team2Rating = team2TotalScore / team2Players;
	var playersRating = playersTotalScore / players;
	if (team1Rating == undefined || team1Rating == null || isNaN(team1Rating)){team1Rating = -1;}
	if (team2Rating == undefined || team2Rating == null || isNaN(team2Rating)){team2Rating = -1;}
	if (playersRating == undefined || playersRating == null || isNaN(playersRating) || players.length <= 1){playersRating = -1;} //Need at least 2 ranked people in a FFA game to be ranting influenced

	var rating = {
		team1:team1Rating,
		team2:team2Rating,
		players:playersRating,
	};

	return rating;
}

function compare(a,b) {
	if (a.cashEarnedThisGame < b.cashEarnedThisGame)
	  return 1;
	if (a.cashEarnedThisGame > b.cashEarnedThisGame)
	  return -1;
	return 0;
  }

  
function compareKills(a,b) {
	if (!a || !b){return 0;}
  	if (a.kills < b.kills)
    	return 1;
  	if (a.kills > b.kills)
		return -1;
	if (a.kills == b.kills){
		if (a.cashEarnedThisGame < b.cashEarnedThisGame)
			return 1;
		if (a.cashEarnedThisGame > b.cashEarnedThisGame)
			return -1;	
	}
  	return 0;
}


//abandoningCognitoSubs
function calculateEndgameStats(){ //calculate endgame calculate ranking calculatePostgameStats calculate postgame
	logg("---CALCULATING ENDGAME STATS!---");
	var eligiblePlayerList = player.getEligiblePlayerList();
	if (gametype == "ffa"){
		eligiblePlayerList.sort(compareKills);
	}
	var averageTeamPlayersCash = player.getAverageTeamPlayersCash();

	updatePlayersRatingAndExpFromDB(eligiblePlayerList, function(eligiblePlayerListUpdated, mongoRes){
		var team1EligiblePlayerCount = getEligibleTeamCount(eligiblePlayerListUpdated, 1);
		var team2EligiblePlayerCount = getEligibleTeamCount(eligiblePlayerListUpdated, 2);		
		var averageRating = calculateAvgRating(eligiblePlayerListUpdated, false);
		var averageRatingPlusNoobs = calculateAvgRating(eligiblePlayerListUpdated, true);
		console.log("averageRating:" + averageRating + " averageRatingPlusNoobs:" + averageRatingPlusNoobs);
		//if playing empty team, zero points awarded
		//if playing noob team, minimum gain/loss awarded (unless you are a noob)

		//Calculate progress made, and send to client (and then update user's DB stats)
		for (var p in eligiblePlayerListUpdated){
			var player = eligiblePlayerListUpdated[p];
			var dbPlayer = getPlayerDBEntry(player.cognitoSub, mongoRes);
			var socket = SOCKET_LIST[player.id];
			logg("Processing " + player.name + "'s results");

			if (player.team == 0)
				continue;
						
			var personalPerformancePoints = 0;	
			var ptsGained = 0;

			if (gametype == "ffa" && eligiblePlayerList.length > 1){
				var playersAverageRating = calculateAvgRating(eligiblePlayerListUpdated, true, player.id).players;
				if (player.rating < ratingCalcThresh){
					playersAverageRating = calculateAvgRating(eligiblePlayerListUpdated, false, player.id).players;
				}
				var teamSkillDifferencePoints = (playersAverageRating - player.rating)/enemySkillDifferenceDivider;

				var placement = getPlacement(eligiblePlayerList, "kills", player.kills); //list should already be sorted by kills
				var placementDifferential = (matchWinLossRatingBonus*2) / (eligiblePlayerList.length-1);
				var placementBonus = matchWinLossRatingBonus - (placementDifferential*(placement-1));
				console.log(player.name + " came in " + placement + " place, with placement bonus of " + placementBonus + ". teamSkillDifferencePoints:" + teamSkillDifferencePoints);

				ptsGained = placementBonus + teamSkillDifferencePoints;
				console.log("pts gained before cap: " + ptsGained);

				if (placement > eligiblePlayerList.length/2){ //Placed bottom half
					player.gamesLost = 1;
					if (ptsGained > -1 || playersAverageRating === -1){console.log("loss min(" + ptsGained + ") or playersAverageRating was -1"); ptsGained = -1; }		
					if (ptsGained < -20){console.log("loss max(" + ptsGained + ")"); ptsGained = -20;} //Loss cap	
					player.cashEarnedThisGame+=loseCash; 	
				}
				else { //Placed top half, or middle
					player.gamesWon = 1;
					if (ptsGained < minWinPointsGained || playersAverageRating === -1){console.log("win min(" + ptsGained + ") or playersAverageRating was -1"); ptsGained = minWinPointsGained;}		
					if (ptsGained > 25){console.log("win max(" + ptsGained + ")"); ptsGained = 25;} //Gain cap		
					player.cashEarnedThisGame+=loseCash; 
				}
			}
			else if (eligiblePlayerList.length > 1) {
				var enemyAverageRating = player.team == 1 ? averageRating.team2 : averageRating.team1;
				if (player.rating < ratingCalcThresh){
					enemyAverageRating = player.team == 1 ? averageRatingPlusNoobs.team2 : averageRatingPlusNoobs.team1;
				}
				//personal performance formula
				console.log("Calculating personal performance");
				var subby = player.cashEarnedThisGame - averageTeamPlayersCash;
				personalPerformancePoints = (player.cashEarnedThisGame - averageTeamPlayersCash) / 200;
				if (personalPerformancePoints < 0) {personalPerformancePoints /= 2;}
				ptsGained += Math.round(personalPerformancePoints);
				console.log("MyCash:" + player.cashEarnedThisGame + " AVG:" + averageTeamPlayersCash + " subtracted=" + subby + " performance points:" + personalPerformancePoints);

				var teamSkillDifferencePoints = (enemyAverageRating - player.rating)/enemySkillDifferenceDivider;
				console.log("enemyAverageRating:" + enemyAverageRating + " teamSkillDifferencePoints: " + teamSkillDifferencePoints);

				if ( ((player.team == 1 && whiteScore > blackScore) || (player.team == 2 && whiteScore < blackScore)) && socket){
					//win
					player.gamesWon = 1;
					console.log("matchWinLossBonus: " + matchWinLossRatingBonus);
					ptsGained += Math.round(matchWinLossRatingBonus + teamSkillDifferencePoints);
					if (ptsGained < minWinPointsGained || enemyAverageRating === -1){console.log("win min(" + ptsGained + ") or enemyAverageRating was -1"); ptsGained = minWinPointsGained;}		
					if (ptsGained > 25){console.log("win max(" + ptsGained + ")"); ptsGained = 25;} //Gain cap		
					logg(player.name + " had " + player.rating + " pts, and beat a team with " + enemyAverageRating + " pts. He gained " + ptsGained);
					player.cashEarnedThisGame+=winCash; 
				}
				else {
					//loss
					player.gamesLost = 1;
					ptsGained += Math.round(-matchWinLossRatingBonus + teamSkillDifferencePoints);
					console.log("matchWinLossBonus: -" + matchWinLossRatingBonus);
					if (ptsGained > -1 || enemyAverageRating === -1){console.log("loss min(" + ptsGained + ") or enemyAverageRating was -1"); ptsGained = -1; }		
					if (ptsGained < -20){console.log("loss max(" + ptsGained + ")"); ptsGained = -20;} //Loss cap		
					logg(player.name + " had " + player.rating + " pts, and lost to a team with " + enemyAverageRating + " pts. He lost " + ptsGained);				
					player.cashEarnedThisGame+=loseCash; 
				}

				//Playing empty team
				if((player.team == 1 && team2EligiblePlayerCount === 0) || (player.team == 2 && team1EligiblePlayerCount === 0)){
					logg("Playing empty team");
					ptsGained = 0;				
				}
			}

			updatePlayerList.push({id:player.id,property:"cashEarnedThisGame",value:player.cashEarnedThisGame});

			//Prevent player from having sub zero ranking
			if (player.rating + ptsGained < 0){
				logg("Saved player from dipping below zero ranking");
				ptsGained = -player.rating; //lose all points
			}

			//Eligible for rank up/down this game?
			if (gametype == "ffa"){
				var timeElapsed = (gameMinutesLength * 60 + gameSecondsLength) - (minutesLeft * 60 + secondsLeft);
				timeInGameRankingThresh = timeElapsed * 0.90;
				console.log("FFA! Time elapsed is " + timeElapsed + ". So time required to play is " + timeInGameRankingThresh);
			}
			log("player.timeInGame: " + player.timeInGame + " have they played longer than " + timeInGameRankingThresh);
			if ((player.timeInGame < timeInGameRankingThresh && !isLocal) || customServer){
				logg("Player ineligible for rank influence this game");
				ptsGained = 0;				
			}


			//Thursday Bonus!
			dt = new Date();
			if (dt.getDay() == 4 && dt.getHours() > 12){
				if (player && typeof player.updatePropAndSend != 'undefined'){
					player.updatePropAndSend("cashEarnedThisGame", player.cashEarnedThisGame * 2);
				}
			}	
			
			if (customServer){
				player.cashEarnedThisGame =  Math.round(player.cashEarnedThisGame/2);
			}

			ptsGained = Math.round(ptsGained);
			player.cashEarnedThisGame = Math.round(player.cashEarnedThisGame);
			log("Grand total is " + ptsGained);

			//Trigger client's end of game progress results report
			var endGameProgressResults = {};
			endGameProgressResults.originalRating = player.rating;
			endGameProgressResults.ratingDif = ptsGained;
			endGameProgressResults.originalExp = player.experience;
			endGameProgressResults.expDif = player.cashEarnedThisGame;
			endGameProgressResults.personalPerformancePoints = personalPerformancePoints;

			var rankProgressInfo = getRankFromRating(player.rating);
			endGameProgressResults.rank = rankProgressInfo.rank;
			endGameProgressResults.nextRank = rankProgressInfo.nextRank;
			endGameProgressResults.previousRank = rankProgressInfo.previousRank;
			endGameProgressResults.rankFloor = rankProgressInfo.floor;
			endGameProgressResults.rankCeiling = rankProgressInfo.ceiling;

			var experienceProgressInfo = getLevelFromExperience(player.experience);
			endGameProgressResults.level = experienceProgressInfo.level;
			endGameProgressResults.experienceFloor = experienceProgressInfo.floor;
			endGameProgressResults.experienceCeiling = experienceProgressInfo.ceiling;		

			log(player.name + "'s endGameProgressResults:");
			console.log(endGameProgressResults);

			//convert back to all stats being incremental
			player.rating = ptsGained;
			player.experience = player.cashEarnedThisGame;
			player.cash = player.cashEarnedThisGame;

			if (!dbPlayer){continue;}
			var updateParams = getEndgameUpdateParams(player, dbPlayer);

			if (dbPlayer.experience < 1000000 && player.cashEarnedThisGame + dbPlayer.experience >= 1000000){
				//Award millionaire icon
			}

			if (socket){
				socket.emit('endGameProgressResults', endGameProgressResults);		
			}
			else if ((player.timeInGame < timeInGameRankingThresh) && !customServer){
				updateParams = {gamesLost:dbPlayer.gamesLost+1, gamesPlayed:dbPlayer.gamesPlayed+1, rating:dbPlayer.rating + ptsGained};
				logg("Hitting cognito sub with a hard L for abandoning");
				player.cashEarnedThisGame = 0;
			}

			dataAccessFunctions.dbUserUpdate("set", player.cognitoSub, updateParams);
		} //eligible player loop
	});
}

function getPlayerDBEntry(cognitoSub, mongoRes){
	var dbPlayer = mongoRes.find(plyr => plyr.cognitoSub == cognitoSub);
	return dbPlayer;
}

function getEndgameUpdateParams(player, dbPlayer) {
	if (!player || !dbPlayer){return false;}

	var updateParams = {};

	//Normal fields
	var fieldsToIncrement = [
		"kills", 
		"assists",
		"deaths",
		"captures",
		"steals",
		"returns",
		"cash",
		"experience",
		"gamesWon",
		"gamesLost",
		"rating"
	];		
	for (var f = 0; f < fieldsToIncrement.length; f++){
		if (!dbPlayer[fieldsToIncrement[f]]){dbPlayer[fieldsToIncrement[f]] = 0;}
		if (!player[fieldsToIncrement[f]]){player[fieldsToIncrement[f]] = 0;}
		updateParams[fieldsToIncrement[f]] = player[fieldsToIncrement[f]] + dbPlayer[fieldsToIncrement[f]];
	}
	updateParams.gamesPlayed = dbPlayer.gamesPlayed+1;

	//Medals
	if (!dbPlayer.medals){dbPlayer.medals = {};}
	if (!player.medals){player.medals = {};}
	updateParams.medals = {};
	for (var m = 0; m < playerMedals.length; m++){
		if (!dbPlayer["medals"][playerMedals[m]])
			dbPlayer["medals"][playerMedals[m]] = 0;
		if (!player["medals"][playerMedals[m]])
			player["medals"][playerMedals[m]] = 0;
		
		updateParams["medals"][playerMedals[m]] = dbPlayer["medals"][playerMedals[m]] + player["medals"][playerMedals[m]];	
	}

	return updateParams;
	//upsert User to DB
	//dataAccessFunctions.dbUserUpdate("inc", player.cognitoSub, updateParams);

}

function getPlacement(list, prop, playerValue){
	for (var i = 0; i < list.length; i++){
		if (list[i][prop] <= playerValue){
			return i+1;
		}
	}
	return list.length;
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
		if (typeof playerList[p].rating === 'undefined'){playerList[p].rating = 0;}
		if (typeof playerList[p].rating === 'undefined'){playerList[p].experience = 0;}
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

var spawnSafely = function(entity){
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
			if (map == "narrows"){
				potentialX = randomInt(4*75, 40*75);			
				potentialY = randomInt(0,mapHeight);
			}
			else if (map == "longNarrows"){
				potentialX = randomInt(6*75, 47*75);			
				potentialY = randomInt(0,mapHeight);
			}
			else {
				potentialX = randomInt(0,mapWidth);			
				potentialY = randomInt(0,mapHeight);
			}
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
	checkForWinByScore();
	checkForWinByTime();
}

function checkForWinByScore(){
	if (pregame || gameOver){return;}
	if (scoreToWin <= 0){return;}
	var isTeamGame = gametype == "ffa" ? false : true;

	if (isTeamGame){
		if (whiteScore >= scoreToWin || blackScore >= scoreToWin){
			endGame();
		}
	}
	else if (!isTeamGame){
		var playerList = player.getTeamPlayerList();
		for (var p in playerList){
			if (playerList[p].kills >= scoreToWin){
				endGame();
				break;
			}
		}
	}


}

function checkForWinByTime(){
	if (pregame || gameOver){return;}
	if (gameSecondsLength <= 0 && gameMinutesLength <= 0){return;}
	var isTeamGame = gametype == "ffa" ? false : true;

	if (secondsLeft <= 0 && minutesLeft <= 0){
		if (isTeamGame && whiteScore != blackScore){ 
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
		else if (!isTeamGame){
			var playerList = player.getTeamPlayerList();
			var leaders = [];
			var leadingScore = 0;
			if (playerList.length <= 1){return;}
			for (var p in playerList){
				if (playerList[p].kills >= leadingScore){
					if (playerList[p].kills > leadingScore){
						leaders = [];
						leadingScore = playerList[p].kills;
					}
					leaders.push(playerList[p]);
				}
			}	

			if (leaders.length == 1){
				endGame();
			}

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

//bag physics bagMechanics
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
	if ((bagBlue.x != bagBlue.homeX || bagBlue.y != bagBlue.homeY) && !bagBlue.captured){
		if (block.checkCollision(bagBlue))
			updateMisc.bagBlue = bagBlue;
	}
	if ((bagRed.x != bagRed.homeX || bagRed.y != bagRed.homeY) && !bagRed.captured){
		if (block.checkCollision(bagRed))
			updateMisc.bagRed = bagRed;
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
	pickup.clearDroppedPickups();

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
		var newGameSise=parties[q].partySize + getNumTeamPlayersInGame();
		logg("IF WE ADD YOU[" + parties[q].playerIds[0] + "'s party], IS NEW GAME SIZE(" + newGameSise + ") greater than maxPlayers (" + maxPlayers);
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
	grenade.clearGrenades();
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
	if (ctfVotes > slayerVotes && ctfVotes > elimVotes && ctfVotes > ffaVotes && gametype != "ctf"){
		scoreToWin = 3;
		gameMinutesLength = 5;
		gameSecondsLength = 0;
		gametype = "ctf";
	}
	else if (slayerVotes > ctfVotes && slayerVotes > elimVotes && slayerVotes > ffaVotes && gametype != "slayer"){
		scoreToWin = 50;
		gameMinutesLength = 5;
		gameSecondsLength = 0;
		gametype = "slayer";
	}
	else if (elimVotes > ctfVotes && elimVotes > slayerVotes && elimVotes > ffaVotes && gametype != "elim"){
		scoreToWin = 7;		
		gameMinutesLength = 0;
		gameSecondsLength = 0;
		gametype = "elim";
	}
	else if (ffaVotes > ctfVotes && ffaVotes > slayerVotes && ffaVotes > elimVotes && gametype != "ffa"){
		scoreToWin = 25;		
		gameMinutesLength = 5;
		gameSecondsLength = 0;
		gametype = "ffa";
	}
	
	if (thePitVotes > longestVotes && thePitVotes > crikVotes && thePitVotes > narrowsVotes && thePitVotes > longNarrowsVotes && thePitVotes > whirlpoolVotes){
		map = "thepit";
	}
	else if (longestVotes > thePitVotes && longestVotes > crikVotes && longestVotes > narrowsVotes && longestVotes > longNarrowsVotes && longestVotes > whirlpoolVotes){
		map = "longest";
	}
	else if (crikVotes > thePitVotes && crikVotes > longestVotes && crikVotes > narrowsVotes && crikVotes > longNarrowsVotes && crikVotes > whirlpoolVotes){
		map = "crik";
	}
	else if (narrowsVotes > thePitVotes && narrowsVotes > longestVotes && narrowsVotes > crikVotes && narrowsVotes > longNarrowsVotes && narrowsVotes > whirlpoolVotes){
		map = "narrows";
	}
	else if (longNarrowsVotes > thePitVotes && longNarrowsVotes > longestVotes && longNarrowsVotes > crikVotes && longNarrowsVotes > narrowsVotes && longNarrowsVotes > whirlpoolVotes){
		map = "longNarrows";
	}
	else if (whirlpoolVotes > thePitVotes && whirlpoolVotes > longestVotes && whirlpoolVotes > crikVotes && whirlpoolVotes > narrowsVotes && whirlpoolVotes > longNarrowsVotes){
		map = "whirlpool";
	}
	
	if (voteRebalanceTeamsYes >= voteRebalanceTeamsNo){
		rebalanceTeams(true);
	}
	else {
		rebalanceTeams(false);
	}
	
	ctfVotes = 0;
	slayerVotes = 0;
	ffaVotes = 0;
	elimVotes = 0;
	thePitVotes = 0;
	longestVotes = 0;
	whirlpoolVotes = 0;
	narrowsVotes = 0;
	longNarrowsVotes = 0;
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
function initializeNewGame(){ //startGame gameStart
	gameOver = false;
	roundOver = false;
	pregame = false;
	bannedCognitoSubs = [];
	abandoningCognitoSubs = [];
	if (!(pregameIsHorde && pregame) && gametype != "horde"){spawnOpposingThug = false;}

	whiteScore = 0;
	blackScore = 0;
	var secondsLeftPlusZero = secondsLeft.toString();	
	if (secondsLeft < 10){
		secondsLeftPlusZero = "0" + secondsLeft.toString();
	}	
	if (gametype == "slayer" || gametype == "ffa"){
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
	timeInGameRankingThresh = 60;

	minutesLeft = gameMinutesLength;
	secondsLeft = gameSecondsLength;

	var thugList = thug.getThugList();
	for (var t in thugList){
		for(var i in SOCKET_LIST){
			SOCKET_LIST[i].emit('removeThug', thugList[t].id);
		}			
	}
	thug.clearThugList();
	grenade.clearGrenades();
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
		playerList[i].cash = (gametype == "elim" ? startingCash : 0);
		playerList[i].cashEarnedThisGame = 0;
		playerList[i].kills = 0;
		playerList[i].assists = 0;
		playerList[i].benedicts = 0;
		playerList[i].damageWarnings = 0;
		playerList[i].deaths = 0;
		playerList[i].steals = 0;
		playerList[i].returns = 0;
		playerList[i].captures = 0;			
		playerList[i].timeInGame = 0;		
		playerList[i].energyExhausted = false;		
		//playerList[i].eligibleForRank = true;	
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
	
	if (!spawnOpposingThug){
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

var updatePlayersRatingAndExpFromDB = function(playerList, cb){
	var cognitoSubs = [];

	for (var i in playerList){
		cognitoSubs.push(playerList[i].cognitoSub);
	}
	
	var searchParams = { cognitoSub: { $in: cognitoSubs } };	
	dataAccess.dbFindAwait("RW_USER", searchParams, async function(err, res){
		if (res && res[0]){

			for (var p in playerList){
				for (var r in res){
					if (playerList[p].cognitoSub == res[r].cognitoSub){		
						playerList[p].rating = res[r].rating;
						playerList[p].experience = res[r].experience;			
						break;
					}
				}
				if (typeof playerList[p].rating === 'undefined'){playerList[p].rating = 0;}
				if (typeof playerList[p].rating === 'undefined'){playerList[p].experience = 0;}
			}	

			cb(playerList, res);
		}
		else {
			cb(false, false);
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
	socket.emit('signInResponse',{success:true,id:socket.id, mapWidth:mapWidth, mapHeight:mapHeight, whiteScore:whiteScore, blackScore:blackScore});
}

function spawnHordeThugs(){ //spawnThug
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

		var killsScaling = Math.round((500 - hordeKills)/100); //1-5
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
	grenade.runEngines();
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
		var myPlayer = player.getPlayerById(socket.id);
		var teamFilteredUpdateEffectList = updateEffectList.filter(function(effect){
			if (effect.type != 7){
				return effect;
			}
			else if (effect.type == 7 && (!effect.team || (myPlayer && effect.team == myPlayer.team))){
				return effect;
			}
		});
		
		//updatePlayerListFiltered
		var myUpdatePlayerList = updatePlayerList.filter((item) => { //SELECT //WHERE //LINQ
			if (item.single === 2 && item.id == socket.id){
				return false;
			}
			if (item.property == "customizations" && item.id == socket.id){
				return false;
			}
			if (item.single === true && item.id != socket.id){
				return false;
			}
			return true;
		});

		//SOCKET OVERLOADING PREVENTION
		// if (myPlayer && myPlayer.ticksSinceLastPing > 150){
		// 	continue;
		// }

		//send update
		socket.emit('update', myUpdatePlayerList, updateThugList, updatePickupList, updateNotificationList, teamFilteredUpdateEffectList, updateGrenadeList, updateMisc);
	}

	//console.log("Sent " + msSinceLastTick + "ms after last tick. Emit took " + msSinceEmit + "ms");
	updatePlayerList = [];
	updateGrenadeList = [];
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

	//ranked Eligibility on timeout
	if (!pregame && !gameOver)
		incrementTimeInGameForPlayers();

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
				ffaVotes:ffaVotes,
				elimVotes:elimVotes,
				thePitVotes:thePitVotes,
				longestVotes:longestVotes, 
				whirlpoolVotes:whirlpoolVotes, 
				crikVotes:crikVotes,
				narrowsVotes:narrowsVotes,
				longNarrowsVotes:longNarrowsVotes,
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
		gameOver = false;
		secondsLeft = 99;
		minutesLeft = 9;
		whiteScore = 0;
		blackScore = 0;
		abandoningCognitoSubs = [];
		bannedCognitoSubs = [];
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
			else if ((gametype == "ffa") && getNumPlayersInGame() >= 2 && !customServer){
				console.log("Restarting because gametype is " + gametype + " and there are " + getNumPlayersInGame() + " players (need 2)");
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

function incrementTimeInGameForPlayers(){
	var playerList = player.getPlayerList();
	for (var p in playerList){
		if (!playerList[p].timeInGame){
			playerList[p].timeInGame = 0;
		}
		playerList[p].timeInGame++;
	}
}

var profanityImport = require('@2toad/profanity');
const options = new profanityImport.ProfanityOptions();
options.wholeWord = false;
const profanity = new profanityImport.Profanity(options);
profanity.removeWords([
 '4r5e','5h1t','5hit','a55','anal','anus','ar5e','arrse','arse','arses','ass','ass-fucker','asses','assfucker','assfukka','asshole','assholes','asswhole','a_s_s','a$$','as$','a$s','b!tch','b00bs','b17ch','b1tch','ballbag','balls','ballsack','bastard','beastial','beastiality','bellend','bestial','bestiality','bi+ch','biatch','bitch','bitchboy','bitcher','bitchers','bitches','bitchin','bitching','bloody','blow job','blowjob','blowjobs','boiolas','bollock','bollok','boner','boob','boobs','booobs','boooobs','booooobs','booooooobs','breasts','buceta','bugger','bullshit','bum','butt','butts','butthole','buttmuch','buttplug','c0ck','c0cksucker','carpet muncher','cawk','chink','cipa','cl1t','clit','clitoris','clits','cnut','cock','cock-sucker','cockface','cockhead','cockmunch','cockmuncher','cocks','cocksuck','cocksucked','cocksucker','cocksucking','cocksucks','cocksuka','cocksukka','cok','cokmuncher','coksucka','coon','cox','crap','cum','cummer','cumming','cums','cumshot','cunilingus','cunillingus','cunnilingus','cunt','cuntlick','cuntlicker','cuntlicking','cunts','cyalis','cyberfuc','cyberfuck','cyberfucked','cyberfucker','cyberfuckers','cyberfucking','d1ck','damn','dick','dickhead','dildo','dildos','dink','dinks','dirsa','dlck','dog-fucker','doggin','dogging','donkeyribber','doosh','duche','dyke','ejaculate','ejaculated','ejaculates','ejaculating','ejaculatings','ejaculation','ejakulate','f u c k','f u c k e r','f4nny','fag','fagging','faggitt','faggot','faggs','fagot','fagots','fags','fanny','fannyflaps','fannyfucker','fanyy','fatass','fcuk','fcuker','fcuking','feck','fecker','felching','fellate','fellatio','fingerfuck','fingerfucked','fingerfucker','fingerfuckers','fingerfucking','fingerfucks','fistfuck','fistfucked','fistfucker','fistfuckers','fistfucking','fistfuckings','fistfucks','flange','fook','fooker','fuck','fucka','fucked','fucker','fuckers','fuckhead','fuckheads','fuckin','fucking','fuckings','fuckingshitmotherfucker','fuckme','fucks','fuckwhit','fuckwit','fudge packer','fudgepacker','fuk','fuker','fukker','fukkin','fuks','fukwhit','fukwit','fux','fux0r','f_u_c_k','gangbang','gangbanged','gangbangs','gaylord','gaysex','goatse','god-dam','god-damned','goddamn','goddamned','hardcoresex','headass','hoar','hoare','hoer','hoes','homo','hore','horniest','horny','hotsex','jack-off','jackoff','jap','jerk-off','jism','jiz','jizm','jizz','kawk','knobead','knobed','knobend','knobhead','knobjocky','knobjokey','kock','kondum','kondums','kum','kummer','kumming','kums','kunilingus','l3i+ch','l3itch','labia','lust','lusting','m0f0','m0fo','m45terbate','ma5terb8','ma5terbate','masochist','master-bate','masterb8','masterbat*','masterbat3','masterbate','masterbation','masterbations','masturbate','mo-fo','mof0','mofo','mothafuck','mothafucka','mothafuckas','mothafuckaz','mothafucked','mothafucker','mothafuckers','mothafuckin','mothafucking','mothafuckings','mothafucks','motherfuck','motherfucked','motherfucker','motherfuckers','motherfuckin','motherfucking','motherfuckings','motherfuckka','motherfucks','muff','muthafecker','muthafuckker','mutherfucker','n1gga','n1gger','nazi','nigg3r','nigg4h','nigga','niggah','niggas','niggaz','nigger','niggers','nob','nob jokey','nobhead','nobjocky','nobjokey','numbnuts','nutsack','orgasim','orgasims','orgasm','orgasms','p0rn','pawn','pecker','penis','penisfucker','phonesex','phuck','phuk','phuked','phuking','phukked','phukking','phuks','phuq','pigfucker','pimpis','piss','pissed','pisser','pissers','pisses','pissflaps','pissin','pissing','pissoff','poop','porn','porno','pornography','pornos','prick','pricks','pron','pube','pusse','pussi','pussies','pussy','pussys','rectum','retard','rimjaw','rimming','s hit','s.o.b.','sadist','schlong','screwing','scroat','scrote','scrotum','semen','sex','sh!+','sh!t','sh1t','shag','shagger','shaggin','shagging','shemale','shi+','shit','shitdick','shite','shited','shitey','shitfuck','shitfull','shithead','shiting','shitings','shits','shitted','shitter','shitters','shitting','shittings','shitty','skank','slut','sluts','smegma','smut','snatch','son-of-a-bitch','spac','spunk','s_h_i_t','t1tt1e5','t1tties','teets','teez','testical','testicle','tit','titfuck','tits','titt','tittie5','tittiefucker','titties','tittyfuck','tittywank','titwank','tosser','turd','tw4t','twat','twathead','twatty','twunt','twunter','v14gra','v1gra','vagina','viagra','vulva','w00se','wang','wank','wanker','wanky','whoar','whore','willies','willy'
]);
profanity.addWords([
'5h1t','5hit','a55','ass-fucker','assfucker','assfukka','asshole','assholes','asswhole','beastiality','bestiality','bullshit','c0ck','c0cksucker','cawk','chink','clit','clitoris','clits','cock','cock-sucker','cockface','cockhead','cockmunch','cockmuncher','cocks','cocksuck','cocksucked','cocksucker','cocksucking','cocksucks','cocksuka','cocksukka','cok','cokmuncher','coksucka','coon','cox','cum','cummer','cumming','cums','cumshot','cunilingus','cunillingus','cunnilingus','cunt','cuntlick','cuntlicker','cuntlicking','cunts','dog-fucker','dyke','f u c k','f u c k e r','fag','fagging','faggitt','faggot','faggs','fagot','fagots','fags','fannyfucker','fcuk','fcuker','fcuking','felching','fellate','fellatio','fingerfuck','fingerfucked','fingerfucker','fingerfuckers','fingerfucking','fingerfucks','fistfuck','fistfucked','fistfucker','fistfuckers','fistfucking','fistfuckings','fistfucks','fuck','fucka','fucked','fucker','fuckers','fuckhead','fuckheads','fuckin','fucking','fuckings','fuckingshitmotherfucker','fuckme','fucks','fuckwhit','fuckwit','fudge packer','fudgepacker','fuk','fuker','fukker','fukkin','fuks','fukwhit','fukwit','fux','fux0r','f_u_c_k','gangbang','gangbanged','gangbangs','gaysex','goatse','hardcoresex','homo','hore','jack-off','jackoff','jap','jerk-off','jism','jiz','jizm','jizz','kawk','kock','kum','kummer','kumming','kums','kunilingus','labia','m45terbate','ma5terb8','ma5terbate','masochist','master-bate','masterb8','masterbat*','masterbat3','masterbate','masterbation','masterbations','masturbate','mo-fo','mof0','mofo','mothafuck','mothafucka','mothafuckas','mothafuckaz','mothafucked','mothafucker','mothafuckers','mothafuckin','mothafucking','mothafuckings','mothafucks','motherfuck','motherfucked','motherfucker','motherfuckers','motherfuckin','motherfucking','motherfuckings','motherfuckka','motherfucks','muthafecker','muthafuckker','mutherfucker','n1gga','n1gger','nigg3r','nigg4h','nigga','niggah','niggas','niggaz','nigger','niggers','penis','penisfucker','phuck','phuk','phuked','phuking','phukked','phukking','phuks','phuq','pigfucker','pussies','pussy','pussys','retard','rimjaw','rimming','s hit','sh!+','sh!t','sh1t','shi+','shit','shitdick','shite','shited','shitey','shitfuck','shitfull','shithead','shiting','shitings','shits','shitted','shitter','shitters','shitting','shittings','shitty','slut','sluts','smegma','s_h_i_t','titfuck','tittiefucker','titties','tittyfuck','tittywank','titwank','tw4t','twat','twathead','twatty','twunt','twunter','vagina','vulva','whore'
])


function getServerName(){
	if (!customServer){
		serverName = "RANKED " + port.substring(2,4);
		if (gametype == "horde"){
			serverName = "Invasion " + port.substring(2,4);
		}
	}
	return profanity.censor(serverName);
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
		serverSubName += " Team Killfest]";
	}
	else if (gametype == "elim"){
		serverSubName += " Elimination]";
	}
	else if (gametype == "ffa"){
		serverSubName = "[" + maxPlayers + " Player Free For All]";
	}
	else if (gametype == "horde"){
		serverSubName = "[" + maxPlayers + " Player Invasion]";
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
	obj.environment = process.env.Environment;
	if (!obj.environment){obj.environment = "local";}

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
