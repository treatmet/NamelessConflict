global.express = require('express');
global.app = express();
global.serv = require('http').Server(app);


global.fs = require('fs');
global.util = require('util');

global.config = require("../settings.json");

//--------------------------------SERVER CONFIGURATION-----------------------------------------------------
global.debug = true;
global.httpOnlyCookies = false;
global.allowDuplicateUsername = false;
global.allowServerCommands = true;

global.syncServerWithDbInterval = 15; //Seconds //Both sync and check for stale thresholds

global.staleOnlineTimestampThreshold = 60; //Seconds

global.pcMode = 2; //1 = no, 2= yes

//Cash Values for Events
global.killCash = 100;
global.doubleKillCash = 200;
global.tripleKillCash = 300;
global.quadKillCash = 400;
global.spreeCash = 250;
global.frenzyCash = 500;
global.rampageCash = 750;
global.unbelievableCash = 1000;
global.thugCash = 25;
global.assassinationCash = 150;
global.stealCash = 50;
global.captureCash= 300;
global.killEnemyBagHolder = 150;
global.returnCash = 100;
global.winCash = 1000;
global.loseCash = 100;
global.mvpCash = 300;
global.hitCash = 5;

//Shop config
global.shopEnabled = false;
global.invincibleInShop = false;
global.shop = {
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


//Player config
global.startingCash = 0;
global.boostAmount = 24;
global.boostDecay = 1;
global.playerMaxSpeed = 5;
global.playerAcceleration = 1;
global.rechargeDelayTime = 150; //Double for breaking under zero energy
global.healDelayTime = 300;
global.healRate = 10; //Milisecond delay between heal tick after player already started healing (Higher number is slower heal)
global.respawnTimeLimit = 180;
global.slayerRespawnTimeLimit = 5 * 60; //seconds (translated to frames)
global.ctfRespawnTimeLimit = 7 * 60; //seconds (translated to frames)
global.bagDrag = 0.85;
//Cloaking config
global.cloakingEnabled = true;
global.cloakDrainSpeed = 0.09;
global.cloakDrag = 0.5; //Walking speed multiplier when cloaked
global.cloakInitializeSpeed = 0.02;
global.cloakDeinitializeSpeed = 0.1;
global.playerMaxHealth = 175;
global.AfkFramesAllowed = 6000 * 60; //seconds (translated to frames) //timeout

//Weapons config
global.bulletRange = 19 * 75;
global.damageScale = 1;
	global.pistolDamage = 10;
	global.pistolSideDamage = 10; //Stacks on above
	global.pistolBackDamage = 20; //Stacks AGAIN on above
	global.mgDamage = 12; 
	global.mgSideDamage = 12; //Stacks on above
	global.mgBackDamage = 24; //Stacks AGAIN on above
	global.SGDamage = 30;
	global.SGSideDamage = 30;
	global.SGBackDamage = 60;
	global.friendlyFireDamageScale = 0.5;
	global.boostDamage = 50;
	
global.SGRange = 310;
global.SGCloseRangeDamageScale = 4;
global.SGPushSpeed = 12;
global.MGPushSpeed = 2;

global.DPClipSize = 20;
global.MGClipSize = 45;
global.SGClipSize = 6;

global.pistolFireRateLimiter = true;	
global.pistolFireRate = 12;
global.DPFireRate = 12;
global.MGFireRate = 5;
global.SGFireRate = 50;

global.maxSGAmmo = 24;
global.maxDPAmmo = 40;
global.maxMGAmmo = 90;

global.cloakBonusDamage = 20;

global.staggerScale = 0.60;
global.staggerTime = 20;

global.damagePushScale = 2;
global.pushMaxSpeed = 35;

global.allowBagWeapons = false;

//thug Config
global.spawnOpposingThug = true; //Whether or not to spawn an opposing thug for each player who enters the game
global.thugSightDistance = 600;
global.thugHealth = 80;
global.thugDamage = 50;
global.thugSpeed = 4;
global.thugAttackDelay = 30;
global.thugLimit = 2; //Limit on how many thugs can appear before ALL thugs are wiped off map (for performance concerns)


//Map Config
global.threatSpawnRange = 400;
global.pushStrength = 15; //Push block strength

//Rating config
global.matchWinLossRatingBonus = 30;
global.enemySkillDifferenceDivider = 20;

//----------------------SERVER GLOBAL VARIABLES---------------------------------
global.myIP = "";
global.myUrl = "";
global.port = '3001';
global.serverHomePage = "/";
global.myQueryString = "";
global.instanceId = "local";

//Game global variables
global.pause = false;
global.minutesLeft = 9;
global.secondsLeft = 99;
global.nextGameTimer = 20;
global.gameMinutesLength = 5;
global.gameSecondsLength = 0;
global.map = "longest";
global.gametype = "ctf";
global.maxPlayers = 4;
global.isWebServer = false;
global.isLocal = false;
global.privateServer = false;
global.scoreToWin = 0;
global.serverNumber = 1;
global.serverName = "Server";
global.voteGametype = true;
global.voteMap = true;
global.ctfVotes = 0;
global.slayerVotes = 0;
global.thePitVotes = 0;
global.longestVotes = 0;
global.crikVotes = 0;
global.voteMapIds = [];
global.voteGametypeIds = [];
global.timeBeforeNextGame = 145; //newGameTimer

global.bagRed = {
	homeX:0,
	homeY:0,
	x:0,
	y:0,
	captured:false,
	speed:0,
	direction:0,
	playerThrowing:0,
};

global.bagBlue = {
	homeX:0,
	homeY:0,
	x:0,
	y:0,
	captured:false,
	speed:0,
	direction:0,
	playerThrowing:0,
};

global.whiteScore = 0;
global.blackScore = 0;

global.pregame = true;
global.gameOver = false;

//Map global variables
global.mapWidth = 0;
global.mapHeight = 0;

global.warp1X = 0;
global.warp1Y = 0;
global.warp2X = 0;
global.warp2Y = 0;

global.spawnXminBlack = 0;
global.spawnXmaxBlack = 0;
global.spawnYminBlack = 0;
global.spawnYmaxBlack = 0;

global.spawnXminWhite = 0;
global.spawnXmaxWhite = 0;
global.spawnYminWhite = 0;
global.spawnYmaxWhite = 0;

//Update packs
global.updatePlayerList = [];
global.updateThugList = [];
global.updateNotificationList = [];
global.updatePickupList = [];
global.updateEffectList = [];
global.updateMisc = {};

global.SOCKET_LIST = [];
