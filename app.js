//2017-2020 Treat Metcalf
//Alpha Version

/*
CMD to run on new server:


download and install npm
download and install node.js
npm install nodejs


npm install --save amazon-cognito-identity-js
npm install --save aws-sdk
npm install --save request
npm install --save jwk-to-pem
npm install --save jsonwebtoken
npm install --save node-fetch


//use pm2 below
sudo su (I think)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.2/install.sh | bash (may even need to run this to install nvm)
nvm install 12.10.0
npm install -g pm2

//Create pm2 dameon
sudo su (i think)
pm2 start app.js -f -- 3001
pm2 start app.js -f -- 3002
pm2 start app.js -f -- 3003
pm2 start app.js -f -- 3004

//Get startup script (run result in terminal)
pm2 startup

pm2 save

//Stop app from running on ec2 startup: (don't run unless you want to undo the auto startup)
pm2 unstartup systemv

	
*/



'use strict';
var mongojs = require('mongojs');
var ObjectId = require('mongodb').ObjectID;
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const AWS = require('aws-sdk');
const request = require('request-promise');
const jwkToPem = require('jwk-to-pem');
const jwt = require('jsonwebtoken');
const fs = require('fs');
global.fetch = require('node-fetch');

var express = require('express');
var app = express();
var serv = require('http').Server(app);
const https = require('https');
var cookieParser = require('cookie-parser');
var io = require('socket.io')(serv,{});
var os = require('os');
var util = require('util')

process
  .on('unhandledRejection', (reason, p) => {
	logg("--SERVER CRASH:Unhandled Rejection at Promise");
    logg("--" + reason);
	logObj(p);
  })
  .on('uncaughtException', err => {
	logg("--SERVER CRASH:Uncaught Exception thrown");
    logg(util.format(err));
    process.exit(1);
  });

//--------------------------------CONFIG-----------------------------------------------------
var debug = true;
var httpOnlyCookies = false;
var allowDuplicateUsername = false;

var config = parseINIString(fs.readFileSync(__dirname + '/config.ini', 'utf8'));

var allowServerCommands = true;

//Game Config   //game config
var gameMinutesLength = 5;
var gameSecondsLength = 0;
var map = "longest";
var gametype = "ctf";
var maxPlayers = 14;
var isWebServer = false;
var isLocal = false;

const syncServerWithDbInterval = 15; //Seconds //Both sync and check for stale thresholds
const serverHealthCheckTimestampThreshold = 90; //Seconds

const updateOnlineTimestampInterval = 15; //Seconds
const staleOnlineTimestampThreshold = 60; //Seconds

const staleRequestCheckInterval = 60; //Seconds
const staleFriendRequestThreshold = 30; //Days
const stalePartyRequestThreshold = 300; //Seconds

const joinActiveGameThreshold = 0.8; //Percentage threshold for how far the game is allowed to be progressed and still accept incoming players


var privateServer = false;
var scoreToWin = 0;
var serverNumber = 1;
var serverName = "Server";
var voteGametype = true;
var voteMap = true;


var timeBeforeNextGame = 60;
var pcMode = 2; //1 = no, 2= yes


//Cash Values for Events
const killCash = 100;
const doubleKillCash = 200;
const tripleKillCash = 300;
const quadKillCash = 400;
const spreeCash = 250;
const frenzyCash = 500;
const rampageCash = 750;
const unbelievableCash = 1000;
const thugCash = 25;
const assassinationCash = 150;
const stealCash = 50;
const captureCash= 300;
const killEnemyBagHolder = 150;
const returnCash = 100;
const winCash = 1000;
const loseCash = 100;
const mvpCash = 300;
const hitCash = 5;

//Shop config
var shopEnabled = false;
var invincibleInShop = false;
const shop = {
	active:false,
	selection:3,
	price1:150,
	price2:300,
	price3:200,
	price4:300,
	price5:100,	
	uniqueTextTimer:0,
	uniqueText:"",
	purchaseEffectTimer:0,
};


//Player config player config
const startingCash = 0;
const boostAmount = 23;
const boostDecay = 1.9;
var globalSpeed = 6;
const speedMin = globalSpeed; 
const maxSpeed = globalSpeed; 
const rechargeDelayTime = 150; //Double for breaking under zero energy
const healDelayTime = 300;
const healRate = 10; //Milisecond delay between heal tick after player already started healing (Higher number is slower heal)
var respawnTimeLimit = 180;
const slayerRespawnTimeLimit = 5 * 60; //seconds (translated to frames)
const ctfRespawnTimeLimit = 7 * 60; //seconds (translated to frames)
const bagDrag = 0.85;
//Cloaking config
const cloakingEnabled = true;
const cloakDrainSpeed = 0.09;
const cloakDrag = 0.5; //Walking speed multiplier when cloaked
const cloakInitializeSpeed = 0.02;
const cloakDeinitializeSpeed = 0.1;
const playerMaxHealth = 175;
const AfkFramesAllowed = 6000 * 60; //seconds (translated to frames) //timeout

//Weapons config
var bulletRange = 19 * 75;
var damageScale = 1;
	var pistolDamage = 10;
	var pistolSideDamage = 10; //Stacks on above
	var pistolBackDamage = 20; //Stacks AGAIN on above
	var mgDamage = 12; 
	var mgSideDamage = 12; //Stacks on above
	var mgBackDamage = 24; //Stacks AGAIN on above
	var SGDamage = 30;
	var SGSideDamage = 30;
	var SGBackDamage = 60;

var SGRange = 310;
var SGCloseRangeDamageScale = 4;
var SGPushSpeed = 12;

var DPClipSize = 20;
var MGClipSize = 45;
var SGClipSize = 12;
	
var pistolFireRateLimiter = true;	
var pistolFireRate = 12;
var DPFireRate = 12;
var MGFireRate = 5;
var SGFireRate = 50;

var maxSGAmmo = 24;
var maxDPAmmo = 40;
var maxMGAmmo = 90;


var staggerScale = 0.60;
var staggerTime = 20;

var damagePushScale = 2;
var pushMaxSpeed = 35;

var allowBagWeapons = false;


//Thug Config
var spawnOpposingThug = true; //Whether or not to spawn an opposing thug for each player who enters the game
var thugSightDistance = 600;
var thugHealth = 80;
var thugDamage = 50;
var thugSpeed = 4;
var thugAttackDelay = 30;
var thugLimit = 2; //Limit on how many thugs can appear before ALL thugs are wiped off map (for performance concerns)

//Bot Config

//Map Config
var mapWidth = 0;
var mapHeight = 0;
var pushStrength = 15; //Push block strength

var playerWhiteHomeX = 75;
var playerWhiteHomeY = 75;
var playerBlackHomeX = mapWidth - 75;
var playerBlackHomeY = mapHeight - 75;

var spawnXminBlack = 0;
var spawnXmaxBlack = 0;
var spawnYminBlack = 0;
var spawnYmaxBlack = 0;

var spawnXminWhite = 0;
var spawnXmaxWhite = 0;
var spawnYminWhite = 0;
var spawnYmaxWhite = 0;

var threatSpawnRange = 400;

var keepBlackPlayerFromWalls = false;


//----------------------SERVER GLOBAL VARIABLES---------------------------------
var pause = false;
var minutesLeft = 9;
var secondsLeft = 99;
var nextGameTimer = 20;

var bagRed = {
	homeX:0,
	homeY:0,
	x:0,
	y:0,
	captured:false,
	speed:0,
	direction:0,
	playerThrowing:0,
};

var bagBlue = {
	homeX:0,
	homeY:0,
	x:0,
	y:0,
	captured:false,
	speed:0,
	direction:0,
	playerThrowing:0,
};

var whiteScore = 0;
var blackScore = 0;

var pregame = true;
var gameOver = false;

var updatePlayerList = [];
var updateThugList = [];
var updateNotificationList = [];
var updatePickupList = [];
var updateEffectList = [];
var updateMisc = {};

//This belongs in a database... or in a museum
var rankings = [
	{rank:"bronze1",rating:0},
	{rank:"bronze2",rating:200},
	{rank:"bronze3",rating:400},
	{rank:"silver1",rating:600},
	{rank:"silver2",rating:800},
	{rank:"silver3",rating:1000},
	{rank:"gold1",rating:1200},
	{rank:"gold2",rating:1400},
	{rank:"gold3",rating:1600},
	{rank:"diamond",rating:2000},
	{rank:"diamond2",rating:9999}
];

