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
global.allowServerCommands = false;

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
global.elimDeathCash = 50;
global.multikillTimer = 4.5 * 60;
global.startingCash = 50;

//Post game Voting
global.ctfVotes = 0;
global.slayerVotes = 0;
global.ffaVotes = 0;
global.elimVotes = 0;
global.thePitVotes = 0;
global.longestVotes = 0;
global.whirlpoolVotes = 0;
global.crikVotes = 0;
global.narrowsVotes = 0;
global.longNarrowsVotes = 0;
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

//Server settings
global.minutesLeft = 9;
global.secondsLeft = 99;
global.scoreToWin = 3;
global.nextGameTimer = 20;
global.timeBeforeNextGame = 45; //newGameTimer
global.timeBeforeNextRound = 20; //roundTimer
global.gameMinutesLength = 5;
global.gameSecondsLength = 0;
global.map = "longest";
global.gametype = "elim";
global.freeForAll = false;
global.maxPlayers = 14;
global.bootOnAfk = true;
global.AfkFramesAllowed = 60 * 60; //seconds (translated to frames) //timeout

//Player config player settings
global.framesOfAiming = 60;
global.boostAmount = 19;
global.playerMaxSpeed = 5;
global.playerAcceleration = 1;
global.diagMovementScale = (2/3);
global.maxEnergyMultiplier = 1;
global.rechargeDelayTime = 120; //Double for breaking under zero energy
global.healDelayTime = 300;
global.healRate = 5; //Milisecond delay between heal tick after player already started healing (Higher number is slower heal) //regenSpeed healthRegenSpeed
global.respawnTimeLimit = 3 * 60;
global.slayerRespawnTimeLimit = 3 * 60; //seconds (translated to frames)
global.ctfRespawnTimeLimit = 5 * 60; //seconds (translated to frames)
global.elimRespawnTimeLimit = 2 * 60; //seconds (translated to frames)
global.bagDrag = 0.85;
global.playerMaxHealth = 175;
global.assistDamageThreshold = 30;
global.grappleSpeed = 20;
global.grappleStrength = 3;
global.grappleLength = 5 * 75; //Tiles * 75

global.grenadeEnergyCost = 30;
global.grenadeTimer = 2 * 60; //Seconds (translated to frames)
global.grenadeThrowSpeed = 18;
global.grenadeDrag = 0.2;
global.grenadeExplosionSize = 400;
global.grenadeDamage = 30;
global.grenadeDamageScale = 1;
global.grenadePower = 0.5;
global.grenadeRaySpeed = 8;
global.grenadeResource = true;
global.grenadeRechargeSpeed = 0.2; // out of 100
global.maxGrenades = 3;

//Boost config
global.boostDamage = 34;
global.boostEnergyCost = 25;
global.meleeRange = 50;


//Block config
global.blockPushSpeed = 4;

global.clientSideMovement = true;



/*
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
*/


//Cloaking config
global.cloakingEnabled = true;
global.cloakDrainSpeed = 0.12;
global.cloakDrag = 0.5; //Walking speed multiplier when cloaked
global.cloakInitializeSpeed = 0.02;
global.cloakDeinitializeSpeed = cloakInitializeSpeed * 5;


//Weapons config
global.damageScale = 1;
	global.pistolDamage = 12;
	global.pistolSideDamage = pistolDamage/2 +2; //Stacks on above
	global.pistolBackDamage = pistolDamage/2 +4; //Stacks AGAIN on above
	global.DPDamage = 12;
	global.DPSideDamage = DPDamage/2; //Stacks on above
	global.DPBackDamage = DPDamage/2; //Stacks AGAIN on above
	global.mgDamage = 8; 
	global.mgSideDamage = mgDamage/2; //Stacks on above
	global.mgBackDamage = mgDamage/2; //Stacks AGAIN on above
	global.SGDamage = 30;
	global.SGSideDamage = SGDamage/2;
	global.SGBackDamage = SGDamage/2;
	global.LaserDamage = 250;
	global.friendlyFireDamageScale = 0.25;
	global.cloakBonusDamage = 20;

global.allyDamageWarningThreshold = 50;

global.startingWeapon = 1;
global.bulletRange = 19 * 75;
global.laserRange = 22 * 75;
global.laserSecondShotTimer = 10; //In frames
global.SGRange = 310;
global.SGCloseRangeDamageScale = 4;
global.SGPushSpeed = 12;
global.laserPushSpeed = 36;
global.laserOffsetX = 9;
global.MGPushSpeed = 2;
global.speedCap = 45; //Maxspeed max speed


global.pistolFireRateLimiter = true;	
global.pistolFireRate = 12;
global.DPFireRate = 12;
global.MGFireRate = 5;
global.SGFireRate = 50;
global.laserFireRate = 50;
global.laserMaxCharge = 150;

global.PClipSize = 15;
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


//Shop config
global.shopEnabled = true;
global.invincibleInShop = false;
global.shop = {
	active:false,
	selection:3,
	price1:100,
	price2:150,
	price3:50,
	price4:100,
	price5:150,	
	price6:200,	
	amount1:MGClipSize,
	amount2:SGClipSize,
	amount3:DPClipSize,
	amount4:laserClipSize,
	amount5:75,	
	amount6:100,	
	uniqueTextTimer:0,
	uniqueText:"",
	purchaseEffectTimer:0,
};


//thug Config
global.spawnOpposingThug = true; //Whether or not to spawn an opposing thug for each player who enters the game
global.thugSightDistance = 600;
global.thugHealth = 80;
global.hordeThugHealth = 15;
global.thugDamage = 50;
global.thugSpeed = 3;
global.thugAttackDelay = 30;
global.maxThugs = 50;

//Map Config
global.threatSpawnRange = 500;
global.pushStrength = 14; //Push block strength

//Rating config
global.matchWinLossRatingBonus = 30;
global.enemySkillDifferenceDivider = 30;
global.ratingCalcThresh = 200; //Rating threshold for team rating evaluation
global.minWinPointsGained = 5;
global.timeInGameRankingThresh = 60; //seconds
global.abandonLimit = 5; //seconds


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
global.serverPassword = "";
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
global.roundOver = false;

//Map global variables
global.mapWidth = 0;
global.mapHeight = 0;

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
global.updateGrenadeList = [];
global.updateMisc = {};

global.SOCKET_LIST = [];

global.sharedSettings = { //Initial 1 time only config settings
	grenadeTimer: grenadeTimer,
	grenadeThrowSpeed: grenadeThrowSpeed,
	grenadeDrag:grenadeDrag,
	grenadeExplosionSize:grenadeExplosionSize,
	grenadeDamage:grenadeDamage,
	grenadeDamageScale:grenadeDamageScale,
	grenadePower:grenadePower,
	grappleSpeed:grappleSpeed,
	pushStrength:pushStrength,
	blockPushSpeed:blockPushSpeed,
	speedCap:speedCap,
	clientSideMovement:clientSideMovement,
	laserMaxCharge:laserMaxCharge,
	grenadeResource:grenadeResource,
	grenadeRechargeSpeed:grenadeRechargeSpeed,
	maxGrenades:maxGrenades,
};

// map = "horde";
// gametype = "horde";
// playerMaxSpeed = 15;
// spawnOpposingThug = false; //Whether or not to spawn an opposing thug for each player who enters the game
