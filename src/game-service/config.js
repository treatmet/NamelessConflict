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
global.staleCustomGameThreshold = 60 * 60; // Seconds trans to frames

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
global.assistCash = 50;
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
global.multikillTimer = 4.5 * 60;

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
global.startingCash = 0;

//Post game Voting
global.ctfVotes = 0;
global.slayerVotes = 0;
global.thePitVotes = 0;
global.longestVotes = 0;
global.crikVotes = 0;
global.voteRebalanceTeamsYes = 0;
global.voteRebalanceTeamsNo = 0;
global.voteRebalanceTeamsIds = [];
global.voteMapIds = [];
global.voteGametypeIds = [];

// Changeble Settings 
//-------------------------------------------------------------------------------------
global.voteGametype = true;
global.voteMap = true;
global.voteRebalance = true;
global.pregameIsHorde = true;

//Horde settings
global.hordeKills = 0;
global.hordeGlobalBest = 0;
global.hordeGlobalBestNames = "RTPM3";
global.personalHordeMode = true;

global.minutesLeft = 9;
global.secondsLeft = 99;
global.scoreToWin = 0;
global.nextGameTimer = 20;
global.timeBeforeNextGame = 45; //newGameTimer
global.gameMinutesLength = 5;
global.gameSecondsLength = 0;
global.map = "longest";
global.gametype = "ctf";
global.freeForAll = false;
global.maxPlayers = 14;
global.bootOnAfk = true;
global.AfkFramesAllowed = 60 * 60; //seconds (translated to frames) //timeout

//Player config
global.framesOfAiming = 60;
global.boostAmount = 19;
global.playerMaxSpeed = 5;
global.playerAcceleration = 1;
global.diagMovementScale = (2/3);
global.maxEnergyMultiplier = 1;
global.rechargeDelayTime = 120; //Double for breaking under zero energy
global.healDelayTime = 300;
global.healRate = 7; //Milisecond delay between heal tick after player already started healing (Higher number is slower heal)
global.respawnTimeLimit = 3 * 60;
global.slayerRespawnTimeLimit = 3 * 60; //seconds (translated to frames)
global.ctfRespawnTimeLimit = 5 * 60; //seconds (translated to frames)
global.bagDrag = 0.85;
global.playerMaxHealth = 175;
global.assistDamageThreshold = 30;

//Cloaking config
global.cloakingEnabled = true;
global.cloakDrainSpeed = 0.12;
global.cloakDrag = 0.5; //Walking speed multiplier when cloaked
global.cloakInitializeSpeed = 0.02;
global.cloakDeinitializeSpeed = 0.1;


//Weapons config
global.damageScale = 1;
	global.pistolDamage = 10;
	global.pistolSideDamage = 6; //Stacks on above
	global.pistolBackDamage = 10; //Stacks AGAIN on above
	global.DPDamage = 12;
	global.DPSideDamage = DPDamage/2; //Stacks on above
	global.DPBackDamage = DPDamage/2; //Stacks AGAIN on above
	global.mgDamage = 9; 
	global.mgSideDamage = mgDamage/2; //Stacks on above
	global.mgBackDamage = mgDamage/2; //Stacks AGAIN on above
	global.SGDamage = 30;
	global.SGSideDamage = SGDamage/2;
	global.SGBackDamage = SGDamage/2;
	global.LaserDamage = 250;
	global.friendlyFireDamageScale = 0.5;
	global.boostDamage = 50;
	global.cloakBonusDamage = 20;
	
global.startingWeapon = 1;
global.bulletRange = 19 * 75;
global.laserRange = 19 * 75;
global.SGRange = 310;
global.SGCloseRangeDamageScale = 4;
global.SGPushSpeed = 12;
global.laserPushSpeed = 36;
global.laserOffsetX = 9;
global.MGPushSpeed = 2;
global.speedCap = 45;


global.pistolFireRateLimiter = true;	
global.pistolFireRate = 12;
global.DPFireRate = 12;
global.MGFireRate = 5;
global.SGFireRate = 50;
global.laserFireRate = 50;
global.laserMaxCharge = 150;

global.DPClipSize = 15;
global.MGClipSize = 60;
global.SGClipSize = 6;
global.laserClipSize = 5;
global.maxSGAmmo = SGClipSize*3;
global.maxDPAmmo = DPClipSize*3;
global.maxMGAmmo = MGClipSize*2;
global.maxLaserAmmo = 10;
global.infiniteAmmo = false;

global.staggerScale = 0.60;
global.staggerTime = 20;
global.damagePushScale = 2;
global.pushMaxSpeed = 35;

global.allowBagWeapons = false;

//thug Config
global.spawnOpposingThug = true; //Whether or not to spawn an opposing thug for each player who enters the game
global.thugSightDistance = 600;
global.thugHealth = 80;
global.hordeThugHealth = 15;
global.thugDamage = 50;
global.thugSpeed = 3;
global.thugAttackDelay = 30;
global.thugLimit = 2; //Limit on how many thugs can appear before ALL thugs are wiped off map (for performance concerns)


//Map Config
global.threatSpawnRange = 500;
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
global.isWebServer = false;
global.isLocal = false;
global.isTest = false; //No need to flip manually
global.pause = false;

global.privateServer = false;
global.customServer = false;
global.serverName = "Ranked";
global.createdByCognitoSub = "";


global.bannedCognitoSubs = [];
global.allowedCognitoSubs = [];
global.abandoningCognitoSubs = [];

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

// map = "horde";
// gametype = "horde";
// playerMaxSpeed = 15;
// spawnOpposingThug = false; //Whether or not to spawn an opposing thug for each player who enters the game