function getRankFromRating(rating){
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

function getLevelFromExperience(experience){
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

//----------------------END GLOBAL VARIABLES---------------------------------

//Rating config
var matchWinLossRatingBonus = 30;
var enemySkillDifferenceDivider = 20;


/////////////////////////////////////////////MAP LAYOUT/////////////////////////////////////////////////////////////////

function initializePickups(map){
	Pickup.list = [];
	
	bagRed.captured=false;
	bagRed.speed=0;
	bagRed.direction=0;
	bagRed.playerThrowing=0;
	bagBlue.captured=false;
	bagBlue.speed=0;
	bagBlue.direction=0;
	bagBlue.playerThrowing=0;
	
	if (map == "empty"){
	}
	else if (map == "loadTest"){
		for (var i = 0; i <= 60; i+=10){
			Pickup(Math.random(), mapWidth/2 + i, mapHeight/2 - 90, 5, 75, 60); //Body Armor
			Pickup(Math.random(), mapWidth/2 + i, mapHeight/2 + 75, 3, 120, 60); //MG
			Pickup(Math.random(), mapWidth + i - 150, 150, 2, 40, 30); //DP
			Pickup(Math.random(), 150 + i, mapHeight - 150, 2, 40, 30); //DP
			Pickup(Math.random(), bagRed.homeX + i, bagRed.homeY - 120, 1, 50, 10); //MD
			Pickup(Math.random(), bagBlue.homeX + i, bagBlue.homeY + 120, 1, 50, 10); //MD			
		}
	}
	else if (map == "longest"){
		bagRed.homeX = 3*75;
		bagRed.homeY = 19*75;
		bagBlue.homeX = 36*75;
		bagBlue.homeY = 3*75;

		
		Pickup(Math.random(), 16, 11, 5, 75, 60); //Body Armor
		Pickup(Math.random(), 24, 12, 5, 75, 60); //Body Armor
		Pickup(Math.random(), 13, 2, 3, 90, 45); //MG
		Pickup(Math.random(), 27, 21, 3, 90, 45); //MG
		Pickup(Math.random(), 29, 4, 4, 24, 60); //SG
		Pickup(Math.random(), 11, 19, 4, 24, 60); //SG
		Pickup(Math.random(), 2, 12, 2, 40, 30); //DP
		Pickup(Math.random(), 38, 11, 2, 40, 30); //DP
		Pickup(Math.random(), 2, 4, 1, 50, 10); //MD
		Pickup(Math.random(), 38, 19, 1, 50, 10); //MD		
	}
	else if (map == "thepit"){
		bagRed.homeX = 5*75;
		bagRed.homeY = 17*75;
		bagBlue.homeX = 36*75;
		bagBlue.homeY = 17*75;
		
		Pickup(Math.random(), 4, 7, 1, 50, 10); //MD
		Pickup(Math.random(), 38, 7, 1, 50, 10); //MD
		Pickup(Math.random(), 21, 22, 5, 75, 45); //Body Armor
		Pickup(Math.random(), 21, 3, 3, 90, 45); //MG
		Pickup(Math.random(), 21, 28, 3, 90, 45); //MG
		Pickup(Math.random(), 3, 29, 4, 24, 40); //SG
		Pickup(Math.random(), 39, 29, 4, 24, 40); //SG
		Pickup(Math.random(), 5, 20, 2, 40, 25); //DP
		Pickup(Math.random(), 37, 20, 2, 40, 25); //DP
	}
	else if (map == "close"){
		bagRed.homeX = 5*75;
		bagRed.homeY = 17*75;
		bagBlue.homeX = 36*75;
		bagBlue.homeY = 17*75;		
	}
	else{ //Default: map2
		bagRed.homeX = 200;
		bagRed.homeY = 200;
		bagBlue.homeX = mapWidth - 200;
		bagBlue.homeY = mapHeight - 200;

		//id, x, y, type, amount, respawnTime
		Pickup(Math.random(), (mapWidth/2 - 90)/75, mapHeight/2/75, 5, 75, 60); //Body Armor
		Pickup(Math.random(), (mapWidth/2 + 95)/75, mapHeight/2/75, 3, 60, 60); //MG
		Pickup(Math.random(), 1000/75, 110/75, 4, 36, 90); //SG
		Pickup(Math.random(), (mapWidth - 1000)/75, (mapHeight - 110)/75, 4, 36, 90); //SG
		Pickup(Math.random(), (mapWidth - 150)/75, 150/75, 2, 40, 30); //DP
		Pickup(Math.random(), 150/75, (mapHeight - 150)/75, 2, 40, 30); //DP
		Pickup(Math.random(), bagRed.homeX/75, (bagRed.homeY - 120)/75, 1, 50, 10); //MD
		Pickup(Math.random(), bagBlue.homeX/75, (bagBlue.homeY + 120)/75, 1, 50, 10); //MD
	}
	bagBlue.x = bagBlue.homeX;
	bagBlue.y = bagBlue.homeY;
	bagRed.x = bagRed.homeX;
	bagRed.y = bagRed.homeY;	
}

function initializeBlocks(map){
	Block.list = [];
	
	if (map == "empty"){
	}
	else if (map == "loadTest"){
		for (var i = 0; i <= 60; i+=10){
			Block(450 + i, 200, 400, 75, "normal");
			Block(200 + i, 450, 75, 400, "normal");
			Block(mapWidth + i - 400 - 450, mapHeight - 75 - 200, 400, 75, "normal");
			Block(mapWidth + i - 75 - 200, mapHeight - 400 - 450, 75, 400, "normal");
			Block(mapWidth/2 + i - 250, mapHeight/2 - 37, 500, 75, "normal");
			Block(-20 + i, 235, 70, 50, "normal");
			Block(mapWidth + i - 50, mapHeight - 285, 70, 50, "normal");	
			Block(-50 + i, mapHeight, mapWidth + 100, 50, "normal"); //Bottom
			Block(-50 + i, -50, 50, mapHeight + 100, "normal"); //Left
			Block(mapWidth + i, -50, 50, mapHeight + 100, "normal"); //Right
			Block(-50 + i, -50, mapWidth + 100, 50, "normal");	//Top
		}
	}
	else if (map == "longest"){
		mapWidth = 39*75;
		mapHeight = 22*75;
		
		//Spawn areas
		spawnXminBlack = mapWidth - 700;
		spawnXmaxBlack = mapWidth - 10;
		spawnYminBlack = 10;
		spawnYmaxBlack = mapHeight;
		
		spawnXminWhite = 10;
		spawnXmaxWhite = 700;
		spawnYminWhite = 0;
		spawnYmaxWhite = mapHeight - 10;
		
		//push blocks
		Block(9.7, 5, 5.6, 1, "pushDown");
		Block(26.7, 5, 3.6, 1, "pushDown");
		Block(8.7, 16, 3.6, 1, "pushUp");
		Block(23.7, 16, 5.6, 1, "pushUp");	

		Block(3, 0, 7, 3, "normal");
		Block(-0.5, -0.5, 10.5, 2.5, "normal");			
		Block(3, 5, 7, 1, "normal");
		Block(15, 0, 7, 6, "normal");
		Block(15, -0.5, 16, 2.5, "normal");
		Block(24, 5, 3, 1, "normal");
		Block(30, -0.5, 1, 6.5, "normal");
		Block(34, 2, 1, 2.9, "blue");
		Block(34, 4, 3, 1, "blue");
		Block(3, 10, 9, 2, "red");
		Block(14, 11, 8, 1, "red"); //mid bars
		Block(17, 10, 8, 1, "blue"); //mid bars
		Block(27, 10, 9, 2, "blue");
		Block(4, 17.1, 1, 2.9, "red");
		Block(2, 17, 3, 1, "red");
		Block(8, 16, 1, 6.5, "normal");
		Block(12, 16, 3, 1, "normal");
		Block(17, 16, 7, 6, "normal");
		Block(8, 20, 16, 2.5, "normal");
		Block(29, 16, 7, 1, "normal");
		Block(29, 19, 7, 3, "normal");
		Block(29, 20, 10.5, 2.5, "normal");	

		Block(-1/2, mapHeight/75, (mapWidth + 75)/75, 1/2, "normal"); //Bottom
		Block(-1/2, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Left
		Block(mapWidth/75, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Right
		Block(-1/2, -1/2, (mapWidth + 75)/75, 1/2, "normal");	//Top
		
		/*
		Block(-100/75, (mapHeight - 10)/75, (mapWidth + 400)/75, 200/75); //Bottom
		Block((-200 + 10)/75, -200/75, 200/75, (mapHeight + 400)/75); //Left
		Block((mapWidth - 10)/75, -200/75, 200/75, (mapHeight + 400)/75); //Right
		Block(-200/75, (-200 + 10)/75, (mapWidth + 400)/75, 200/75);	//Top		
		*/
	}
	else if (map == "thepit"){
		mapWidth = 41*75;
		mapHeight = 30*75;
		
		//Spawn areas
		spawnXminBlack = mapWidth - 700;
		spawnXmaxBlack = mapWidth - 10;
		spawnYminBlack = 8*75;
		spawnYmaxBlack = 29*75;
		spawnXminWhite = 10;
		spawnXmaxWhite = 700;
		spawnYminWhite = 8*75;
		spawnYmaxWhite = 29*75;
		
		Block(4, 3, 2, 2, "normal");	
		Block(4, 7, 2, 2, "normal");	
		Block(-0.5, 7, 2.5, 2, "normal");	
		Block(6, 15, 1, 7, "red");	
		Block(3, 15, 4, 1, "red");	
		Block(2, 21, 5, 1, "red");	
		Block(2, 24, 1, 4, "red");	
		Block(2, 27, 4, 1, "red");	
		Block(13, 18, 1, 4, "red");	
		Block(10, 27, 4, 1, "normal");	
		Block(10, 3, 4.9, 1, "normal");	
		Block(10, 5, 4.9, 1, "normal");	
		Block(14, -0.5, 1, 4.5, "normal");	
		Block(14.1, 8, 4.9, 1, "normal");	
		Block(14, 5, 1, 4, "normal");	
		Block(22, 8, 4.9, 1, "normal");	
		Block(26.1, 3, 4.9, 1, "normal");	
		Block(26, -0.5, 1, 4.5, "normal");	
		Block(26.1, 5, 4.9, 1, "normal");	
		Block(26, 5, 1, 4, "normal");	
		Block(35, 3, 2, 2, "normal");	
		Block(35, 7, 2, 2, "normal");	
		Block(39, 7, 2.5, 2, "normal");	
		Block(27, 18, 1, 4, "blue");	
		Block(34, 15, 1, 7, "blue");	
		Block(34, 15, 4, 1, "blue");	
		Block(34, 21, 5, 1, "blue");	
		Block(38, 24, 1, 4, "blue");	
		Block(35, 27, 4, 1, "blue");	
		Block(27, 27, 4, 1, "normal");	
		Block(17, 28, 7, 2.5, "normal");	
		Block(17, 21, 2, 2, "normal");	
		Block(22, 21, 2, 2, "normal");	
		Block(17, 22, 7, 5, "normal");	
		Block(20, 12, 1, 6, "normal");	
		Block(17, 17, 7, 2, "normal");	

		Block(-1/2, mapHeight/75, (mapWidth + 75)/75, 1/2, "normal"); //Bottom
		Block(-1/2, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Left
		Block(mapWidth/75, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Right
		Block(-1/2, -1/2, (mapWidth + 75)/75, 1/2, "normal");	//Top
	}
	else if (map == "close"){
		mapWidth = 8*75;
		mapHeight = 8*75;
		
		//Spawn areas
		spawnXminBlack = mapWidth - 400;
		spawnXmaxBlack = mapWidth - 10;
		spawnYminBlack = mapHeight - 400;
		spawnYmaxBlack = mapHeight - 10;
		spawnXminWhite = 10;
		spawnXmaxWhite = 400;
		spawnYminWhite = 10;
		spawnYmaxWhite = 400;
		
		Block(3, 6, 2, 2, "normal");	
		Block(3, 6, 2, 2, "normal");	
		Block(3, 6, 2, 2, "normal");	
		Block(3, 6, 2, 2, "normal");	
		Block(3, 6, 2, 2, "normal");	

		Block(-1/2, mapHeight/75, (mapWidth + 75)/75, 1/2, "normal"); //Bottom
		Block(-1/2, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Left
		Block(mapWidth/75, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Right
		Block(-1/2, -1/2, (mapWidth + 75)/75, 1/2, "normal");	//Top
		
		Thug(Math.random(), "black", 10, 10);
		Thug(Math.random(), "black", 10, 10);
		Thug(Math.random(), "black", 10, 10);
		Thug(Math.random(), "white", 10, 450);
		Thug(Math.random(), "white", 10, 450);
		Thug(Math.random(), "white", 10, 450);
	}
	else{ //default	
		mapWidth = 2100;
		mapHeight = 1500;
		
		//Spawn areas
		spawnXminBlack = mapWidth - 700;
		spawnXmaxBlack = mapWidth - 10;
		spawnYminBlack = mapHeight - 700;
		spawnYmaxBlack = mapHeight - 10;
		spawnXminWhite = 10;
		spawnXmaxWhite = 700;
		spawnYminWhite = 10;
		spawnYmaxWhite = 700;

		Block(550/75, 200/75, 600/75, 75/75, "normal");
		Block(-50/75, 275/75, 350/75, 900/75, "normal");
		Block((mapWidth - 400 - 750)/75, (mapHeight - 75 - 200)/75, 600/75, 75/75, "normal");
		Block((mapWidth - 300)/75, (mapHeight - 900 - 450 + 175)/75, 350/75, 900/75, "normal");
		Block((mapWidth/2 - 37)/75, (mapHeight/2 - 250)/75, 75/75, 500/75, "normal"); //Middle beam
		Block(-20/75, 235/75, 70/75, 50/75, "normal"); //BM nub white
		Block((mapWidth - 50)/75, (mapHeight - 285)/75, 70/75, 50/75, "normal"); //BM nub black

		Block(-50/75, mapHeight/75, (mapWidth + 100)/75, 50/75, "normal"); //Bottom
		Block(-50/75, -50/75, 50/75, (mapHeight + 100)/75, "normal"); //Left
		Block(mapWidth/75, -50/75, 50/75, (mapHeight + 100)/75, "normal"); //Right
		Block(-50/75, -50/75, (mapWidth + 100)/75, 50/75, "normal");	//Top
	}
}

//-------------------------------------------------------------------------------------
logg('Initializing...');

///MongoDB
var db = mongojs(config.mongoDbLocation, ['RW_USER','RW_USER_PROG','RW_SERV','RW_FRIEND', 'RW_REQUEST']);

logg("testing db");
db.RW_USER.find({USERNAME:"testuser"}, function(err,res){
	if (res && res[0]){
		logg("DB SUCCESS! found testuser");
	}
	else {
		logg("ERROR! DB CONNECT FAIL: unable to find testuser");
	}
});

app.use('/client',express.static(__dirname + '/client'));
app.use(express.urlencoded({extended: true})); // to support URL-encoded bodies
app.use(cookieParser());

app.get('/', function(req, res) {
	var pageData = {};
	

	getPublicServersFromDB(function(servers){
		var serversHtml = "";
		
		for (let j = 0; j < servers.length; j++) {
		
			var currentPlayers = getCurrentPlayersFromUsers(servers[j].currentUsers).length;
			//<div class="serverSelectButton" onclick="location.href='http://3.19.27.250:3004/?join=true';" style="cursor: pointer;">PlayersChoice_1_3004<br><span style="font-size: 12;text-shadow: none;">Deathmatch -- 0/14 Players</span></div>
			var serverHtml = '<div class="serverSelectButton" onclick="getJoinableServer({server:\'' + servers[j].url + '\'})" style="cursor: pointer;">' + servers[j].serverName + '<br><span style="font-size: 12;text-shadow: none;">' + servers[j].gametype + ' -- ' + currentPlayers + '/' + servers[j].maxPlayers + ' Players</span></div>';
			//var serverHtml = '<a class="serverSelectLink" href="http://' + servers[j].url + '/?join=true" style="text-decoration: none;"><div class="serverSelectButton">' + servers[j].serverName + '<br><span style="font-size: 12;text-shadow: none;">' + servers[j].gametype + ' -- ' + currentPlayers + '/' + servers[j].maxPlayers + ' Players</span></div></a>';
			
			serversHtml += serverHtml;
		}		
		pageData["servers"] = serversHtml;
		pageData["header"] = fs.readFileSync(__dirname + '/client/header.html', 'utf8');
		
		var homePageContent = fs.readFileSync(__dirname + '/client/home.html', 'utf8');
		homePageContent = replaceValues(pageData, homePageContent);
				
		res.send(homePageContent);
	});	
});



//Process command line arguments parameters params
var port = 3000;
processArgs();
function processArgs(){
	logg("Command line arguments:");
	for (let j = 0; j < process.argv.length; j++) {
		if (j >= 2){
			logg(j + ' -> ' + (process.argv[j]));
			if (j == 2){
				logg("Updating port based on cmd argument: " + process.argv[j]);
				port = process.argv[j];
			}
			else if (j == 3 && process.argv[j] == "true"){
				logg("Updating app to run as an admin webserver: " + process.argv[j]);
				isWebServer = true;
			}
			else if (j == 4 && process.argv[j] == "true"){
				logg("Updating app to run locally: " + process.argv[j]);
				isLocal = true;
			}
		}
	}
}
serv.listen(port);
logg('Express server started on port ' + port + '.');


var SOCKET_LIST = [];
var S3StreamLogger = require('s3-streamlogger').S3StreamLogger;
var s3stream = new S3StreamLogger({ bucket: config.s3LoggingBucket, access_key_id: config.awsAccessKeyId, secret_access_key: config.awsSecretAccessKey, name_format: isWebServer ? "WEBADMIN_" + port + ".txt" : "_" + port + ".txt"});
//reinitStream();
logg("----------------------SERVER STARTUP-----------------------");
logg("If you are seeing this, then S3 connection established");


var ifaces = os.networkInterfaces();
var myIP = "";
var myUrl = "";

if (isLocal){
	getIP();
}
else {
	getAwsIp();
}

//Get IP Address for RW_SERV (localhost)
function getIP(){
	Object.keys(ifaces).forEach(function (ifname) {
	  var alias = 0;

	  ifaces[ifname].forEach(function (iface) {
		if ('IPv4' !== iface.family || iface.internal !== false) {
		  // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
		  return;
		}

		if (alias >= 1) {
		  // this single interface has multiple ipv4 addresses
		  logg(ifname + ':' + alias, iface.address);
		} else {
		  // this interface has only one ipv4 adress
		  logg("Server hosting outside AWS on: " + iface.address);
		}
		myIP = iface.address;
		reinitStream();
		++alias;
	  });
	});
	myUrl = myIP + ":" + port;
}

//Get IP Address for RW_SERV (AWS)
function getAwsIp() {
	request('http://169.254.169.254/latest/meta-data/public-ipv4', function (error, response, body) {
		if (!error && response.statusCode === 200 && response.body) {
			myIP = response.body;
			reinitStream();
			myUrl = myIP + ":" + port;
		}
	}).catch(function (err){
		logg("ERROR: FAILED TO GET AWS IPV4 ADDRESS (ignore this if hosting outside AWS)");
		logg(util.format(err));
		//getIP(); //If the previous command fails, we arent in AWS, so try the local method
	});
}

function reinitStream(){
	var name_format = "_" + port + ".txt";
	if (myIP && myIP.length > 0){
		name_format = myIP.replace(/\./g,"_") + "_" + port + ".txt";
	}
		
	if (isWebServer){
		name_format = "WEBADMIN_" + name_format;
	}
	

	var reinitYear = (new Date().getUTCFullYear()).toString();
	var reinitMonth = (new Date().getUTCMonth()+1).toString();
	if (reinitMonth.length === 1) {
		reinitMonth = "0" + reinitMonth;
	}
	var reinitDate = (new Date().getUTCDate()).toString();
	if (reinitDate.length === 1) {
		reinitDate = "0" + reinitDate;
	}
	
	
	s3stream = new S3StreamLogger({
	  bucket: config.s3LoggingBucket,
	  access_key_id: config.awsAccessKeyId,
	  secret_access_key: config.awsSecretAccessKey,
	  folder: reinitYear + '_' + reinitMonth + '_' + reinitDate,
	  name_format: name_format,
	  max_file_size: 500000000,
	  rotate_every: 86405000
	});
	s3stream.write("\r\n");
	logg("----------STREAMWRITER INITIALIZED WITH IP: " + myIP + "---------FOLDER: " + reinitYear + "_" + reinitMonth + "_" + reinitDate + "------------\r\n");		
}

function sendPartyToGameServer(party, targetServer) {
	logg("function sendPartyToGameServer with this party:");
	console.log(party);
	for (var p = 0; p < party.length; p++){
		var options = {
			method: 'POST',
			uri: 'http://' + party[p].serverUrl + '/sendPlayerToGameServer',
			form: {
				cognitoSub: party[p].cognitoSub,
				targetServer: targetServer
			}
		};
		 
		logg("Attempting to summon party member [" + party[p].cognitoSub + "] on server [" + party[p].serverUrl + "]...");
		request(options)
			.then(function (parsedBody) {
				// POST succeeded...
				logg("SUCCESSFUL request for party member!");
			})
			.catch(function (err) {
				// POST failed...
				logg("ERROR summoning party member!");
		});
	}
}


/////////////////ROUTES CONTROLLERS ENDPOINTS/////////////////////////////////////////////////////////////

//Get user profile page
app.get('/user/:cognitoSub', function(req, res) {
	var cognitoSub = req.params.cognitoSub;		
	
	getUserFromDB(cognitoSub, function(pageData){
		if (pageData){

			var rankProgressInfo = getRankFromRating(pageData["rating"]);
			var experienceProgressInfo = getLevelFromExperience(pageData["experience"]);

			pageData["username"] = pageData["username"].substring(0,15);
			pageData["playerLevel"] = experienceProgressInfo.level;
			pageData["levelProgressPercent"] = getProgressBarPercentage(pageData["experience"], experienceProgressInfo.floor, experienceProgressInfo.ceiling) * 100;
			pageData["expToNext"] = numberWithCommas(experienceProgressInfo.ceiling - pageData["experience"]);
			pageData["rank"] = rankProgressInfo.rank;
			pageData["rankFullName"] = getFullRankName(rankProgressInfo.rank);
			pageData["rankProgressPercent"] = getProgressBarPercentage(pageData["rating"], rankProgressInfo.floor, rankProgressInfo.ceiling) * 100;
			pageData["nextRank"] = rankProgressInfo.nextRank;
			pageData["nextRankFullName"] = getFullRankName(rankProgressInfo.nextRank);
			pageData["ratingToNext"] = rankProgressInfo.ceiling - pageData["rating"];
			pageData["experience"] = numberWithCommas(pageData["experience"]);
			pageData["header"] = fs.readFileSync(__dirname + '/client/header.html', 'utf8');

			
			//logg("Requesting User Profile page with this data:");
			//logObj(pageData);

			var profilePageContent = fs.readFileSync(__dirname + '/client/profile.html', 'utf8');
			profilePageContent = replaceValues(pageData, profilePageContent);

			res.send(profilePageContent);
		}
		else {
			var data = {};
			data["header"] = fs.readFileSync(__dirname + '/client/header.html', 'utf8');
			var pageContent = replaceValues(data, fs.readFileSync(__dirname + '/client/invalidUsername.html', 'utf8'));

			res.send(pageContent);
		}
	});	
});

var serverHomePage = "/";
//var serverHomePage = "https://rw.treatmetcalf.com/";
app.get('/search/:searchText', function(req, res) {
	var searchText = req.params.searchText;		
	
	searchUserFromDB(searchText, function(searchRes){
		if (searchRes){
			
			var searchResultsHTML = "";
			for (var i = 0; i < searchRes.length; i++){
				if (searchRes[i].USERNAME){
					searchResultsHTML+="<a href='" + serverHomePage + "user/" + searchRes[i].cognitoSub + "'>" + searchRes[i].USERNAME + "</a><br>";
				}
				else {
					logg("ERROR ACQUIRING USERNAME:");
					logg(searchRes[i]);
				}
			}		
			var pageData = {};
			pageData["searchResults"] = searchResultsHTML;
			pageData["header"] = fs.readFileSync(__dirname + '/client/header.html', 'utf8');
			var pageContent = fs.readFileSync(__dirname + '/client/playerSearch.html', 'utf8');
			pageContent = replaceValues(pageData, pageContent);

			res.send(pageContent);
		}
		else {
			res.sendFile(__dirname + '/client/playerSearch.html');
		}
	});	
});

app.post('/sendPlayerToGameServer', async function (req, res) {
	/*req.body
	{
		cognitoSub: "1534523452345",
		targetServer: "123.43.2345:3000"
	}*/
	log("HIT SEND PLAYER TO GAME SERVER ENDPOINT:");
	console.log(req.body);
	
	for (var s in SOCKET_LIST){
		if (SOCKET_LIST[s].cognitoSub == req.body.cognitoSub){
			SOCKET_LIST[s].emit('redirectToGame', 'http://' + req.body.targetServer);
		}
	}
	res.send({msg:"Request received"});
});

app.post('/playNow', async function (req, res) {
	if (myUrl == ""){
		logg("res.send: " + "Url for current server not set");
		res.send({autoJoin:false, error:"Url for current server not set"});
		return;
	}
	/*req.body
	{
	}*/
	
	var authorizedUser = await getAuthorizedUser(req.cookies); //Get authorized user Get authenticated User
	

	//Check if server is expecting this incoming user
	var params = {url:myUrl, privateServer:false};
	var approvedToJoinServer = false;
	db.RW_SERV.find(params).sort({serverNumber: 1}, function(err,serv){
		if (serv && serv[0]){
			var incomingUsers = serv[0].incomingUsers || "[]";
			for (var u = 0; u < incomingUsers.length; u++){
				if (incomingUsers[u].cognitoSub == authorizedUser.cognitoSub){
					approvedToJoinServer = true;
					
					res.status(200);
					logg("res.send: " + "Server " + myUrl + " welcomes you!");
					res.send({msg:"Server " + myUrl + " welcomes you!", success:true});
					joinGame(authorizedUser.cognitoSub, incomingUsers[u].username, incomingUsers[u].team); //Join game
					return;
				}
			}	
		}
		if (!approvedToJoinServer){
			logg("res.send: " + "Error: The server was not expecting you");
			res.send({msg:"Error: The server was not expecting you", success:false}); //Error
			return;
		}
	});
});

app.post('/getJoinableServer', async function (req, res) {
	if (myUrl == ""){
		log("SENDING " + "Url for current server not set");
		res.send({autoJoin:false, error:"Url for current server not set"});
		return;
	}
	/*req.body
	{
		partyId:'12345',
		cognitoSub:'12345',
		server:'127.0.0.1:3000',		
	}*/

	var party = [];
	getPartyForUser(req.body.cognitoSub, function(dbResults){
		/*
		var dbResults = {
			leader:{}, //{cognitoSub:"12345",username:"myguy",serverUrl:serverUrl}
			party:[]
		};	
		*/
		party = dbResults.party;
		
		log("GOT PARTY:");
		console.log(party);

		var options = req.body;
		options.party = party;
		
		log("getJoinableServer endpoint called with:");
		console.log("Server: " + req.body.server);
		console.log("PARTY:");
		console.log(options.party);

		//If matchmaking request, return res immediately, and submit matchmaking ticket to db TODO

		logg("Attempting to join server: " + req.body.server);
		getJoinableServer(options, function(msg, joinableServer){
			if (!joinableServer){
				log("SENDING " + msg);
				res.send({msg:msg, server:false});
			}
			else { //Join approved
				log("SENDING PARTY TO SERVER: " + msg);
				sendPartyToGameServer(party, req.body.server);
				res.send({msg:msg, server:joinableServer});
			}
		}); //End getJoinableServer
	}); //End getParty
}); //End .post('/getJoinableServer

var getJoinableServer = function(options, cb){
	var joinableServer = "";
	var unfavorableServers = [];
	var params = {privateServer:false};
	
	if (options.server == "ctf" || options.server == "slayer"){ //Specific gametype
		params = {gametype:options.server, privateServer:false};
		//cb("Found joinable server. Joining...", serv[i].url);
		return;
	}
	else if (options.server.indexOf(':') > -1) { //Server IP provided
		params = {url:options.server, privateServer:false};
		options.matchmaking = false;
	}
	
	db.RW_SERV.find(params).sort({serverNumber: 1}, function(err,serverResult){ //Get list of candidate servers	
		var serv = serverResult;
		if (typeof serv != 'undefined' && typeof serv[0] != 'undefined'){	
			console.log("FOUND " + serv.length + " POSSIBLE SERVERS");
			for (var i = 0; i < serv.length; i++){			
				console.log("CHECKING OUT SERVER:" + serv[i].url + "");
				if (!options.matchmaking){
				
					////////////////////RULES////////////////////////////////
					
					//Server full dis-qualifier
					if (getCurrentPlayersFromUsers(serv[i].currentUsers) + options.party.length > serv[i].maxPlayers){
						logg("SERVER (" + serv[i].url + ") is too full for " + options.party.length + " more. We got " + getCurrentPlayersFromUsers(serv[i].currentUsers) + " already.");
						cb("Server full", false);
						return;
					}
					
					
					//Determine if spectatingTeam
					var team = "none";
					var incomingUsers = serv[i].incomingUsers || [];
					var currentUsers = serv[i].currentUsers || [];
					
					console.log("Incoming users:");
					console.log(incomingUsers);
					console.log("Current users:");
					console.log(currentUsers);
					
					
					log("Percentage of match remaining: " + (serv[i].currentTimeLeft / serv[i].matchTime));
					if ((serv[i].currentTimeLeft / serv[i].matchTime) < joinActiveGameThreshold){ //Spectate - if percentage of match remaining is less than threshold
						team = "none";
					}
					else { //Join team
						var moreWhitePlayers = 0; 
						for (var u in currentUsers){
							if (currentUsers[u].team == "white"){moreWhitePlayers++;}
							else if (currentUsers[u].team == "black"){moreWhitePlayers--;}
						}
						for (var s in incomingUsers){
							var continueLoop = false;
							for (var u in currentUsers){
								if (incomingUsers[s].cognitoSub == currentUsers[u].cognitoSub){continueLoop = true;}
							}
							if (continueLoop)
								continue;						
							if (incomingUsers[s].team == "white"){moreWhitePlayers++;}
							else if (incomingUsers[s].team == "black"){moreWhitePlayers--;}
						}
						
						if (moreWhitePlayers <= 0){
							team = "white";
						}
						else {
							team = "black";
						}
					}
					log("TEAM I came up with is " + team);
					//Set DB incoming Users
					for (var p = 0; p < options.party.length; p++){
						options.party[p].timestamp = new Date();
						options.party[p].team = team;						
					}
					
					//Before merging arrays, remove duplicate cognitoSubs from incomingUser
					
					incomingUsers.push.apply(incomingUsers, options.party); //Merge 2 arrays					
					var obj = {incomingUsers:incomingUsers};
					db.RW_SERV.update({url: serv[i].url}, {$set: obj}, {multi: true}, function () { 
						logg("DB: UPDATING incomingUsers: " + serv[i].url + " with: " + JSON.stringify(obj));
					});		
					cb("Found joinable server. Joining...", serv[i].url);
					return;
				}				
			}
		}
		cb("FAILED TO FIND JOINABLE SERVER", false);
		return;
	});
}


app.post('/sendPlayerToGame', async function (req, res) {
	console.log(req.body);
	res.send({msg:""});
});

app.post('/logOut', async function (req, res) {
	log("Logging out user");
	res.cookie("cog_i", "", { httpOnly: httpOnlyCookies });
	res.cookie("cog_a", "", { httpOnly: httpOnlyCookies });
	res.cookie("cog_r", "", { httpOnly: httpOnlyCookies });
	res.send({msg:"Logout - Successfully removed auth cookies"});
});

app.post('/getPlayerRelationship', async function (req, res) {
	//log("Get player Relationship endpoint called with:");
	//console.log("--BODY");
	//console.log(req.body);
	getPlayerRelationshipFromDB(req.body, function(dbResults){
		res.status(200);
		res.send(dbResults);
	});
});

app.post('/addFriend', async function (req, res) {
	log("ADD FRIEND ENDPOINT CALLED WITH:");
	console.log(req.body);
	removeRequest({targetCognitoSub:req.body.cognitoSub, cognitoSub:req.body.targetCognitoSub, type:"friend"}); //remove any friend request that the player you are friending may have had to you 
	upsertFriend(req.body, function(dbResults){
		res.status(200);
		res.send(dbResults);
	});
});

app.post('/kickFromParty', async function (req, res) {
	log("KICK FROM PARTY ENDPOINT CALLED WITH:");
	console.log(req.body);
	var authorizedUser = await getAuthorizedUser(req.cookies); //Get authorized user Get authenticated User
	if (!authorizedUser.cognitoSub || authorizedUser.cognitoSub != req.body.cognitoSub){
		var errorMsg = "ERROR: User unauthorized to perform this action!";
		logg(errorMsg);
		res.status(200);
		res.send({msg:errorMsg});
		return;
	}		

	db.RW_USER.update({partyId: req.body.cognitoSub, cognitoSub:req.body.targetCognitoSub}, {$set: {partyId:""}}, {multi: true}, function () {
		//logg("DB: Set: cognitoSub=" + req.body.cognitoSub + " with: ");
		//console.log('partyId:""');
		res.status(200);
		res.send({msg:"Kicked this user from party: " + req.body.targetCognitoSub});
	});	
});

app.post('/requestResponse', async function (req, res) {
	log("1REQUEST RESPONSE ENDPOINT CALLED WITH:");
	console.log(req.body);

	//First look up request by req.body.id
	getRequestById(req.body.id, async function(request){
		if (request){		
			var authorizedUser = await getAuthorizedUser(req.cookies); //Get authorized user
			if (!authorizedUser.cognitoSub || authorizedUser.cognitoSub != request.targetCognitoSub){ //Make sure the one responding to this request is authorized as the person this request was sent to
				var errorMsg = "ERROR: User unauthorized to perform this action!";
				logg(errorMsg);
				res.status(200);
				res.send({msg:errorMsg});
				return;
			}		
			//Perform decline operation			
			if (req.body.accept == "false"){
				removeRequestById(req.body.id);
				res.status(200);
				res.send({msg:"Removed request"});
			}
			else {
				//Perform accept operation							
				if(req.body.type == "friend") {
					upsertFriend({cognitoSub:request.targetCognitoSub, targetCognitoSub:request.cognitoSub}, function(dbResults){
						if (!dbResults.error){
							removeRequestById(req.body.id);
						}
						res.status(200);
						res.send(dbResults);
					});
				}
				else if(req.body.type == "party") {
					getPartyForUser(request.cognitoSub, function(partyDbResults){
						/*
						var partyDbResults = {
							partyId:"12345",
							party:[]
						};	
						*/
						log("2REQUEST RESPONSE ENDPOINT - FOUND PARTY WE ARE JOINING:");
						//console.log(partyDbResults);
						getUserFromDB(request.targetCognitoSub, function(partyJoiner){
							if (partyJoiner && partyJoiner.partyId && partyJoiner.partyId.length > 0 && partyJoiner.partyId == partyJoiner.cognitoSub && partyJoiner.partyId != partyDbResults.partyId){ //If party leader of a previous party (which is NOT the party currently requested to join) and accepting a new party request
								var re = new RegExp(partyJoiner.cognitoSub,"g");
								db.RW_USER.update({partyId: partyJoiner.partyId, cognitoSub: {$not: re}}, {$set: {partyId: ""}}, {multi: true}, function () {}); //Disband the previous party
							}
							//log("dbUserUpdate - Party request accepted, joining party.");
							dbUserUpdate("set", authorizedUser.cognitoSub, {partyId:partyDbResults.partyId});
							db.RW_REQUEST.remove({targetCognitoSub:request.targetCognitoSub, type:"party"}, function(err, obj) {});	//Remove all party requests targeted at the responder
							db.RW_REQUEST.remove({targetCognitoSub:request.cognitoSub, cognitoSub:request.targetCognitoSub, type:"party"}, function(err, obj) {});	//Remove any mirrored requests (where both users request each other, but then one clicks accept)
						});
					});					
					res.status(200);
					res.send({msg:"Joined player's party"});	
				}				
			}
		}
		else {
			var errorMsg = "ERROR: Request no longer exists: " + req.body.id;
			logg(errorMsg);
			res.status(200);
			res.send({msg:errorMsg});
			return;		
		}
	});
});

function getLeaderFromParty(partyData){
	for (var p = 0; p < partyData.party.length; p++){
		if (partyData.party[p].leader == true){
			return partyData.party[p];
		}
	}
	return false;
}

app.post('/leaveParty', async function (req, res) {
	log("LEAVE PARTY ENDPOINT CALLED WITH:");
	console.log("--BODY");
	console.log(req.body);

	if (req.body.partyId == req.body.cognitoSub){
		db.RW_USER.update({partyId: req.body.partyId}, {$set: {partyId:""}}, {multi: true}, function () {
			//logg("DB: Set: cognitoSub=" + req.body.cognitoSub + " with: ");
			//console.log('partyId:""');
			res.status(200);
			res.send({msg:"Ended Party " + req.body.partyId});
		});	
	}
	else {
		db.RW_USER.update({cognitoSub: req.body.cognitoSub}, {$set: {partyId:""}}, {multi: true}, function () {
			//logg("DB: Set: partyId=" + req.body.partyId + " with: ");
			//console.log('partyId:""');
			res.status(200);
			res.send({msg:"Left Party " + req.body.partyId});
		});	
	}
});

app.post('/removeFriend', async function (req, res) {
	log("REMOVE FRIEND ENDPOINT CALLED WITH:");
	console.log("--BODY");
	console.log(req.body);
	removeFriend({targetCognitoSub:req.body.targetCognitoSub, cognitoSub:req.body.cognitoSub});
	res.status(200);
	res.send("request sent to remove friend");
});

/*	const req.body = {
		cognitoSub:cognitoSub,
		username:username,
		targetCognitoSub:getUrl().split('/user/')[1],
		type:"party"
	};	*/
app.post('/upsertRequest', async function (req, res) {
	log("ADD REQUEST ENDPOINT CALLED WITH:");
	console.log("--BODY");
	console.log(req.body);
	
	if (req.body.type == "friend"){
		db.RW_FRIEND.find({cognitoSub:req.body.targetCognitoSub, friendCognitoSub:req.body.cognitoSub}, function(err,friendRes){ //Make sure they're not already a friend
			if (friendRes[0]){
				res.status(200);
				res.send("Already friends!");				
			}
			else {
				console.log("Added friend has not friended back yet, so adding request to do so");
				upsertRequest(req.body, function(dbResults){
					res.status(200);
					res.send(dbResults);
				});			
			}
		});
	}
	else if (req.body.type == "party"){
		setPartyIdIfEmpty(req.body.cognitoSub);
		upsertRequest(req.body, function(dbResults){
			res.status(200);
			res.send(dbResults);
		});
	}
	else {
		res.status(200);
		res.send({error:"Invalid Request type: " + req.body.type});
	}
});

app.post('/getOnlineFriends', async function (req, res) {
	//log("getOnlineFriends endpoint called with:");
	//console.log("--BODY");
	//console.log(req.body);
	
	getOnlineFriends(req.body.cognitoSub, function(dbResults){
		res.status(200);
		res.send(dbResults);
	});
});

/*	const data = {
		cognitoSub:cognitoSub
	};*/
app.post('/getParty', async function (req, res) {
	//log("getParty endpoint called with:");
	//console.log("--BODY");
	//console.log(req.body);
	
	getPartyForUser(req.body.cognitoSub, function(dbResults){
		/*
		var dbResults = {
			partyId:"12345",
			party:[]
		};	
		*/
		
		//Create party endpoint result
		
		res.status(200);
		res.send(dbResults);
	});
});

app.post('/getRequests', async function (req, res) {
	//log("Get requests endpoint called with:");
	//console.log("--BODY");
	//console.log(req.body);
	
	var response = {
		friendRequests:[],
		partyRequests:[]
	};
	
	getFriendRequests(req.body.cognitoSub, function(friendDbResults){
		getPartyRequests(req.body.cognitoSub, function(partyDbResults){
			response.friendRequests = friendDbResults;
			response.partyRequests = partyDbResults;			
			res.status(200);
			res.send(response);
		});

	});
});

app.post('/validateToken', async function (req, res) {
	//log("VALIDATE TOKEN ENDPOINT");
	var code = req.body.code;
	//console.log("--BODY");
	//console.log(req.body);
	
	var result = {};
	
	if (code && code != ""){ //If code present in URL, use that
		result = await getTokenFromCodeAndValidate(code);
	}
	if (!result.cognitoSub && (req.cookies["cog_r"] || req.body.cog_r)){ //Otherwise, check for token in cookie and body
		//logg("COULDN'T GET TOKEN FROM CODE - ACCESSING COOKIES (or request body)");
		
		var tokens = {};
		
		if(req.body.cog_r && req.body.cog_r.length > 0) {
			//logg("Found token on request body. Ignoring cookies.");
			tokens = {
				access_token:req.body.cog_a,
				id_token:req.body.cog_i,
				refresh_token:req.body.cog_r
			};
		}
		else if (req.cookies["cog_r"] && req.cookies["cog_r"].length > 0){
			//logg("Could not find code or tokens on request body. Trying site cookies...");
			tokens = {
				access_token:req.cookies["cog_a"],
				id_token:req.cookies["cog_i"],
				refresh_token:req.cookies["cog_r"]
			};			
		}
		
		result = await validateTokenOrRefresh(tokens);
	}
	if (!result.cognitoSub){
		logg("Authentication failed");
		result.msg = "Authentication failed. Please log in.";
	}

	var httpResult = {};
	if (result && result.cognitoSub && result.username && result.refresh_token && result.access_token) {
		//Success
		updateOnlineTimestampForUser(result.cognitoSub);
		updateServerUrlForUser(result.cognitoSub);
		res.status(200);
		res.cookie("cog_i", result.id_token, { httpOnly: httpOnlyCookies });
		res.cookie("cog_a", result.access_token, { httpOnly: httpOnlyCookies });
		res.cookie("cog_r", result.refresh_token, { httpOnly: httpOnlyCookies });
		httpResult = {
			cognitoSub:result.cognitoSub,
			username:result.username,
			federatedUser:result.federatedUser,
			ip:myIP,
			port:port,
			isWebServer:isWebServer,
			/* ///may not need to send these if cookies httpOnly = false works !!!
			cog_i:result.id_token,
			cog_a:result.access_token,
			cog_r:result.refresh_token,
			*/
			msg:result.msg || "(no response message)"
		};
	}
	else { //error
		res.status(200);
		if (result){
			httpResult = {
				msg:result.msg || "(unhandled error)"
			};
		}
		res.send(httpResult);
		return;
	}

	//Get or create mongo username, and then return to the client
	getUserFromDB(httpResult.cognitoSub, function(mongoRes){
		if (mongoRes && mongoRes.username){
			httpResult.username = mongoRes.username;
			res.send(httpResult);
		}
		else {
			addUser(httpResult.cognitoSub, httpResult.username, function(){
				logg("Added user: " + httpResult.username + ". Returning ValidateToken response:");
				logObj(httpResult);
				res.send(httpResult);
			});
		}
	});
});

app.post('/updateUsername', async function (req, res) {
	var updateNewUsername = req.body.newUsername;
	var updateCognitoSub = req.body.cognitoSub;
	logg("Updating username for sub " + updateCognitoSub + ". New username: " + updateNewUsername);
	
	var goodToUpdateUsername = false;
	try {
		db.RW_USER.find({USERNAME:updateNewUsername}, function(err,result){
			if (result && result[0]){
				if (allowDuplicateUsername){
					goodToUpdateUsername = true;
				} else {
					res.send({error:"Another user with that username already exists. Please choose another username."});
				}
			}
			else {
				goodToUpdateUsername = true;
			}		
			if (goodToUpdateUsername){
				db.RW_USER.update({cognitoSub: updateCognitoSub}, {$set: {USERNAME: updateNewUsername}}, {multi: true}, function () {
					res.send({msg:"Updated username to " + updateNewUsername});
				});			
			}
		});
	}
	catch(e) {
		res.send({error:"Error while updating username. Please try again."});
	}
});


/////////////////////DB FUNCTIONS////////////////////////////// dbfunctions.js
//updateUser update user
function dbUserUpdate(action, cognitoSub, obj) {
	if (action == "set"){
		db.RW_USER.update({cognitoSub: cognitoSub}, {$set: obj}, {multi: true}, function () {
			logg("dbUserUpdate DB: Set: " + cognitoSub + " with: ");
			console.log(obj);
		});		
	}
	else if (action == "inc"){
		db.RW_USER.update({cognitoSub: cognitoSub}, {$inc: obj}, {multi: true}, function () {
			//logg("DB: Increased: " + cognitoSub + " with: ");
			//console.log(obj);
		});	
	}
}

function setPartyIdIfEmpty(cognitoSub) {
	db.RW_USER.find({cognitoSub:cognitoSub}, function(err,res){
		if (res && res[0]){
			if (!res[0].partyId || res[0].partyId == ""){
				db.RW_USER.update({cognitoSub: cognitoSub}, {$set: {partyId:cognitoSub}}, {multi: true}, function () {
					//logg("DB: Set: " + cognitoSub + " with: ");
					//console.log("partyId:" + cognitoSub);
				});						
			}
		}
	});
}

function dbGameServerRemoveAndAdd(){
	db.RW_SERV.remove({ url: myUrl }, function(err, obj) {
		if (!err){
			logg("document(s) deleted");
			dbGameServerAdd();
		}
	});
}

function dbGameServerRemoveAndAddParams(url, number, name, priv, gt, max, voteGt, voteM){
	db.RW_SERV.remove({ url: url }, function(err, obj) {
		if (!err){
			logg("document(s) deleted");
			dbGameServerAdd(url, number, name, priv, gt, max, voteGt, voteM);
		}
	});
}

function dbGameServerAdd(){
	if (!myUrl || myUrl == "")
		return;
		
	var healthCheckTimestamp = new Date();
	var matchTime = (gameMinutesLength * 60) + gameSecondsLength;
	var currentTimeLeft = (minutesLeft * 60) + secondsLeft;
	if (pregame == true || gameOver == true){currentTimeLeft = matchTime;}
	var currentHighestScore = 0;
	if (blackScore > whiteScore){
		currentHighestScore = blackScore;
	}
	else {
		currentHighestScore = whiteScore;
	}
	db.RW_SERV.insert({url:myUrl, serverNumber:serverNumber, serverName:serverName,  privateServer:privateServer, healthCheckTimestamp:healthCheckTimestamp, gametype:gametype, maxPlayers:maxPlayers, voteGametype:voteGametype, voteMap:voteMap, matchTime:matchTime, currentTimeLeft:currentTimeLeft, scoreToWin:scoreToWin, currentHighestScore:currentHighestScore},	
		function(err, doc){
			if (!err){
				logg("New server added to RW_SERV: " + myUrl + " with timestamp: " + healthCheckTimestamp.toISOString());
			}
			else {
				logg("ERROR when adding server to RW_SERV: " + myUrl);
				logg(err);
			}
		}
	);
}

function dbGameServerAddParams(url, number, name, priv, gt, max, voteGt, voteM){
	if (!url || url == "")
		return;
		
	var healthCheckTimestamp = new Date();
	db.RW_SERV.insert({url:url, serverNumber:number, serverName:name,  privateServer:privateServer, healthCheckTimestamp:healthCheckTimestamp, gametype:gt, maxPlayers:max, voteGametype:voteGt, voteMap:voteM},	
		function(err, doc){
			if (!err){
				logg("New server added to RW_SERV: " + url + " with timestamp: " + healthCheckTimestamp.toISOString());
			}
			else {
				logg("ERROR when adding server to RW_SERV: " + url);
				logg(err);
			}
		}
	);
}

function dbGameServerUpdate() {
	var healthCheckTimestamp = new Date();
	var matchTime = (gameMinutesLength * 60) + gameSecondsLength;
	var currentTimeLeft = (minutesLeft * 60) + secondsLeft;
	if (pregame == true || gameOver == true){currentTimeLeft = matchTime;}
	var currentHighestScore = 0;
	if (blackScore > whiteScore){
		currentHighestScore = blackScore;
	}
	else {
		currentHighestScore = whiteScore;
	}

	var obj = {serverNumber:serverNumber, serverName:serverName,  privateServer:privateServer, healthCheckTimestamp:healthCheckTimestamp, gametype:gametype, maxPlayers:maxPlayers, voteGametype:voteGametype, voteMap:voteMap, matchTime:matchTime, currentTimeLeft:currentTimeLeft, scoreToWin:scoreToWin, currentHighestScore:currentHighestScore, currentUsers:Player.list};
	
	db.RW_SERV.update({url: myUrl}, {$set: obj}, {upsert:true, multi: true}, function () {
		//logg("dbGameServerUpdate DB: Set: " + myUrl + " with: ");
		//console.log(obj);
	});		
}

function dbGameServerUpdateParams(obj) {
	db.RW_SERV.update({url: myUrl}, {$set: obj}, {multi: true}, function () {
		//logg("DB: Set: " + myUrl + " with: " + obj);
	});		
}

function dbDiffServerUpdateParams(url, obj) {
	db.RW_SERV.update({url: url}, {$set: obj}, {multi: true}, function () {
		//logg("DB: Set: " + url + " with: " + obj);
	});		
}

function dbGameServerRemove(){
	db.RW_SERV.remove({ url: myUrl }, function(err, obj) {
		if (!err){
			//logg("Server: " + myUrl + " successfully removed from database.");
		}
	});
}

function dbGameServerRemove(url){
	db.RW_SERV.remove({ url: url }, function(err, obj) {
		if (!err){
			logg("Server: " + url + " successfully removed from database.");
		}
	});
}

var getPublicServersFromDB = function(cb){
	var servers = [];
	db.RW_SERV.find({privateServer:false}, function(err,res){
		if (res && res[0]){
				
			for (var i = 0; i < res.length; i++){
				var thisServer = {};
					thisServer.url = res[i].url;
					thisServer.serverName = res[i].serverName;
					thisServer.gametype = res[i].gametype;
					thisServer.maxPlayers = res[i].maxPlayers;
					thisServer.voteGametype = res[i].voteGametype;
					thisServer.voteMap = res[i].voteMap;
				if (thisServer.gametype == "ctf"){
					thisServer.gametype = "CTF";
				}
				else if (thisServer.gametype == "slayer"){
					thisServer.gametype = "Deathmatch";
				}

				servers.push(thisServer);
			}		
			
			cb(servers);
		}
		else {
			cb(servers);
		}
	});
}

var getPlayerRelationshipFromDB = function(data,cb){
	/*const data = {
		callerCognitoSub:cognitoSub,
		targetCognitoSub:getUrl().split('/user/')[1]
	};*/
	var result = {
		friends:false,
		inParty:false
	}
	try {
		//log("searching for user: " + data.callerCognitoSub);
		db.RW_FRIEND.find({cognitoSub:data.callerCognitoSub}, function(err,friendRes){
			if (friendRes[0]){
				for (let j = 0; j < friendRes.length; j++) {
					if (friendRes[j].friendCognitoSub == data.targetCognitoSub){
						result.friends = true;
						break;
					}
				}
			}
			getUserFromDB(data.callerCognitoSub, function(callingUser){
				if (callingUser){
					getUserFromDB(data.targetCognitoSub, function(targetUser){
						if (targetUser){
							if (callingUser.partyId && targetUser.partyId == callingUser.partyId){
								result.inParty = true;
							}
						}
						cb(result);
					});
				}
				else {
					cb(result);
				}
			});
			
		});
	}
	catch(e) {
		cb({error:"ERROR in getPlayerRelationshipFromDB!"});
	}
}

var upsertFriend = function(data,cb){
	/*const data = {
		cognitoSub:cognitoSub,
		targetCognitoSub:getUrl().split('/user/')[1]
	};*/
	var result = {};
	try {
		//log("searching for user: " + data.cognitoSub);
		db.RW_FRIEND.find({cognitoSub:data.cognitoSub}, function(err,friendRes){
			if (friendRes[0]){
				for (let j = 0; j < friendRes.length; j++) {
					if (friendRes[j].friendCognitoSub == data.targetCognitoSub){
						result.status = "present";
						cb(result);
						break;
						return;
					}
				}
			}
			if (result.status != "present"){
				db.RW_FRIEND.insert({cognitoSub:data.cognitoSub, friendCognitoSub:data.targetCognitoSub, timestamp:new Date()},	
					function(err, doc){
						if (!err){
							logg("New friend added to RW_FRIEND: " + data.cognitoSub + "," + data.targetCognitoSub);
							cb({status:"added"});
						}
						else {
							logg("ERROR when adding friend to RW_FRIEND: " + data.cognitoSub + "," + data.targetCognitoSub);
							logg(err);
							cb({error:"ERROR when adding friend to RW_FRIEND: " + data.cognitoSub + "," + data.targetCognitoSub});
						}
					}
				);				
			}
		});
	}
	catch(e) {
		cb({error:"ERROR in upsertFriend database action!"});
	}
}


function removeFriend(data){
	/*const data = {
		cognitoSub:cognitoSub,
		targetCognitoSub:getUrl().split('/user/')[1]
	};*/
	try {
		logg("Removing friendship: " + data.cognitoSub + " friends with " + data.targetCognitoSub);
		db.RW_FRIEND.remove({cognitoSub:data.cognitoSub, friendCognitoSub:data.targetCognitoSub}, function(err,friendRes){
		});
	}
	catch(e) {
		logg("ERROR REMOVING FRIEND");
	}
}

function removeRequest(data){
	/*const data = {
		cognitoSub:cognitoSub,
		targetCognitoSub:getUrl().split('/user/')[1],
		type:"friend"		
	};*/
	try {
		logg("Removing request:");
		console.log(data);
		db.RW_REQUEST.remove(data, function(err,res){
		});
	}
	catch(e) {
		logg("ERROR REMOVING REQUEST");
	}
}


var upsertRequest = function(data,cb){
	/*const data = {
		cognitoSub:cognitoSub,
		username:username,
		targetCognitoSub:getUrl().split('/user/')[1],
		type:"friend" || "party" || "block",
		timestamp:"1234-12-12"
	};*/
	var result = {};
	try {
		log("searching for request: ");
		logObj(data);
		db.RW_REQUEST.find({cognitoSub:data.cognitoSub, targetCognitoSub:data.targetCognitoSub, type:data.type}, function(err,friendRes){
			if (friendRes[0]){
				logg("REQUEST ALREADY EXISTS SPAMMER, exiting");
				cb(false);
			}
			else {
				db.RW_REQUEST.insert({cognitoSub:data.cognitoSub, username:data.username, targetCognitoSub:data.targetCognitoSub, type:data.type, timestamp:new Date()},	
					function(err, doc){
						if (!err){
							logg("New request added to RW_REQUEST: " + data.cognitoSub + "," + data.targetCognitoSub + "," + data.type);
							cb({status:"added"});
						}
						else {
							logg("ERROR when adding friend to RW_FRIEND: " + data.cognitoSub + "," + data.targetCognitoSub);
							logg(err);
							cb({error:"ERROR when adding friend to RW_FRIEND: " + data.cognitoSub + "," + data.targetCognitoSub});
						}
					}
				);				
			}
		});
	}
	catch(e) {
		cb({error:"ERROR in upsertFriend database action!"});
	}
}

var getOnlineFriendsAndPartyFromDB = function(cognitoSub,cb){
	//log("searching for user: " + cognitoSub);
	db.RW_FRIEND.find({cognitoSub:cognitoSub}, function(err,res){
		var friends = [];
		if (res && res[0]){
			for (let j = 0; j < res.length; j++) {
				//var friend
			}
		}
		cb(friends);
	});
}

var searchUserFromDB = function(searchText,cb){
	//log("searching for user with text: " + searchText);
	var re = new RegExp(searchText,"i");
	db.RW_USER.find({USERNAME:re}).limit(50, function(err,res){
		if (res && res[0]){
			var users = res;
			console.log(users);
			cb(users);
		}
		else {
			cb({});
		}
	});
}


var getUserFromDB = function(cognitoSub,cb){
	//log("searching for user: " + cognitoSub);
	db.RW_USER.find({cognitoSub:cognitoSub}, function(err,res){
		if (res && res[0]){
			var user = res[0];
			user.username = res[0].USERNAME;
			if (typeof user.partyId === 'undefined'){
				//log("dbUserUpdate - No entry found for party in DB, setting to ''");
				dbUserUpdate("set", user.cognitoSub, {partyId:""});
			}
			cb(user);
		}
		else {
			cb(false);
		}
	});
}


var getAllPlayersFromDB = function(cb){
	var cognitoSubsInGame = [];
	for (var i in Player.list){
		cognitoSubsInGame.push(Player.list[i].cognitoSub);
	}
	
	var searchParams = { cognitoSub: { $in: cognitoSubsInGame } };
	db.RW_USER.find(searchParams, function(err,res){
		if (res && res[0]){
			cb(res);
		}
		else {
			cb(false);
		}
	});
}

var getAllUsersOnServer = function(cb){
	var cognitoSubs = [];
	for (var i in SOCKET_LIST){
		cognitoSubs.push(SOCKET_LIST[i].cognitoSub);
	}
	
	var searchParams = { cognitoSub: { $in: cognitoSubs } };
	db.RW_USER.find(searchParams, function(err,res){
		if (res && res[0]){
			cb(res);
		}
		else {
			cb(false);
		}
	});
}


function updateOnlineTimestampForUsers(){
	for(var i in SOCKET_LIST){
		if (SOCKET_LIST[i].cognitoSub){
			var newDate = new Date();
			db.RW_USER.update({cognitoSub: SOCKET_LIST[i].cognitoSub}, {$set: {onlineTimestamp: newDate}}, {multi: true}, function () {
				//logg("Updated player[" + SOCKET_LIST[i].cognitoSub + "] onlineTimestamp to " + newDate);
			});			
		}
	}	
}

function updateOnlineTimestampForUser(cognitoSub){
	var newDate = new Date();
	db.RW_USER.update({cognitoSub: cognitoSub}, {$set: {onlineTimestamp: newDate}}, {multi: true}, function () {
		//logg("Updated player[" + cognitoSub + "] onlineTimestamp to " + newDate);
	});			
}

function updateServerUrlForUser(cognitoSub){
	db.RW_USER.update({cognitoSub: cognitoSub}, {$set: {serverUrl: myUrl}}, {multi: true}, function () {
		//logg("Updated player[" + cognitoSub + "] onlineTimestamp to " + newDate);
	});			
}


var getOnlineFriends = function(cognitoSub, cb){
	var onlineFriends = [];
	
	//console.log("Searching DB for online friends of: " + cognitoSub);
	db.RW_FRIEND.find({cognitoSub:cognitoSub}, function(err,friendRes){
		var cognitoSubArray = [];
		//console.log("Friend DB results:");
		//console.log(friendRes);
		if (friendRes[0]){
			for (let j = 0; j < friendRes.length; j++) {
				cognitoSubArray.push(friendRes[j].friendCognitoSub);
			}						
			var miliInterval = (staleOnlineTimestampThreshold * 1000);
			var thresholdDate = new Date(Date.now() - miliInterval);
			var searchParams = { cognitoSub:{ $in: cognitoSubArray }, onlineTimestamp:{ $gt: thresholdDate } };
			//console.log("Searching DB for which of the above friends are online?");
			db.RW_USER.find(searchParams, function(err,userRes){
				//console.log("Online friend result:");
				//console.log(userRes);
				if (userRes[0]){
					for (let k = 0; k < userRes.length; k++) {
						var user = userRes[k];
						user.username = userRes[k].USERNAME;
						onlineFriends.push(user);
					}						
				}
				cb(onlineFriends);
			});			
		}
		else {
			cb(onlineFriends);
		}
	});		
}
// Returns: partyData (see below)
var getPartyForUser = function(cognitoSub, cb){
	var partyData = {
		partyId:"",
		party:[] //ALL Party members [{cognitoSub:partyRes[k].cognitoSub, username:partyRes[k].USERNAME, serverUrl:partyRes[k].serverUrl, leader:false}]
	};	
	db.RW_USER.find({cognitoSub:cognitoSub}, function(err,userRes){
		//console.log("PARTY get user DB results:");
		//console.log(userRes);
		if (userRes && userRes[0]){
			partyData.partyId = cognitoSub; //Default the partyId to the requested User
			if (userRes[0].partyId && userRes[0].partyId.length > 0){ //User is in a party
				//console.log("PARTY Searching DB for users with partyId: " + userRes[0].partyId);
				partyData.partyId = userRes[0].partyId;
				kickOfflineFromParty(partyData.partyId, function(){
					var miliInterval = (staleOnlineTimestampThreshold * 1000);
					var thresholdDate = new Date(Date.now() - miliInterval);			
					db.RW_USER.find({partyId:partyData.partyId, onlineTimestamp:{ $gt: thresholdDate }}, function(err2,partyRes){
						//console.log("PARTY Get all users with partyId DB results:");
						//console.log(partyRes);
						if (partyRes && partyRes[0]){ //There is at least 1 person in the party
							for (let k = 0; k < partyRes.length; k++) {
								var partyMember = {cognitoSub:partyRes[k].cognitoSub, username:partyRes[k].USERNAME, serverUrl:partyRes[k].serverUrl, leader:false};
								if (partyRes[k].cognitoSub == partyData.partyId){
									partyMember.leader = true;
								}							
								partyData.party.push(partyMember);
							}				
						}
						cb(partyData);
					});	
				});
			}
			else { //User is not in a party
				partyData.party = [{cognitoSub:cognitoSub, username:userRes[0].USERNAME, serverUrl:userRes[0].serverUrl, leader:true}];
				cb(partyData);
			}
		}
		else { //ERROR: USER NOT FOUND
			cb(partyData);
		}
	});		
}

var getPartyById = function(partyId, cb){
	var partyData = {
		partyId:partyId,
		party:[] //ALL Party members [{cognitoSub:partyRes[k].cognitoSub, username:partyRes[k].USERNAME, serverUrl:partyRes[k].serverUrl, leader:false}]
	};	
	kickOfflineFromParty(partyData.partyId, function(){
		var miliInterval = (staleOnlineTimestampThreshold * 1000);
		var thresholdDate = new Date(Date.now() - miliInterval);			
		db.RW_USER.find({partyId:partyData.partyId, onlineTimestamp:{ $gt: thresholdDate }}, function(err2,partyRes){
			//console.log("PARTY Get all users with partyId DB results:");
			//console.log(partyRes);
			if (partyRes && partyRes[0]){ //There is at least 1 person in the party
				for (let k = 0; k < partyRes.length; k++) {
					var partyMember = {cognitoSub:partyRes[k].cognitoSub, username:partyRes[k].USERNAME, serverUrl:partyRes[k].serverUrl, leader:false};
					if (partyRes[k].cognitoSub == partyData.partyId){
						partyMember.leader = true;
					}							
					partyData.party.push(partyMember);
				}				
			}
			cb(partyData);
		});	
	});
}

//If leader of the party is offline, set ALL party members party Id to '' (and return callback)
//If party leader is online, 


var kickOfflineFromParty = function(partyId, cb){
	if (!partyId || partyId.length < 1){
		return;
	}
	db.RW_USER.find({cognitoSub:partyId}, function(err,partyRes){ //First, analyze party leader
		var miliInterval = (staleOnlineTimestampThreshold * 1000);
		var thresholdDate = new Date(Date.now() - miliInterval);
		if (partyRes && partyRes[0] && (partyRes[0].partyId != partyRes[0].cognitoSub || partyRes[0].onlineTimestamp < thresholdDate)){ //PartyId where the 'leader' is in a different party or offline. Clearing all users with partyId
			db.RW_USER.update({partyId: partyId}, {$set: {partyId: ""}}, {multi: true}, function () { 
				logg("PartyId where the 'leader' is in a different party or offline. Clearing party for ALL users with partyId: " + partyId);
				cb();
			});	
		}
		else if(partyRes && partyRes[0] && partyRes[0].partyId == partyRes[0].cognitoSub && partyRes[0].onlineTimestamp >= thresholdDate){ //Valid party with online leader who is also in the party		
			var searchParams = { partyId: partyId, onlineTimestamp:{ $lt: thresholdDate } };		
			db.RW_USER.update(searchParams, {$set: {partyId: ""}}, {multi: true}, function () { 
				logg("Valid, online party. Clearing all party members that are offline");
				cb();
			});				
		}
		else { //Catch all, do nothing
			cb();
		}
	});					
}




var getFriendRequests = function(cognitoSub, cb){
	var friendRequests = [];
	
	//console.log("Searching DB for friend requests of: " + cognitoSub);
	db.RW_REQUEST.find({targetCognitoSub:cognitoSub, type:"friend"}, function(err,friendRes){
		var cognitoSubArray = [];
		//console.log("Friend request DB results:");
		//console.log(friendRes);
		if (friendRes[0]){
			for (let j = 0; j < friendRes.length; j++) {
				friendRequests.push(friendRes[j]);
			}						
		}
		cb(friendRequests);
	});		
}

var getPartyRequests = function(cognitoSub, cb){
	var partyRequests = [];
	
	//console.log("Searching DB for party requests of: " + cognitoSub);
	db.RW_REQUEST.find({targetCognitoSub:cognitoSub, type:"party"}, function(err,partyRes){
		var cognitoSubArray = [];
		//console.log("Party  request DB results:");
		//console.log(partyRes);
		if (partyRes[0]){
			for (let j = 0; j < partyRes.length; j++) {
				partyRequests.push(partyRes[j]);
			}						
		}
		cb(partyRequests);
	});		
}

var getRequestById = function(id, cb){
	console.log("DB getRequestById: " + id);
	db.RW_REQUEST.find({"_id": ObjectId(id)}, function(err,res){
		//console.log("getRequestById DB results:");
		//console.log(res);
		if (res && res[0]){
			cb(res[0]);			
		}
		else {
			cb(false);
		}		
	});		
}

function removeRequestById(id){
	console.log("DB Removing request by id: " + id);
	db.RW_REQUEST.remove({"_id": ObjectId(id)}, function(err, obj) {
		if (!err){
			logg("document(s) deleted");
		}
	});
}


function removeStaleFriendRequests(){
	var miliInterval = (staleFriendRequestThreshold * 1000 * 60 * 60 * 24);
	var thresholdDate = new Date(Date.now() - miliInterval);
	var searchParams = { type:"friend", timestamp:{ $lt: thresholdDate } };
	db.RW_REQUEST.remove(searchParams, function(err, obj) {	
	});	
}

function removeStalePartyRequests(){
	var miliInterval = (stalePartyRequestThreshold * 1000);
	var thresholdDate = new Date(Date.now() - miliInterval);
	var searchParams = { type:"party", timestamp:{ $lt: thresholdDate } };
	db.RW_REQUEST.remove(searchParams, function(err, obj) {	
	});	
}


/////////////////////////////////////////////////////USER FUNCTIONS///////////////////////// userFunctions.js

function getSocketIdFromCognitoSub(cognitoSub){
	for(var s in SOCKET_LIST){
		if (SOCKET_LIST[s].cognitoSub == cognitoSub){
			return 	SOCKET_LIST[s].id;
		}
	}	
	return false;
}

/////////////////////////////////////////////////////COGNITO LOGIN AND USER DB SYNC AUTHENTICATION/////////////////////////

async function getAuthorizedUser(cookies){
	var tokens = {
		access_token:cookies["cog_a"],
		id_token:cookies["cog_i"],
		refresh_token:cookies["cog_r"]
	};			
	
	return await validateTokenOrRefresh(tokens);
}

const cognitoClientId = '70ru3b3jgosqa5fpre6khrislj';
const expectedIss = 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_SbevJL5zt';

async function getTokenFromCodeAndValidate(code){
	var error = false;

    const url='https://treatmetcalfgames.auth.us-east-2.amazoncognito.com/oauth2/token';
	const body = {
		grant_type:'authorization_code',
		code:code,
		client_id:cognitoClientId,
		redirect_uri:'https://rw.treatmetcalf.com/'
	};
	
	var formBody = Object.keys(body).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(body[key])).join('&');
	
	const params = {
		headers:{
			"Content-Type":'application/x-www-form-urlencoded'
		},
		body:formBody,
		method:"POST"
	};

	var tokens = {};
	
	await fetch(url, params)
	.then(data=>{return data.json()})
	.then(res=>{tokens = res;})
	.catch(error=>{
        logg(error);
        error = true;
    });
    if (error){
		return {msg:"ERROR - Unable to exchange code for token! " + code};
    }
	
	var validationResponse = await validateTokenOrRefresh(tokens);

	return validationResponse;
}

async function validateTokenOrRefresh(tokens){
	//console.log("Validating token or refreshing..");
	var validationResponse = await validateToken(tokens.access_token); //sets username and cognitoSub

	validationResponse.refresh_token = tokens.refresh_token;
	validationResponse.id_token = tokens.id_token;
	validationResponse.access_token = tokens.access_token;
	if (validationResponse.fail) { //If token validation failed, use the refresh token to get a new one
		var refreshResult = await refreshCognitoToken(tokens.refresh_token);
		if (refreshResult.id_token){
			log("SUCCESSFULLY REFRESHED TOKEN");
			validationResponse.id_token = refreshResult.id_token;
			validationResponse.access_token = refreshResult.access_token;
		}
		var refreshedValidationResponse = await validateToken(refreshResult.access_token);
		if (refreshedValidationResponse.msg){
			validationResponse.cognitoSub = refreshedValidationResponse.cognitoSub;
			validationResponse.username = refreshedValidationResponse.username;
			validationResponse.federatedUser = refreshedValidationResponse.federatedUser;
			validationResponse.msg = "Token Refreshed - " + refreshedValidationResponse.msg;
		}
		if (!validationResponse.cognitoSub){ //Refresh failed
			delete validationResponse.refresh_token;
		}
	}

	return validationResponse;
}

async function validateToken(token) {
	//logg('VALIDATING TOKEN:' + token);

	var username = "";
	var cognitoSub = "";
	var federatedUser = false;

	var validateTokenResult = {};
	await request({
		url: 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_SbevJL5zt/.well-known/jwks.json',
		json: true
	}, async function (error, response, body) {
		//log("STATUS CODE:" + response.statusCode);
		if (!error && response.statusCode === 200) {

			//Step 1: Confirm the Structure of the JWT
			var decodedJwt = jwt.decode(token, { complete: true });
			if (!decodedJwt) {
				log("validateToken - Not a valid JWT token");
				validateTokenResult = {fail:true, msg:"ERROR  - Not a valid JWT token"};
				return;
			}
			else {

				//Step 2: Validate the JWT Signature
				var payload = validateJWTSignatureAndGetPayload(body['keys'], decodedJwt, token);
				if (!payload){
					logg("ERROR - Invalid JWT Signature!!");
					validateTokenResult = {fail:true, msg:"ERROR - Invalid JWT Signature!!"};
					return;					
				}
				else{

					//Step 3: Verify the Claims
					var currentDateInterval = new Date() / 1000;
					//currentDateInterval = 9999999999999; //Force expiration
					if (payload.exp < currentDateInterval) { //payload.exp is seconds since Jan 1 1970
					logg("WARNING - Expired Token, authentication required");
						validateTokenResult = {fail:true, msg:"WARNING - Expired Token, authentication required"};
						return;
					}
					if (payload.client_id && payload.client_id != cognitoClientId){
						logg("ERROR - Token client_id does not match cognito Client Id");
						validateTokenResult = {fail:true, msg:"ERROR - Token client_id does not match cognito Client Id"};
						return;
					}
					if (payload.iss != expectedIss){
						logg("ERROR - Token does not have correct issuer (Cognito Pool ARN)");
						validateTokenResult = {fail:true, msg:"ERROR - Token does not have correct issuer (Cognito Pool ARN)"};
						return;
					}
					//logg("Valid Token! Returning...");

					username = payload.username;
					cognitoSub = payload.sub;
					if (payload['cognito:groups']){
						federatedUser = true;
						//log("Confirmed user is a federated account.");
					}

					if (username != "" && cognitoSub != "") {
						//SUCCESS
						//log("USERNAME SUCCESSFULLY GOT FROM TOKEN: " + username);
						
						validateTokenResult = {
							cognitoSub: cognitoSub,
							username: username,
							federatedUser:federatedUser,
							msg:"Successfully Validated Token!"
						};
					}
				}
			}
		}
		else {
			//FAIL
			logg("validateToken - Error! Unable to download JWKs");
			return {msg:"ERROR - Unable to download JWKs"};
		}
	}).then(function (result) {		
	}).catch(function (err){log(err);});
	return validateTokenResult;
}

async function refreshCognitoToken(refreshToken){

	logg("Token invalid or expired, attempting to refresh using Refresh Token");
    const url='https://treatmetcalfgames.auth.us-east-2.amazoncognito.com/oauth2/token';
	const body = {
		grant_type:'refresh_token',
		client_id:cognitoClientId,
		refresh_token:refreshToken
	};	
	var formBody = Object.keys(body).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(body[key])).join('&');
	
	const params = {
		headers:{
			"Content-Type":'application/x-www-form-urlencoded'
		},
		body:formBody,
		method:"POST"
	};
	var result = {};
	
	await fetch(url, params)
	.then(data=>{return data.json()})
	.then(res=>{result = res;})
	.catch(error=>{
        logg(error);
        error = true;
    });
	return result;
}

function validateJWTSignatureAndGetPayload(keys, decodedJwt, token){
	var result = null;
	var pems = {};


	for (var i = 0; i < keys.length; i++) {
		//Convert each key to PEM
		var key_id = keys[i].kid;
		var modulus = keys[i].n;
		var exponent = keys[i].e;
		var key_type = keys[i].kty;
		var jwk = { kty: key_type, n: modulus, e: exponent };
		var pem = jwkToPem(jwk);
		pems[key_id] = pem;
	}
	var kid = decodedJwt.header.kid;
	var pem = pems[kid];
	if (!pem) {
		logg('ERROR in validateJWTSignatureAndGetPayload - unable to convert jwk to pem');
		return null;
	}
	else {
		
		jwt.verify(token, pem, function (err, payload) {
			if (err) {
				logg("validateJWTSignatureAndGetPayload - Invalid Token:");
				logg(token);
				return null;
			}
			else {
				//logg("SUCCESS validateJWTSignaturePayload");
				result = payload;
			}
		});
	}
	return result;
}

function replaceValues(userData, content){
	for (var value in userData){
		content = content.replace("{{"+value+"}}", userData[value]);
	}
	return content;
}

////////////////////// ADD USER ///////////////////////////////////////////////////////////////////////////////

var addUser = function(cognitoSub, username, cb){
	if (!cognitoSub || !username){
		cb();
		return;
	}
	var today = new Date();
	var date = today.getUTCFullYear()+'-'+(today.getUTCMonth()+1)+'-'+today.getUTCDate();

	log(date);
	db.RW_USER.insert({cognitoSub:cognitoSub, USERNAME:username, experience:0, cash:0, level:0, kills:0, benedicts:0, deaths:0, captures:0, steals:0, returns:0, gamesPlayed:0, gamesWon:0, gamesLost:0, rating:0, dateJoined:date, onlineTimestamp:today, partyId:'', serverUrl:''},
		function(err){cb();});
}

function crash(){
	var newVar = alskdjf.thisIsUndefined;
}

function updateSocketAndServerDb(cognitoSub){
	getUserFromDB(cognitoSub, function(userData){
		if (userData){
			for (var s in SOCKET_LIST){
				if (SOCKET_LIST[s].cognitoSub == cognitoSub){
					SOCKET_LIST[s].partyId = userData.partyId;
					SOCKET_LIST[s].rating = userData.rating;
					SOCKET_LIST[s].experience = userData.experience;
					SOCKET_LIST[s].username = userData.USERNAME;
					
					sendSocketListToServerDb();
					
					break;
				}
			}
		}
	});	
}

function sendSocketListToServerDb(){
	var currentUsers = [];
	for (var s in SOCKET_LIST){
		if (Player.list[SOCKET_LIST[s].id]){
			SOCKET_LIST[s].team = Player.list[SOCKET_LIST[s].id].team;
		}		
		
		currentUsers.push({
			socketId:SOCKET_LIST[s].id,
			cognitoSub:SOCKET_LIST[s].cognitoSub,
			username:SOCKET_LIST[s].username,
			partyId:SOCKET_LIST[s].partyId,
			rating:SOCKET_LIST[s].rating,
			experience:SOCKET_LIST[s].experience,
			team:SOCKET_LIST[s].team
		});
	}

	db.RW_SERV.update({url: myUrl}, {$set: {currentUsers:currentUsers}}, {multi: true}, function () {
		//logg("Updated currentUsers in RW_SERV for " + myUrl + ":");
		//console.log(JSON.stringify(currentUsers));
	});
}

function getCurrentPlayersFromUsers(users){
	var players = [];
	
	if (typeof users === "undefined"){
		return players;
	}
	
	for (var u = 0; u < users.length; u++){
		if (users[u].team){
			players.push(users[u]);
		}
	}
	return players;
}

io.sockets.on('connection', function(socket){
	socket.id = Math.random();
	var socketBak = socket; //Look into why the hell this is needed!!! Happened after Player init, respawn and restartGame methods were combined/cleaned up
	SOCKET_LIST[socket.id] = socket;
	logg('Client has connected (ID:' + socket.id + ')');	
	populateLoginPage(socket);
	
	socket.on('updateSocketInfo', function(cognitoSub){
		//console.log(">>>>>>>>>>>>>>>>>>>>>>>>>> Updating socket info. SOCKET LIST: " + SOCKET_LIST.length);
		for (var s in SOCKET_LIST){ //Kill any existing duplicate logins with this user on this server
			//console.log("ID:" + SOCKET_LIST[s].id + " CognitoSub:" + SOCKET_LIST[s].cognitoSub);
			if (SOCKET_LIST[s].cognitoSub == cognitoSub && SOCKET_LIST[s].id != socket.id){
				SOCKET_LIST[s].disconnect();
			}
		}
		socket.cognitoSub = cognitoSub;
		//logg("updateSocketInfo for cognitoSub: " + SOCKET_LIST[socket.id].cognitoSub);
		
		updateSocketAndServerDb(cognitoSub);
		if (!isWebServer)
			dbGameServerUpdate();
	});

	socket.on('error', function(error){
		logg("!!!UNHANDLED SOCKET ERROR");
		logg(util.format(error));
		logg("!!!SOCKET DISCONNECTED!");
		sendSocketListToServerDb();
	});
	

	socket.on('test', function(data){
		searchUserFromDB("test", function(mongoRes){});
	});

	socket.on('validateToken', function(token){
		if (token != null){
			validateToken(token, socket);
		}
		else {
			socket.emit('authenticationFail');
		}
	});

	socket.on('disconnect', function(){
		logg("Socket " + socket.id + " disconnected.");
		if (gameOver == false && pregame == false && Player.list[socket.id] && Player.list[socket.id].rating > matchWinLossRatingBonus){
			//dbUserUpdate("inc", Player.list[socket.id].cognitoSub, {rating: -matchWinLossRatingBonus});
		}
		Player.onDisconnect(socket); //Deletes from Player.list
		delete SOCKET_LIST[socket.id];
		
		sendSocketListToServerDb();
	});

	socket.on('chat', function(data){
		if (Player.list[data[0]]){
			for(var i in SOCKET_LIST){
				SOCKET_LIST[i].emit('addToChat',Player.list[data[0]].name + ': ' + data[1].substring(0,50), Player.list[data[0]].id);
				updateEffectList.push({type:7, playerId:data[0], text:data[1].substring(0,50)});
			}
		}
	});

	//Server commands
	socket.on('evalServer', function(data){
		//socket = socketBak;
		if(!allowServerCommands){return;}
		if (!Player.list[socket.id]){return;}
		
		
		logg("SERVER COMMAND:" + data);
		log(data.substring(4));
		if (data == "start" || data == "restart"){
			restartGame();
		}
		else if (data == "team1" || data == "teamsize1"){
			maxPlayers = 2;
		}
		else if (data == "team2" || data == "teamsize2"){
			maxPlayers = 4;
		}
		else if (data == "team3" || data == "teamsize3"){
			maxPlayers = 6;
		}
		else if (data == "team4" || data == "teamsize4"){
			maxPlayers = 8;
		}
		else if (data == "team5" || data == "teamsize5"){
			maxPlayers = 10;
		}
		else if (data == "team6" || data == "teamsize6"){
			maxPlayers = 12;
		}
		else if (data == "team7" || data == "teamsize7"){
			maxPlayers = 14;
		}
		else if (data == "team8" || data == "teamsize8"){
			maxPlayers = 16;
		}
		else if (data == "respawn3" || data == "spawn3"){
			respawnTimeLimit = 3 * 60;
		}
		else if (data == "respawn5" || data == "spawn5"){
			respawnTimeLimit = 5 * 60;
		}
		else if (data == "respawn7" || data == "spawn7"){
			respawnTimeLimit = 7 * 60;
		}
		else if (data == "respawn9" || data == "spawn9"){
			respawnTimeLimit = 9 * 60;
		}
		else if (data.substring(0,4) == "kick"){
			for (var p in Player.list){
				if (Player.list[p].name == data.substring(4)){
					var id = Player.list[p].id;
					var name = Player.list[p].name;
					Player.onDisconnect(SOCKET_LIST[id]);
					delete SOCKET_LIST[id];
					socket.emit('addToChat', 'Kicked ' + name + ' from game.');
					break;
				}
			}
		}
		else if (data == "speed6" || data == "run6"){
			globalSpeed = 6;
			maxSpeed = 6;
			speedMin = 6;
		}
		else if (data == "speed7" || data == "run7"){
			globalSpeed = 7;
			maxSpeed = 7;
			speedMin = 7;
		}
		else if (data == "speed8" || data == "run8"){
			globalSpeed = 8;
			maxSpeed = 8;
			speedMin = 8;
		}
		else if (data == "speed9" || data == "run9"){
			globalSpeed = 9;
			maxSpeed = 9;
			speedMin = 9;
		}
		else if (data == "speed10" || data == "run10"){
			globalSpeed = 10;
			maxSpeed = 10;
			speedMin = 10;
		}
		else if (data == "pc" || data == "pcmode"){
			if (pcMode == 2){
				pcMode = 1;
			}
			else {
				pcMode = 2;
			}		
			updateMisc.pcMode = pcMode;
		}
		else if (data == "dam1" || data == "damage1"){
			damageScale = 1;
		}
		else if (data == "dam.9" || data == "damage.9"){
			damageScale = 0.9;
		}
		else if (data == "dam.8" || data == "damage.8"){
			damageScale = 0.8;
		}
		else if (data == "dam.7" || data == "damage.7"){
			damageScale = 0.7;
		}
		else if (data == "dam.6" || data == "damage.6"){
			damageScale = 0.6;
		}
		else if (data == "dam.5" || data == "damage.5"){
			damageScale = 0.5;
		}
		//gametypes
		else if (data == "slayer" || data == "deathmatch"){
			gametype = "slayer";
			restartGame();
		}
		else if (data == "slayer1"){
			gametype = "slayer";
			gameMinutesLength = 0;
			gameSecondsLength = 0;
			scoreToWin = 25;			
			restartGame();
		}
		else if (data == "slayer2"){
			gametype = "slayer";
			gameMinutesLength = 0;
			gameSecondsLength = 0;
			scoreToWin = 50;			
			restartGame();
		}
		else if (data == "ctf1"){
			gametype = "ctf";
			gameMinutesLength = 5;
			gameSecondsLength = 0;
			scoreToWin = 0;			
			restartGame();
		}
		else if (data == "ctf2"){
			gametype = "ctf";
			gameMinutesLength = 10;
			gameSecondsLength = 0;
			scoreToWin = 3;			
			restartGame();
		}
		else if (data == "ctf"){
			gametype = "ctf";
			restartGame();
		}
		else if (data == "ctf"){
			gametype = "ctf";
			restartGame();
		}
		else if (data == "time" || data == "timelimit"){
			if (gameMinutesLength == 0 && gameSecondsLength == 0){
				gameMinutesLength = 5;
				gameSecondsLength = 0;
			}
			else {
				gameMinutesLength = 0;
				gameSecondsLength = 0;
			}
			restartGame();
		}
		else if (data == "time1"){
			gameMinutesLength = 1;
			gameSecondsLength = 0;
			restartGame();
		}
		else if (data == "time3"){
			gameMinutesLength = 3;
			gameSecondsLength = 0;
			restartGame();
		}
		else if (data == "time5"){
			gameMinutesLength = 5;
			gameSecondsLength = 0;
			restartGame();
		}
		else if (data == "time7"){
			gameMinutesLength = 7;
			gameSecondsLength = 0;
			restartGame();
		}
		else if (data == "time10"){
			gameMinutesLength = 10;
			gameSecondsLength = 0;
			restartGame();
		}
		else if (data == "score0" || data == "to0" || data == "noscore"){
			scoreToWin = 0;
			restartGame();
		}
		else if (data == "score1" || data == "to1"){
			scoreToWin = 1;
			restartGame();
		}
		else if (data == "score3" || data == "to3"){
			scoreToWin = 3;
			restartGame();
		}
		else if (data == "score5" || data == "to5"){
			scoreToWin = 5;
			restartGame();
		}
		else if (data == "score7" || data == "to7"){
			scoreToWin = 7;
			restartGame();
		}
		else if (data == "score10" || data == "to10"){
			scoreToWin = 10;
			restartGame();
		}
		else if (data == "score15" || data == "to15"){
			scoreToWin = 15;
			restartGame();
		}
		else if (data == "score20" || data == "to20"){
			scoreToWin = 20;
			restartGame();
		}
		else if (data == "score25" || data == "to25"){
			scoreToWin = 25;
			restartGame();
		}
		else if (data == "score30" || data == "to30"){
			scoreToWin = 30;
			restartGame();
		}
		else if (data == "score50" || data == "to50"){
			scoreToWin = 50;
			restartGame();
		}

		//maps
		else if (data == "longest"){
			map = "longest";
			restartGame();
		}
		else if (data == "thepit" || data == "pit" || data == "the pit"){
			map = "thepit";
			restartGame();
		}
		else if (data == "map2"){
			map = "map2";
			restartGame();
		}
		else if (data == "stats" || data == "stat"){
			db.RW_USER.find({cognitoSub:Player.list[socket.id].cognitoSub}, function(err,res){
				if (res && res[0]){
					socket.emit('addToChat', 'Cash Earned:' + res[0].experience + ' Kills:' + res[0].kills + ' Deaths:' + res[0].deaths + ' Benedicts:' + res[0].benedicts + ' Captures:' + res[0].captures + ' Steals:' + res[0].steals + ' Returns:' + res[0].returns + ' Games Played:' + res[0].gamesPlayed + ' Wins:' + res[0].gamesWon + ' Losses:' + res[0].gamesLost + ' TPM Rating:' + res[0].rating);	
				}
				else {
					socket.emit('addToChat', 'ERROR looking you up in database.');
				}
			});
		}
		else if (data == "thugs"){		
			if (spawnOpposingThug){
				logg("Server command: Thugs Disabled");
				socket.emit('addToChat', "Server command: Thugs Disabled");
				spawnOpposingThug = false;
			}
			else {
				logg("Server command: Thugs Enabled");
				socket.emit('addToChat', "Server command: Thugs Enabled");
				spawnOpposingThug = true;
			}
			ensureCorrectThugCount();
		}
		else if (data == "shop"){		
			if (shopEnabled){
				logg("Server command: Shop Disabled");
				socket.emit('addToChat', "Server command: Shop Disabled");
				shopEnabled = false;
			}
			else {
				logg("Server command: Shop Enabled");
				socket.emit('addToChat', "Server command: Shop Enabled");
				shopEnabled = true;
			}
		}
		else if (data == "sThugWhite"){		
			logg("Server command: Spawn Thug (White)");
			var coords = getSafeCoordinates("white");
			Thug(Math.random(), "white", coords.x, coords.y);
			socket.emit('addToChat', 'White thug spawned.');	
		}
		else if (data == "sThugBlack"){
			logg("Server command: Spawn Thug (Black)");
			var coords = getSafeCoordinates("black");
			Thug(Math.random(), "black", coords.x, coords.y);
			socket.emit('addToChat', 'Black thug spawned.');	
		}
		else if (data == "5sec"){
			minutesLeft = 0;
			secondsLeft = 5;
		}
		else if (data == "1min"){
			minutesLeft = 1;
			secondsLeft = 0;
		}
		else if (data == "1min1sec"){
			minutesLeft = 1;
			secondsLeft = 1;
		}
		else if (data == "1min3sec"){
			minutesLeft = 1;
			secondsLeft = 3;
		}				
		else if (data == "team" || data == "teams" || data == "change" || data == "switch" || data == "changeTeams" || data == "changeTeam"){
			changeTeams(socket.id);
		}
		else if (data == "capture" || data == "score"){
			if (Player.list[socket.id].team == "white"){
				capture("white");
			}
			else if (Player.list[socket.id].team == "black"){
				capture("black");
			}
		}
		else if (data == "kill" || data == "die"){
			Player.list[socket.id].health = 0
			updatePlayerList.push({id:Player.list[socket.id].id,property:"health",value:Player.list[socket.id].health})
			kill(Player.list[socket.id], 1, 0);
		}
		else if (data == "end"){
			minutesLeft = 0;
			secondsLeft = 0;
		}
		else if (data == "pause"){
			if (pause == true)
				pause = false;
			else if (pause == false)
				pause = true;
		}
		else if (data == "wint"){
			whiteScore = 0;
			blackScore = 0;
			gameOver = false;

			for (var i in SOCKET_LIST){
				var sock = SOCKET_LIST[i];	
				sendCapturesToClient(sock);
			}
			restartGame();

			log("PLAYER ID = " + Player.list[socket.id].id + "PLAYER NAME = " + Player.list[socket.id].name + " TEAM: " + Player.list[socket.id].team);
			if (Player.list[socket.id] && Player.list[socket.id].team == "white"){
				if (gametype == "ctf")
					capture("white");
			}
			else if (Player.list[socket.id] && Player.list[socket.id].team == "black"){
				if (gametype == "ctf")
					capture("black");
			}
			minutesLeft = 0;
			secondsLeft = 0;
		}
		else if (data == "loset"){
			whiteScore = 0;
			blackScore = 0;
			gameOver = false;

			for (var i in SOCKET_LIST){
				var sock = SOCKET_LIST[i];	
				sendCapturesToClient(sock);
			}
			restartGame();

			log("PLAYER ID = " + Player.list[socket.id].id + "PLAYER NAME = " + Player.list[socket.id].name + " TEAM: " + Player.list[socket.id].team);
			if (Player.list[socket.id] && Player.list[socket.id].team == "white"){
				if (gametype == "ctf")
					capture("black");
			}
			else if (Player.list[socket.id] && Player.list[socket.id].team == "black"){
				if (gametype == "ctf")
					capture("white");
			}
			minutesLeft = 0;
			secondsLeft = 0;
		}
		else if (data == "crasht"){
			crash();
		}
		else if (data == "godt" || data == "haxt"){
			Player.list[socket.id].SGClip = 99;
			Player.list[socket.id].MGClip = 999;
			Player.list[socket.id].DPClip = 99;
			Player.list[socket.id].health = 99;
			Player.list[socket.id].hasBattery = 2;
			updatePlayerList.push({id:socket.id,property:"hasBattery",value:Player.list[socket.id].hasBattery});
			updatePlayerList.push({id:socket.id,property:"health",value:Player.list[socket.id].health});
			updatePlayerList.push({id:socket.id,property:"weapon",value:Player.list[socket.id].weapon});
			updatePlayerList.push({id:socket.id,property:"DPClip",value:Player.list[socket.id].DPClip});
			updatePlayerList.push({id:socket.id,property:"MGClip",value:Player.list[socket.id].MGClip});
			updatePlayerList.push({id:socket.id,property:"SGClip",value:Player.list[socket.id].SGClip});
			socket.emit('addToChat', 'INITIATE HAX');
		}

		else {
			try {
				var res = eval(data);
			}
			catch(e) {
				socket.emit('addToChat', 'Invalid Command.');
				res = "invalid command";
			}
			finally {
				socket.emit('evalAnswer', res);
			}
		}
		
	});	
}); //END socket.on(connection)

function joinGame(cognitoSub, username, team){
	var socket = SOCKET_LIST[getSocketIdFromCognitoSub(cognitoSub)];
	var players = getNumPlayersInGame();
	if (players >= maxPlayers){ //Another redundant maxplayers check couldn't hurt, right?
		socket.emit('signInResponse',{success:false,message:"SERVER FULL. Try again later, or try a different server."});								
	}
	else {
		log("CognitoSub signing into game server: " + cognitoSub);
		Player.onConnect(socket, cognitoSub, username, team);
		dbGameServerUpdate();
		socket.emit('signInResponse',{success:true,id:socket.id, mapWidth:mapWidth, mapHeight:mapHeight, whiteScore:whiteScore, blackScore:blackScore});
	}	
}

function changeTeams(playerId){
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
			SOCKET_LIST[playerId].emit('addToChat', 'CHANGING TO THE BLACK TEAM.');
		}
		else if (Player.list[playerId].team == "black"){
			Player.list[playerId].team = "white";
			updatePlayerList.push({id:SOCKET_LIST[playerId].id,property:"team",value:Player.list[playerId].team});
			SOCKET_LIST[playerId].emit('addToChat', 'CHANGING TO THE WHITE TEAM.');
		}
		SOCKET_LIST[playerId].team = Player.list[playerId].team;
		sendSocketListToServerDb();
		Player.list[playerId].respawn();	
		dbGameServerUpdate();
	}
}

function populateLoginPage(socket){	

	//Populate Leaderboard Table
	var leaderboard= "<table class='leaderboard'><tr><th>Rank</th><th style='width: 900px;'>Username</th><th>Rating</th><th>Kills</th><th>Capts</th><th>Wins</th><th>Exp</th></tr>";
	db.RW_USER.find().limit(100).sort({experience: -1}, function(err,res){
		if (res && res[0]){
			for (var i = 0; i < res.length; i++){
				if (res[i].USERNAME){
					leaderboard+="<tr><td style='background-color: #728498; text-align: center; font-weight: bold;'>" + (i + 1) + "</td><td><a href='{{serverHomePage}}user/"+res[i].cognitoSub+"'>" + res[i].USERNAME.substring(0, 15) + "</td><td>" + res[i].rating + "</td><td>" + res[i].kills + "</td><td>" + res[i].captures + "</td><td>" + res[i].gamesWon + "</td><td>" + res[i].experience + "</td></tr>";
				}
				else {
					logg("ERROR ACQUIRING USERNAME:");
					logg(res[i]);
				}
			}		
			leaderboard+="</table>";
			//Send PC Setting and update homepage title
			socket.emit('populateLoginPage', leaderboard, pcMode);
		}
		else {
			logg('ERROR finding players in database.');
		}
	}); //Limit the results	
}

function sendChatToAll(text){
	for(var i in SOCKET_LIST){
		SOCKET_LIST[i].emit('addMessageToChat',text);
	}
}

/*
//Unused, but could be a nice function in the future
function getPlayerRatingAndExperience(id){
	var cognitoSub = Player.list[id].cognitoSub;
	db.RW_USER.find({cognitoSub:cognitoSub}, function(err,res){
		if (res && res[0]){
			var rating = res[0].rating;
			if (rating == undefined || rating == null || isNaN(rating)){rating = 0;}
			Player.list[id].rating = rating;

			var experience = res[0].experience;
			if (experience == undefined || experience == null || isNaN(experience)){experience = 0;}
			Player.list[id].experience = experience;
		}
		else {
			logg("ERROR: Could not get rating for user: " + cognitoSub);
		}
	});
}
*/

function restartGame(){	
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
	initializePickups(map);
	initializeBlocks(map);
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
	sendSocketListToServerDb();
	
	if (!isWebServer)
		dbGameServerUpdate();
		
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
		var coords = getSafeCoordinates("white");
		Thug(Math.random(), "white", coords.x, coords.y);	
		whiteThugs++;
	}
	while (blackThugs < expectedBlackThugs){
		var coords = getSafeCoordinates("black");
		Thug(Math.random(), "black", coords.x, coords.y);			
		blackThugs++;
	}
	

}


//-----------------------PLAYER----------------------
var Player = function(id, cognitoSub, name, team){
//Stuff that ONLY gets set on Player entry
	var self = {
		id:id,
		cognitoSub:cognitoSub,
		team:team,
		name:name,
		height:94,
		width:94,
		pressingUp:false,
		pressingRight:false,
		pressingDown:false,
		pressingLeft:false,
		pressingW:false,
		pressingD:false,
		pressingS:false,		
		pressingA:false,
		pressingShift:false,

		cash:startingCash,
		cashEarnedThisGame:0,
		kills:0,
		deaths:0,
		steals:0,
		returns:0,
		captures:0,	
		rating:0,
		experience:0
	}
		
	//Initialize Player
	updatePlayerList.push({id:self.id,property:"team",value:self.team});
	updatePlayerList.push({id:self.id,property:"cash",value:self.cash});
	updatePlayerList.push({id:self.id,property:"cashEarnedThisGame",value:self.cashEarnedThisGame});
	updatePlayerList.push({id:self.id,property:"kills",value:self.kills});
	updatePlayerList.push({id:self.id,property:"deaths",value:self.deaths});
	updatePlayerList.push({id:self.id,property:"steals",value:self.steals});
	updatePlayerList.push({id:self.id,property:"returns",value:self.returns});
	updatePlayerList.push({id:self.id,property:"captures",value:self.captures});
	

	var socket = SOCKET_LIST[id];
	
//Player Update (Timer1 for player - Happens every frame)
	self.engine = function(){	
	
		//Invincibility in Shop
		if (invincibleInShop){
			if (self.team == "white" && self.x == 0 && self.y < 200 && self.health < 100){
				self.health = 100;
				updatePlayerList.push({id:self.id,property:"health",value:self.health});
			}
			else if (self.team == "black" && self.x == mapWidth && self.y > mapHeight - 200 && self.health < 100){
				self.health = 100;
				updatePlayerList.push({id:self.id,property:"health",value:self.health});
			}		
		}		
	/////////////////////////// DEATH /////////////////////		
		//Drop bag
		if (self.health <= 0 && self.holdingBag == true){
			if (self.team == "white"){
				bagBlue.captured = false;
				updateMisc.bagBlue = bagBlue;
			}
			else if (self.team == "black"){
				bagRed.captured = false;
				updateMisc.bagRed = bagRed;
			}
			self.holdingBag = false;
			updatePlayerList.push({id:self.id,property:"holdingBag",value:self.holdingBag});
		}
		if (self.health <= 0 && self.respawnTimer < respawnTimeLimit){self.respawnTimer++;}
		if (self.respawnTimer >= respawnTimeLimit && self.health <= 0){self.respawn();}
		if (self.health <= 0){return false;}

		
	////////////SHOOTING///////////////////
		//Auto shooting for holding down button
		if (self.firing <= 0 && !self.pressingShift && self.fireRate <= 0 && (self.pressingUp || self.pressingDown || self.pressingLeft || self.pressingRight)){
			Discharge(self);
		}
		if (self.fireRate > 0){
			self.fireRate--;
			if (self.bufferReload && self.fireRate <= 0){
				self.bufferReload = false;
				reload(self.id);				
			}
		}
		
		//If currently holding an arrow key, be aiming in that direction 
		if (self.aiming < 45 && self.pressingUp === true && self.pressingRight === false && self.pressingDown === false && self.pressingLeft === false){				
			if (self.shootingDir != 1){
				self.shootingDir = 1;
				updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
			}
		}
		if (self.aiming < 45 && self.pressingUp === true && self.pressingRight === true && self.pressingDown === false && self.pressingLeft === false){				
			if (self.shootingDir != 2){
				self.shootingDir = 2;
				updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
			}
		}
		if (self.aiming < 45 && self.pressingUp === false && self.pressingRight === true && self.pressingDown === false && self.pressingLeft === false){				
			if (self.shootingDir != 3){
				self.shootingDir = 3;
				updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
			}
		}
		if (self.aiming < 45 && self.pressingUp === false && self.pressingRight === true && self.pressingDown === true && self.pressingLeft === false){				
			if (self.shootingDir != 4){
				self.shootingDir = 4;
				updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
			}
		}
		if (self.aiming < 45 && self.pressingUp === false && self.pressingRight === false && self.pressingDown === true && self.pressingLeft === false){				
			if (self.shootingDir != 5){
				self.shootingDir = 5;
				updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
			}
		}
		if (self.aiming < 45 && self.pressingUp === false && self.pressingRight === false && self.pressingDown === true && self.pressingLeft === true){				
			if (self.shootingDir != 6){
				self.shootingDir = 6;
				updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
			}
		}
		if (self.aiming < 45 && self.pressingUp === false && self.pressingRight === false && self.pressingDown === false && self.pressingLeft === true){				
			if (self.shootingDir != 7){
				self.shootingDir = 7;
				updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
			}
		}
		if (self.aiming < 45 && self.pressingUp === true && self.pressingRight === false && self.pressingDown === false && self.pressingLeft === true){				
			if (self.shootingDir != 8){
				self.shootingDir = 8;
				updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
			}
		}
		
		//Firing and aiming decay (every frame)
		if (self.aiming > 0){
			self.aiming--;
		}
		if (self.triggerTapLimitTimer > 0){self.triggerTapLimitTimer--;}

		if (self.firing > 0){
			self.firing--;
			
			//Hit detection
			if (self.liveShot){
				var hitTargets = [];
				var blockHitTargets = [];
				var organicHitTargets = [];
				for (var i in Player.list){
					var isHitTarget = checkIfInLineOfShot(self, Player.list[i]);
					if (isHitTarget && isHitTarget != false){
						hitTargets.push(isHitTarget);
						organicHitTargets.push(isHitTarget);
					}	
				}
				for (var i in Thug.list){
					var isHitTarget = checkIfInLineOfShot(self, Thug.list[i]);
					if (isHitTarget && isHitTarget != false){
						hitTargets.push(isHitTarget);
						organicHitTargets.push(isHitTarget);
					}	
				}					
				for (var i in Block.list){
					if (Block.list[i].type == "normal" || Block.list[i].type == "red" || Block.list[i].type == "blue"){
						var isHitTarget = checkIfInLineOfShot(self, Block.list[i]);
						if (isHitTarget && isHitTarget != false){
							hitTargets.push(isHitTarget);
							blockHitTargets.push(isHitTarget);
						}	
					}
				}				

				if (self.weapon == 4){
					var SGhitTargets = [];
					
					for (var t in organicHitTargets){
						var isBehindCover = false;
						for (var b in blockHitTargets){ 
							if (checkIfBlocking(blockHitTargets[b].target, self, organicHitTargets[t].target)){ //And see if it is blocking the shooter's path
								isBehindCover = true;
							}										
						}
						if (!isBehindCover){
							hit(organicHitTargets[t].target, self.shootingDir, organicHitTargets[t].dist, self.id);
							//Calculate blood effect if target is organic
							var bloodX = organicHitTargets[t].target.x;
							var bloodY = organicHitTargets[t].target.y;
							sprayBloodOntoTarget(self.shootingDir, bloodX, bloodY, organicHitTargets[t].target.id);
						}
					}
					var shotData = {};
					shotData.id = self.id;
					shotData.spark = false;
					shotData.distance = 10000;
					shotData.shootingDir = self.shootingDir;
					self.liveShot = false;
					for(var i in SOCKET_LIST){
						SOCKET_LIST[i].emit('shootUpdate',shotData);
					}	
				}
				else {
					//Out of all targets in line of shot, which is closest?				
					var hitTarget = getHitTarget(hitTargets);				
					if (hitTarget != null){
						//We officially have a hit on a specific target
						self.liveShot = false;
						hit(hitTarget, self.shootingDir, hitTarget.dist, self.id);					
						 
						if (hitTarget.team && hitTarget.health){
							//Calculate blood effect if target is organic
							var bloodX = hitTarget.x;
							var bloodY = hitTarget.y;
							if (self.shootingDir == 1){if (self.weapon != 4) bloodX = self.x;}
							if (self.shootingDir == 2){bloodX = hitTarget.x - hitTarget.distFromDiag/2; bloodY = hitTarget.y - hitTarget.distFromDiag/2;}
							if (self.shootingDir == 3){if (self.weapon != 4) bloodY = self.y;}
							if (self.shootingDir == 4){bloodX = hitTarget.x - hitTarget.distFromDiag/2; bloodY = hitTarget.y + hitTarget.distFromDiag/2;}
							if (self.shootingDir == 5){if (self.weapon != 4) bloodX = self.x;}
							if (self.shootingDir == 6){bloodX = hitTarget.x - hitTarget.distFromDiag/2; bloodY = hitTarget.y - hitTarget.distFromDiag/2;}
							if (self.shootingDir == 7){if (self.weapon != 4) bloodY = self.y;}
							if (self.shootingDir == 8){bloodX = hitTarget.x - hitTarget.distFromDiag/2; bloodY = hitTarget.y + hitTarget.distFromDiag/2;}
							sprayBloodOntoTarget(self.shootingDir, bloodX, bloodY, hitTarget.id);
						}
					}
					else {
						var shotData = {};
						shotData.id = self.id;
						shotData.spark = false;
						shotData.distance = bulletRange;
						self.liveShot = false;
						for(var i in SOCKET_LIST){
							SOCKET_LIST[i].emit('shootUpdate',shotData);
						}					
					}
				}
			}
		}
		/////////////////////// MULTIKILL ////////////////////
		if (self.multikillTimer > 0){
			self.multikillTimer--;
		}
		if (self.multikill > 0 && self.multikillTimer <= 0){
			self.multikill = 0;
		}

		/////////////////////// HEALING ////////////////////
		if (self.healDelay <= 0 && self.health < 100 && self.health > 0){
			self.health++;
			updatePlayerList.push({id:self.id,property:"health",value:self.health});
			if (self.health >= 100){
				self.lastEnemyToHit = 0;
			}
			self.healDelay += healRate;
		}
		if (self.healDelay > 0){self.healDelay--;}
		
	/////////////////////// ENERGY /////////////////////
		if (self.rechargeDelay <= 0 && self.energy < (100 * self.hasBattery)){
			self.energy++;
			if ((self.hasBattery > 1 && self.energy == 100) || (self.hasBattery > 2 && self.energy == 200) || (self.hasBattery > 3 && self.energy == 300) || (self.hasBattery > 4 && self.energy == 400))
				self.energy++; //Free extra energy at 100 if more than one battery to avoid stopping the charge sfx at 100 (normally 100 is "charge complete")
			if (self.hasBattery == 1 && self.energy > 100){
				self.energy = 100;
			}
			if (self.hasBattery == 2 && self.energy > 200){
				self.energy = 200;
			}
			updatePlayerList.push({id:self.id,property:"energy",value:self.energy});
		}
		if (self.rechargeDelay > 0){self.rechargeDelay--;}
		
		//boost decay
		if (self.boosting > 0){
			self.boosting = self.boosting - boostDecay;
			updatePlayerList.push({id:self.id,property:"boosting",value:self.boosting});
		}
		
	///////////////////////CLOAKING/////////////////////
	if (self.cloakEngaged && self.energy > 0){
		self.energy -= cloakDrainSpeed;
		if (self.energy < 0)
			self.energy = 0;
		updatePlayerList.push({id:self.id,property:"energy",value:self.energy});
		self.rechargeDelay = rechargeDelayTime;
	}
	if (self.cloakEngaged && self.energy > 0 && self.cloak < 1){
		self.cloak += cloakInitializeSpeed;
		if (self.cloak > 1)
			self.cloak = 1;
		self.cloak = Math.round(self.cloak * 100) / 100;
		updatePlayerList.push({id:self.id,property:"cloak",value:self.cloak});
	}
	else if ((!self.cloakEngaged || self.energy <= 0) && self.cloak > 0){
		self.cloak -= cloakDeinitializeSpeed;
		if (self.energy == 0){
			self.rechargeDelay = rechargeDelayTime * 2;
			self.cloakEngaged = false;
			updatePlayerList.push({id:self.id,property:"cloakEngaged",value:self.cloakEngaged});
		}		
		if (self.cloak < 0)
			self.cloak = 0;
		self.cloak = Math.round(self.cloak * 100) / 100;
		updatePlayerList.push({id:self.id,property:"cloak",value:self.cloak});
	}
		
	/////MOVEMENT //////////
		if (self.boosting <= 0){
			if(self.pressingW && !self.pressingS && !self.pressingD && !self.pressingA){
				self.speed = globalSpeed;
				if (self.stagger > 0){self.speed = self.speed * staggerScale;}
				if (self.cloakEngaged){self.speed = self.speed * cloakDrag;}
				else if (self.holdingBag){self.speed = self.speed * bagDrag;}
				self.y -= self.speed;
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
				if (self.walkingDir != 1){
					self.walkingDir = 1;
					updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
				}
			}
			else if(self.pressingD && !self.pressingS && !self.pressingW && !self.pressingA){
				self.speed = globalSpeed;
				if (self.stagger > 0){self.speed = self.speed * staggerScale}
				if (self.cloakEngaged){self.speed = self.speed * cloakDrag;}
				else if (self.holdingBag){self.speed = self.speed * bagDrag;}
				self.x += self.speed;
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				if (self.walkingDir != 3){
					self.walkingDir = 3;
					updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
				}
			}
			else if(self.pressingS && !self.pressingA && !self.pressingW && !self.pressingD){
				self.speed = globalSpeed;
				if (self.stagger > 0){self.speed = self.speed * staggerScale}
				if (self.cloakEngaged){self.speed = self.speed * cloakDrag;}
				else if (self.holdingBag){self.speed = self.speed * bagDrag;}
				self.y += self.speed;
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
				if (self.walkingDir != 5){
					self.walkingDir = 5;
					updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
				}
			}
			else if(self.pressingA && !self.pressingS && !self.pressingW && !self.pressingD){
				self.speed = globalSpeed;
				if (self.stagger > 0){self.speed = self.speed * staggerScale}
				if (self.cloakEngaged){self.speed = self.speed * cloakDrag;}
				else if (self.holdingBag){self.speed = self.speed * bagDrag;}
				self.x -= self.speed;
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				if (self.walkingDir != 7){
					self.walkingDir = 7;
					updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
				}
			}
			else if(self.pressingW && self.pressingD){
				self.speed = globalSpeed;
				if (self.stagger > 0){self.speed = self.speed * staggerScale}
				if (self.cloakEngaged){self.speed = self.speed * cloakDrag;}
				else if (self.holdingBag){self.speed = self.speed * bagDrag;}
				self.x += (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y -= (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
				if (self.walkingDir != 2){
					self.walkingDir = 2;
					updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
				}
			}
			else if(self.pressingD && self.pressingS){
				self.speed = globalSpeed;
				if (self.stagger > 0){self.speed = self.speed * staggerScale}
				if (self.cloakEngaged){self.speed = self.speed * cloakDrag;}
				else if (self.holdingBag){self.speed = self.speed * bagDrag;}
				self.x += (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y += (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
				if (self.walkingDir != 4){
					self.walkingDir = 4;
					updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
				}
			}
			else if(self.pressingA && self.pressingS){
				self.speed = globalSpeed;
				if (self.stagger > 0){self.speed = self.speed * staggerScale}
				if (self.cloakEngaged){self.speed = self.speed * cloakDrag;}
				else if (self.holdingBag){self.speed = self.speed * bagDrag;}
				self.x -= (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y += (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
				if (self.walkingDir != 6){
					self.walkingDir = 6;
					updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
				}
			}
			else if(self.pressingW && self.pressingA){
				self.speed = globalSpeed;
				if (self.stagger > 0){self.speed = self.speed * staggerScale}
				if (self.cloakEngaged){self.speed = self.speed * cloakDrag;}
				else if (self.holdingBag){self.speed = self.speed * bagDrag;}
				self.x -= (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y -= (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
				if (self.walkingDir != 8){
					self.walkingDir = 8;
					updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
				}
			}
			else if (!self.pressingW && !self.pressingA && !self.pressingS && !self.pressingD){
				if (self.walkingDir != 0){
					self.walkingDir = 0;
					updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
				}
			}
		}
		//Calculate boosting amount on player		
		else {
			if(self.boostingDir == 1){
				self.y -= self.speed + self.boosting;
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
			}
			else if(self.boostingDir == 3){
				self.x += self.speed + self.boosting;
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
			}
			else if(self.boostingDir == 5){
				self.y += self.speed + self.boosting;
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
			}
			else if(self.boostingDir == 7){
				self.x -= self.speed + self.boosting;
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
			}
			else if(self.boostingDir == 2){
				self.x += (self.speed + self.boosting) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y -= (self.speed + self.boosting) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
			}
			else if(self.boostingDir == 4){
				self.x += (self.speed + self.boosting) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y += (self.speed + self.boosting) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
			}
			else if(self.boostingDir == 6){
				self.x -= (self.speed + self.boosting) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y += (self.speed + self.boosting) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
			}
			else if(self.boostingDir == 8){
				self.x -= (self.speed + self.boosting) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y -= (self.speed + self.boosting) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
			}			
		}
		if (self.boosting < 0){
			self.boosting = 0;
			updatePlayerList.push({id:self.id,property:"boosting",value:self.boosting});
		}
		
		if (!self.pressingShift && self.walkingDir != 0 && self.aiming == 0 && !self.pressingUp && !self.pressingDown && !self.pressingLeft && !self.pressingRight && self.reloading <= 0){
			if (self.shootingDir != self.walkingDir){
				self.shootingDir = self.walkingDir;
				updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
			}
		} //default to shootingdir = walkingdir unless otherwise specified!

		if (self.speed < 0){self.speed = 0;}

		//Keep player from walls Edge detection. Walls.
		if (self.x > mapWidth - 5){self.x = mapWidth - 5; updatePlayerList.push({id:self.id,property:"x",value:self.x});} //right
		if (self.y > mapHeight - 5){self.y = mapHeight - 5; updatePlayerList.push({id:self.id,property:"y",value:self.y});} // bottom
		if (self.x < 5){self.x = 5; updatePlayerList.push({id:self.id,property:"x",value:self.x});} //left
		if (self.y < 5){self.y = 5; updatePlayerList.push({id:self.id,property:"y",value:self.y});} //top

		//For testing stuff off of walls i guess. Delete me someday!!!
		if (self.team == "black" && keepBlackPlayerFromWalls){
			if (self.x > mapWidth - 200){self.x = mapWidth - 200; updatePlayerList.push({id:self.id,property:"x",value:self.x});}
			if (self.y > mapHeight - 200){self.y = mapHeight - 200; updatePlayerList.push({id:self.id,property:"y",value:self.y});}
			if (self.x < 200){self.x = 200; updatePlayerList.push({id:self.id,property:"x",value:self.x});}
			if (self.y < 200){self.y = 200; updatePlayerList.push({id:self.id,property:"y",value:self.y});}
		}

		
		
		if (self.stagger > 0){self.stagger--;}
		//End MOVEMENT
	
		////////////////////// BEING PUSHED ///////////////////////////////////////////
		processEntityPush(self);

		///////////////////// COLLISION WITH OBSTACLES/PLAYERS /////////////////////////
		
		//Check collision with players
		for (var i in Player.list){
			if (Player.list[i].id != self.id  && Player.list[i].health > 0 && self.x + self.width > Player.list[i].x && self.x < Player.list[i].x + Player.list[i].width && self.y + self.height > Player.list[i].y && self.y < Player.list[i].y + Player.list[i].height){								
				if (self.x == Player.list[i].x && self.y == Player.list[i].y){self.x -= 5; updatePlayerList.push({id:self.id,property:"x",value:self.x});} //Added to avoid math issues when entities are directly on top of each other (distance = 0)
				var dx1 = self.x - Player.list[i].x;
				var dy1 = self.y - Player.list[i].y;
				var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
				var ax1 = dx1/dist1;
				var ay1 = dy1/dist1;
				if (dist1 < 40){				
					if (self.boosting > 0){
						Player.list[i].pushSpeed = 20;
						Player.list[i].pushDir = self.boostingDir;
						if (self.team != Player.list[i].team){
							Player.list[i].health -= 40;
						}
						self.pushSpeed = 20;
						self.boosting = -1;
						updatePlayerList.push({id:self.id,property:"boosting",value:self.boosting});
						
						//Assassinations
						if (self.boostingDir == 1){
							self.pushDir = 5;
							if ((Player.list[i].shootingDir == 1 || Player.list[i].shootingDir == 8 || Player.list[i].shootingDir == 2) && self.team != Player.list[i].team){
								Player.list[i].health = 0;
							}
						}
						else if (self.boostingDir == 2){
							self.pushDir = 6;
							if ((Player.list[i].shootingDir == 1 || Player.list[i].shootingDir == 2 || Player.list[i].shootingDir == 3) && self.team != Player.list[i].team){
								Player.list[i].health = 0;
							}
						}
						else if (self.boostingDir == 3){
							self.pushDir = 7;
							if ((Player.list[i].shootingDir == 2 || Player.list[i].shootingDir == 3 || Player.list[i].shootingDir == 4) && self.team != Player.list[i].team){
								Player.list[i].health = 0;
							}
						}
						else if (self.boostingDir == 4){
							self.pushDir = 8;
							if ((Player.list[i].shootingDir == 3 || Player.list[i].shootingDir == 4 || Player.list[i].shootingDir == 5) && self.team != Player.list[i].team){
								Player.list[i].health = 0;
							}
						}
						else if (self.boostingDir == 5){
							self.pushDir = 1;
							if ((Player.list[i].shootingDir == 4 || Player.list[i].shootingDir == 5 || Player.list[i].shootingDir == 6) && self.team != Player.list[i].team){
								Player.list[i].health = 0;
							}
						}
						else if (self.boostingDir == 6){
							self.pushDir = 2;
							if ((Player.list[i].shootingDir == 5 || Player.list[i].shootingDir == 6 || Player.list[i].shootingDir == 7) && self.team != Player.list[i].team){
								Player.list[i].health = 0;
							}
						}
						else if (self.boostingDir == 7){
							self.pushDir = 3;
							if ((Player.list[i].shootingDir == 6 || Player.list[i].shootingDir == 7 || Player.list[i].shootingDir == 8) && self.team != Player.list[i].team){
								Player.list[i].health = 0;
							}
						}
						else if (self.boostingDir == 8){
							self.pushDir = 4;
							if ((Player.list[i].shootingDir == 7 || Player.list[i].shootingDir == 8 || Player.list[i].shootingDir == 1) && self.team != Player.list[i].team){
								Player.list[i].health = 0;
							}
						}
						updatePlayerList.push({id:Player.list[i].id,property:"health",value:Player.list[i].health})
						Player.list[i].healDelay = healDelayTime;
						sprayBloodOntoTarget(self.boostingDir, Player.list[i].x, Player.list[i].y, Player.list[i].id);
						if (Player.list[i].health <= 0){
							kill(Player.list[i], self.shootingDir, self.id);
						}

					}
					
					self.x += ax1 / (dist1 / 70); //Higher number is greater push
					updatePlayerList.push({id:self.id,property:"x",value:self.x})
					self.y += ay1 / (dist1 / 70);
					updatePlayerList.push({id:self.id,property:"y",value:self.y});
				}
			}
		}
	
		//Check collision with thugs
		for (var i in Thug.list){
			if (Thug.list[i].id != self.id && Thug.list[i].health > 0 && self.x + self.width > Thug.list[i].x && self.x < Thug.list[i].x + Thug.list[i].width && self.y + self.height > Thug.list[i].y && self.y < Thug.list[i].y + Thug.list[i].height){								
				if (self.x == Thug.list[i].x && self.y == Thug.list[i].y){self.x -= 5; updateThugList.push({id:self.id,property:"x",value:self.x});} //Added to avoid math issues when entities are directly on top of each other (distance = 0)
				var dx1 = self.x - Thug.list[i].x;
				var dy1 = self.y - Thug.list[i].y;
				var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
				var ax1 = dx1/dist1;
				var ay1 = dy1/dist1;
				if (dist1 < 40){		

					if (self.boosting > 0){
						self.pushSpeed = 20;
						self.boosting = -1;
						updatePlayerList.push({id:self.id,property:"boosting",value:self.boosting});
						
						if (self.team != Thug.list[i].team){
							Thug.list[i].health -= 40;
							updateThugList.push({id:Thug.list[i].id,property:"health",value:Thug.list[i].health})
							sprayBloodOntoTarget(self.boostingDir, Thug.list[i].x, Thug.list[i].y, Thug.list[i].id);
							Thug.list[i].attacking = thugAttackDelay;
							if (Thug.list[i].health <= 0){
								kill(Thug.list[i], 1, self.id);
							}
						}
					}
				
					self.x += ax1 / (dist1 / 70); //Higher number is greater push
					updatePlayerList.push({id:self.id,property:"x",value:self.x})
					self.y += ay1 / (dist1 / 70);
					updatePlayerList.push({id:self.id,property:"y",value:self.y});
				}				
			}
		}
		
		//Check Player collision with blocks
		for (var i in Block.list){
			if (self.x > Block.list[i].x && self.x < Block.list[i].x + Block.list[i].width && self.y > Block.list[i].y && self.y < Block.list[i].y + Block.list[i].height){												
				if (Block.list[i].type == "normal" || Block.list[i].type == "red" || Block.list[i].type == "blue"){
					var overlapTop = Math.abs(Block.list[i].y - self.y);  
					var overlapBottom = Math.abs((Block.list[i].y + Block.list[i].height) - self.y);
					var overlapLeft = Math.abs(self.x - Block.list[i].x);
					var overlapRight = Math.abs((Block.list[i].x + Block.list[i].width) - self.x);			
					if (overlapTop <= overlapBottom && overlapTop <= overlapRight && overlapTop <= overlapLeft){	
						self.y = Block.list[i].y - 1;
						updatePlayerList.push({id:self.id,property:"y",value:self.y});
					}
					else if (overlapBottom <= overlapTop && overlapBottom <= overlapRight && overlapBottom <= overlapLeft){
						self.y = Block.list[i].y + Block.list[i].height + 1;
						updatePlayerList.push({id:self.id,property:"y",value:self.y});
					}
					else if (overlapLeft <= overlapTop && overlapLeft <= overlapRight && overlapLeft <= overlapBottom){
						self.x = Block.list[i].x - 1;
						updatePlayerList.push({id:self.id,property:"x",value:self.x});
					}
					else if (overlapRight <= overlapTop && overlapRight <= overlapLeft && overlapRight <= overlapBottom){
						self.x = Block.list[i].x + Block.list[i].width + 1;
						updatePlayerList.push({id:self.id,property:"x",value:self.x});
					}
				}
				else if (Block.list[i].type == "pushUp"){
					self.y -= pushStrength;
					if (self.y < Block.list[i].y){self.y = Block.list[i].y;}
					updatePlayerList.push({id:self.id,property:"y",value:self.y});
				}
				else if (Block.list[i].type == "pushRight"){
					self.x += pushStrength;
					if (self.x > Block.list[i].x + Block.list[i].width){self.x = Block.list[i].x + Block.list[i].width;}
					updatePlayerList.push({id:self.id,property:"x",value:self.x});
				}
				else if (Block.list[i].type == "pushDown"){
					self.y += pushStrength;
					if (self.y > Block.list[i].y + Block.list[i].height){self.y = Block.list[i].y + Block.list[i].height;}
					updatePlayerList.push({id:self.id,property:"y",value:self.y});
				}
				else if (Block.list[i].type == "pushLeft"){
					self.x -= pushStrength;
					if (self.x < Block.list[i].x){self.x = Block.list[i].x;}
					updatePlayerList.push({id:self.id,property:"x",value:self.x});
				}

			}// End check if player is overlapping block
		}//End Block.list loop		
		
		//Pickup updates
		for (var i in Pickup.list){
			if (self.health > 0 && self.x > Pickup.list[i].x - 30 && self.x < Pickup.list[i].x + Pickup.list[i].width + 30 && self.y > Pickup.list[i].y - 30 && self.y < Pickup.list[i].y + Pickup.list[i].height + 30 && Pickup.list[i].respawnTimer == 0){
				pickupPickup(self.id, Pickup.list[i].id);
			}
		}			
		
		//Check Player collision with bag - STEAL
		if (gametype == "ctf"){
			if (self.team == "white" && bagBlue.captured == false && self.health > 0 && bagBlue.playerThrowing != self.id){
				if (self.x > bagBlue.x - 67 && self.x < bagBlue.x + 67 && self.y > bagBlue.y - 50 && self.y < bagBlue.y + 50){												
					bagBlue.captured = true;
					bagBlue.speed = 0;
					updateMisc.bagBlue = bagBlue;
					self.holdingBag = true;
					updatePlayerList.push({id:self.id,property:"holdingBag",value:self.holdingBag});
					if (!allowBagWeapons){
						self.weapon = 1;
						updatePlayerList.push({id:self.id,property:"weapon",value:self.weapon});
						if (self.reloading > 0){
							self.reloading = 0;
							updatePlayerList.push({id:self.id,property:"reloading",value:self.reloading});				
						}					
					}
					if (bagBlue.x == bagBlue.homeX && bagBlue.y == bagBlue.homeY){
						playerEvent(self.id, "steal");
					}
				}
			}
			else if (self.team == "black" && bagRed.captured == false && self.health > 0 && bagRed.playerThrowing != self.id){
				if (self.x > bagRed.x - 67 && self.x < bagRed.x + 67 && self.y > bagRed.y - 50 && self.y < bagRed.y + 50){												
					bagRed.captured = true;
					bagRed.speed = 0;
					updateMisc.bagRed = bagRed;
					self.holdingBag = true;
					updatePlayerList.push({id:self.id,property:"holdingBag",value:self.holdingBag});
					if (!allowBagWeapons){
						self.weapon = 1;
						updatePlayerList.push({id:self.id,property:"weapon",value:self.weapon});
						if (self.reloading > 0){
							self.reloading = 0;
							updatePlayerList.push({id:self.id,property:"reloading",value:self.reloading});				
						}					
					}
					if (bagRed.x == bagRed.homeX && bagRed.y == bagRed.homeY){
						playerEvent(self.id, "steal");					
					}
				}
			}

			//Check Player collision with bag - RETURN
			if (self.team == "white" && bagRed.captured == false && self.health > 0 && (bagRed.x != bagRed.homeX || bagRed.y != bagRed.homeY)){
				if (self.x > bagRed.x - 67 && self.x < bagRed.x + 67 && self.y > bagRed.y - 50 && self.y < bagRed.y + 50){			
					playerEvent(self.id, "return");
					bagRed.x = bagRed.homeX;
					bagRed.y = bagRed.homeY;
					bagRed.speed = 0;
					updateMisc.bagRed = bagRed;		
				}
			}
			if (self.team == "black" && bagBlue.captured == false && self.health > 0 && (bagBlue.x != bagBlue.homeX || bagBlue.y != bagBlue.homeY)){
				if (self.x > bagBlue.x - 67 && self.x < bagBlue.x + 67 && self.y > bagBlue.y - 50 && self.y < bagBlue.y + 50){												
					playerEvent(self.id, "return");
					bagBlue.x = bagBlue.homeX;
					bagBlue.y = bagBlue.homeY;
					bagBlue.speed = 0;
					updateMisc.bagBlue = bagBlue;
				}
			}

			//Check Player collision with bag - CAPTURE
			if (gameOver == false){
				if (self.team == "white" && self.holdingBag == true && bagRed.captured == false && self.health > 0 && (bagRed.x == bagRed.homeX && bagRed.y == bagRed.homeY)){
					if (self.x > bagRed.homeX - 67 && self.x < bagRed.homeX + 67 && self.y > bagRed.homeY - 50 && self.y < bagRed.homeY + 50){												
						//Bag Score
						playerEvent(self.id, "capture");
						capture("white");
					}
				}
				if (self.team == "black" && self.holdingBag == true && bagBlue.captured == false && self.health > 0 && (bagBlue.x == bagBlue.homeX && bagBlue.y == bagBlue.homeY)){
					if (self.x > bagBlue.homeX - 67 && self.x < bagBlue.homeX + 67 && self.y > bagBlue.homeY - 50 && self.y < bagBlue.homeY + 50){												
						//Bag Score
						playerEvent(self.id, "capture");
						capture("black");
					}
				}
			}
			
			//Move bag with player
			if (self.holdingBag == true && self.health > 0){
				if (self.team == "black"){
					bagRed.x = self.x;
					bagRed.y = self.y;				
					updateMisc.bagRed = bagRed;
				}
				else if (self.team == "white"){
					bagBlue.x = self.x;
					bagBlue.y = self.y;				
					updateMisc.bagBlue = bagBlue;
				}
			}
		}//End check if gametype is ctf
		
		////// RELOADING ///////////////////////////////////////////////////////////////////////////
		if (self.reloading > 0){
			self.reloading--;
			if (self.reloading <= 0) {
				if (self.weapon == 1){
					self.PClip = 15;
					updatePlayerList.push({id:self.id,property:"PClip",value:self.PClip});
				}
				else if (self.weapon == 2){
					var clipNeeds = DPClipSize - self.DPClip;
					if (self.DPAmmo >= clipNeeds){
						self.DPClip = DPClipSize;
						self.DPAmmo -= clipNeeds;
					}
					else {
						self.DPClip += self.DPAmmo;
						self.DPAmmo = 0;
					}
					updatePlayerList.push({id:self.id,property:"DPClip",value:self.DPClip});
					updatePlayerList.push({id:self.id,property:"DPAmmo",value:self.DPAmmo});
				}
				else if (self.weapon == 3){
					var clipNeeds = MGClipSize - self.MGClip;
					if (self.MGAmmo >= clipNeeds){
						self.MGClip = MGClipSize;
						self.MGAmmo -= clipNeeds;
					}
					else {
						self.MGClip += self.MGAmmo;
						self.MGAmmo = 0;
					}
					updatePlayerList.push({id:self.id,property:"MGClip",value:self.MGClip});
					updatePlayerList.push({id:self.id,property:"MGAmmo",value:self.MGAmmo});
				}
				else if (self.weapon == 4){
					var clipNeeds = SGClipSize - self.SGClip;
					if (self.SGAmmo >= 1 && clipNeeds >= 1){
						self.SGClip++;
						self.SGAmmo--;						
					}
					if (clipNeeds >= 2 && self.SGAmmo > 0){
						self.reloading = 30;
						updatePlayerList.push({id:self.id,property:"reloading",value:self.reloading});
					}
					updatePlayerList.push({id:self.id,property:"SGClip",value:self.SGClip});
					updatePlayerList.push({id:self.id,property:"SGAmmo",value:self.SGAmmo});
				}
			}
		}		
		////////////AFK/MISC///////////////////
		if (typeof self.afk === 'undefined'){
		 self.afk = AfkFramesAllowed;
		}
		else if (self.afk >= 0 && self.team != "none"){
			self.afk--;
		}
		else { //Boot em
			socket.emit('reloadHomePage');
			socket.disconnect();
		}
		
	}//End engine()

	self.respawn = function(){
		updatePlayerList.push({id:self.id,property:"name",value:self.name});
		self.health = 100;
		updatePlayerList.push({id:self.id,property:"health",value:self.health});
		self.energy = 100;
		updatePlayerList.push({id:self.id,property:"energy",value:self.energy});
		self.cloak = 0;
		updatePlayerList.push({id:self.id,property:"cloak",value:self.cloak});		
		self.cloakEngaged = false;
		updatePlayerList.push({id:self.id,property:"cloakEngaged",value:self.cloakEngaged});		
		self.boosting = 0;
		updatePlayerList.push({id:self.id,property:"boosting",value:self.boosting});
		self.boostingDir = 0;
		self.rechargeDelay = 0;
		self.healDelay = 0;

		self.speed = 0;
		self.stagger = 0;
		self.hasBattery = 1;
		self.respawnTimer = 0;
		self.pushSpeed = 0;		
		self.spree = 0;
		self.multikill = 0;
		self.multikillTimer = 0;
		
		self.firing = 0; //0-3; 0 = not firing
		self.aiming = 0;
		self.liveShot = false; ////!! This variable may not need to exist, it never gets set to false when missing a target
		self.respawnTimer = 0;
		self.holdingBag = false;
		updatePlayerList.push({id:self.id,property:"holdingBag",value:self.holdingBag});
		self.weapon = 1;
		updatePlayerList.push({id:self.id,property:"weapon",value:self.weapon});
		self.PClip = 15;
		updatePlayerList.push({id:self.id,property:"PClip",value:self.PClip});
		self.DPClip = 0;
		updatePlayerList.push({id:self.id,property:"DPClip",value:self.DPClip});
		self.MGClip = 0;
		updatePlayerList.push({id:self.id,property:"MGClip",value:self.MGClip});
		self.SGClip = 0;
		updatePlayerList.push({id:self.id,property:"SGClip",value:self.SGClip});
		self.DPAmmo = 0;
		updatePlayerList.push({id:self.id,property:"DPAmmo",value:self.DPAmmo});
		self.MGAmmo = 0;
		updatePlayerList.push({id:self.id,property:"MGAmmo",value:self.MGAmmo});
		self.SGAmmo = 0;		
		updatePlayerList.push({id:self.id,property:"SGAmmo",value:self.SGAmmo});
		self.fireRate = 0;
		self.triggerTapLimitTimer = 0;
		self.reloading = 0;
		
		self.pressingUp = false;
		self.pressingRight = false;
		self.pressingDown = false;
		self.pressingLeft = false;
		self.pressingW = false;
		self.pressingD = false;
		self.pressingS = false;		
		self.pressingA = false;
		self.pressingShift = false;					
							
		spawnSafely(self);
		updatePlayerList.push({id:self.id,property:"y",value:self.y});
		updatePlayerList.push({id:self.id,property:"x",value:self.x});
		
						
		//Send Full Game Status To Individual Player
		var playerPack = [];
		var thugPack = [];
		var blockPack = [];
		var pickupPack = [];
		var miscPack = {};

		for (var a in Player.list){
			var player = {
				id:Player.list[a].id,
				name:Player.list[a].name,
				x:Player.list[a].x,
				y:Player.list[a].y,
				health:Player.list[a].health,
				energy:Player.list[a].energy,
				cloak:Player.list[a].cloak,
				cloakEngaged:Player.list[a].cloakEngaged,
				boosting:Player.list[a].boosting,
				walkingDir:Player.list[a].walkingDir,				
				shootingDir:Player.list[a].shootingDir,				
				holdingBag:Player.list[a].holdingBag,				
				team:Player.list[a].team,	
				weapon:Player.list[a].weapon,	
				PClip:Player.list[a].DPClip,	
				DPClip:Player.list[a].DPClip,	
				MGClip:Player.list[a].MGClip,	
				SGClip:Player.list[a].SGClip,	
				DPAmmo:Player.list[a].DPAmmo,	
				MGAmmo:Player.list[a].MGAmmo,	
				SGAmmo:Player.list[a].SGAmmo,	
				reloading:Player.list[a].reloading,
				
				cash:Player.list[a].cash,
				cashEarnedThisGame:Player.list[a].cashEarnedThisGame,
				kills:Player.list[a].kills,
				deaths:Player.list[a].deaths,
				steals:Player.list[a].steals,
				returns:Player.list[a].returns,
				captures:Player.list[a].captures,	
				chat:"",
				chatDecay:0,
			};
			playerPack.push(player);
		}
		for (var b in Thug.list){
			var thug = {
				id:Thug.list[b].id,
				x:Thug.list[b].x,
				y:Thug.list[b].y,
				health:Thug.list[b].health,
				team:Thug.list[b].team,
				rotation:Thug.list[b].rotation,
			};
			thugPack.push(thug);
		}
		for (var b in Block.list){
			blockPack.push(Block.list[b]);
		}
		for (var p in Pickup.list){
			var pickup = {
				id:Pickup.list[p].id,
				x:Pickup.list[p].x,
				y:Pickup.list[p].y,
				type:Pickup.list[p].type,
				amount:Pickup.list[p].amount,
				respawnTimer:Pickup.list[p].respawnTimer,
			};			
			pickupPack.push(pickup);
		}
		
		var size = Object.size(Player.list);			
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
		socket.emit('updateInit', playerPack, thugPack, pickupPack, blockPack, miscPack); //Goes to a single player //!!!! Questionable. This might overload stack
	}
	
	Player.list[id] = self;

	logg("Player " + self.name + " has entered the game.");
	var teamName = self.team;
	if (pcMode){
		if (self.team == "white"){
			teamName = "red";
		}
		else if (self.team == "black"){
			teamName = "blue";
		}
	}
	if (teamName != "none")
		sendChatToAll(self.name + " has joined the " + teamName + " team!");
		
	socket.emit('sendPlayerNameToClient',self.name);
	
	self.respawn();
	
	return self;
} //End Player function

Player.list = [];

function gunCycle(player){
	if (player.reloading > 0){
		player.reloading = 0;
		updatePlayerList.push({id:player.id,property:"reloading",value:player.reloading});				
	}
	if (player.weapon == 1){
		if (player.DPAmmo > 0 || player.DPClip > 0) {
			if (player.holdingBag == true && !allowBagWeapons) {
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sfx
			}
			else {
				player.weapon = 2;
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});						
			}
		}
		else if (player.MGAmmo > 0 || player.MGClip > 0){
			if (player.holdingBag == true && !allowBagWeapons) {
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sfx
			}
			else {
				player.weapon = 3;
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
			}
		}
		else if (player.SGAmmo > 0 || player.SGClip > 0){
			if (player.holdingBag == true && !allowBagWeapons) {
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sg equip sfx
			}
			else {
				player.weapon = 4;
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
			}
		}	
		else {
			player.weapon = 1;
			updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
		}		
	}
	else if (player.weapon == 2){
		if (player.MGAmmo > 0 || player.MGClip > 0){
			if (player.holdingBag == true && !allowBagWeapons) {
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sfx
			}
			else {
				player.weapon = 3;
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
			}
		}
		else if (player.SGAmmo > 0 || player.SGClip > 0){
			if (player.holdingBag == true && !allowBagWeapons) {
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sg equip sfx
			}
			else {
				player.weapon = 4;
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
			}
		}
		else {
			player.weapon = 1;
			updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
		}		
	}	
	else if (player.weapon == 3){
		if (player.SGAmmo > 0 || player.SGClip > 0){
			if (player.holdingBag == true && !allowBagWeapons) {
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sg equip sfx
			}
			else {
				player.weapon = 4;
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
			}
		}
		else {
			player.weapon = 1;
			updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
		}		
	}		
	else if (player.weapon == 4){
		player.weapon = 1;
		updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
	}		
	else {
		player.weapon = 1;
		updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
	}
}

function gunSwap(player){
	if (player.reloading > 0){
		player.reloading = 0;
		updatePlayerList.push({id:player.id,property:"reloading",value:player.reloading});				
	}
	if (player.weapon == 1){
		if (player.SGAmmo > 0 || player.SGClip > 0){
			if (player.holdingBag == true && !allowBagWeapons) {
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sg equip sfx
			}
			else {
				player.weapon = 4;
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
			}
		}
		else if (player.MGAmmo > 0 || player.MGClip > 0){
			if (player.holdingBag == true && !allowBagWeapons) {
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sfx
			}
			else {
				player.weapon = 3;
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
			}
		}
		else if (player.DPAmmo > 0 || player.DPClip > 0) {
			if (player.holdingBag == true && !allowBagWeapons) {
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sfx
			}
			else {
				player.weapon = 2;
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});						
			}
		}
	}
	else {
		player.weapon = 1;
		updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
	}
}

Player.onConnect = function(socket, cognitoSub, name, team){
	var player = Player(socket.id, cognitoSub, name, team);
	ensureCorrectThugCount();

	socket.on('keyPress', function(data){
		if (!Player.list[socket.id]){
			return;
		}
		else {
			Player.list[socket.id].afk = AfkFramesAllowed;
		}
		if (player.health > 0 && player.team != "none"){
			var discharge = false;
			if(data.inputId === 87){player.pressingW = data.state;}
			else if(data.inputId === 68){player.pressingD = data.state;}
			else if(data.inputId === 83){player.pressingS = data.state;}
			else if(data.inputId === 65){player.pressingA = data.state;}
			
			else if(data.inputId === 38){ //Up
				if (player.pressingUp === false){
					if (!player.pressingShift){
						discharge = true;
					}
					if (player.pressingLeft == true && player.pressingRight == false){player.shootingDir = 8; updatePlayerList.push({id:player.id,property:"shootingDir",value:player.shootingDir});}				
					if (player.pressingLeft == false && player.pressingRight == false){player.shootingDir = 1; updatePlayerList.push({id:player.id,property:"shootingDir",value:player.shootingDir});}
					if (player.pressingLeft == false && player.pressingRight == true){player.shootingDir = 2; updatePlayerList.push({id:player.id,property:"shootingDir",value:player.shootingDir});}
				}
				player.pressingUp = data.state;
			}
			else if(data.inputId === 39){ //Right
				if (player.pressingRight === false){
					if (!player.pressingShift){
						discharge = true;
					}
					if (player.pressingUp == true && player.pressingDown == false){player.shootingDir = 2; updatePlayerList.push({id:player.id,property:"shootingDir",value:player.shootingDir});}				
					if (player.pressingUp == false && player.pressingDown == false){player.shootingDir = 3; updatePlayerList.push({id:player.id,property:"shootingDir",value:player.shootingDir});}
					if (player.pressingUp == false && player.pressingDown == true){player.shootingDir = 4; updatePlayerList.push({id:player.id,property:"shootingDir",value:player.shootingDir});}
				}
				player.pressingRight = data.state;
			}
			else if(data.inputId === 40){ //Down
				if (player.pressingDown === false){
					if (!player.pressingShift){
						discharge = true;
					}
					if (player.pressingLeft == false && player.pressingRight == true){player.shootingDir = 4; updatePlayerList.push({id:player.id,property:"shootingDir",value:player.shootingDir});}
					if (player.pressingLeft == false && player.pressingRight == false){player.shootingDir = 5; updatePlayerList.push({id:player.id,property:"shootingDir",value:player.shootingDir});}
					if (player.pressingLeft == true && player.pressingRight == false){player.shootingDir = 6; updatePlayerList.push({id:player.id,property:"shootingDir",value:player.shootingDir});}				
				}
				player.pressingDown = data.state;
			}
			else if(data.inputId === 37){ //Left
				if (player.pressingLeft === false){
					if (!player.pressingShift){
						discharge = true;
					}
					if (player.pressingUp == false && player.pressingDown == true){player.shootingDir = 6; updatePlayerList.push({id:player.id,property:"shootingDir",value:player.shootingDir});}
					if (player.pressingUp == false && player.pressingDown == false){player.shootingDir = 7; updatePlayerList.push({id:player.id,property:"shootingDir",value:player.shootingDir});}
					if (player.pressingUp == true && player.pressingDown == false){player.shootingDir = 8; updatePlayerList.push({id:player.id,property:"shootingDir",value:player.shootingDir});}
				}
				player.pressingLeft = data.state;
			}	
			else if(data.inputId === 32){ //SPACE
				if ((player.pressingW || player.pressingD || player.pressingS || player.pressingA) && player.energy > 0 && player.boosting <= 0 && player.holdingBag == false){
					if (player.cloakEngaged){
						player.cloakEngaged = false;						
						updatePlayerList.push({id:player.id,property:"cloakEngaged",value:player.cloakEngaged});	
					}
					player.boosting = boostAmount;
					updatePlayerList.push({id:player.id,property:"boosting",value:player.boosting});
					player.rechargeDelay = rechargeDelayTime;
					player.energy -= 25;
					if (player.energy <= 0){
						player.rechargeDelay = rechargeDelayTime * 2;
						player.energy = 0;
					}
					if (player.hasBattery > 1 && player.energy == 100)
					player.energy--; //To avoid having bar appear white when more than one battery
					updatePlayerList.push({id:player.id,property:"energy",value:player.energy});
					player.boostingDir = player.walkingDir;
					updateEffectList.push({type:3,playerId:player.id});
				}
				else if (player.holdingBag == true && player.walkingDir != 0){
					player.holdingBag = false;
					gunSwap(player);
					if (player.energy > 0){
						player.rechargeDelay = rechargeDelayTime;
						player.energy = 1;
						updatePlayerList.push({id:player.id,property:"energy",value:player.energy});
					}
					if (player.cloakEngaged){
						player.cloakEngaged = false;						
						updatePlayerList.push({id:player.id,property:"cloakEngaged",value:player.cloakEngaged});
					}
					updatePlayerList.push({id:player.id,property:"holdingBag",value:player.holdingBag});	
					if (player.team == "white"){
						bagBlue.captured = false;
						updateMisc.bagBlue = bagBlue;
						bagBlue.playerThrowing = player.id;
						bagBlue.speed = 25;
						bagBlue.direction = player.walkingDir;
					}
					else if (player.team == "black"){
						bagRed.captured = false;
						updateMisc.bagRed = bagRed;
						bagRed.playerThrowing = player.id;
						bagRed.speed = 25;
						bagRed.direction = player.walkingDir;
					}
				}
				else if ((!player.pressingW && !player.pressingD && !player.pressingS && !player.pressingA) && player.energy > 0){
					if (!player.cloakEngaged){
						player.cloakEngaged = true;
						SOCKET_LIST[player.id].emit('sfx', "sfxCloak");
					}
					else if (player.cloakEngaged){
						player.cloakEngaged = false;
					}
					updatePlayerList.push({id:player.id,property:"cloakEngaged",value:player.cloakEngaged});	
				}
				else {
					//no energy
				}
			}
			else if (data.inputId == 81){ //Q
				gunCycle(player);
			}
			else if (data.inputId == 82){ //R (or Ctrl)
				reload(player.id);
			}

			else if (data.inputId == 16){ //Shift
				player.pressingShift = data.state;
			}
			else if (data.inputId == 49){ //1
				if (player.weapon != 1){
					if (player.reloading > 0){
						player.reloading = 0;
						updatePlayerList.push({id:player.id,property:"reloading",value:player.reloading});				
					}
					player.weapon = 1;
					updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
				}
			}
			else if (data.inputId == 50){ //2
				if ((player.DPAmmo > 0 || player.DPClip > 0) && player.weapon != 2) {
					if (player.reloading > 0){
						player.reloading = 0;
						updatePlayerList.push({id:player.id,property:"reloading",value:player.reloading});				
					}					
					if (player.holdingBag == true && !allowBagWeapons) {
						updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sfx
					}
					else {
						player.weapon = 2;
						updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});						
					}
				}
			}
			else if (data.inputId == 51){ //3
				
				if ((player.MGAmmo > 0 || player.MGClip > 0) && player.weapon != 3) {
					if (player.reloading > 0){
						player.reloading = 0;
						updatePlayerList.push({id:player.id,property:"reloading",value:player.reloading});				
					}
					if (player.holdingBag == true && !allowBagWeapons) {
						updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sfx
					}
					else {
						player.weapon = 3;
						updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});						
					}
				}
			}
			else if (data.inputId == 52){ //4
				
				if ((player.SGAmmo > 0 || player.SGClip > 0) && player.weapon != 4) {
					if (player.reloading > 0){
						player.reloading = 0;
						updatePlayerList.push({id:player.id,property:"reloading",value:player.reloading});				
					}
					if (player.holdingBag == true && !allowBagWeapons) {
						updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play pistol sfx
					}
					else {
						player.weapon = 4;
						updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});						
					}
				}
			}
			//TESTING KEY
			else if (data.inputId == 85){ //U (TESTING BUTTON) 
			
			/* hurt player
				player.health -= 10;
				player.healDelay = 300;
				updatePlayerList.push({id:player.id,property:"health",value:player.health});\
			*/				
			}

			if (discharge){
				player.aiming = 60;
				Discharge(player);				
			}
				
		}//End health > 0 check for allowing input		
	}); //End Socket on Keypress
	
	
	//ping
	socket.on('pingServer', function(socketId){
		socket.emit('pingResponse', socketId);
	});
	
	socket.on('purchase', function(data){
		if (data.selection == 1 && Player.list[data.playerId].cash >= shop.price1){
			Player.list[data.playerId].cash -= shop.price1;
			updatePlayerList.push({id:data.playerId,property:"cash",value:Player.list[data.playerId].cash});								
			Player.list[data.playerId].weapon = 3;
			updatePlayerList.push({id:data.playerId,property:"weapon",value:Player.list[data.playerId].weapon});								
			if (Player.list[data.playerId].MGClip <= 0 && Player.list[data.playerId].MGAmmo <= 0){
				Player.list[data.playerId].MGClip += 30;
				Player.list[data.playerId].MGAmmo += 30;
				updatePlayerList.push({id:data.playerId,property:"MGClip",value:Player.list[data.playerId].MGClip});								
				updatePlayerList.push({id:data.playerId,property:"MGAmmo",value:Player.list[data.playerId].MGAmmo});								
			}
			else {
				Player.list[data.playerId].MGAmmo += 60;
				updatePlayerList.push({id:data.playerId,property:"MGAmmo",value:Player.list[data.playerId].MGAmmo});								
			}
		}		
		else if (data.selection == 2 && Player.list[data.playerId].cash >= shop.price2){
			Player.list[data.playerId].cash -= shop.price2;
			updatePlayerList.push({id:data.playerId,property:"cash",value:Player.list[data.playerId].cash});								
			Player.list[data.playerId].weapon = 4;
			updatePlayerList.push({id:data.playerId,property:"weapon",value:Player.list[data.playerId].weapon});								
			if (Player.list[data.playerId].SGClip <= 0 && Player.list[data.playerId].SGAmmo <= 0){
				Player.list[data.playerId].SGClip += 12;
				Player.list[data.playerId].SGAmmo += 24;
				updatePlayerList.push({id:data.playerId,property:"SGClip",value:Player.list[data.playerId].SGClip});								
				updatePlayerList.push({id:data.playerId,property:"SGAmmo",value:Player.list[data.playerId].SGAmmo});								
			}
			else {
				Player.list[data.playerId].SGAmmo += 36;
				updatePlayerList.push({id:data.playerId,property:"SGAmmo",value:Player.list[data.playerId].SGAmmo});								
			}
		}		
		else if (data.selection == 3 && Player.list[data.playerId].cash >= shop.price3){
			Player.list[data.playerId].cash -= shop.price3;
			updatePlayerList.push({id:data.playerId,property:"cash",value:Player.list[data.playerId].cash});								
			Player.list[data.playerId].weapon = 2;
			updatePlayerList.push({id:data.playerId,property:"weapon",value:Player.list[data.playerId].weapon});								
			if (Player.list[data.playerId].DPClip <= 0 && Player.list[data.playerId].DPAmmo <= 0){
				Player.list[data.playerId].DPClip += 20;
				Player.list[data.playerId].DPAmmo += 20;
				updatePlayerList.push({id:data.playerId,property:"DPClip",value:Player.list[data.playerId].DPClip});								
				updatePlayerList.push({id:data.playerId,property:"DPAmmo",value:Player.list[data.playerId].DPAmmo});								
			}
			else {
				Player.list[data.playerId].DPAmmo += 40;
				updatePlayerList.push({id:data.playerId,property:"DPAmmo",value:Player.list[data.playerId].DPAmmo});								
			}
		}		
		else if (data.selection == 4 && Player.list[data.playerId].cash >= shop.price4){
			Player.list[data.playerId].cash -= shop.price4;
			updatePlayerList.push({id:data.playerId,property:"cash",value:Player.list[data.playerId].cash});								
			Player.list[data.playerId].health += 75;
			if (Player.list[data.playerId].health > 175){
				Player.list[data.playerId].health = 175;
			}
			updatePlayerList.push({id:data.playerId,property:"health",value:Player.list[data.playerId].health});								
		}		
		else if (data.selection == 5 && Player.list[data.playerId].cash >= shop.price5 && Player.list[data.playerId].hasBattery < 5){
			Player.list[data.playerId].cash -= shop.price5;
			updatePlayerList.push({id:data.playerId,property:"cash",value:Player.list[data.playerId].cash});								
			Player.list[data.playerId].hasBattery += 1;
		}		
		
	});
	
}//End Player.onConnect

function pickupPickup(playerId, pickupId){
	if (Pickup.list[pickupId].type == 1){
		if (Player.list[playerId].health < 100){
			Player.list[playerId].health += Pickup.list[pickupId].amount;
			if (Player.list[playerId].health > 100){
				Player.list[playerId].health = 100;
			}
			updatePlayerList.push({id:playerId,property:"health",value:Player.list[playerId].health});											
			SOCKET_LIST[playerId].emit('sfx', "sfxHealthPackGrab");
			removePickup(pickupId);
		}
		else {
			return;
		}
	}
	else if (Pickup.list[pickupId].type == 2){
		if (Player.list[playerId].holdingBag == false && Player.list[playerId].weapon == 1){
			if (Player.list[playerId].reloading > 0){
				Player.list[playerId].reloading = 0;
				updatePlayerList.push({id:playerId,property:"reloading",value:Player.list[playerId].reloading});				
			}
			Player.list[playerId].weapon = 2;
			updatePlayerList.push({id:playerId,property:"weapon",value:Player.list[playerId].weapon});	
		}
		else {
			SOCKET_LIST[playerId].emit('sfx', "sfxDPEquip");
		}
		if (Player.list[playerId].DPClip <= 0 && Player.list[playerId].DPAmmo <= 0){
			if (Pickup.list[pickupId].amount <= DPClipSize){
				Player.list[playerId].DPClip += Pickup.list[pickupId].amount;				
			}
			else {
				Player.list[playerId].DPClip += DPClipSize;
				Player.list[playerId].DPAmmo += Pickup.list[pickupId].amount - DPClipSize;
				if (Player.list[playerId].DPAmmo > maxDPAmmo){Player.list[playerId].DPAmmo = maxDPAmmo;}
			}
			updatePlayerList.push({id:playerId,property:"DPClip",value:Player.list[playerId].DPClip});								
			updatePlayerList.push({id:playerId,property:"DPAmmo",value:Player.list[playerId].DPAmmo});								
		}
		else {
			Player.list[playerId].DPAmmo += Pickup.list[pickupId].amount;
			if (Player.list[playerId].DPAmmo > maxDPAmmo){Player.list[playerId].DPAmmo = maxDPAmmo;}
			updatePlayerList.push({id:playerId,property:"DPAmmo",value:Player.list[playerId].DPAmmo});								
		}	
		removePickup(pickupId);		
	}
	else if (Pickup.list[pickupId].type == 3){
		if (Player.list[playerId].holdingBag == false && Player.list[playerId].weapon == 1){
			if (Player.list[playerId].reloading > 0){
				Player.list[playerId].reloading = 0;
				updatePlayerList.push({id:playerId,property:"reloading",value:Player.list[playerId].reloading});				
			}
			Player.list[playerId].weapon = 3;
			updatePlayerList.push({id:playerId,property:"weapon",value:Player.list[playerId].weapon});	
		}
		else {
			SOCKET_LIST[playerId].emit('sfx', "sfxMGEquip");
		}
		if (Player.list[playerId].MGClip <= 0 && Player.list[playerId].MGAmmo <= 0){
			if (Pickup.list[pickupId].amount <= MGClipSize){
				Player.list[playerId].MGClip += Pickup.list[pickupId].amount;				
			}
			else {
				Player.list[playerId].MGClip += MGClipSize;
				Player.list[playerId].MGAmmo += Pickup.list[pickupId].amount - MGClipSize;
				if (Player.list[playerId].MGAmmo > maxMGAmmo){Player.list[playerId].MGAmmo = maxMGAmmo;}
			}
			updatePlayerList.push({id:playerId,property:"MGClip",value:Player.list[playerId].MGClip});								
			updatePlayerList.push({id:playerId,property:"MGAmmo",value:Player.list[playerId].MGAmmo});								
		}
		else {
			Player.list[playerId].MGAmmo += Pickup.list[pickupId].amount;
			if (Player.list[playerId].MGAmmo > maxMGAmmo){Player.list[playerId].MGAmmo = maxMGAmmo;}
			updatePlayerList.push({id:playerId,property:"MGAmmo",value:Player.list[playerId].MGAmmo});								
		}	
		removePickup(pickupId);		
	}
	else if (Pickup.list[pickupId].type == 4){
		if (Player.list[playerId].holdingBag == false && Player.list[playerId].weapon == 1){
			if (Player.list[playerId].reloading > 0){
				Player.list[playerId].reloading = 0;
				updatePlayerList.push({id:playerId,property:"reloading",value:Player.list[playerId].reloading});				
			}
			Player.list[playerId].weapon = 4;
			updatePlayerList.push({id:playerId,property:"weapon",value:Player.list[playerId].weapon});	
		}
		else { //because the sfx will already trigger automatically clientside if switching weapons to SG
			SOCKET_LIST[playerId].emit('sfx', "sfxSGEquip");
		}
		if (Player.list[playerId].SGClip <= 0 && Player.list[playerId].SGAmmo <= 0){
			if (Pickup.list[pickupId].amount <= SGClipSize){
				Player.list[playerId].SGClip += Pickup.list[pickupId].amount;				
			}
			else {
				Player.list[playerId].SGClip += SGClipSize;
				Player.list[playerId].SGAmmo += Pickup.list[pickupId].amount - SGClipSize;
				if (Player.list[playerId].SGAmmo > maxSGAmmo){Player.list[playerId].SGAmmo = maxSGAmmo;}
			}
			updatePlayerList.push({id:playerId,property:"SGClip",value:Player.list[playerId].SGClip});								
			updatePlayerList.push({id:playerId,property:"SGAmmo",value:Player.list[playerId].SGAmmo});								
		}
		else {
			Player.list[playerId].SGAmmo += Pickup.list[pickupId].amount;
			if (Player.list[playerId].SGAmmo > maxSGAmmo){Player.list[playerId].SGAmmo = maxSGAmmo;}
			updatePlayerList.push({id:playerId,property:"SGAmmo",value:Player.list[playerId].SGAmmo});								
		}		
		removePickup(pickupId);		
	}
	else if (Pickup.list[pickupId].type == 5 && Player.list[playerId].health < playerMaxHealth){
		Player.list[playerId].health += Pickup.list[pickupId].amount;
		if (Player.list[playerId].health > playerMaxHealth){
			Player.list[playerId].health = playerMaxHealth;
		}
		updatePlayerList.push({id:playerId,property:"health",value:Player.list[playerId].health});											
		SOCKET_LIST[playerId].emit('sfx', "sfxBagGrab");
		removePickup(pickupId);
	}
	
	
}

function removePickup(pickupId){
	if (Pickup.list[pickupId].respawnTime == -1){
		delete Pickup.list[pickupId];
	}
	else {
		Pickup.list[pickupId].respawnTimer = Pickup.list[pickupId].respawnTime;
	}
	updatePickupList.push(pickupId);
}

function reload(playerId){
	if ((Player.list[playerId].weapon == 3 && Player.list[playerId].MGClip <= 0 && Player.list[playerId].MGAmmo <= 0)){			
			Player.list[playerId].weapon = 1;
			updatePlayerList.push({id:playerId,property:"weapon",value:Player.list[playerId].weapon});		
			return;
	}
	else if ((Player.list[playerId].weapon == 2 && Player.list[playerId].DPClip <= 0 && Player.list[playerId].DPAmmo <= 0)){
			Player.list[playerId].weapon = 1;
			updatePlayerList.push({id:playerId,property:"weapon",value:Player.list[playerId].weapon});		
			return;
	}
	else if ((Player.list[playerId].weapon == 4 && Player.list[playerId].SGClip <= 0 && Player.list[playerId].SGAmmo <= 0)){
			Player.list[playerId].weapon = 1;
			updatePlayerList.push({id:playerId,property:"weapon",value:Player.list[playerId].weapon});		
			return;
	}
	if (Player.list[playerId].weapon == 1 && Player.list[playerId].PClip >= 15){return;}
	else if ((Player.list[playerId].weapon == 3 && Player.list[playerId].MGClip >= MGClipSize) || (Player.list[playerId].weapon == 3 && Player.list[playerId].MGAmmo <= 0)){return;}
	else if ((Player.list[playerId].weapon == 2 && Player.list[playerId].DPClip >= DPClipSize) || (Player.list[playerId].weapon == 2 && Player.list[playerId].DPAmmo <= 0)){return;}
	else if ((Player.list[playerId].weapon == 4 && Player.list[playerId].SGClip >= SGClipSize) || (Player.list[playerId].weapon == 4 && Player.list[playerId].SGAmmo <= 0)){return;}
	if (Player.list[playerId].reloading <= 0){
		if (Player.list[playerId].weapon == 1){
			Player.list[playerId].reloading = 60;
			updatePlayerList.push({id:playerId,property:"reloading",value:Player.list[playerId].reloading});
		}					
		else if (Player.list[playerId].weapon == 2){
			Player.list[playerId].reloading = 80;
			updatePlayerList.push({id:playerId,property:"reloading",value:Player.list[playerId].reloading});
		}					
		else if (Player.list[playerId].weapon == 3){
			Player.list[playerId].reloading = 114;
			updatePlayerList.push({id:playerId,property:"reloading",value:Player.list[playerId].reloading});
		}					
		else if (Player.list[playerId].weapon == 4){
			if (Player.list[playerId].fireRate > 0){
				Player.list[playerId].bufferReload = true;
			}
			else {
				Player.list[playerId].reloading = 30;
				updatePlayerList.push({id:playerId,property:"reloading",value:Player.list[playerId].reloading});
			}
		}					
	}	
}

function Discharge(player){
	if (player.reloading > 0 && player.weapon != 4){return;}	
	else if (player.weapon == 1 && player.PClip <= 0){
		reload(player.id);
		player.fireRate = pistolFireRate;
		return;
	}
	else if (player.weapon == 2 && player.DPClip <= 0){
		reload(player.id);
		player.fireRate = DPFireRate;
		return;
	}
	else if (player.weapon == 3 && player.MGClip <= 0){
		reload(player.id);
		player.fireRate = MGFireRate;
		return;
	}
	else if (player.weapon == 4 && player.SGClip <= 0){
		reload(player.id);
		player.fireRate = SGFireRate;
		return;
	}
	if (player.triggerTapLimitTimer > 0 && player.firing <= 0){ //Don't let SG fire if TapLimiter is active AND not actively firing 
		return;
	}	
	
	if (player.weapon == 4){ //update sgpushspeed wheather or not already firing
		var pushDirection = player.shootingDir - 4; if (pushDirection <= 0){ pushDirection += 8; }		
		player.pushDir = pushDirection;
		player.pushSpeed = SGPushSpeed;
	}
	
	//ACTUAL DISCHARGES
	if (player.cloakEngaged){
		player.cloakEngaged = false;
		updatePlayerList.push({id:player.id,property:"cloakEngaged",value:player.cloakEngaged});
	}
	if(player.weapon == 1 && player.firing <= 0){
		player.PClip--;
		updatePlayerList.push({id:player.id,property:"PClip",value:player.PClip});
		player.fireRate = pistolFireRate;
		if (pistolFireRateLimiter){
			player.triggerTapLimitTimer = pistolFireRate;
		}
	}
	else if(player.weapon == 2 && player.firing <= 0){
		player.DPClip--;
		updatePlayerList.push({id:player.id,property:"DPClip",value:player.DPClip});
		player.fireRate = DPFireRate;
		if (pistolFireRateLimiter){
			player.triggerTapLimitTimer = DPFireRate;
		}
	}
	else if(player.weapon == 3 && player.firing <= 0){
		player.MGClip--;
		updatePlayerList.push({id:player.id,property:"MGClip",value:player.MGClip});
		player.fireRate = MGFireRate;
	}
	else if(player.weapon == 4 && player.firing <= 0){
		player.SGClip--;
		player.reloading = 0;
		updatePlayerList.push({id:player.id,property:"SGClip",value:player.SGClip});
		
		player.fireRate = SGFireRate;
		player.triggerTapLimitTimer = SGFireRate;
	}
	
	player.firing = 3; 
	player.liveShot = true;
}

Player.onDisconnect = function(socket){
	if (Player.list[socket.id]){
		logg(Player.list[socket.id].name + " disconnected.");
		if (Player.list[socket.id].holdingBag == true){
			if (Player.list[socket.id].team == "white"){
				bagBlue.captured = false;
				updateMisc.bagBlue = bagBlue;
			}
			else if (Player.list[socket.id].team == "black"){
				bagRed.captured = false;
				updateMisc.bagRed = bagRed;
			}
		}
		sendChatToAll(Player.list[socket.id].name + " has disconnected.");
		sendSocketListToServerDb();
	}
	delete Player.list[socket.id];
	for(var i in SOCKET_LIST){
		SOCKET_LIST[i].emit('removePlayer', socket.id);
	}	
	ensureCorrectThugCount();
}
Player.update = function(){
		var pack = [];
		for (var i in Player.list){
			var player = Player.list[i];
			player.move();

			//pack.push(player); This will send ALL player data to client	
			pack.push({
				id:player.id,
				name:player.name,
				team:player.team,
				health:player.health,
				energy:player.energy,
				rechargeDelay:player.rechargeDelay,
				x:player.x,
				y:player.y,
				walkingDir:player.walkingDir,
				shootingDir:player.shootingDir,
				firing:player.firing,
				aiming:player.aiming,
				holdingBag:player.holdingBag,
			});
		}
		return pack;
}

function capture(team) {
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

function sendCapturesToClient(socket){
	socket.emit('capture', 'reset', whiteScore, blackScore);
}

function killScore(team){
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

function sprayBloodOntoTarget(shootingDir, targetX, targetY, targetId) {
	var data = {};
	data.targetX = targetX;
	data.targetY = targetY;
	data.shootingDir = shootingDir;
	data.targetId = targetId;
	for(var i in SOCKET_LIST){
		SOCKET_LIST[i].emit('sprayBloodOntoTarget',data);
	}
}

function checkIfInLineOfShot(shooter, target){
	var distFromDiag = 0;
	//&& target.team != shooter.team //Take off friendly fire
	
	if (shooter.weapon == 1 || shooter.weapon == 2 || shooter.weapon == 3){
		if (target.team){
			if (target.id != shooter.id && target.health > 0){
				if (shooter.shootingDir == 1){
					if (target.x > shooter.x - 31 && target.x < shooter.x + 31 && target.y < shooter.y){
						return {target:target,dist:(shooter.y - target.y),distFromDiag:distFromDiag};
					}
				}
				else if (shooter.shootingDir == 2){
					distFromDiag = -shooter.x + target.x - shooter.y + target.y; //forwardslash diag. Negative means target's x is left of shooter's diag.
					if (Math.abs(distFromDiag) < 44 && target.y < shooter.y){
						return {target:target,dist:(shooter.y - target.y),distFromDiag:distFromDiag};
					}
				}
				else if (shooter.shootingDir == 3){
					if (target.y > shooter.y - 31 && target.y < shooter.y + 31 && target.x > shooter.x){
						return {target:target,dist:(target.x - shooter.x),distFromDiag:distFromDiag};
					}
				}
				else if (shooter.shootingDir == 4){
					distFromDiag = -shooter.x + target.x + shooter.y - target.y; //backslash diag. Negative means target's x is left of shooter's diag.
					if (Math.abs(distFromDiag) < 44 && target.y > shooter.y){
						return {target:target,dist:(target.x - shooter.x),distFromDiag:distFromDiag};
					}
				}

				else if (shooter.shootingDir == 5){
					if (target.x > shooter.x - 31 && target.x < shooter.x + 31 && target.y > shooter.y){
						return {target:target,dist:(target.y - shooter.y),distFromDiag:distFromDiag};
					}
				}
				else if (shooter.shootingDir == 6){
					distFromDiag = -shooter.x + target.x - shooter.y + target.y;
					if (Math.abs(distFromDiag) < 44 && target.y > shooter.y){
						return {target:target,dist:(target.y - shooter.y),distFromDiag:distFromDiag};
					}
				}
				else if (shooter.shootingDir == 7){
					if (target.y > shooter.y - 31 && target.y < shooter.y + 31 && target.x < shooter.x){
						return {target:target,dist:(shooter.x - target.x),distFromDiag:distFromDiag};
					}
				}
				else if (shooter.shootingDir == 8){
					distFromDiag = -shooter.x + target.x + shooter.y - target.y;
					if (Math.abs(distFromDiag) < 44 && target.y < shooter.y){
						return {target:target,dist:(shooter.x - target.x),distFromDiag:distFromDiag};
					}
				}	
			} // End check if target.id != shooter.id
		}// End check if target is organic (or block)
		else {
		//Block shot hit detection
			var overlapTop = shooter.y - target.y;  
			var overlapBottom = (target.y + target.height) - shooter.y;
			var overlapLeft = shooter.x - target.x;
			var overlapRight = (target.x + target.width) - shooter.x;		
			
			if (shooter.shootingDir == 1){
				if (target.x + target.width > shooter.x && target.x < shooter.x && target.y < shooter.y){
					return {target:target,dist:(shooter.y - (target.y + target.height)) + 5,distFromDiag:distFromDiag};
				}
			}
			else if (shooter.shootingDir == 2){
				distFromDiag = (target.x + target.width/2) - (shooter.x + (shooter.y - (target.y + target.height/2)));
				if (Math.abs(distFromDiag) < target.width/2 + target.height/2 && target.y < shooter.y && target.x + target.width > shooter.x){
					var dist = 0;
					if (overlapBottom >= overlapLeft){
						//Hitting the left side of block
						dist = target.x - shooter.x;
					}
					else if (overlapLeft >= overlapBottom){
						//Hitting bottom of block
						dist = (shooter.y - (target.y + target.height));
					}
					return {target:target,dist:dist + 15,distFromDiag:distFromDiag};
				}
			}
			else if (shooter.shootingDir == 3){
				if (target.y + target.height > shooter.y && target.y < shooter.y && target.x + target.width > shooter.x){
					return {target:target,dist:(target.x - shooter.x) + 5,distFromDiag:distFromDiag};
				}
			}
			else if (shooter.shootingDir == 4){
				distFromDiag = (target.x + target.width/2) - shooter.x + (shooter.y - (target.y + target.height/2));
				if (Math.abs(distFromDiag) < target.width/2 + target.height/2 && target.y + target.height > shooter.y && target.x + target.width > shooter.x){
					var dist = 0;
					if (overlapTop >= overlapLeft){
						//Hitting the left side of block
						dist = target.x - shooter.x;
					}
					else if (overlapLeft >= overlapTop){
						//Hitting top of block
						dist = target.y - shooter.y;
					}
					return {target:target,dist:dist + 15,distFromDiag:distFromDiag};
				}
			}
			else if (shooter.shootingDir == 5){
				if (target.x + target.width > shooter.x && target.x < shooter.x && target.y + target.height > shooter.y){
					return {target:target,dist:(target.y - shooter.y) + 5,distFromDiag:distFromDiag};
				}
			}
			else if (shooter.shootingDir == 6){
				distFromDiag = (target.x + target.width/2) - (shooter.x + (shooter.y - (target.y + target.height/2)));
				if (Math.abs(distFromDiag) < target.width/2 + target.height/2 && target.y + target.height > shooter.y && target.x < shooter.x){
					var dist = 0;
					if (overlapTop >= overlapRight){
						//Hitting the right side of block
						dist = shooter.x - (target.x + target.width);
					}
					else if (overlapRight >= overlapTop){
						//Hitting top of block
						dist = target.y - shooter.y;
					}
					return {target:target,dist:dist + 15,distFromDiag:distFromDiag};
				}
			}
			else if (shooter.shootingDir == 7){
				if (target.y + target.height > shooter.y && target.y < shooter.y && target.x < shooter.x){
					return {target:target,dist:(shooter.x - (target.x + target.width)) + 5,distFromDiag:distFromDiag};
				}
			}
			else if (shooter.shootingDir == 8){
				distFromDiag = (target.x + target.width/2) - shooter.x + (shooter.y - (target.y + target.height/2));
				if (Math.abs(distFromDiag) < target.width/2 + target.height/2 && target.y < shooter.y && target.x < shooter.x){
					var dist = 0;
					if (overlapBottom >= overlapRight){
						//Hitting the right side of block
						dist = shooter.x - (target.x + target.width);
					}
					else if (overlapRight >= overlapBottom){
						//Hitting bottom of block
						dist = (shooter.y - (target.y + target.height));
					}
					return {target:target,dist:dist + 15,distFromDiag:distFromDiag};
				}
			}
		} //End Block detection Else statement
	} //End if weapon == 1,2,3
	
	//Shotgun hit detection
	else if (shooter.weapon == 4){
		if (target.team && target.health){
			if (getDistance(target, shooter) < SGRange && target.id != shooter.id && target.health > 0){
				const distFromDiagForward = target.x - (shooter.x + (shooter.y - target.y)); // diag[/]. Negative means target's x is left of shooter's diag.
				const distFromDiagBack = target.x - shooter.x + (shooter.y - target.y); //  diag[\]. Negative means target's x is left of shooter's diag.
				
				if (shooter.shootingDir == 1){
					if (distFromDiagForward < 0 && distFromDiagBack > 0){
						return {target:target,dist:(shooter.y - target.y),distFromDiag:0};
					}
				}
				else if (shooter.shootingDir == 2){
					if (target.x > shooter.x && target.y < shooter.y){
						return {target:target,dist:(shooter.y - target.y),distFromDiag:0};
					}
				}
				else if (shooter.shootingDir == 3){
					if (distFromDiagForward > 0 && distFromDiagBack > 0){
						return {target:target,dist:(shooter.x - target.x),distFromDiag:0};
					}
				}
				else if (shooter.shootingDir == 4){
					if (target.x > shooter.x && target.y > shooter.y){
						return {target:target,dist:(shooter.x - target.x),distFromDiag:0};
					}
				}
				else if (shooter.shootingDir == 5){
					if (distFromDiagForward > 0 && distFromDiagBack < 0){
						return {target:target,dist:(shooter.y - target.y),distFromDiag:0};
					}
				}
				else if (shooter.shootingDir == 6){
					if (target.x < shooter.x && target.y > shooter.y){
						return {target:target,dist:(shooter.y - target.y),distFromDiag:0};
					}
				}
				else if (shooter.shootingDir == 7){
					if (distFromDiagForward < 0 && distFromDiagBack < 0){
						return {target:target,dist:(shooter.x - target.x),distFromDiag:0};
					}
				}
				else if (shooter.shootingDir == 8){
					if (target.x < shooter.x && target.y < shooter.y){
						return {target:target,dist:(shooter.x - target.x),distFromDiag:0};
					}
				}
			}//End check if in shotgun range
		}//Check if organic target
		else{
			var SGEstRange = SGRange + 40;
			//Blocks shotgun hit detection
			if (shooter.shootingDir == 1){
				if (target.x + target.width > shooter.x - SGEstRange/2 && target.x < shooter.x + SGEstRange/2 && target.y < shooter.y && target.y + target.height > shooter.y - SGEstRange){
					return {target:target,dist:(shooter.y - target.y),distFromDiag:0};
				}
			}
			else if (shooter.shootingDir == 2){
				if (target.x + target.width > shooter.x && target.x < shooter.x + SGEstRange && target.y < shooter.y && target.y + target.height > shooter.y - SGEstRange){
					return {target:target,dist:(shooter.y - target.y),distFromDiag:0};
				}
			}
			else if (shooter.shootingDir == 3){
				if (target.x + target.width > shooter.x && target.x < shooter.x + SGEstRange && target.y < shooter.y + SGEstRange/2 && target.y + target.height > shooter.y - SGEstRange/2){
					return {target:target,dist:(shooter.x - target.x),distFromDiag:0};
				}
			}
			else if (shooter.shootingDir == 4){
				if (target.x + target.width > shooter.x && target.x < shooter.x + SGEstRange && target.y < shooter.y + SGEstRange && target.y + target.height > shooter.y){
					return {target:target,dist:(shooter.x - target.x),distFromDiag:0};
				}
			}
			else if (shooter.shootingDir == 5){
				if (target.x + target.width > shooter.x - SGEstRange/2 && target.x < shooter.x + SGEstRange/2 && target.y < shooter.y + SGEstRange && target.y + target.height > shooter.y){
					return {target:target,dist:(shooter.y - target.y),distFromDiag:0};
				}
			}
			else if (shooter.shootingDir == 6){
				if (target.x + target.width > shooter.x - SGEstRange && target.x < shooter.x && target.y < shooter.y + SGEstRange && target.y + target.height > shooter.y){
					return {target:target,dist:(shooter.y - target.y),distFromDiag:0};
				}
			}
			else if (shooter.shootingDir == 7){
				if (target.x + target.width > shooter.x - SGEstRange && target.x < shooter.x && target.y < shooter.y + SGEstRange/2 && target.y + target.height > shooter.y - SGEstRange/2){
					return {target:target,dist:(shooter.x - target.x),distFromDiag:0};
				}
			}
			else if (shooter.shootingDir == 8){
				if (target.x + target.width > shooter.x - SGEstRange && target.x < shooter.x && target.y < shooter.y && target.y + target.height > shooter.y - SGEstRange){
					return {target:target,dist:(shooter.x - target.x),distFromDiag:0};
				}
			}
		}
	}
	
	return false;
}

function getHitTarget(hitTargets){
	var hitTarget = null;
	var closest = bulletRange;
	var distFromDiag = 0;
	for (var j in hitTargets){
		if (hitTargets[j].dist < closest){
			hitTarget = hitTargets[j].target;
			closest = hitTargets[j].dist;
			distFromDiag = hitTargets[j].distFromDiag;
			hitTarget.dist = hitTargets[j].dist;
			hitTarget.distFromDiag = hitTargets[j].distFromDiag;

		}
	}
	return hitTarget;		
}


//hit //gethit //get hit
function hit(target, shootingDir, distance, shooterId){	
		//log("hit function " + target.id);
		
		if (Player.list[shooterId].weapon != 4){
			var shotData = {};
			shotData.id = shooterId;
			shotData.spark = false;
			shotData.shootingDir = shootingDir;
			if (!target.team){shotData.spark = true;}
			if (shootingDir % 2 == 0){
				shotData.distance = distance * 1.42 - 42;
			}
			else {
				shotData.distance = distance - 42;
			}
			if (shotData.distance < 0){shotData.distance = 1;}	
			for(var i in SOCKET_LIST){
				SOCKET_LIST[i].emit('shootUpdate',shotData);
			}
		}
		
		if (target.team && target.health){
			if (target.team != Player.list[shooterId].team){
				target.lastEnemyToHit = shooterId; //For betrayal/Suicide detection
			}
			
			//Player stagger and cloak interruption stuff
			if (Player.list[target.id]){
				target.stagger = staggerTime;		
				target.healDelay += healDelayTime;
				if (target.healDelay > healDelayTime){target.healDelay = healDelayTime;} //Ceiling on healDelay
				if (target.team != Player.list[shooterId].team){
					playerEvent(shooterId, "hit");
				}
				if (target.cloakEngaged){
					target.cloakEngaged = false;
					updatePlayerList.push({id:target.id,property:"cloakEngaged",value:target.cloakEngaged});
				}
			}
		
			//CALCULATE DAMAGE
			var damageInflicted = 0;
			var targetDistance = getDistance(target, Player.list[shooterId]);
			
			//Facing attacker (lowest damage)
			if (Player.list[shooterId].weapon == 1){ damageInflicted += pistolDamage; } //Single Pistol
			else if (Player.list[shooterId].weapon == 2){ damageInflicted += pistolDamage * 2; } //Double damage for double pistols
			else if (Player.list[shooterId].weapon == 3){ damageInflicted += mgDamage; } //Damage for MG
			else if (Player.list[shooterId].weapon == 4){ damageInflicted += -(targetDistance - SGRange)/(SGRange/SGCloseRangeDamageScale) * SGDamage; } //Damage for SG
			
			if (Player.list[target.id]){
				if (target.shootingDir != (shootingDir + 4) && target.shootingDir != (shootingDir - 4) && target.shootingDir != (shootingDir + 5) && target.shootingDir != (shootingDir - 5) && target.shootingDir != (shootingDir + 3) && target.shootingDir != (shootingDir - 3) && target.team != Player.list[shooterId].team){
					//Target is NOT facing shooter (within 3 angles)
					if (Player.list[shooterId].weapon == 1){ damageInflicted += pistolSideDamage; } //Single Pistol
					else if (Player.list[shooterId].weapon == 2){ damageInflicted += pistolSideDamage * 2; } //Double damage for double pistols
					else if (Player.list[shooterId].weapon == 3){ damageInflicted += mgSideDamage; } //Damage for MG
					else if (Player.list[shooterId].weapon == 4){ damageInflicted += -(targetDistance - SGRange)/(SGRange/SGCloseRangeDamageScale) * SGSideDamage; } //Damage for SG
				}
				if (target.shootingDir == shootingDir && target.team != Player.list[shooterId].team){
					//Back Damage
					if (Player.list[shooterId].weapon == 1){ damageInflicted += pistolBackDamage; } //Single Pistol
					else if (Player.list[shooterId].weapon == 2){ damageInflicted += pistolBackDamage * 2; } //Double damage for double pistols
					else if (Player.list[shooterId].weapon == 3){ damageInflicted += mgBackDamage; } //Damage for MG
					else if (Player.list[shooterId].weapon == 4){ damageInflicted += -(targetDistance - SGRange)/(SGRange/SGCloseRangeDamageScale) * SGBackDamage; } //Damage for SG
				}
			}

			damageInflicted = damageInflicted * damageScale; //Scale damage
			target.health -= Math.floor(damageInflicted);
			if (Player.list[target.id]){updatePlayerList.push({id:target.id,property:"health",value:target.health});}
			else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"health",value:target.health});}
						
			//Damage push
			target.pushSpeed += damageInflicted/8 * damagePushScale;
			target.pushDir = Player.list[shooterId].shootingDir;			
			if (Player.list[target.id]){updatePlayerList.push({id:target.id,property:"pushSpeed",value:target.pushSpeed});}
			else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"pushSpeed",value:target.pushSpeed});}
			if (Player.list[target.id]){updatePlayerList.push({id:target.id,property:"pushDir",value:target.pushDir});}
			else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"pushDir",value:target.pushDir});}
		
			if (target.health <= 0){
				kill(target, shootingDir, shooterId);
			}
			
		}
} //END hit function

//eventTrigger Database push update db
function playerEvent(playerId, event){
	if (!gameOver && Player.list[playerId]){
		if (event == "hit"){
			Player.list[playerId].cash += hitCash;
			Player.list[playerId].cashEarnedThisGame += hitCash;
			updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
			updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
		}
		else if (event == "kill"){
			Player.list[playerId].kills++;			
			Player.list[playerId].cash+=killCash;
			Player.list[playerId].cashEarnedThisGame+=killCash;
			updatePlayerList.push({id:playerId,property:"kills",value:Player.list[playerId].kills});
			updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
			updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
			updateNotificationList.push({text:"+$" + killCash + " - Enemy Killed",playerId:playerId});
			log("KILL = " + Player.list[playerId].cognitoSub);
			dbUserUpdate("inc", Player.list[playerId].cognitoSub, {kills: 1});
		}
		else if (event == "multikill"){
			if (Player.list[playerId].multikill == 2){
				Player.list[playerId].cash+=doubleKillCash;
				Player.list[playerId].cashEarnedThisGame+=doubleKillCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"**DOUBLE KILL!!**",playerId:playerId});				
			}
			else if (Player.list[playerId].multikill == 3){
				Player.list[playerId].cash+=tripleKillCash;
				Player.list[playerId].cashEarnedThisGame+=tripleKillCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"**TRIPLE KILL!!!**",playerId:playerId});				
			}
			else if (Player.list[playerId].multikill >= 4){
				Player.list[playerId].cash+=quadKillCash;
				Player.list[playerId].cashEarnedThisGame+=quadKillCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"**OVERKILL!!!!**",playerId:playerId});				
			}
		}
		else if (event == "spree"){
			if (Player.list[playerId].spree == 5){
				Player.list[playerId].cash+=spreeCash;
				Player.list[playerId].cashEarnedThisGame+=spreeCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"**KILLING SPREE!!**",playerId:playerId});				
			}		
			else if (Player.list[playerId].spree == 10){
				Player.list[playerId].cash+=frenzyCash;
				Player.list[playerId].cashEarnedThisGame+=frenzyCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"**GENOCIDE!!**",playerId:playerId});				
			}		
			else if (Player.list[playerId].spree == 15){
				Player.list[playerId].cash+=rampageCash;
				Player.list[playerId].cashEarnedThisGame+=rampageCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"**EXTERMINATION!!**",playerId:playerId});				
			}		
			else if (Player.list[playerId].spree == 20){
				Player.list[playerId].cash+=unbelievableCash;
				Player.list[playerId].cashEarnedThisGame+=unbelievableCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"**NEXT HITLER!!**",playerId:playerId});				
			}		
		}
		else if (event == "killThug"){
			Player.list[playerId].cash+=thugCash;
			Player.list[playerId].cashEarnedThisGame+=thugCash;
			updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
			updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
			updateNotificationList.push({text:"+$" + thugCash + " - Thug Killed",playerId:playerId});
		}
		else if (event == "death"){
			Player.list[playerId].deaths++;
			if (Player.list[playerId]){
				updatePlayerList.push({id:playerId,property:"deaths",value:Player.list[playerId].deaths});
			}
			dbUserUpdate("inc", Player.list[playerId].cognitoSub, {deaths: 1});
		}
		else if (event == "benedict"){
			updateNotificationList.push({text:"Benedict!",playerId:playerId});
			dbUserUpdate("inc", Player.list[playerId].cognitoSub, {benedicts: 1});
		}
		else if (event == "steal"){
			Player.list[playerId].steals++;
			Player.list[playerId].cash += stealCash;
			Player.list[playerId].cashEarnedThisGame += stealCash;
			updatePlayerList.push({id:playerId,property:"steals",value:Player.list[playerId].steals});
			updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
			updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
			updateNotificationList.push({text:"+$" + stealCash + " - Bag Stolen",playerId:playerId});
			dbUserUpdate("inc", Player.list[playerId].cognitoSub, {steals: 1});
		}
		else if (event == "return"){
			Player.list[playerId].returns++;
			Player.list[playerId].cash+=returnCash;
			Player.list[playerId].cashEarnedThisGame+=returnCash;
			updatePlayerList.push({id:playerId,property:"returns",value:Player.list[playerId].returns});
			updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
			updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
			updateNotificationList.push({text:"+$" + returnCash + " - Bag Returned",playerId:playerId});
			dbUserUpdate("inc", Player.list[playerId].cognitoSub, {returns: 1});
		}
		else if (event == "capture"){
			Player.list[playerId].holdingBag = false;
			updatePlayerList.push({id:playerId,property:"holdingBag",value:false});
			Player.list[playerId].captures++;
			Player.list[playerId].cash+=captureCash;
			Player.list[playerId].cashEarnedThisGame+=captureCash;
			updatePlayerList.push({id:playerId,property:"captures",value:Player.list[playerId].captures});
			updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
			updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
			if (minutesLeft > 0 && secondsLeft > 0){
				updateNotificationList.push({text:"+$" + captureCash + " - BAG CAPTURED!!",playerId:playerId});
			}
			dbUserUpdate("inc", Player.list[playerId].cognitoSub, {captures: 1});
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
	if (enemyTeamAvgRating == undefined || enemyTeamAvgRating == null || isNaN(enemyTeamAvgRating)){enemyTeamAvgRating = 10;}
	return enemyTeamAvgRating;
}


function calculateEndgameStats(){
	getAllPlayersFromDB(function(mongoRes){
		if (mongoRes){
			//Get CURRENT player rating and experience from mongo
			updatePlayersRatingAndExpWithMongoRes(mongoRes);		
			var whiteAverageRating = calculateTeamAvgRating("white");
			var blackAverageRating = calculateTeamAvgRating("black");

			for (var p in Player.list){
				SOCKET_LIST[p].emit('sendLog', "Player in endgame loop...");
				var ptsGained = 0;
				var enemyAverageRating = Player.list[p].team == "white" ? blackAverageRating : whiteAverageRating;
				if ((Player.list[p].team == "white" && whiteScore > blackScore) || (Player.list[p].team == "black" && whiteScore < blackScore)){
					//win
					ptsGained = Math.round(matchWinLossRatingBonus + (enemyAverageRating - Player.list[p].rating)/enemySkillDifferenceDivider);
					if (ptsGained < 1){ptsGained = 1;}		
					logg(Player.list[p].name + " had " + Player.list[p].rating + " pts, and beat a team with " + enemyAverageRating + " pts. He gained " + ptsGained);
					Player.list[p].cashEarnedThisGame+=winCash; //Not sending this update to the clients because it is only used for server-side experience calculation, not displaying on scoreboard
				}
				else {
					//loss
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

				dbUserUpdate("inc", Player.list[p].cognitoSub, {cash: Player.list[p].cashEarnedThisGame, experience: Player.list[p].cashEarnedThisGame, gamesLost: 1, gamesPlayed: 1, rating: ptsGained});
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

function updateSocketRatingAndExpWithMongoRes(mongoRes){
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

function getNumPlayersInGame(){
	var totalPlayers = 0;
	for (var p in Player.list){
		totalPlayers++;
	}
	
	return totalPlayers;
}

function getPlayerFromCognitoSub(searchingCognitoSub){
	for (var p in Player.list){
		if (Player.list[p].cognitoSub == searchingCognitoSub){
			return Player.list[p].id;
		}
	}
	return null;
}



function kill(target, shootingDir, shooterId){
		
	if (shooterId != 0){
		if (target.team != Player.list[shooterId].team || (target.lastEnemyToHit && target.lastEnemyToHit != 0)){
			if ((target.lastEnemyToHit && target.lastEnemyToHit != 0) && target.team == Player.list[shooterId].team){
				shooterId = target.lastEnemyToHit; //Give kill credit to last enemy that hit the player (if killed by own team or self)
			}
			if (Player.list[target.id]){
				if (gametype == "slayer" && gameOver == false){
					killScore(Player.list[shooterId].team);
				}
				playerEvent(shooterId, "kill");
				
				Player.list[shooterId].spree++;
				Player.list[shooterId].multikill++;
				Player.list[shooterId].multikillTimer = 4 * 60;
				if (Player.list[shooterId].multikill >= 2){
					playerEvent(shooterId, "multikill");
				}
				if (Player.list[shooterId].spree == 5 || Player.list[shooterId].spree == 10 || Player.list[shooterId].spree == 15 || Player.list[shooterId].spree == 20){
					playerEvent(shooterId, "spree");
				}
			}
			else if (Thug.list[target.id]){
				playerEvent(shooterId, "killThug");
			}
		}
		else { //Killed by own team or self AND no last enemy to hit
			playerEvent(shooterId, "benedict");
		}
	}
	if (Player.list[target.id]){
		playerEvent(target.id, "death");
	}
	
	
	//Create Body
	if (target.pushSpeed > pushMaxSpeed){ target.pushSpeed = pushMaxSpeed; }
	
	if (target.team == "white"){
		updateEffectList.push({type:5, targetX:target.x, targetY:target.y, pushSpeed:target.pushSpeed, shootingDir:shootingDir, bodyType:"whiteRed"});
	}
	else if (target.team == "black"){
		updateEffectList.push({type:5, targetX:target.x, targetY:target.y, pushSpeed:target.pushSpeed, shootingDir:shootingDir, bodyType:"blackBlue"});
	}
	
	//Drop Ammo/Pickups drop pickups
	if (Player.list[target.id]){
		var drops = 0;
		if (target.DPAmmo > 0 || target.DPClip > 0){
			drops++;
			var ammoAmount = target.DPClip + target.DPAmmo;
			var dpId = Math.random();
			Pickup(dpId, target.x - 40, target.y - 35, 2, ammoAmount, -1);
			updatePickupList.push(Pickup.list[dpId]);
			target.DPAmmo = 0;
			target.DPClip = 0;
			updatePlayerList.push({id:target.id,property:"DPAmmo",value:target.DPAmmo});		
			updatePlayerList.push({id:target.id,property:"DPClip",value:target.DPClip});		
		}
		if (target.MGAmmo > 0 || target.MGClip > 0){
			drops++;
			var ammoAmount = target.MGClip + target.MGAmmo;
			var mgId = Math.random();
			Pickup(mgId, target.x - 25 + (drops * 8), target.y - 10, 3, ammoAmount, -1);
			updatePickupList.push(Pickup.list[mgId]);
			target.MGAmmo = 0;
			target.MGClip = 0;
			updatePlayerList.push({id:target.id,property:"MGAmmo",value:target.MGAmmo});		
			updatePlayerList.push({id:target.id,property:"MGClip",value:target.MGClip});		
		}
		if (target.SGAmmo > 0 || target.SGClip > 0){
			drops++;
			var ammoAmount = target.SGClip + target.SGAmmo;
			var sgId = Math.random();
			Pickup(sgId, target.x - 30, target.y - 20 + (drops * 10), 4, ammoAmount, -1);
			updatePickupList.push(Pickup.list[sgId]);
			target.SGAmmo = 0;
			target.SGClip = 0;
			updatePlayerList.push({id:target.id,property:"SGAmmo",value:target.SGAmmo});		
			updatePlayerList.push({id:target.id,property:"SGClip",value:target.SGClip});		
		}
	}
}

var Thug = function(id, team, x, y){
	var self = {
		id:id,
		team:team,
		x:x,
		y:y,
		width:94,
		height:94,
		health:thugHealth,
		legHeight:47,
		legSwingForward:true,
		rotation:0,
		targetId:0,
		reevaluateTargetTimer:0,
		respawnTimer:600,
		closestTargetDist:999999,
		attacking:0,
		pushDir:0,
		pushSpeed:0,
	};
	Thug.list[id] = self;	
	
	//Send to client
	updateThugList.push({id:self.id,property:"team",value:self.team});
	updateThugList.push({id:self.id,property:"x",value:self.x});
	updateThugList.push({id:self.id,property:"y",value:self.y});
	updateThugList.push({id:self.id,property:"legHeight",value:self.legHeight});
	updateThugList.push({id:self.id,property:"legSwingForward",value:self.legSwingForward});
	updateThugList.push({id:self.id,property:"rotation",value:self.rotation});
	
	self.engine = function(){
		self.checkForDeathAndRespawn();
		if (self.health > 0){
			self.evaluateTarget();
			self.checkForEntityCollision();
			processEntityPush(self);
					
			if (self.attacking > 0){self.attacking--;}
			
			if (self.targetId != 0 && self.attacking == 0){		
				self.moveThug();
				self.checkForThugStab();
				self.swingLegs();
			}
			else if (self.attacking == 0){
				self.standThereAwkwardly();
			}
			self.checkForBlockCollision();			
		}
	}//End self.engine
	
	self.checkForEntityCollision = function(){
		//Check collision with players
		for (var i in Player.list){
			if (Player.list[i].id != self.id  && Player.list[i].health > 0 && self.x + self.width > Player.list[i].x && self.x < Player.list[i].x + Player.list[i].width && self.y + self.height > Player.list[i].y && self.y < Player.list[i].y + Player.list[i].height){								
				if (self.x == Player.list[i].x && self.y == Player.list[i].y){self.x -= 5; updateThugList.push({id:self.id,property:"x",value:self.x});} //Added to avoid math issues when entities are directly on top of each other (distance = 0)
				var dx1 = self.x - Player.list[i].x;
				var dy1 = self.y - Player.list[i].y;
				var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
				var ax1 = dx1/dist1;
				var ay1 = dy1/dist1;
				if (dist1 < 40){				
					self.x += ax1 / (dist1 / 70); //Higher number is greater push
					updateThugList.push({id:self.id,property:"x",value:self.x})
					self.y += ay1 / (dist1 / 70);
					updateThugList.push({id:self.id,property:"y",value:self.y});
				}
			}
		}
	
		//Check collision with thugs
		for (var i in Thug.list){
			if (Thug.list[i].id != self.id && Thug.list[i].health > 0 && self.x + self.width > Thug.list[i].x && self.x < Thug.list[i].x + Thug.list[i].width && self.y + self.height > Thug.list[i].y && self.y < Thug.list[i].y + Thug.list[i].height){								
				if (self.x == Thug.list[i].x && self.y == Thug.list[i].y){self.x -= 5; updateThugList.push({id:self.id,property:"x",value:self.x});} //Added to avoid math issues when entities are directly on top of each other (distance = 0)
				var dx1 = self.x - Thug.list[i].x;
				var dy1 = self.y - Thug.list[i].y;
				var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
				var ax1 = dx1/dist1;
				var ay1 = dy1/dist1;
				if (dist1 < 40){				
					self.x += ax1 / (dist1 / 70); //Higher number is greater push
					updateThugList.push({id:self.id,property:"x",value:self.x})
					self.y += ay1 / (dist1 / 70);
					updateThugList.push({id:self.id,property:"y",value:self.y});
				}				
			}
		}
	}
		
	self.moveThug = function(){
		var target = getEntityById(self.targetId);
		if (target == 0){
			return;
		}
		var dist1 = getDistance(self, target);
		var ax1 = (self.x - target.x)/dist1;
		var ay1 = (self.y - target.y)/dist1;
		if (dist1 > 5){
			if (self.team != target.team){
				self.x -= ax1 * thugSpeed;
				self.y -= ay1 * thugSpeed;
			}
			else if (self.team == target.team && dist1 > 75){
				self.x -= ax1 * thugSpeed;
				self.y -= ay1 * thugSpeed;
			}
			updateThugList.push({id:self.id,property:"x",value:self.x});
			updateThugList.push({id:self.id,property:"y",value:self.y});
		}

		self.rotation = Math.atan2((self.y - target.y),(self.x - target.x)) + 4.71239;
		updateThugList.push({id:self.id,property:"rotation",value:self.rotation});
	}
	
	self.evaluateTarget = function(){
		if (self.reevaluateTargetTimer > 0){
			self.reevaluateTargetTimer--;
		}
		if (self.reevaluateTargetTimer <= 0){			
			self.targetId = 0;
			self.closestTargetDist = 999999;
			
			for (var i in Player.list){
				if (Player.list[i].cloak < 0.2){
					checkIfClosestToThug(self, Player.list[i]);
				}
			}
			for (var i in Thug.list){
				checkIfClosestToThug(self, Thug.list[i]);
			}			
			self.reevaluateTargetTimer = 30;
		}
	}//End self.evaluateTarget	
	
	self.checkForThugStab = function(){
		var target = getEntityById(self.targetId);
		if (self.closestTargetDist < 60 && target.health > 0 && target.team != self.team){
			self.attacking = thugAttackDelay;
			target.health -= thugDamage * damageScale; //scale damage
			if (Player.list[target.id]){
				updatePlayerList.push({id:target.id,property:"health",value:target.health});
				if (target.health <= 0){
					kill(target, target.shootingDir, 0);
				}
				target.healDelay += healDelayTime;
				if (target.healDelay > healDelayTime){target.healDelay = healDelayTime;} //Ceiling on healDelay
			}
			else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"health",value:target.health});}
				
			var bloodDir = 7;
			if (target.x < self.x){
				bloodDir = 3;
			}

			sprayBloodOntoTarget(bloodDir, target.x, target.y, target.id);				
			self.legHeight = -94;
			updateThugList.push({id:self.id,property:"legHeight",value:self.legHeight});				
		}					
	}
	
	self.checkForBlockCollision = function(){
		for (var i in Block.list){
			if (self.x > Block.list[i].x && self.x < Block.list[i].x + Block.list[i].width && self.y > Block.list[i].y && self.y < Block.list[i].y + Block.list[i].height){												
				if (Block.list[i].type == "normal" || Block.list[i].type == "red" || Block.list[i].type == "blue"){	
					//absolutevalue		
					var overlapTop = Math.abs(Block.list[i].y - self.y);  
					var overlapBottom = Math.abs((Block.list[i].y + Block.list[i].height) - self.y);
					var overlapLeft = Math.abs(self.x - Block.list[i].x);
					var overlapRight = Math.abs((Block.list[i].x + Block.list[i].width) - self.x);
					
					if (overlapTop <= overlapBottom && overlapTop <= overlapRight && overlapTop <= overlapLeft){
						self.y = Block.list[i].y;
						updateThugList.push({id:self.id,property:"y",value:self.y});				
					}
					else if (overlapBottom <= overlapTop && overlapBottom <= overlapRight && overlapBottom <= overlapLeft){
						self.y = Block.list[i].y + Block.list[i].height;
						updateThugList.push({id:self.id,property:"y",value:self.y});				
					}
					else if (overlapLeft <= overlapTop && overlapLeft <= overlapRight && overlapLeft <= overlapBottom){
						self.x = Block.list[i].x;
						updateThugList.push({id:self.id,property:"x",value:self.x});				
					}
					else if (overlapRight <= overlapTop && overlapRight <= overlapLeft && overlapRight <= overlapBottom){
						self.x = Block.list[i].x + Block.list[i].width;
						updateThugList.push({id:self.id,property:"x",value:self.x});				
					}
				}
				else if (Block.list[i].type == "pushUp"){
					self.y -= pushStrength;
					if (self.y < Block.list[i].y){self.y = Block.list[i].y;}
					updatePlayerList.push({id:self.id,property:"y",value:self.y});
				}
				else if (Block.list[i].type == "pushRight"){
					self.x += pushStrength;
					if (self.x > Block.list[i].x + Block.list[i].width){self.x = Block.list[i].x + Block.list[i].width;}
					updatePlayerList.push({id:self.id,property:"x",value:self.x});
				}
				else if (Block.list[i].type == "pushDown"){
					self.y += pushStrength;
					if (self.y > Block.list[i].y + Block.list[i].height){self.y = Block.list[i].y + Block.list[i].height;}
					updatePlayerList.push({id:self.id,property:"y",value:self.y});
				}
				else if (Block.list[i].type == "pushLeft"){
					self.x -= pushStrength;
					if (self.x < Block.list[i].x){self.x = Block.list[i].x;}
					updatePlayerList.push({id:self.id,property:"x",value:self.x});
				}
			}//End is entity overlapping block
		}
	}

	self.swingLegs = function(){
		if (self.targetId != 0 && self.attacking == 0){
			if (self.legSwingForward == true){
				self.legHeight += 7 * 1.3;
				updateThugList.push({id:self.id,property:"legHeight",value:self.legHeight});
				if (self.legHeight > 94){
					self.legSwingForward = false;
					updateThugList.push({id:self.id,property:"legSwingForward",value:self.legSwingForward});
				}
			}
			else if (self.legSwingForward == false){
				self.legHeight -= 7 * 1.3;
				updateThugList.push({id:self.id,property:"legHeight",value:self.legHeight});
				if (self.legHeight < -94){
					self.legSwingForward = true;
					updateThugList.push({id:self.id,property:"legSwingForward",value:self.legSwingForward});
				}
			}
		}
	}//End self.swinglegs
	self.standThereAwkwardly = function(){
		if (self.legHeight != 45){
			self.legHeight = 45;
			updateThugList.push({id:self.id,property:"legHeight",value:self.legHeight});
		}
	}
	
	self.checkForDeathAndRespawn = function(){
		if (self.health <= 0){		
			if (self.respawnTimer <= 0){
				respawnThug(self);
			}
			else {
				self.respawnTimer--;
			}
		}
	}
}//End Thug


		
Thug.list = [];
function checkIfClosestToThug(thug, target){
	if (target.id != thug.id && target.team != thug.team){
		var dist1 = getDistance(thug, target);
		if (dist1 < thug.closestTargetDist && dist1 < thugSightDistance && target.health > 0){
			thug.closestTargetDist = dist1;
			if (thug.targetId != target.id){
				thug.targetId = target.id;
			}
		}
	}
}


function respawnThug(thug){
	thug.attacking = 0;
	thug.targetId = 0;
	thug.pushSpeed = 0;
	spawnSafely(thug);
	thug.health = thugHealth;
	updateThugList.push({id:thug.id,property:"x",value:thug.x});
	updateThugList.push({id:thug.id,property:"y",value:thug.y});
	updateThugList.push({id:thug.id,property:"health",value:thug.health});
	thug.respawnTimer = 600;
	//delete Thug.list[thug.id];

}

function spawnSafely(entity){
	if (entity.team == "black"){
		var potentialX = 0;
		var potentialY = 0;

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
				if (Player.list[i].team != entity.team && Player.list[i].health > 0 && potentialX >= Player.list[i].x - threatSpawnRange && potentialX <= Player.list[i].x + threatSpawnRange && potentialY >= Player.list[i].y - threatSpawnRange && potentialY <= Player.list[i].y + threatSpawnRange){																		
					safeToSpawn = false;
				}
			}
			for (var i in Thug.list){
				if (Thug.list[i].team != entity.team && Thug.list[i].health > 0 && potentialX >= Thug.list[i].x - threatSpawnRange && potentialX <= Thug.list[i].x + threatSpawnRange && potentialY >= Thug.list[i].y - threatSpawnRange && potentialY <= Thug.list[i].y + threatSpawnRange){																		
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
		
		entity.x = potentialX;
		entity.y = potentialY;
	}
	else if (entity.team == "white"){
		var potentialX = 0;
		var potentialY = 0;


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
				if (Player.list[i].team != entity.team && Player.list[i].health > 0 && potentialX >= Player.list[i].x - threatSpawnRange && potentialX <= Player.list[i].x + threatSpawnRange && potentialY >= Player.list[i].y - threatSpawnRange && potentialY <= Player.list[i].y + threatSpawnRange){																		
					safeToSpawn = false;
				}
			}
			for (var i in Thug.list){
				if (Thug.list[i].team != entity.team && Thug.list[i].health > 0 && potentialX >= Thug.list[i].x - threatSpawnRange && potentialX <= Thug.list[i].x + threatSpawnRange && potentialY >= Thug.list[i].y - threatSpawnRange && potentialY <= Thug.list[i].y + threatSpawnRange){																		
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

		entity.x = potentialX;
		entity.y = potentialY;
	}
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
	var potentialX = 0;
	var potentialY = 0;
	
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

var Block = function(x, y, width, height, type){	
	x *= 75;
	y *= 75;
	width *= 75;
	height *= 75;

	var self = {
		id:Math.random(),
		x:x,
		y:y,
		width:width,
		height:height,
		type:type,
	}		
	Block.list[self.id] = self;
}//End Block Function
Block.list = [];

var Pickup = function(id, x, y, type, amount, respawnTime){
	if (respawnTime > -1){
		x-=1;
		y-=1;
		x *= 75;
		y *= 75;
	}
	
	var self = {
		id:id,
		x:x,
		y:y,
		type:type,
		amount:amount,
		width:0,
		height:0,
		respawnTime: respawnTime, //Initialize this as -1 if the pickup is a non-respawning "one time drop" like from a fallen player
		respawnTimer: 0,
	}		
	if (self.type == 1){
		self.width = 41;
		self.height = 41;
	}
	else if (self.type == 2){
		self.width = 41;
		self.height = 41;
	}
	else if (self.type == 3){
		self.width = 67;
		self.height = 25;
	}
	else if (self.type == 4){
		self.width = 61;
		self.height = 32;
	}
	else if (self.type == 5){
		self.width = 41;
		self.height = 56;
	}
	else if (self.type == 6){
		self.width = 0;
		self.height = 0;
	}

	if (respawnTime > -1){
		self.x += (75/2) - self.width/2;
		self.y += (75/2) - self.height/2;
	}
	

	
	Pickup.list[self.id] = self;
}//End Pickup Function
Pickup.list = [];


//////////INITIALIZE MAP///////////////////// Create Blocks new block Create Pickups new pickups
initializeBlocks(map);
initializePickups(map);


///////////////////////////CREATE THUGS/////////////////

//var thug = Thug(Math.random(), "white", 50, 50);	

//var BMBlackBlock = Block(Math.random(), mapWidth/2 - 250, mapHeight/2 - 37, 500, 75);

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

function checkForGameOver(){
	//GAME IS OVER, GAME END, ENDGAME GAMEOVER GAME OVER
	//End by time
	if (gameOver == false){	
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
//------------------------------------------------------------------------------


var secondsSinceLastServerSync = syncServerWithDbInterval - 2;
var secondsSinceOnlineTimestampUpdate = 0;
var secondsSinceStaleRequestCheck = 0;
var currentStreamingDay = new Date().getUTCDate();
//EVERY 1 SECOND
setInterval( 
	function(){
		if (pause == true)
			return;
	
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
				checkForUnhealthyServers();
			}
			else {
				syncGameServerWithDatabase();
			}			
			secondsSinceLastServerSync = 0;
		}		
		
		//Remove stale requests
		secondsSinceStaleRequestCheck++;
		if (secondsSinceStaleRequestCheck > staleRequestCheckInterval){
			if (isWebServer){
				removeStaleFriendRequests();
				removeStalePartyRequests();
			}
			secondsSinceStaleRequestCheck = 0;
		}
		
		//Set Player onlineTimestamp
		secondsSinceOnlineTimestampUpdate++;
		if (secondsSinceOnlineTimestampUpdate > updateOnlineTimestampInterval){
			updateOnlineTimestampForUsers();
			secondsSinceOnlineTimestampUpdate = 0;
		}
		
		//Check if next UTC day for updating log file folder (reinitialize stream)
		if (currentStreamingDay != new Date().getUTCDate()){
			reinitStream();
			currentStreamingDay = new Date().getUTCDate();
		}		

	},
	1000/1 //Ticks per second
);


function checkForUnhealthyServers(){
	//logg("Checking for dead servers on server DB...");	
	db.RW_SERV.find().sort({serverNumber: 1}, function(err,res){
		if (res && res[0]){
			for (var i = 0; i < res.length; i++){
				var serverLastHealthCheck = new Date(res[i].healthCheckTimestamp);
				var acceptableLastHealthCheckTime = new Date();
				acceptableLastHealthCheckTime.setSeconds(acceptableLastHealthCheckTime.getUTCSeconds() - serverHealthCheckTimestampThreshold);
				//Should delete url:null here as well !!!!
				if (serverLastHealthCheck < acceptableLastHealthCheckTime){
					logg("DEAD SERVER FOUND: " + res[i].url + ". [" + serverLastHealthCheck.toISOString() + " is less than " + acceptableLastHealthCheckTime.toISOString() + ". Current time is " + new Date().toISOString() + "] Removing...");
					dbGameServerRemove(res[i].url);
				}
			}					
		}
	});
}

function removeIndexesFromArray(array, indexes){
	for (var i = indexes.length-1; i >= 0; i--){
		array.splice(indexes[i],1);
	}
	return array;
}

function syncGameServerWithDatabase(){	
	if (myIP == ""){
		logg("WARNING - Unable to get server IP. Retrying in " + syncServerWithDbInterval + " seconds...");
		return;
	}
	//logg("Syncing server with Database...");
	db.RW_SERV.find({url:myUrl}, function(err,res){
		if (res && res[0]){
			//log("Server " + myUrl + " present in IN_SERV. Grabbing server config...");
			serverNumber = res[0].serverNumber;
			if (gametype == "ctf"){
				serverName = "Capture_" + serverNumber + "_" + port;
			}
			else if (gametype == "slayer"){
				serverName = "Deathmatch_" + serverNumber + "_" + port;
			}
			
			//serverName = res[0].serverName;

			
			//These source of truth are the DB. Be sure to differentiate these from the ones that should be written to DB from server values
			maxPlayers = res[0].maxPlayers;
			voteGametype = res[0].voteGametype;
			voteMap = res[0].voteMap;
			if (res[0].gametype == "slayer" || res[0].gametype == "ctf"){
				gametype = res[0].gametype;
			}
			
			var healthyTimestamp = new Date();
			if (res[1]){ //More than one entry found for this URL. Remove all, and add just one.				
				dbGameServerRemoveAndAdd();
			}	
			else {
				dbGameServerUpdate();
				
				//Check for stale incoming users
				var incomingUsers = res[0].incomingUsers || [];
				var usersToRemove = [];
				var miliInterval = (staleOnlineTimestampThreshold /2 * 1000); //Stale incoming player threshold is half of online timestamp threshold
				var thresholdDate = new Date(Date.now() - miliInterval);


				
				for (var u = 0; u < incomingUsers.length; u++){
					if (incomingUsers[u].timestamp < thresholdDate){
						usersToRemove.push(u);
					}
				}
				incomingUsers = removeIndexesFromArray(incomingUsers, usersToRemove);	

			
				dbGameServerUpdateParams({incomingUsers:incomingUsers});
			}			
		}
		else {
			//Server url does not exist
			logg('Server does not exist');
			db.RW_SERV.find().sort({serverNumber: -1}, function(err,res){
				if (res && res[0]){
					serverNumber = res[0].serverNumber;
					serverNumber++;						
				}
				else {
					logg('There are no servers live');
				}

				//SERVER CONFIG BASED ON PORT
				//string contains includes
				if (port.toString().indexOf('01') > -1) {
					serverName = "Capture_" + serverNumber + "_" + port;
					gametype = "ctf";
					voteGametype = false;
				}
				else if (port.toString().indexOf('02') > -1) {
					serverName = "Deathmatch_" + serverNumber + "_" + port;
					gametype = "slayer";
					voteGametype = false;
				}
				else if (port.toString().indexOf('03') > -1) {
					serverName = "PlayersChoice_" + serverNumber + "_" + port;
					gametype = "ctf";
					voteGametype = true;
				}
				else if (port.toString().indexOf('04') > -1) {
					serverName = "PlayersChoice_" + serverNumber + "_" + port;
					gametype = "slayer";
					voteGametype = true;
				}
				else {
					serverName = "PlayersChoice_" + serverNumber + "_" + port;
				}
				console.log("ADDING SERVER WITH NO PARAMS");
				dbGameServerAdd();
			});
		}
	});
}

//------------------------------------------------------------------------------
//Handy handy functions

function parseINIString(data){
    var regex = {
        section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
        param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
        comment: /^\s*;.*$/
    };
    var value = {};
    var lines = data.split(/[\r\n]+/);
    var section = null;
    lines.forEach(function(line){
        if(regex.comment.test(line)){
            return;
        }else if(regex.param.test(line)){
            var match = line.match(regex.param);
            if(section){
                value[section][match[1]] = match[2];
            }else{
                value[match[1]] = match[2];
            }
        }else if(regex.section.test(line)){
            var match = line.match(regex.section);
            value[match[1]] = {};
            section = match[1];
        }else if(line.length == 0 && section){
            section = null;
        };
    });
    return value;
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getProgressBarPercentage(value, floor, ceiling){
	value -= floor;
	ceiling -= floor;	
	return Math.round((value/ceiling) * 1000) / 1000;
}

function getFullRankName(rank){
	switch(rank) {
		case "bronze1":
			return "Bronze I";
		case "bronze2":
			return "Bronze II";
		case "bronze3":
			return "Bronze III";
		case "silver1":
			return "Silver I";
		case "silver2":
			return "Silver II";
		case "silver3":
			return "Silver III";
		case "gold1":
			return "Gold I";
		case "gold2":
			return "Gold II";
		case "gold3":
			return "Gold III";
		case "diamond":
			return "Diamond";
		case "diamond2":
			return "Super Diamond";
		default:
			return "Bronze I";
	}
}


function getDistance(entity1, entity2){
		var dx1 = entity1.x - entity2.x;
		var dy1 = entity1.y - entity2.y;
		return Math.round(Math.sqrt(dx1*dx1 + dy1*dy1) * 10)/10;	
}

// This one works
function checkIfBlocking(object, pointA, pointB){
	//intersect with top side of block?
	if (line_intersects(pointA.x, pointA.y, pointB.x, pointB.y, object.x, object.y, (object.x + object.width), object.y)){
		return true;
	}
	//intersect with bottom side of block?
	else if (line_intersects(pointA.x, pointA.y, pointB.x, pointB.y, object.x, (object.y + object.height), (object.x + object.width), (object.y + object.height))){
		return true;
	}
	//intersect with left side of block?
	else if (line_intersects(pointA.x, pointA.y, pointB.x, pointB.y, object.x, object.y, object.x, (object.y + object.height))){
		return true;
	}
	//intersect with right side of block?
	else if (line_intersects(pointA.x, pointA.y, pointB.x, pointB.y, (object.x + object.width), object.y, (object.x + object.width), (object.y + object.height))){
		return true;
	}
	//intersect with mid x axis of block? //for glitch where SG shoots through blocks if shooter & target are both up against block
	if (line_intersects(pointA.x, pointA.y, pointB.x, pointB.y, object.x, (object.y + object.height/2), (object.x + object.width), (object.y + object.height/2))){
		return true;
	}
	//intersect with mid y axis of block? //for glitch where SG shoots through blocks if shooter & target are both up against block
	else if (line_intersects(pointA.x, pointA.y, pointB.x, pointB.y, (object.x + object.width/2), object.y, (object.x + object.width/2), (object.y + object.height))){
		return true;
	}
	return false;
}

function line_intersects(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y) {

    var s1_x, s1_y, s2_x, s2_y;
    s1_x = p1_x - p0_x;
    s1_y = p1_y - p0_y;
    s2_x = p3_x - p2_x;
    s2_y = p3_y - p2_y;

    var s, t;
    s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
    t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

    if (s > 0 && s < 1 && t > 0 && t < 1)
    {
        return true;
    }
	
    return false; // No collision
}

function isNumBetween(numBetween, num1, num2){
	if (num1 <= numBetween && numBetween <= num2){
		return true;
	}
	else if (num1 >= numBetween && numBetween >= num2){
		return true;
	}
	return false
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function randomInt(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}
function log(msg) {
	msg = msg.toString();
	if (debug){
		var d = new Date();
		var hours = d.getUTCHours();
		if (hours <= 9){hours = "0" + hours;}
		var minutes = d.getUTCMinutes();
		if (minutes <= 9){minutes = "0" + minutes;}
		var seconds = d.getUTCSeconds();
		if (seconds <= 9){seconds = "0" + seconds;}
		
		var logMsgText = hours + ':' + minutes + '.' + seconds + '> ' + msg;
		console.log(logMsgText);	
		if (s3stream){
			s3stream.write(logMsgText+'\r\n');
		}
	}
}

function logObj(obj){
	if (debug){
		log(util.format(obj));
	}
}

function logg(msg) {
	log(msg);
}
