page = "game";
initializePage();
function initializePage(){
	getTokenFromUrlParameterAndLogin(); 	
}

function voteCTF(){
	socket.emit("voteEndgame", myPlayer.id, "gametype", "ctf");
	document.getElementById("voteCTF").disabled = true;
	document.getElementById("voteDeathmatch").disabled = true;	
}

function voteDeathmatch(){
	socket.emit("voteEndgame", myPlayer.id, "gametype", "slayer");
	document.getElementById("voteCTF").disabled = true;
	document.getElementById("voteDeathmatch").disabled = true;	
}

function voteLongest(){
	socket.emit("voteEndgame", myPlayer.id, "map", "longest");
	document.getElementById("voteLongest").disabled = true;
	document.getElementById("voteCrik").disabled = true;
	document.getElementById("voteThePit").disabled = true;	
}

function voteThePit(){
	socket.emit("voteEndgame", myPlayer.id, "map", "thepit");
	document.getElementById("voteLongest").disabled = true;
	document.getElementById("voteCrik").disabled = true;
	document.getElementById("voteThePit").disabled = true;	
}
				
function voteCrik(){
	socket.emit("voteEndgame", myPlayer.id, "map", "crik");
	document.getElementById("voteLongest").disabled = true;
	document.getElementById("voteCrik").disabled = true;
	document.getElementById("voteThePit").disabled = true;	
}

socket.on('votesUpdate', function(votesData){
	document.getElementById("voteCTF").innerHTML = "CTF - [" + votesData.ctfVotes + "]";
	document.getElementById("voteDeathmatch").innerHTML = "Deathmatch - [" + votesData.slayerVotes + "]";	
	document.getElementById("voteLongest").innerHTML = "Longest - [" + votesData.longestVotes + "]";
	document.getElementById("voteThePit").innerHTML = "The Pit - [" + votesData.thePitVotes + "]";	
	document.getElementById("voteCrik").innerHTML = "Battle Creek - [" + votesData.crikVotes + "]";
});


var debugTimer = 60;
var debugText = true;
//'use strict';


//-----------------Config----------------------
var version = "v 0.4.5"; //Post cognito


var screenShakeScale = 0.5;
var drawDistance = 10; 
var bodyLimit = 16;
var legSwingSpeed = 1;

//Offset is how many pixels away from the center the camera will go when aiming, greater value means player closer to edge of screen
var camOffSet = 350;//doestn do anything
var diagCamOffSet = 200;
var camMaxSpeed = 300;
var camAccelerationMultiplier = 2;
var shiftCamOffSet = 450;
var shiftDiagCamOffSet = 325;
var zoom = 0.75;

const maxCloakStrength = 0.99;
const maxAlliedCloakOpacity = .2; 
const BODY_AGE = 1500;

var shopEnabled = false;

//Player Config
var SGTriggerTapLimitTimer = 50;

//Chat Config
var hideChatTimer = 800;

//-----------------Variables-------------------

//Document Variables and Initialization
var ctx = document.getElementById("ctx").getContext("2d", { alpha: false });
var canvas = document.getElementById("ctx");

ctx.font = 'bold 11px Electrolize';
ctx.textAlign="center";
ctx.lineWidth=4;

var gameStartAlpha = 0;
var suddenDeathAlpha = 0;
var energyRedAlpha = 1.0;

var chatText = document.getElementById("chat-text");
var chatInput = document.getElementById("chat-input");
var chatForm = document.getElementById("chat-form");
var chatStale = 0;

var	showStatOverlay = false;

var spectatingPlayerId = "";

var canvasDiv = document.getElementById("canvasDiv"); 

var map = "map2";
var gametype = "ctf";
var scoreToWin = 0;
var timeLimit = true; //true for time limit victory condition, false if score limit victory condition.
var minutesLeft = "9";
var secondsLeft = "99";
var nextGameTimer = 0;
var	ping = 999;

var lowGraphicsMode = true;
var noShadows = false;

//Initialize client-side code variables



function normalShadow() {
	if (noShadows){
		noShadow();
		return;
	}
	ctx.shadowColor = "black";
	ctx.shadowOffsetX = 2; 
	ctx.shadowOffsetY = 2;
	if (lowGraphicsMode){
		ctx.shadowBlur = 0;		
	}
	else {
		ctx.shadowBlur = 4;
	}
}
function noShadow() {
	ctx.shadowColor = "black";
	ctx.shadowOffsetX = 0; 
	ctx.shadowOffsetY = 0;
	ctx.shadowBlur = 0;
}
function heavyCenterShadow() {
	noShadow();
	return;
	
	//Heavy center shadows disabled under all circumstances
	/*
	ctx.shadowColor = "black";
	ctx.shadowOffsetX = 0; 
	ctx.shadowOffsetY = 0;
	if (lowGraphicsMode){
		ctx.shadowBlur = 0;		
	}
	else {
		ctx.shadowBlur = 20;
	}
	*/
}
function smallCenterShadow() {
	//noShadow();
	//return;
	//return;
	
	//Small center shadows disabled under all circumstances
	ctx.shadowColor = "black";
	ctx.shadowOffsetX = 0; 
	ctx.shadowOffsetY = 0;
	ctx.shadowBlur = 3;
}
function largeCenterShadow() {
	if (noShadows){
		noShadow();
		return;
	}
	ctx.shadowColor = "black";
	ctx.shadowOffsetX = 0; 
	ctx.shadowOffsetY = 0;
	if (lowGraphicsMode){
		ctx.shadowBlur = 0;		
	}
	else {
		ctx.shadowBlur = 4;
	}
}
normalShadow();

var canvasWidth = parseInt(document.getElementById("ctx").width); //1100
var canvasHeight = parseInt(document.getElementById("ctx").height); //900
var centerX = canvasWidth/2; //450
var centerY = canvasHeight/2; //400
var targetCenterX = canvasWidth/2; //450
var targetCenterY = canvasWidth/2; //450
var cameraX = 0; //This defines the upper-left XY coord of the camera. For camera center, add canvasWidth/2 and canvasHeight/2
var cameraY = 0;

var screenShakeCounter = 0;

var mapWidth = 2000;
var mapHeight = 1500;

var whiteScoreHeight = 36;
var blackScoreHeight = 36;
var clockHeight = 30;
var victoryPumpSize = 118;

var whiteScore = 0;
var blackScore = 0;

var bagRed = {
	homeX: 0,
	homeY:0,
	x:150,
	y:150,
	captured:false,
};

var bagBlue = {
	homeX: 0,
	homeY:0,
	x:mapWidth - 150,
	y:mapHeight -150,
	captured:false,
};

socket.on('pingResponse', function (socketId){
	if (Player.list[socketId]){
		ping = stopStopwatch();
		waitingOnPing = false;
	}		
});

var blinkOn = false;
socket.on('sendClock', function(secondsLeftPlusZeroData, minutesLeftData){
	if (myPlayer.name == "" || !Player.list[myPlayer.id])
		return;
		
	minutesLeft = minutesLeftData;
	secondsLeft = secondsLeftPlusZeroData;
	if (minutesLeft > 0 || secondsLeft > 0){suddenDeath = false; suddenDeathAlpha = 1;}
	
	if (parseInt(minutesLeft)*60 + parseInt(secondsLeftPlusZeroData) == 60 && !mute){
		sfxTimeWarning.play();
		clockHeight = 266;
	}
	//log("CLOCK timeLimit:" + timeLimit.toString());
	var timerleft = parseInt(minutesLeft)*60 + parseInt(secondsLeftPlusZeroData);
	//log("timeleft:" + timerleft);
	if (parseInt(minutesLeft)*60 + parseInt(secondsLeftPlusZeroData) == 0 && suddenDeath == false && blackScore == whiteScore && timeLimit == true && !mute){
		sfxSuddenDeath.play();
		suddenDeath = true;
	}
	
	//Border (blink on flag stolen)
	if (myPlayer.team == "white" && bagRed.captured == true && blinkOn == false){
		canvas.style.margin = "-5px";
		canvas.style.border = "5px solid #FF0000";
		blinkOn = true;
	}
	else if (myPlayer.team == "black" && bagBlue.captured == true && blinkOn == false){
		canvas.style.margin = "-5px";
		canvas.style.border = "5px solid #FF0000";
		blinkOn = true;
	}
	else {
		determineBorderStyle();
		blinkOn = false;
	}

});

function determineBorderStyle(){
	canvas.style.margin = "-2px";
	canvas.style.border = "2px solid #000000";
	if (myPlayer.health >= 175){
		canvas.style.margin = "-5px";
		canvas.style.border = "5px solid #005b98";						
	}
	else if (myPlayer.health >= 150){
		canvas.style.margin = "-4px";
		canvas.style.border = "4px solid #005b98";						
	}
	else if (myPlayer.health >= 125){
		canvas.style.margin = "-3px";
		canvas.style.border = "3px solid #005b98";						
	}
	else if (myPlayer.health >= 101){
		canvas.style.margin = "-1px";
		canvas.style.border = "1px solid #005b98";			
	}
}

var shop = {
	active:false,
	selection:0,
	price1:0,
	price2:0,
	price3:0,
	price4:0,
	price5:0,	
	uniqueTextTimer:0,
	uniqueText:"",
	purchaseEffectTimer:0,
};

var arrowsGoingOut = true;
var leftArrowX = 77;
var rightArrowX = 480;
var pickupFlash = 1.0;

var gameOver = false;
var pregame = true;
var suddenDeath = false;

var healthFlashTimer = 100;

//----------------Loading Images----------------
var Img = {};
Img.block = new Image();
Img.block.src = "/client/img/block.png";
Img.redBlock = new Image();
Img.redBlock.src = "/client/img/blockRed.png";
Img.blueBlock = new Image();
Img.blueBlock.src = "/client/img/blockBlue.png";
Img.pushUpBlock = new Image();
Img.pushUpBlock.src = "/client/img/blockPushUp.png";
Img.pushRightBlock = new Image();
Img.pushRightBlock.src = "/client/img/blockPushRight.png";
Img.pushDownBlock = new Image();
Img.pushDownBlock.src = "/client/img/blockPushDown.png";
Img.pushLeftBlock = new Image();
Img.pushLeftBlock.src = "/client/img/blockPushLeft.png";
Img.warp1 = new Image();
Img.warp1.src = "/client/img/beam1.png";
Img.warp2 = new Image();
Img.warp2.src = "/client/img/beam2.png";
Img.warp3 = new Image();
Img.warp3.src = "/client/img/beam3.png";
Img.warp4 = new Image();
Img.warp4.src = "/client/img/beam4.png";
Img.tile = new Image();
Img.tile.src = "/client/img/factory-floor.png";
Img.tileWhite = new Image();
Img.tileWhite.src = "/client/img/factory-floor-white.png";
Img.tileBlack = new Image();
Img.tileBlack.src = "/client/img/factory-floor-black.png";
Img.statOverlay = new Image();
Img.statOverlay.src = "/client/img/stat-overlay.png";
Img.statArrow = new Image();
Img.statArrow.src = "/client/img/arrow.png";
Img.statCamera = new Image();
Img.statCamera.src = "/client/img/cameraIconScoreboard.png";
Img.mute = new Image();
Img.mute.src = "/client/img/mute.png";
Img.yellow = new Image();
Img.yellow.src = "/client/img/yellow.png";
Img.orange = new Image();
Img.orange.src = "/client/img/orange.png";
Img.lightGreen = new Image();
Img.lightGreen.src = "/client/img/light-green.png";
Img.lightYellow = new Image();
Img.lightYellow.src = "/client/img/light-yellow.png";
Img.redLaser = new Image();
Img.redLaser.src = "/client/img/red-pixel-trans.png";
Img.spectatingOverlay = new Image();
Img.spectatingOverlay.src = "/client/img/spectating-overlay.png";


Img.redFlash = new Image();
Img.redFlash.src = "/client/img/red-flash.png";
Img.whiteFlash = new Image();
Img.whiteFlash.src = "/client/img/white-flash.png";
Img.smashRed = new Image();
Img.smashRed.src = "/client/img/smash-red.png";
Img.smashBlue = new Image();
Img.smashBlue.src = "/client/img/smash-blue.png";
Img.smashYellow = new Image();
Img.smashYellow.src = "/client/img/smash-yellow.png";
Img.smashGreen = new Image();
Img.smashGreen.src = "/client/img/smash-green.png";

Img.boostBlast = new Image();
Img.boostBlast.src = "/client/img/shot-flash.png";


Img.blackPlayerPistol = new Image();
Img.blackPlayerPistol.src = "/client/img/blackPlayerPistolNaked.png";
Img.blackPlayerPistolReloading1 = new Image();
Img.blackPlayerPistolReloading1.src = "/client/img/blackPlayerPistolReloading1.png";
Img.blackPlayerPistolReloading2 = new Image();
Img.blackPlayerPistolReloading2.src = "/client/img/blackPlayerPistolReloading2.png";
Img.blackPlayerPistolReloading3 = new Image();
Img.blackPlayerPistolReloading3.src = "/client/img/blackPlayerPistolReloading3.png";
Img.blackPlayerPistolReloading4 = new Image();
Img.blackPlayerPistolReloading4.src = "/client/img/blackPlayerPistolReloading4.png";
Img.blackPlayerDP = new Image();
Img.blackPlayerDP.src = "/client/img/blackPlayerDP.png";
Img.blackPlayerDPReloading1 = new Image();
Img.blackPlayerDPReloading1.src = "/client/img/blackPlayerDPReloading1.png";
Img.blackPlayerDPReloading2 = new Image();
Img.blackPlayerDPReloading2.src = "/client/img/blackPlayerDPReloading2.png";
Img.blackPlayerDPReloading3 = new Image();
Img.blackPlayerDPReloading3.src = "/client/img/blackPlayerDPReloading3.png";
Img.blackPlayerMGReloading1 = new Image();
Img.blackPlayerMGReloading1.src = "/client/img/blackPlayerMGReloading1.png";
Img.blackPlayerMGReloading2 = new Image();
Img.blackPlayerMGReloading2.src = "/client/img/blackPlayerMGReloading2.png";
Img.blackPlayerMGReloading3 = new Image();
Img.blackPlayerMGReloading3.src = "/client/img/blackPlayerMGReloading3.png";
Img.blackPlayerMGReloading4 = new Image();
Img.blackPlayerMGReloading4.src = "/client/img/blackPlayerMGReloading4.png";
Img.blackPlayerMGReloading5 = new Image();
Img.blackPlayerMGReloading5.src = "/client/img/blackPlayerMGReloading5.png";
Img.bloodyBorder = new Image();
Img.bloodyBorder.src = "/client/img/bloody-border.png";

Img.whitePlayerPistol = new Image();
Img.whitePlayerPistol.src = "/client/img/whitePlayerPistolNaked.png";
Img.whitePlayerPistolReloading1 = new Image();
Img.whitePlayerPistolReloading1.src = "/client/img/whitePlayerPistolReloading1.png";
Img.whitePlayerPistolReloading2 = new Image();
Img.whitePlayerPistolReloading2.src = "/client/img/whitePlayerPistolReloading2.png";
Img.whitePlayerPistolReloading3 = new Image();
Img.whitePlayerPistolReloading3.src = "/client/img/whitePlayerPistolReloading3.png";
Img.whitePlayerPistolReloading4 = new Image();
Img.whitePlayerPistolReloading4.src = "/client/img/whitePlayerPistolReloading4.png";
Img.whitePlayerDP = new Image();
Img.whitePlayerDP.src = "/client/img/whitePlayerDP.png";
Img.whitePlayerDPReloading1 = new Image();
Img.whitePlayerDPReloading1.src = "/client/img/whitePlayerDPReloading1.png";
Img.whitePlayerDPReloading2 = new Image();
Img.whitePlayerDPReloading2.src = "/client/img/whitePlayerDPReloading2.png";
Img.whitePlayerDPReloading3 = new Image();
Img.whitePlayerDPReloading3.src = "/client/img/whitePlayerDPReloading3.png";
Img.whitePlayerMGReloading1 = new Image();
Img.whitePlayerMGReloading1.src = "/client/img/whitePlayerMGReloading1.png";
Img.whitePlayerMGReloading2 = new Image();
Img.whitePlayerMGReloading2.src = "/client/img/whitePlayerMGReloading2.png";
Img.whitePlayerMGReloading3 = new Image();
Img.whitePlayerMGReloading3.src = "/client/img/whitePlayerMGReloading3.png";
Img.whitePlayerMGReloading4 = new Image();
Img.whitePlayerMGReloading4.src = "/client/img/whitePlayerMGReloading4.png";
Img.whitePlayerMGReloading5 = new Image();
Img.whitePlayerMGReloading5.src = "/client/img/whitePlayerMGReloading5.png";
Img.blackPlayerMG = new Image();
Img.blackPlayerMG.src = "/client/img/blackPlayerMG.png";
Img.whitePlayerMG = new Image();
Img.whitePlayerMG.src = "/client/img/whitePlayerMG.png";
Img.whitePlayerSG = new Image();
Img.whitePlayerSG.src = "/client/img/whitePlayerSG.png";
Img.whitePlayerSGCock = new Image();
Img.whitePlayerSGCock.src = "/client/img/whitePlayerSGCock.png";
Img.whitePlayerSGReloading1 = new Image();
Img.whitePlayerSGReloading1.src = "/client/img/whitePlayerSGReloading1.png";
Img.whitePlayerSGReloading2 = new Image();
Img.whitePlayerSGReloading2.src = "/client/img/whitePlayerSGReloading2.png";
Img.whitePlayerSGReloading3 = new Image();
Img.whitePlayerSGReloading3.src = "/client/img/whitePlayerSGReloading3.png";
Img.blackPlayerSG = new Image();
Img.blackPlayerSG.src = "/client/img/blackPlayerSG.png";
Img.blackPlayerSGCock = new Image();
Img.blackPlayerSGCock.src = "/client/img/blackPlayerSGCock.png";
Img.blackPlayerSGReloading1 = new Image();
Img.blackPlayerSGReloading1.src = "/client/img/blackPlayerSGReloading1.png";
Img.blackPlayerSGReloading2 = new Image();
Img.blackPlayerSGReloading2.src = "/client/img/blackPlayerSGReloading2.png";
Img.blackPlayerSGReloading3 = new Image();
Img.blackPlayerSGReloading3.src = "/client/img/blackPlayerSGReloading3.png";

Img.shot = new Image();
Img.shot.src = "/client/img/shot-streak2.png";
Img.shotFlash = new Image();
Img.shotFlash.src = "/client/img/shot-flash.png";
Img.shotSpark = new Image();
Img.shotSpark.src = "/client/img/shot-spark.png";
Img.shotShotgun = new Image();
Img.shotShotgun.src = "/client/img/shotgun-shot.png";


Img.ammo9mm = new Image();
Img.ammo9mm.src = "/client/img/ammo-9mm-30.png";
Img.ammoMG = new Image();
Img.ammoMG.src = "/client/img/ammo-MG-60.png";
Img.ammoDP = new Image();
Img.ammoDP.src = "/client/img/ammo-double-9mm-30.png";
Img.ammoSG = new Image();
Img.ammoSG.src = "/client/img/ammo-SG-24.png";
var ammoWidth = 0;
Img.infinity = new Image();
Img.infinity.src = "/client/img/infinity.png";
Img.weapon1Key = new Image();
Img.weapon1Key.src = "/client/img/1p.png";
Img.weapon2Key = new Image();
Img.weapon2Key.src = "/client/img/2dp.png";
Img.weapon3Key = new Image();
Img.weapon3Key.src = "/client/img/3mg.png";
Img.weapon4Key = new Image();
Img.weapon4Key.src = "/client/img/4sg.png";


Img.pickupDP = new Image();
Img.pickupDP.src = "/client/img/DPammo.png";
Img.pickupDP2 = new Image();
Img.pickupDP2.src = "/client/img/DPammo2.png";
Img.pickupSG = new Image();
Img.pickupSG.src = "/client/img/SGammo.png";
Img.pickupSG2 = new Image();
Img.pickupSG2.src = "/client/img/SGammo2.png";
Img.pickupMG = new Image();
Img.pickupMG.src = "/client/img/MGammo.png";
Img.pickupMG2 = new Image();
Img.pickupMG2.src = "/client/img/MGammo2.png";
Img.pickupBA = new Image();
Img.pickupBA.src = "/client/img/BAammo.png";
Img.pickupBA2 = new Image();
Img.pickupBA2.src = "/client/img/BAammo2.png";
Img.pickupMD = new Image();
Img.pickupMD.src = "/client/img/MDammo.png";
Img.pickupMD2 = new Image();
Img.pickupMD2.src = "/client/img/MDammo2.png";


Img.blackPlayerLegs = new Image();
Img.blackPlayerLegs.src = "/client/img/blackPlayerLegs.png";
Img.whitePlayerLegs = new Image();
Img.whitePlayerLegs.src = "/client/img/whitePlayerLegs.png";
Img.blackPlayerLegs2 = new Image();
Img.blackPlayerLegs2.src = "/client/img/blackPlayerLegs2.png";
Img.whitePlayerLegs2 = new Image();
Img.whitePlayerLegs2.src = "/client/img/whitePlayerLegs2.png";
	
Img.blood1 = new Image();
Img.blood1.src = "/client/img/blood1.png";
Img.blood2 = new Image();
Img.blood2.src = "/client/img/blood2.png";
Img.blood3 = new Image();
Img.blood3.src = "/client/img/blood3.png";
Img.blood4 = new Image();
Img.blood4.src = "/client/img/blood4.png";

Img.bodyBlack = new Image();
Img.bodyBlack.src = "/client/img/body-black.png";
Img.bodyWhite = new Image();
Img.bodyWhite.src = "/client/img/body-white.png";
Img.bodyBlackWall1 = new Image();
Img.bodyBlackWall1.src = "/client/img/body-black-wall1.png";
Img.bodyWhiteWall1 = new Image();
Img.bodyWhiteWall1.src = "/client/img/body-white-wall1.png";
Img.bloodPool = new Image();
Img.bloodPool.src = "/client/img/blood-pool.png";

Img.blackThugTorso = new Image();
Img.blackThugTorso.src = "/client/img/blackThugTorso.png";
Img.blackThugLegs = new Image();
Img.blackThugLegs.src = "/client/img/blackThugLegs.png";
Img.blackThugLegs2 = new Image();
Img.blackThugLegs2.src = "/client/img/blackThugLegs2.png";
Img.whiteThugTorso = new Image();
Img.whiteThugTorso.src = "/client/img/whiteThugTorso.png";
Img.whiteThugLegs = new Image();
Img.whiteThugLegs.src = "/client/img/whiteThugLegs.png";
Img.whiteThugLegs2 = new Image();
Img.whiteThugLegs2.src = "/client/img/whiteThugLegs2.png";

Img.bagRed = new Image();
Img.bagRed.src = "/client/img/bag-white-fist.png";
Img.bagRedStrap = new Image();
Img.bagRedStrap.src = "/client/img/bag-black-strap.png";
Img.bagBlue = new Image();
Img.bagBlue.src = "/client/img/bag-black-fist.png";
Img.bagBlueStrap = new Image();
Img.bagBlueStrap.src = "/client/img/bag-black-strap.png";
Img.bagMissing = new Image();
Img.bagMissing.src = "/client/img/bag-missing.png";

Img.bmDoorWhite = new Image();
Img.bmDoorWhite.src = "/client/img/black-market-white.png";
Img.bmDoorBlack = new Image();
Img.bmDoorBlack.src = "/client/img/black-market-black.png";
Img.shopEB2 = new Image();
Img.shopEB2.src = "/client/img/shop-eb2.png";
Img.shopBA2 = new Image();
Img.shopBA2.src = "/client/img/shop-ba2.png";
Img.shopDP2 = new Image();
Img.shopDP2.src = "/client/img/shop-dp2.png";
Img.shopSG2 = new Image();
Img.shopSG2.src = "/client/img/shop-sg2.png";
Img.shopMG2 = new Image();
Img.shopMG2.src = "/client/img/shop-mg2.png";
Img.downArrow = new Image();
Img.downArrow.src = "/client/img/down-arrow-small.png";
Img.rightArrow = new Image();
Img.rightArrow.src = "/client/img/right-arrow-small.png";
Img.leftArrow = new Image();
Img.leftArrow.src = "/client/img/left-arrow-small.png";
Img.upArrow = new Image();
Img.upArrow.src = "/client/img/up-arrow-small.png";
Img.shopInventory = new Image();
Img.shopInventory.src = "/client/img/shop-inventory.png";
Img.spy = new Image();
Img.spy.src = "/client/img/spy-new.png";

Img.black50 = new Image();
Img.black50.src = "/client/img/black50.png";
Img.white = new Image();
Img.white.src = "/client/img/white.png";
Img.red = new Image();
Img.red.src = "/client/img/red.png";
Img.energyRed = new Image();
Img.energyRed.src = "/client/img/energy-red.png";

Img.bronze1 = new Image();
Img.bronze1.src = "/client/img/ranks/full-size/bronze1.png";
Img.bronze2 = new Image();
Img.bronze2.src = "/client/img/ranks/full-size/bronze2.png";
Img.bronze3 = new Image();
Img.bronze3.src = "/client/img/ranks/full-size/bronze3.png";
Img.silver1 = new Image();
Img.silver1.src = "/client/img/ranks/full-size/silver1.png";
Img.silver2 = new Image();
Img.silver2.src = "/client/img/ranks/full-size/silver2.png";
Img.silver3 = new Image();
Img.silver3.src = "/client/img/ranks/full-size/silver3.png";
Img.gold1 = new Image();
Img.gold1.src = "/client/img/ranks/full-size/gold1.png";
Img.gold2 = new Image();
Img.gold2.src = "/client/img/ranks/full-size/gold2.png";
Img.gold3 = new Image();
Img.gold3.src = "/client/img/ranks/full-size/gold3.png";
Img.diamond = new Image();
Img.diamond.src = "/client/img/ranks/full-size/diamond.png";
Img.diamond2 = new Image();
Img.diamond2.src = "/client/img/ranks/full-size/diamond2.png";

//-----------------------------Loading Sounds-------------------------------
var mute = true;

var sfxPistol = new Howl({src: ['/client/sfx/pistol.mp3']});
var sfxMG = new Howl({src: ['/client/sfx/mgShot.mp3']});
var sfxDP = new Howl({src: ['/client/sfx/double_pistolsLoud.mp3']});
var sfxSG = new Howl({src: ['/client/sfx/shotgun.mp3']});
var sfxCapture = new Howl({src: ['/client/sfx/capture1.mp3']});
var sfxHit1 = new Howl({src: ['/client/sfx/hit1.mp3']});
//sfxHit1.volume(.5);
var sfxHit2 = new Howl({src: ['/client/sfx/hit2.mp3']});
var sfxKill = new Howl({src: ['/client/sfx/kill.mp3']});
sfxKill.volume(.8);
var sfxStealGood = new Howl({src: ['/client/sfx/drumroll.mp3']});
var sfxStealBad = new Howl({src: ['/client/sfx/steal2.mp3']});
sfxStealGood.volume(0.75);
sfxStealBad.volume(0.75);
var sfxBagGrab = new Howl({src: ['/client/sfx/bagGrab.mp3']});
sfxBagGrab.volume(.6);
var sfxTimeWarning = new Howl({src: ['/client/sfx/30sec.mp3']});
sfxTimeWarning.volume(.7);
var sfxSuddenDeath = new Howl({src: ['/client/sfx/suddenDeath.mp3']});

var sfxPistolReload = new Howl({src: ['/client/sfx/pistolReload.mp3']});
var sfxDPReload = new Howl({src: ['/client/sfx/DPReload.mp3']});
var sfxMGReload = new Howl({src: ['/client/sfx/MGReload.mp3']});
var sfxSGReload1 = new Howl({src: ['/client/sfx/SGReload3.mp3']});
var sfxSGReload2 = new Howl({src: ['/client/sfx/SGReload4.mp3']});
var sfxSGReload3 = new Howl({src: ['/client/sfx/SGReload2.mp3']});
var sfxSGReload4 = new Howl({src: ['/client/sfx/SGReload1.mp3']});

var sfxPistolEquip = new Howl({src: ['/client/sfx/Pistolequip2.mp3']});
var sfxDPEquip = new Howl({src: ['/client/sfx/dpPick.mp3']});
var sfxMGEquip = new Howl({src: ['/client/sfx/MGequip.mp3']});
var sfxSGEquip = new Howl({src: ['/client/sfx/SGequipLoud.mp3']});

var sfxClick = new Howl({src: ['/client/sfx/click.mp3']});
var sfxHealthPackGrab = new Howl({src: ['/client/sfx/healthPackGrab.mp3']});
sfxHealthPackGrab.volume(.5);
var sfxWeaponDrop = new Howl({src: ['/client/sfx/weaponDrop2.mp3']});
sfxWeaponDrop.volume(.3);

var sfxPurchase = new Howl({src: ['/client/sfx/purchase.mp3']});
var sfxError = new Howl({src: ['/client/sfx/error2.mp3']});
var sfxMenuMove = new Howl({src: ['/client/sfx/comp-beep.wav']});
sfxMenuMove.volume(.5);

var sfxWhoosh = new Howl({src: ['/client/sfx/whoosh.mp3']});
sfxWhoosh.volume(.25);
var sfxPunch = new Howl({src: ['/client/sfx/punch.mp3']});
var sfxCharge = new Howl({src: ['/client/sfx/recharge-plus-halo.mp3']});
sfxCharge.volume(.7);
var sfxDecharge = new Howl({src: ['/client/sfx/decharge-loud.mp3']});
sfxDecharge.volume(.6);
var sfxBoost = new Howl({src: ['/client/sfx/boost5.mp3']});
var sfxBoostEmpty = new Howl({src: ['/client/sfx/boostEmpty.mp3']});
sfxBoostEmpty.volume(1);
var sfxCloak = new Howl({src: ['/client/sfx/cloak2.mp3']});
sfxCloak.volume(.6);
var sfxWarp = new Howl({src: ['/client/sfx/warp.mp3']});

var sfxNextGameTimer = new Howl({src: ['/client/sfx/haloStartBeeps.mp3']});
var sfxLevelUp = new Howl({src: ['/client/sfx/gsLevelUp.mp3']});
sfxLevelUp.volume(.7);

var sfxDefeatMusic = new Howl({src: ['/client/sfx/music/theme-sad-short.mp3']});
var sfxVictoryMusic = new Howl({src: ['/client/sfx/music/theme-victory-short.mp3']});
sfxDefeatMusic.volume(.3);
sfxVictoryMusic.volume(.3);
var sfxProgressBar = new Howl({src: ['/client/sfx/progressBar.mp3']});
sfxProgressBar.volume(.25);
var sfxProgressBarReverse = new Howl({src: ['/client/sfx/progressBarReverse.mp3']});
sfxProgressBarReverse.volume(.25);


//-----------------------------PLAYER INITIALIZATION-------------------------------
var numPlayers = 0;
var myPlayer = {
	id:0,
	name:"",
	x:0,
	y:0,
	cash:1,
	kills:0,
	deaths:0,
	steals:0,
	returns:0,
	captures:0,
	pressingDown:false,
	pressingUp:false,
	pressingLeft:false,
	pressingRight:false,
	pressingW:false,
	pressingA:false,
	pressingS:false,
	pressingD:false,
	pressingShift:false,
};


var Player = function(id){
	var self = {
		id:id,
		name:"",
		x:0,
		y:0,	
		height:94,
		width:94,
		reloading:0,
		triggerTapLimitTimer:0,
	}
	Player.list[id] = self;
}
Player.list = [];
var orderedPlayerList = [];

function updateOrderedPlayerList(){
	var blackPlayers = [];
	var whitePlayers = [];		
	for (var a in Player.list){
		if (Player.list[a].team == "white"){
			whitePlayers.push(Player.list[a]);
		}
		else if (Player.list[a].team == "black"){
			blackPlayers.push(Player.list[a]);
		}
	}
	whitePlayers.sort(compare);
	blackPlayers.sort(compare);
	whitePlayers.push.apply(whitePlayers, blackPlayers);	
	orderedPlayerList = whitePlayers;
}

function getNextOrderedPlayer(playerId, previous){ //previous is a bool designating if requesting previous player (true) or next player (false)
	for (var p = 0; p < orderedPlayerList.length; p++){
		if (orderedPlayerList[p].id == playerId){
			if (previous){
				if (typeof orderedPlayerList[p-1] != 'undefined'){
					spectatingPlayerId = orderedPlayerList[p-1].id;
					return;
				}
				else if (typeof orderedPlayerList[orderedPlayerList.length-1] != 'undefined'){ //last in the player list
					spectatingPlayerId = orderedPlayerList[orderedPlayerList.length-1].id;
					return;
				}
			}
			else { ////!previous
				if (typeof orderedPlayerList[p+1] != 'undefined'){
					spectatingPlayerId = orderedPlayerList[p+1].id;
					return;
				}
				else if (typeof orderedPlayerList[0] != 'undefined'){
					spectatingPlayerId = orderedPlayerList[0].id;
					return;
				}
			}
		}
	}
	if (typeof orderedPlayerList[0] != 'undefined'){
		spectatingPlayerId = orderedPlayerList[0].id;
		return;
	}
	else {
		spectatingPlayerId = ""; //Center map
	}	
}

socket.on('removePlayer', function(id){
	logg("REMOVING PLAYER: " + id);
	if (Player.list[id]){
		delete Player.list[id];
	}
});

//-----------------------------THUG INITIALIZATION-------------------------------
var Thug = function(id){
	var self = {
		id:id,
		team:"black",
		x:0,
		y:0,	
		health:100,
		legHeight:47,
		legSwingForward:true,
		rotation:0,
		height:94,
		width:94,
	}
	Thug.list[id] = self;
}
Thug.list = {};

socket.on('removeThug', function(id){
	if (Thug.list[id]){
		delete Thug.list[id];
	}
});

//-----------------------------BLOCK INITIALIZATION-------------------------------
var Block = function(id){
	var self = {
		id:0,
		x:0,
		y:0,	
		width:1,
		height:1,
		type:"normal",
	}
	Block.list[id] = self;
}
Block.list = [];


var Pickup = function(id){
	var self = {
		id:id,
		x:0,
		y:0,
		type:0,
		amount:0,
		respawnTimer: 0,
	}		
	Pickup.list[id] = self;
}//End Pickup Function
Pickup.list = [];


//-----------------------------POINTS NOTIFICATION-------------------------------
var Notification = function(notificationText,playerId){
	var self = {
		id:Math.random(),
		playerId:playerId,
		text:notificationText,
		age:0,
		yOffset:0,
	}
	//Check for other notifications, update yOffset accordingly.
	for (var n in Notification.list){
		if (Notification.list[n].playerId == playerId && Notification.list[n].age < 10){
			self.yOffset +=25;
		}		
	}
		
	Notification.list[self.id] = self;
}
Notification.list = {};


//----------------------Login-----------------
logg('Game code initialization');

socket.on('signInResponse', function(data){
	if(data.success){
		///////////////////////// INITIALIZE ////////////////////////		
		myPlayer.id = data.id;
		mapWidth = data.mapWidth;
		mapHeight = data.mapHeight;
		showCanvas();
		whiteScore = data.whiteScore;
		blackScore = data.blackScore;	
		logg("ID: " + myPlayer.id);
		mute = false;
	}
	else {
		alert(data.message);
	}
});

socket.on('killScore', function(team, dataWhiteScore, dataBlackScore){
	whiteScore = dataWhiteScore;
	blackScore = dataBlackScore;
});

socket.on('capture', function(team, dataWhiteCaptures, dataBlackCaptures){
	whiteScore = dataWhiteCaptures;
	blackScore = dataBlackCaptures;
	if (team == "white"){
		whiteScoreHeight = 266;
	}
	else if (team == "black"){
		blackScoreHeight = 266;
	}
	else {
		blackScoreHeight = 266;
		whiteScoreHeight = 266;
	}
	if (!mute)
		sfxCapture.play();
});

socket.on('gameStart', function(){
	gameOver = false;
	pregame = false;
	suddenDeath = false;
	gameStartAlpha = 1.0;
	suddenDeathAlpha = 1.0;
	document.getElementById("voteMenu").style.display = 'none';
	sfxDefeatMusic.volume(.3);
	sfxVictoryMusic.volume(.3);
	sfxVictoryMusic.stop();
	sfxDefeatMusic.stop();
	sfxProgressBar.stop();
	drawMapElementsOnMapCanvas();
	drawBlocksOnBlockCanvas();
	resetPostGameProgressVars();


	/*
	for (var i=0; i<chatText.childNodes.length; i++){
		chatText.childNodes[i].remove();
	}
	*/
});



/////////////////////////////// INITIALIZE /////////////////////////////////	
function showCanvas() {
	canvasDiv.style.display = '';
	canvasDiv.style.backgroundColor="rgb(21,21,21)";
	document.getElementById("leftMenu").style.display = 'inline-block';	
	document.getElementById("rightMenu").style.display = 'inline-block';
}

//----------------Chat Functionality----------------

for (var i=0; i<chatText.childNodes[i].length; i++){
		chatText.childNodes[i].remove();
}
chatText.innerHTML = '<div class="chatElement" style="font-weight:600">Welcome to R-Wars!</div>';

socket.on('addToChat', function(data, playerId){
var color = "#FFFFFF";
	if (Player.list[playerId]){
		if (Player.list[playerId].team == "white"){
			color = "#e09f9f";
		}
		else if (Player.list[playerId].team == "black"){
			color = "#93b3d8";
		}
	}
	addToChat(data, color);
});

socket.on('addMessageToChat', function(text){
	addToChat(text, "#FFFFFF");
});

var maxChatMessages = 9;

function addToChat(data, color){
	var nodes = chatText.childNodes.length;
	for (var i=0; i<nodes - (maxChatMessages - 1); i++){
		chatText.childNodes[i].remove();
	}
	chatText.innerHTML = chatText.innerHTML + '<div class="chatElement" style="color:' + color + ';">' + data + '</div>';
	chatStale = 0;			
}

socket.on('evalAnswer', function(data){
	if (data)
		logg(data);	
});

chatForm.onsubmit = function(e){
	e.preventDefault();
}

socket.on('sfx', function(sfx){
	if (!mute)
		eval(sfx + ".play();");	
});


//----------------Player Functionality----------------
socket.on('sendPlayerNameToClient',function(data){
	myPlayer.name = data;
	logg("My name is " + myPlayer.name + ". Id: " + myPlayer.id);
});

function getRotation(direction){
		var rotateData;			
		if (direction == 1){rotateData = 0;}
		if (direction == 3){rotateData = 90*Math.PI/180;}
		if (direction == 5){rotateData = 180*Math.PI/180;}
		if (direction == 7){rotateData = 270*Math.PI/180;}
		if (direction == 2){rotateData = 45*Math.PI/180;}
		if (direction == 4){rotateData = 135*Math.PI/180;}
		if (direction == 6){rotateData = 225*Math.PI/180;}
		if (direction == 8){rotateData = 315*Math.PI/180;}
		return rotateData;
}
////////////////////////////////////////////////////////////////////////////////////


////!!! Get rid of "var player =" before the init Player function. Do we need to allocate a new player var to init a Player?
socket.on('update', function(playerDataPack, thugDataPack, pickupDataPack, notificationPack, updateEffectPack, miscPack){
	var debugUpdates = false;
	clientTimeoutTicker = clientTimeoutSeconds;
	for (var i = 0; i < playerDataPack.length; i++) {
		if (debugUpdates){
			logg(playerDataPack[i].id + " " + playerDataPack[i].property + " " + playerDataPack[i].value);
		}

		
		//Kick out of shop upon damage
		if (playerDataPack[i].id == myPlayer.id && playerDataPack[i].property == "health" && playerDataPack[i].value < Player.list[playerDataPack[i].id].health){
			shop.active = false;
		}
		
		//Play Charging/Decharge sounds
		if (playerDataPack[i].id == myPlayer.id && !mute){
			if (playerDataPack[i].property == "energy" && playerDataPack[i].value == 0){
				sfxDecharge.play();
				sfxCharge.fade(.3, 0, 100);
			}
			else if (playerDataPack[i].property == "energy" && playerDataPack[i].value > Player.list[playerDataPack[i].id].energy && !sfxCharge.playing()){
				sfxCharge.volume(.3);
				sfxCharge.play();
			}
			else if (playerDataPack[i].property == "energy" && (playerDataPack[i].value % 100 == 0 || playerDataPack[i].value == 1 || playerDataPack[i].value < Player.list[playerDataPack[i].id].energy) && sfxCharge.playing()){
				sfxCharge.fade(.3, 0, 100);
			}
		}
								
		//Update player list. This has to be located here because of adjacent code comparisons between Pack and player.list[i] values
		if (Player.list[playerDataPack[i].id]){
			Player.list[playerDataPack[i].id][playerDataPack[i].property] = playerDataPack[i].value;
		}
		else {
			var player = Player(playerDataPack[i].id);
			Player.list[playerDataPack[i].id][playerDataPack[i].property] = playerDataPack[i].value;
		}
		

		//!!!Remove this when we totally remove the myPlayer
		//Update myPlayer AND create Player in local client Player list if they don't exist yet on this Client
		if (playerDataPack[i].id == myPlayer.id){
			myPlayer[playerDataPack[i].property] = playerDataPack[i].value;
			if (playerDataPack[i].property == "health" && ((myPlayer.team == "black" && bagBlue.captured == false) || (myPlayer.team == "white" && bagRed.captured == false))){
				determineBorderStyle();
			}
		}
		
////////////Put future client updates after this line /////////////////
	
		//Play punch sfx if boosting gets halted (contact)
		if (playerDataPack[i].property == "boosting" && playerDataPack[i].value == -1 && !mute){
			var dx1 = myPlayer.x - Player.list[playerDataPack[i].id].x;
			var dy1 = myPlayer.y - Player.list[playerDataPack[i].id].y;
			var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
			var vol = (Math.round((1 - (dist1 / 1000)) * 100)/100) - .3;
			if (vol > 1)
				vol = 1;
			else if (vol < 0 && vol >= -.1)
				vol = 0.01;
			if (vol < -.1 || mute)
				vol = 0;
			sfxPunch.volume(vol);
			sfxPunch.play();
			Smash(Player.list[playerDataPack[i].id].x, Player.list[playerDataPack[i].id].y);	
		}
		
		

		//Play bagGrab SFX if holdingBag switched to true for someone OR their "returns" count increased
		if (((playerDataPack[i].property == "holdingBag" && playerDataPack[i].value == true) || (playerDataPack[i].property == "returns" && playerDataPack[i].value > 0)) && !mute){			
			var dx1 = myPlayer.x - Player.list[playerDataPack[i].id].x;
			var dy1 = myPlayer.y - Player.list[playerDataPack[i].id].y;
			var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
			var vol = (Math.round((1 - (dist1 / 1000)) * 100)/100) - .3;
			if (vol > 1)
				vol = 1;
			else if (vol < 0 && vol >= -.1)
				vol = 0.01;
			if (vol < -.1 || mute)
				vol = 0;
			sfxBagGrab.volume(vol);
			sfxBagGrab.play();
		}
		
		//Play/Stop Reload SFX upon reload property update
		if ((playerDataPack[i].property == "reloading" && playerDataPack[i].value != 0 && playerDataPack[i].id) && !mute){			
			var dx1 = myPlayer.x - Player.list[playerDataPack[i].id].x;
			var dy1 = myPlayer.y - Player.list[playerDataPack[i].id].y;
			var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
			var vol = (Math.round((1 - (dist1 / 1000)) * 100)/100) - .3; // -.x is the Volume offset
			if (vol > 1)
				vol = 1;
			else if (vol < 0 && vol >= -.1)
				vol = 0.01;
			if (vol < -.1 || mute)
				vol = 0;
			if (Player.list[playerDataPack[i].id].weapon == 1){
				sfxPistolReload.volume(vol);
				sfxPistolReload.play();
			}
			else if (Player.list[playerDataPack[i].id].weapon == 2){
				sfxDPReload.volume(vol);
				sfxDPReload.play();
			}
			else if (Player.list[playerDataPack[i].id].weapon == 3){
				sfxMGReload.volume(vol);
				sfxMGReload.play();
			}
		}
		else if (playerDataPack[i].property == "reloading" && playerDataPack[i].value == 0){			
			if (Player.list[playerDataPack[i].id].weapon == 1){
				sfxPistolReload.stop();
			}
			else if (Player.list[playerDataPack[i].id].weapon == 2){
				sfxDPReload.stop();
			}
			else if (Player.list[playerDataPack[i].id].weapon == 3){
				sfxMGReload.stop();
			}
		}
		
		//play equip sfx AND reset triggerTapLimitTimer
		if (playerDataPack[i].property == "weapon"){
			var dx1 = myPlayer.x - Player.list[playerDataPack[i].id].x;
			var dy1 = myPlayer.y - Player.list[playerDataPack[i].id].y;
			var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
			var vol = (Math.round((1 - (dist1 / 1000)) * 100)/100) - .3; // -.x is the Volume offset
			if (vol > 1)
				vol = 1;
			else if (vol < 0 && vol >= -.1)
				vol = 0.01;
			if (vol < -.1 || mute)
				vol = 0;
			if (playerDataPack[i].value == 1){
				sfxPistolEquip.volume(vol);
				sfxPistolEquip.play();
			}
			else if (playerDataPack[i].value == 2){
				sfxDPEquip.volume(vol);
				sfxDPEquip.play();
			}				
			else if (playerDataPack[i].value == 3){
				sfxMGEquip.volume(vol);
				sfxMGEquip.play();
			}
			else if (playerDataPack[i].value == 4){
				sfxSGEquip.volume(vol);
				sfxSGEquip.play();
			}			//Stop all reloading sfx upon weapon change
			sfxDPReload.stop();
			sfxMGReload.stop();
			sfxPistolReload.stop();
			
			Player.list[playerDataPack[i].id].triggerTapLimitTimer = 0;
		}
	}//END Player loop
	for (var i = 0; i < pickupDataPack.length; i++) {
		if (typeof pickupDataPack[i] == "number"){
			if (debugUpdates){
				logg("Deleting pickup: " + pickupDataPack[i]);
			}
			if (Pickup.list[pickupDataPack[i]] && Pickup.list[pickupDataPack[i]].id){
				delete Pickup.list[pickupDataPack[i]];
			}
		}
		else if (Pickup.list[pickupDataPack[i].id]){
			if (debugUpdates){
				logg("Update pickup:" + pickupDataPack[i].id + " x:" + pickupDataPack[i].x + " y:" + pickupDataPack[i].y + " type:" + pickupDataPack[i].type + " amount:" + pickupDataPack[i].amount + " width:" + pickupDataPack[i].width + " height:" + pickupDataPack[i].height);
			}
			if (pickupDataPack[i].respawnTimer == 0 && !mute){
				sfxWeaponDrop.play();
			}
				
			Pickup.list[pickupDataPack[i].id] = pickupDataPack[i];
		}
		else {
			if (debugUpdates){
				logg("Create pickup:" + pickupDataPack[i].id + " x:" + pickupDataPack[i].x + " y:" + pickupDataPack[i].y + " type:" + pickupDataPack[i].type + " amount:" + pickupDataPack[i].amount + " width:" + pickupDataPack[i].width + " height:" + pickupDataPack[i].height);
			}
			var newPickup = Pickup(pickupDataPack[i].id);
			Pickup.list[pickupDataPack[i].id] = pickupDataPack[i];
		}
	}
	
	for (var i = 0; i < thugDataPack.length; i++) {
		if (Thug.list[thugDataPack[i].id]){
			Thug.list[thugDataPack[i].id][thugDataPack[i].property] = thugDataPack[i].value;
		}
		else {
			var thug = Thug(thugDataPack[i].id);
			Thug.list[thugDataPack[i].id][thugDataPack[i].property] = thugDataPack[i].value;
		}
	}	
	
	for (var i = 0; i < notificationPack.length; i++) {
		var noteText = notificationPack[i].text;
		var notePlayerId = notificationPack[i].playerId;
		
		var notification = Notification(noteText, notePlayerId);
		if (noteText.includes("Stolen") && !mute){
			if (Player.list[notePlayerId].team == myPlayer.team){
				sfxStealGood.play();
			}
			else {
				sfxStealBad.play();
			}
		}
		if (debugUpdates){
			logg("Notification: " + Player.list[notePlayerId].name + " " + noteText);
		}
	}	
	
	for (var i = 0; i < updateEffectPack.length; i++) {
		if (updateEffectPack[i].type == 3){//boost
			BoostBlast(updateEffectPack[i].playerId);
			
			if (!mute){
				var dx1 = myPlayer.x - Player.list[updateEffectPack[i].playerId].x;
				var dy1 = myPlayer.y - Player.list[updateEffectPack[i].playerId].y;
				var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
				var vol = (Math.round((1 - (dist1 / 1000)) * 100)/100) - .3; // -.x is the Volume offset
				if (vol > 1)
					vol = 1;
				else if (vol < 0 && vol >= -.1)
					vol = 0.01;
				if (vol < -.1 || mute)
					vol = 0;
				sfxBoost.volume(vol);
				sfxBoost.play();
			}
		} 				
		else if (updateEffectPack[i].type == 5){//body
			createBody(updateEffectPack[i].targetX, updateEffectPack[i].targetY, updateEffectPack[i].pushSpeed, updateEffectPack[i].shootingDir, updateEffectPack[i].bodyType);
		}
		else if (updateEffectPack[i].type == 7){ //chat
			Player.list[updateEffectPack[i].playerId].chat = updateEffectPack[i].text;
			Player.list[updateEffectPack[i].playerId].chatDecay = 300;
		} 				
	}
	
	if (miscPack.bagRed){
		bagRed = miscPack.bagRed;
		if (debugUpdates){
			logg("bagRed - x:" + miscPack.bagRed.x + " y:" + miscPack.bagRed.y + " captured:" + miscPack.bagRed.captured + " speed:" + miscPack.bagRed.speed);
		}
	}
	if (miscPack.bagBlue){
		bagBlue = miscPack.bagBlue;
		if (debugUpdates){
			logg("bagRed - x:" + miscPack.bagBlue.x + " y:" + miscPack.bagBlue.y + " captured:" + miscPack.bagBlue.captured + " speed:" + miscPack.bagBlue.speed);
		}		
	}
	if (miscPack.gameOver){
		gameOver = miscPack.gameOver;
		if (miscPack.gameOver == true){
			endGame();
			document.getElementById("voteMenu").style.display = '';
			document.getElementById("voteCTF").disabled = false;
			document.getElementById("voteDeathmatch").disabled = false;	
			document.getElementById("voteLongest").disabled = false;
			document.getElementById("voteCrik").disabled = false;
			document.getElementById("voteThePit").disabled = false;				
		}
		else if (miscPack.gameOver == false){
			document.getElementById("voteMenu").style.display = 'none';
		}
		if (debugUpdates){
			logg("GameOver:" + miscPack.gameOver);
		}
	}
	if (miscPack.nextGameTimer){
		nextGameTimer = miscPack.nextGameTimer;
		if (nextGameTimer == 4 && !mute){
			sfxNextGameTimer.play();
		}
	}
	if (miscPack.shopEnabled){
		shopEnabled = miscPack.shopEnabled;
	}
	if (miscPack.variant){
		map = miscPack.variant.map;
		gametype = miscPack.variant.gametype;
		scoreToWin = miscPack.variant.scoreToWin;
		timeLimit = miscPack.variant.timeLimit;
	}
	if (miscPack.mapWidth){
		mapWidth = miscPack.mapWidth;
		if (debugUpdates){
			logg("miscPack.mapWidth: " + miscPack.mapWidth);
		}
	}
	if (miscPack.mapHeight){
		mapHeight = miscPack.mapHeight;
		if (debugUpdates){
			logg("miscPack.mapHeight: " + miscPack.mapHeight);
		}
	}
	if (miscPack.pcMode){
		pcMode = miscPack.pcMode;
	}
});

//Goes to only a single player init initialize 
socket.on('updateInit',function(playerPack, thugPack, pickupPack, blockPack, miscPack){
	Player.list = [];
	for (var i = 0; i < playerPack.length; i++) {
		//Update myPlayer
		if (playerPack[i].id == myPlayer.id){
			myPlayer = playerPack[i];
		}
		if (Player.list[playerPack[i].id]){
			//Keeps certain values from being overwritten by server
			Player.list[playerPack[i].id] = playerPack[i];
		}
		else {
			var player = Player(playerPack[i].id);
			Player.list[playerPack[i].id] = playerPack[i];
		}
	}
	
	Thug.list = [];
	for (var i = 0; i < thugPack.length; i++) {
		if (Thug.list[thugPack[i].id]){
			Thug.list[thugPack[i].id] = thugPack[i];
		}
		else {
			var thug = Thug(thugPack[i].id);
			Thug.list[thugPack[i].id] = thugPack[i];
		}
	}
	
	Block.list = [];
	for (var i = 0; i < blockPack.length; i++) {
		if (Block.list[blockPack[i].id]){
			Block.list[blockPack[i].id] = blockPack[i];
		}
		else {
			var block = Block(blockPack[i].id);
			Block.list[blockPack[i].id] = blockPack[i];
		}
	}

	Pickup.list = [];
	var pickupCount = 0;
	for (var p in Pickup.list){
		pickupCount++;
	}
	for (var i = 0; i < pickupPack.length; i++) { 
		if (typeof pickupPack[i] == "string"){//!!! Why is this checking for pickuptype is string instead of number???
			if (Pickup.list[pickupPack[i]].id){
				delete Pickup.list[pickupPack[i]];
			}
		}
		else if (Pickup.list[pickupPack[i].id]){
			Pickup.list[pickupPack[i].id] = pickupPack[i];
		}
		else {
			var pickup = Pickup(pickupPack[i].id);
			Pickup.list[pickupPack[i].id] = pickupPack[i];
		}
	}

	if (miscPack.bagRed)
		bagRed = miscPack.bagRed;
	if (miscPack.bagBlue)
		bagBlue = miscPack.bagBlue;
	if (miscPack.shop)
		shop = miscPack.shop;
	if (miscPack.variant){
		map = miscPack.variant.map;
		gametype = miscPack.variant.gametype;
		scoreToWin = miscPack.variant.scoreToWin;
		timeLimit = miscPack.variant.timeLimit;
	}
	gameOver = miscPack.gameOver;
	pregame = miscPack.pregame;
	if (miscPack.mapWidth){
		mapWidth = miscPack.mapWidth;
	}
	if (miscPack.mapHeight){
		mapHeight = miscPack.mapHeight;
	}

	if (miscPack.shopEnabled){
		shopEnabled = miscPack.shopEnabled;
	}
	
	if (numPlayers != miscPack.numPlayers) {
		logg(miscPack.numPlayers + ' players here.');			
		numPlayers = miscPack.numPlayers;
	}	
	logg("Server URL: " + miscPack.ip+":"+miscPack.port);
	
	BoostBlast.list = [];	
	drawMapElementsOnMapCanvas();
	drawBlocksOnBlockCanvas();
});

function endGame(){
	if (!mute){
		sfxStealGood.play();		
		//Conditional win sfx
		if ((myPlayer.team == "white" && whiteScore > blackScore) || (myPlayer.team == "black" && blackScore > whiteScore)){
			if (!mute){
				sfxVictoryMusic.play();
			}
		}
		else if(myPlayer.team != "none"){
			if (!mute){
				sfxDefeatMusic.play();
			}
		}
	}	
}

function calculateShopMechanics(){
	if (shopEnabled){
		if (myPlayer.team == "white" && myPlayer.pressingA && myPlayer.x <= 0 && myPlayer.y <= 235 && shop.active == false && !gameOver){
			if (!myPlayer.pressingS && !myPlayer.pressingD && !myPlayer.pressingW && !myPlayer.pressingUp && !myPlayer.pressingRight && !myPlayer.pressingDown && !myPlayer.pressingLeft){
				socket.emit('keyPress',{inputId:65,state:false});
				socket.emit('keyPress',{inputId:83,state:false});
				socket.emit('keyPress',{inputId:87,state:false});

				shop.active = true;
				shop.uniqueText = "Welcome to the Black Market!";
				shop.uniqueTextTimer = 60;
			}
		}
		if (myPlayer.team == "black" && myPlayer.pressingD && myPlayer.x >= mapWidth && myPlayer.y >= mapHeight - 235 && shop.active == false && !gameOver){
			if (!myPlayer.pressingS && !myPlayer.pressingA && !myPlayer.pressingW && !myPlayer.pressingUp && !myPlayer.pressingRight && !myPlayer.pressingDown && !myPlayer.pressingLeft){
				socket.emit('keyPress',{inputId:68,state:false});
				socket.emit('keyPress',{inputId:83,state:false});
				socket.emit('keyPress',{inputId:87,state:false});

				shop.active = true;
				shop.uniqueText = "Welcome to the Black Market!";
				shop.uniqueTextTimer = 60;
			}
		}
		//Failsafe in case wrongly stuck in shop
		if (shop.active == true && myPlayer.team == "white" && (myPlayer.x > 0 || myPlayer.y > 235)){
			shop.active = false;
		}
		if (shop.active == true && myPlayer.team == "black" && (myPlayer.x < mapWidth || myPlayer.y < mapHeight - 235)){
			shop.active = false;
		}
	}
}

function purchase(){ 

	shop.purchaseEffectTimer = 10;

	if (shop.selection == 1 && Player.list[myPlayer.id].cash < shop.price1){
		shop.uniqueText = "Not enough cash, stranger!";
		shop.uniqueTextTimer = 90;
		if (!mute)
			sfxError.play();
		return;
	}
	else if (shop.selection == 2 && Player.list[myPlayer.id].cash < shop.price2){
		shop.uniqueText = "Not enough cash, stranger!";
		shop.uniqueTextTimer = 90;
		if (!mute)
			sfxError.play();
		return;
	}
	else if (shop.selection == 3 && Player.list[myPlayer.id].cash < shop.price3){
		shop.uniqueText = "Not enough cash, stranger!";
		shop.uniqueTextTimer = 90;
		if (!mute)
			sfxError.play();
		return;
	}
	else if (shop.selection == 4 && Player.list[myPlayer.id].cash < shop.price4){
		shop.uniqueText = "Not enough cash, stranger!";
		shop.uniqueTextTimer = 90;
		if (!mute)
			sfxError.play();
		return;
	}
	else if (shop.selection == 4 && Player.list[myPlayer.id].health >= 200){
		shop.uniqueText = "You're already wearing body armor, mate.";
		shop.uniqueTextTimer = 90;
		if (!mute)
			sfxError.play();
		return;
	}
	else if (shop.selection == 5 && Player.list[myPlayer.id].cash < shop.price5){
		shop.uniqueText = "Not enough cash, stranger!";
		shop.uniqueTextTimer = 90;
		if (!mute)
			sfxError.play();
		return;
	}
	if (shop.selection == 1 && Player.list[myPlayer.id].cash >= shop.price1){
	}
	else if (shop.selection == 2 && Player.list[myPlayer.id].cash >= shop.price2){
	}
	else if (shop.selection == 3 && Player.list[myPlayer.id].cash >= shop.price3){
	}
	else if (shop.selection == 4 && Player.list[myPlayer.id].cash >= shop.price4){
	}
	else if (shop.selection == 5 && Player.list[myPlayer.id].cash >= shop.price5){
	}
	else {
		return;
	}

	socket.emit('purchase',{selection:shop.selection,playerId:myPlayer.id});
	if (!mute)
		sfxPurchase.play();
	shop.uniqueText = "Heh heh heh heh... Thank you.";
	shop.uniqueTextTimer = 60;
}

///////////////////// CAMERA /////////////////////////////

function updateCamera(){	
	//Calculate Camera //default center:450,400
	if(myPlayer.shootingDir == 1){targetCenterX = canvasWidth/2; targetCenterY = canvasHeight/2 + (camOffSet - 75);}
	if(myPlayer.shootingDir == 2){targetCenterX = canvasWidth/2 - (diagCamOffSet + 50); targetCenterY = canvasHeight/2 + diagCamOffSet;}
	if(myPlayer.shootingDir == 3){targetCenterX = canvasWidth/2 - camOffSet; targetCenterY = canvasHeight/2;}
	if(myPlayer.shootingDir == 4){targetCenterX = canvasWidth/2 - (diagCamOffSet + 50); targetCenterY = canvasHeight/2 - diagCamOffSet;}
	if(myPlayer.shootingDir == 5){targetCenterX = canvasWidth/2; targetCenterY = canvasHeight/2 - (camOffSet - 75);}
	if(myPlayer.shootingDir == 6){targetCenterX = canvasWidth/2 + (diagCamOffSet + 50); targetCenterY = canvasHeight/2 - diagCamOffSet;}
	if(myPlayer.shootingDir == 7){targetCenterX = canvasWidth/2 + camOffSet; targetCenterY = canvasHeight/2;}
	if(myPlayer.shootingDir == 8){targetCenterX = canvasWidth/2 + (diagCamOffSet + 50); targetCenterY = canvasHeight/2 + diagCamOffSet;}
	if(myPlayer.health <= 0){targetCenterX = canvasWidth/2; targetCenterY = canvasHeight/2} //If ded
	
	if ((!myPlayer.pressingShift && !shop.active) || myPlayer.team == "none"){
		targetCenterX = canvasWidth/2;
		targetCenterY = canvasHeight/2;
	}
	
	//CenterXY Calculation
	var dx1 = centerX - targetCenterX;
	var dy1 = centerY - targetCenterY;
	var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
	var ax1 = dx1/dist1;
	var ay1 = dy1/dist1;

	//Cap on how fast the camera can move
	if (dist1 > camMaxSpeed){dist1 = camMaxSpeed;}

	if (Math.abs(dist1) < 2){
		centerX = targetCenterX;
		centerY = targetCenterY;
	}
	else {
		centerX -= ax1 * (dist1 / (10 * camAccelerationMultiplier));
		centerY -= ay1 * (dist1 / (10 * camAccelerationMultiplier));
	}	
	cameraX = myPlayer.x * zoom - centerX; //This defines the upper-left XY coord of the camera. For camera center, add canvasWidth/2 and canvasHeight/2
	cameraY = myPlayer.y * zoom - centerY;

	screenShake();
}

function screenShake(){
	if (screenShakeCounter >= 0) {
		if (screenShakeCounter == 8){
			centerX -= 10 * screenShakeScale;
		}
		else if (screenShakeCounter == 7){
			centerX += 3 * screenShakeScale;
			centerY += 7 * screenShakeScale;
		}
		else if (screenShakeCounter == 6){
			centerX += 7 * screenShakeScale;
			centerY += 3 * screenShakeScale;
		}
		else if (screenShakeCounter == 5){
			centerX += 7 * screenShakeScale;
			centerY -= 3 * screenShakeScale;
		}
		else if (screenShakeCounter == 4){
			centerX += 3 * screenShakeScale;
			centerY -= 7 * screenShakeScale;
		}
		else if (screenShakeCounter == 3){
			centerX -= 3 * screenShakeScale;
			centerY -= 7 * screenShakeScale;
		}
		else if (screenShakeCounter == 2){
			centerX -= 7 * screenShakeScale;
			centerY -= 3 * screenShakeScale;
		}
		else if (screenShakeCounter == 1){
			centerX -= 7 * screenShakeScale;
			centerY += 3 * screenShakeScale;
		}
		else if (screenShakeCounter == 1){
			centerX -= 7 * screenShakeScale;
			centerY += 3 * screenShakeScale;
		}
		else if (screenShakeCounter == 0 && !myPlayer.pressingShift){
			centerX = targetCenterX;
			centerY = targetCenterY;
		}
		screenShakeCounter--;
	}
}

//////////////// DRAW FUNCTIONS /////////////////////////////////////////////////////
function drawImage(img, x, y, width = 0, height = 0){
	if (width == 0 || height == 0){
		ctx.drawImage(img, Math.round(x), Math.round(y));
	}
	else {
		ctx.drawImage(img, Math.round(x), Math.round(y), Math.round(width), Math.round(height));
	}
}

function drawImageOnMapCanvas(img, x, y, width = 0, height = 0){
	if (width == 0 || height == 0){
		mCtx.drawImage(img, Math.round(x), Math.round(y));
	}
	else {
		mCtx.drawImage(img, Math.round(x), Math.round(y), Math.round(width), Math.round(height));
	}
}

function drawImageOnBlockCanvas(img, x, y, width = 0, height = 0){
	if (width == 0 || height == 0){
		blockCtx.drawImage(img, Math.round(x), Math.round(y));
	}
	else {
		blockCtx.drawImage(img, Math.round(x), Math.round(y), Math.round(width), Math.round(height));
	}
}

function strokeText(text, x, y){
	ctx.strokeText(text, Math.round(x), Math.round(y));
}
function fillText(text, x, y){
	ctx.fillText(text, Math.round(x), Math.round(y));
}
function strokeAndFillText(text, x, y){
	ctx.strokeText(text, Math.round(x), Math.round(y));
	ctx.fillText(text, Math.round(x), Math.round(y));
}

function strokeAndFillText(text, x, y, width){
	ctx.strokeText(text, Math.round(x), Math.round(y), width);
	ctx.fillText(text, Math.round(x), Math.round(y), width);
}

function drawMapElementsOnMapCanvas(){
	m_canvas.width = mapWidth * zoom;
	m_canvas.height = mapHeight * zoom;
	mCtx.clearRect(0,0,m_canvas.width,m_canvas.height); //Clears previous frame!!!!!!

	var tile = Img.tile;
	
	for (var y = 0; y < mapHeight * zoom; y+=tile.height * zoom){
		for (var x = 0; x < mapWidth * zoom; x+=tile.width * zoom){
			if (x + tile.width * zoom > mapWidth * zoom){
				x = mapWidth * zoom - tile.width * zoom;
			}
			if (y + tile.height * zoom > mapHeight * zoom){				
				y = mapHeight * zoom - tile.height * zoom;
			}				
			if (map == "longest"){
				if (y >= (mapHeight - tile.height) * zoom && x <= (tile.height - 75) * zoom){
					drawImageOnMapCanvas(Img.tileWhite, x, y, tile.width * zoom, tile.height * zoom);
				}
				else if (y <= (tile.height - 75) * zoom && x >= (mapWidth - tile.width) * zoom){
					drawImageOnMapCanvas(Img.tileBlack, x, y, tile.width * zoom, tile.height * zoom);
				}
				else {
					drawImageOnMapCanvas(tile, x, y, tile.width * zoom, tile.height * zoom);
				}				
			}
			else if (map == "thepit"){
				if (y >= (tile.height * 3) * zoom && y <= (tile.height * 5) * zoom && x <= (tile.width) * zoom){
					drawImageOnMapCanvas(Img.tileWhite, x, y, tile.width * zoom, tile.height * zoom);
				}
				else if (y >= (tile.height * 3) * zoom && y <= (tile.height * 5) * zoom && x >= (mapWidth - tile.width * 3) * zoom){
					drawImageOnMapCanvas(Img.tileBlack, x, y, tile.width * zoom, tile.height * zoom);
				}
				else {
					drawImageOnMapCanvas(tile, x, y, tile.width * zoom, tile.height * zoom);
				}				
			}
			else if (map == "crik"){
				if (x >= (tile.width * 6) * zoom && x <= (tile.width * 6) * zoom && y >= (tile.height * 1) * zoom && y <= (tile.height * 5) * zoom){
					drawImageOnMapCanvas(Img.tileWhite, x, y, tile.width * zoom, tile.height * zoom);
				}
				else if (y >= (tile.height * 1) * zoom && y <= (tile.height * 4) * zoom && x >= (mapWidth - tile.width * 4) * zoom && x <= (mapWidth - tile.width * 2) * zoom){
					drawImageOnMapCanvas(Img.tileBlack, x, y, tile.width * zoom, tile.height * zoom);
				}
				else if (y >= (tile.height * 1) * zoom && y <= (tile.height * 4) * zoom && x >= (tile.width * 1) * zoom && x <= (tile.width * 3) * zoom){
					drawImageOnMapCanvas(Img.tileBlack, x, y, tile.width * zoom, tile.height * zoom);
				}
				else {
					drawImageOnMapCanvas(tile, x, y, tile.width * zoom, tile.height * zoom);
				}				
			}
			else {
				if (y <= 300 * zoom && x <= 300 * zoom){
					drawImageOnMapCanvas(Img.tileWhite, x, y, tile.width * zoom, tile.height * zoom);
				}
				else if (y >= (mapHeight - 600) * zoom && x >= (mapWidth - 600) * zoom){
					drawImageOnMapCanvas(Img.tileBlack, x, y, tile.width * zoom, tile.height * zoom);
				}
				else {
					drawImageOnMapCanvas(tile, x, y, tile.width * zoom, tile.height * zoom);
				}
			}
		}
	}	
}

function drawMapCanvas(){
	var drawX = centerX - myPlayer.x * zoom;
	var drawY = centerY - myPlayer.y * zoom;
	ctx.drawImage(m_canvas, drawX, drawY);
}

function drawBlackMarkets(){
	if (shopEnabled){
		if (Player.list[myPlayer.id].team == "white"){
			if (centerX - myPlayer.x * zoom - 44 * zoom > -Img.bmDoorWhite.width * zoom - drawDistance && centerX - myPlayer.x * zoom - 44 * zoom < canvasWidth + drawDistance && centerY - myPlayer.y * zoom > -Img.bmDoorWhite.height * zoom - drawDistance && centerY - myPlayer.y * zoom < canvasHeight + drawDistance){
				drawImage(Img.bmDoorWhite, centerX - myPlayer.x * zoom - 44 * zoom, centerY - myPlayer.y * zoom, Img.bmDoorWhite.width * zoom, Img.bmDoorWhite.height * zoom);
			}
		}
		else if (Player.list[myPlayer.id].team == "black"){
		var bmx = centerX + mapWidth * zoom - myPlayer.x * zoom - Img.bmDoorBlack.width * zoom + 44 * zoom;
		var bmy = centerY + mapHeight * zoom - myPlayer.y * zoom - Img.bmDoorBlack.height * zoom;
			if (bmx + Img.bmDoorBlack.width * zoom + drawDistance > 0 && bmx - drawDistance < canvasWidth && bmy + Img.bmDoorBlack.height * zoom + drawDistance > 0 && bmy - drawDistance < canvasHeight){
				drawImage(Img.bmDoorBlack, bmx, bmy, Img.bmDoorBlack.width * zoom, Img.bmDoorBlack.height * zoom);			
			}
		}
	}
}

function drawBodies(){
	for (var b in Body.list) {
		var body = Body.list[b];
		body.age++;
		if (body.age > BODY_AGE){
			 delete Blood.list[body.id];
			 delete Body.list[body.id];
			 continue;
		}
		
		var rotate = getRotation(body.direction);
		var img = Img.bodyWhite;
		if (body.bodyType == "whiteRed"){
			img = Img.bodyWhite;
		}
		else if (body.bodyType == "blackBlue"){
			img = Img.bodyBlack;
		}

		//Movement (sliding)
		if (body.speed > 0){
			var subtractPushSpeed = Math.floor(body.speed / 15); 
			body.speed -= subtractPushSpeed;
			
			if (body.direction == 1){
				body.y -= body.speed; 
			}
			if (body.direction == 2){
				body.x += body.speed * (2/3); 
				body.y -= body.speed * (2/3); 
			}
			if (body.direction == 3){
				body.x += body.speed; 
			}
			if (body.direction == 4){
				body.x += body.speed * (2/3); 
				body.y += body.speed * (2/3); 
			}
			if (body.direction == 5){
				body.y += body.speed; 
			}
			if (body.direction == 6){
				body.x -= body.speed * (2/3); 
				body.y += body.speed * (2/3); 
			}
			if (body.direction == 7){
				body.x -= body.speed; 
			}
			if (body.direction == 8){
				body.x -= body.speed * (2/3); 
				body.y -= body.speed * (2/3); 
			}			
			if (body.x < 10)
				body.x = 10;
			if (body.y < 10)
				body.y = 10;
			if (body.x > mapWidth-10)
				body.x = mapWidth-10;
			if (body.y > mapHeight-10)
				body.y = mapHeight-10;				
			body.speed--;
		}

		var bodyOnWallLegsYOffset = 0;
		
		//Check for body collision with block 
		var bodyBlockOffset = 14;
		for (var i in Block.list){
			if (body.x + bodyBlockOffset >= Block.list[i].x && body.x - bodyBlockOffset <= Block.list[i].x + Block.list[i].width && body.y + bodyBlockOffset >= Block.list[i].y && body.y - bodyBlockOffset <= Block.list[i].y + Block.list[i].height){												
				if (Block.list[i].type == "normal" || Block.list[i].type == "red" || Block.list[i].type == "blue"){
					body.onWall = true;
					bodyOnWallLegsYOffset = 20;
					continue;
				}
			}
		}	
		
		if (centerX - Player.list[myPlayer.id].x * zoom + body.x * zoom > -75 * zoom - drawDistance && centerX - Player.list[myPlayer.id].x * zoom + body.x * zoom < 20 * zoom + canvasWidth + drawDistance && centerY - Player.list[myPlayer.id].y * zoom + body.y * zoom > -75 * zoom - drawDistance && centerY - Player.list[myPlayer.id].y * zoom + body.y * zoom < 20 * zoom + canvasHeight + drawDistance){		
            ctx.save();
			ctx.translate(centerX + body.x * zoom - myPlayer.x * zoom, centerY + body.y * zoom - myPlayer.y * zoom); //Center camera on controlled player
			ctx.rotate(rotate);
			ctx.globalAlpha = 0.8;			
                drawImage(Img.bloodPool, (-body.poolHeight/2.8 + 5) * zoom, -body.poolHeight/1.9 * zoom, body.poolHeight/1.7 * zoom, (body.poolHeight - bodyOnWallLegsYOffset) * zoom);
                ctx.globalAlpha = 1;
                if (body.poolHeight < body.poolHeightMax - 1.5){
                    var enlargePool = (body.poolHeightMax - body.poolHeight)/250;
                    if (enlargePool > .35){enlargePool = .35;}
                    body.poolHeight += enlargePool;
                }
                else {
                    body.poolHeight = body.poolHeightMax;
                }
                drawImage(img, -img.width/2 * zoom, -img.height/2 * zoom, img.width * zoom, (img.height - bodyOnWallLegsYOffset) * zoom);
			//ctx.rotate(-rotate);	
			//ctx.translate(-(centerX + body.x * zoom - myPlayer.x * zoom), -(centerY + body.y * zoom - myPlayer.y * zoom)); //Center camera on controlled player
			ctx.restore();
		}		
	}
}

function drawWallBodies(){
	noShadow();
	for (var b in Body.list) {
		var body = Body.list[b];		
		if (body.onWall == true){
			
			var rotate = 1;	
			var img = Img.bodyWhiteWall1;
			
			if (body.bodyType == "whiteRed"){
				img = Img.bodyWhiteWall1;
			}
			else if (body.bodyType == "blackBlue"){
				img = Img.bodyBlackWall1;
			}

			
			var bodyBlockOffset = 14;
			for (var i in Block.list){
				if (body.x + bodyBlockOffset >= Block.list[i].x && body.x - bodyBlockOffset <= Block.list[i].x + Block.list[i].width && body.y + bodyBlockOffset >= Block.list[i].y && body.y - bodyBlockOffset <= Block.list[i].y + Block.list[i].height){												

					var overlapTop = Math.abs(Block.list[i].y - body.y);  
					var overlapBottom = Math.abs((Block.list[i].y + Block.list[i].height) - body.y);
					var overlapLeft = Math.abs(body.x - Block.list[i].x);
					var overlapRight = Math.abs((Block.list[i].x + Block.list[i].width) - body.x);			
					if (overlapTop <= overlapBottom && overlapTop <= overlapRight && overlapTop <= overlapLeft){ //Hitting top of block
						body.y = Block.list[i].y - bodyBlockOffset;
						rotate = getRotation(1);
					}
					else if (overlapBottom <= overlapTop && overlapBottom <= overlapRight && overlapBottom <= overlapLeft){//Hitting bottom of block
						body.y = Block.list[i].y + Block.list[i].height + bodyBlockOffset;
						rotate = getRotation(5);
					}
					else if (overlapLeft <= overlapTop && overlapLeft <= overlapRight && overlapLeft <= overlapBottom){//hitting left of block
						body.x = Block.list[i].x - bodyBlockOffset;
						rotate = getRotation(7);
					}
					else if (overlapRight <= overlapTop && overlapRight <= overlapLeft && overlapRight <= overlapBottom){//Hitting right of block
						body.x = Block.list[i].x + Block.list[i].width + bodyBlockOffset;
						rotate = getRotation(3);
					}
				}// End check if player is overlapping block
				else {
					body.onWall = false;
					continue;
				}
			}//End Block.list loop		
			
			if (centerX - Player.list[myPlayer.id].x * zoom + body.x * zoom > -75 * zoom - drawDistance && centerX - Player.list[myPlayer.id].x * zoom + body.x * zoom < 20 * zoom + canvasWidth + drawDistance && centerY - Player.list[myPlayer.id].y * zoom + body.y * zoom > -75 * zoom - drawDistance && centerY - Player.list[myPlayer.id].y * zoom + body.y * zoom < 20 * zoom + canvasHeight + drawDistance){		
				ctx.save();
                ctx.translate(centerX + body.x * zoom - myPlayer.x * zoom, centerY + body.y * zoom - myPlayer.y * zoom); //Center camera on controlled player
				ctx.rotate(rotate);
				    drawImage(img, -img.width/2 * zoom, -img.height/2 * zoom, img.width * zoom, img.height * zoom);
				//ctx.rotate(-rotate);
				//ctx.translate(-(centerX + body.x * zoom - myPlayer.x * zoom), -(centerY + body.y * zoom - myPlayer.y * zoom)); //Center camera on controlled player
                ctx.restore();
			}					
		}	
	}
	if (lowGraphicsMode == false){
		normalShadow();
	}
	else {
		noShadow();
	}
}

function drawMissingBags(){
	if (bagRed.x != bagRed.homeX || bagRed.y != bagRed.homeY){
		if (centerX - myPlayer.x * zoom + bagRed.homeX * zoom - Img.bagMissing.width/2 * zoom > -Img.bagMissing.width * zoom - drawDistance && centerX - myPlayer.x * zoom + bagRed.homeX * zoom - Img.bagMissing.width/2 * zoom < canvasWidth + drawDistance && centerY - myPlayer.y * zoom + bagRed.homeY * zoom - Img.bagMissing.height/2 * zoom > -Img.bagMissing.height * zoom - drawDistance && centerY - myPlayer.y * zoom + bagRed.homeY * zoom - Img.bagMissing.height/2 * zoom < canvasHeight + drawDistance){
			drawImage(Img.bagMissing, centerX - myPlayer.x * zoom + bagRed.homeX * zoom - Img.bagMissing.width/2 * zoom, centerY - myPlayer.y * zoom + bagRed.homeY * zoom - Img.bagMissing.height/2 * zoom, Img.bagMissing.width * zoom, Img.bagMissing.height * zoom);
		}
	}
	if (bagBlue.x != bagBlue.homeX || bagBlue.y != bagBlue.homeY){
		if (centerX - myPlayer.x * zoom + bagBlue.homeX * zoom - Img.bagMissing.width/2 * zoom > -Img.bagMissing.width * zoom - drawDistance && centerX - myPlayer.x * zoom + bagBlue.homeX * zoom - Img.bagMissing.width/2 * zoom < canvasWidth + drawDistance && centerY - myPlayer.y * zoom + bagBlue.homeY * zoom - Img.bagMissing.height/2 * zoom > -Img.bagMissing.height * zoom - drawDistance && centerY - myPlayer.y * zoom + bagBlue.homeY * zoom - Img.bagMissing.height/2 * zoom < canvasHeight + drawDistance){
			drawImage(Img.bagMissing, centerX - myPlayer.x * zoom + bagBlue.homeX * zoom - Img.bagMissing.width/2 * zoom, centerY - myPlayer.y * zoom + bagBlue.homeY * zoom - Img.bagMissing.height/2 * zoom, Img.bagMissing.width * zoom, Img.bagMissing.height * zoom);
		}
	}
}

function drawLegs(){
	normalShadow();
	for (var i in Player.list) {
		if (Player.list[i].health > 0 && Player.list[i].team != "none"){
		
			//Calculate LegSwing
			if (!Player.list[i].legHeight){
				Player.list[i].legHeight = 1;
			}
			if (Player.list[i].walkingDir != 0){
				if (Player.list[i].legSwingForward == true){
					Player.list[i].legHeight += 7 * legSwingSpeed;
					if (Player.list[i].legHeight > 94){
						Player.list[i].legSwingForward = false;
					}
				}
				else {
					Player.list[i].legHeight -= 7 * legSwingSpeed;
					if (Player.list[i].legHeight < -94){
						Player.list[i].legSwingForward = true;
					}
				}
				if (Player.list[i].boosting > 0){
					Player.list[i].legHeight = 94; 
				}
			}
			else if(Player.list[i].walkingDir == 0 || isNaN(Player.list[i].walkingDir)){ //No movement input
				Player.list[i].legHeight = 1;
				Player.list[i].legSwingForward = true;
				continue; //If not moving, don't draw legs
			}
		
			if (Player.list[i].x * zoom + 47 * zoom + drawDistance > cameraX && Player.list[i].x * zoom - 47 * zoom - drawDistance < cameraX + canvasWidth && Player.list[i].y * zoom + 47 * zoom + drawDistance > cameraY && Player.list[i].y * zoom - 47 - drawDistance < cameraY + canvasHeight){
				var legs = Img.whitePlayerLegs;
				if (Player.list[i].legHeight < 0 && Player.list[i].team == "white"){legs = Img.whitePlayerLegs2;}			
				else if (Player.list[i].legHeight >= 0 && Player.list[i].team == "black"){legs = Img.blackPlayerLegs;}
				else if (Player.list[i].legHeight < 0 && Player.list[i].team == "black"){legs = Img.blackPlayerLegs2;}
				
				//This is for calculating where to put the legs according to the weapon wielded by the torso
				var width = Img.whitePlayerPistol.width;
				if (Player.list[i].weapon == 2){
					width = Img.whitePlayerDP.width;
				}
				else if (Player.list[i].weapon == 3){
					width = Img.whitePlayerMG.width;
				}
				
				//Draw legs a little different if walking perpendicular to shooting dir
				var torsoTwist = Player.list[i].shootingDir - Player.list[i].walkingDir;
				var twistOffset = 0;
				if (torsoTwist < 1)
					torsoTwist += 8;
				
				if (torsoTwist == 2){
					twistOffset = -4;
					if (Player.list[i].weapon == 3){
						twistOffset = -10;
					}
				}
				if (torsoTwist == 6){
					twistOffset = 4;
				}

				ctx.save();
                ctx.translate(centerX - myPlayer.x * zoom + Player.list[i].x * zoom, centerY - myPlayer.y * zoom + Player.list[i].y * zoom); //Center camera on controlled player
				ctx.rotate(getRotation(Player.list[i].walkingDir));
					normalShadow();
					//if walking dir different than shooting dir, calculate different rotation for legs than body
					var weaponYoffset = 0;
					if (Player.list[i].weapon == 3){weaponYoffset = 5;}
					if (Player.list[i].shootingDir != Player.list[i].walkingDir && Player.list[i].cloakEngaged == false){		
						drawImage(legs,(-width/2 + twistOffset) * zoom, (-Player.list[i].legHeight/2 + 5) * zoom, width * zoom, Player.list[i].legHeight * zoom);
					}
					else if (Player.list[i].cloakEngaged == false) { 
						//Only draw legs in this context (shooting direction rotation context) if walking and shooting dirs match (5 lower)
						drawImage(legs,(-width/2 + twistOffset) * zoom, (-Player.list[i].legHeight/2 + weaponYoffset) * zoom, width * zoom, Player.list[i].legHeight * zoom);
					}
				//ctx.rotate(-(getRotation(Player.list[i].walkingDir)));
				//ctx.translate(-(centerX - myPlayer.x * zoom + Player.list[i].x * zoom), -(centerY - myPlayer.y * zoom + Player.list[i].y * zoom)); //Center camera on controlled player				
                ctx.restore();
			}
		}		
	}
}

function drawBlocksOnBlockCanvas(){
	block_canvas.width = (mapWidth + 150) * zoom; //+150 to offset the block border which is behind 0,0
	block_canvas.height = (mapHeight + 150) * zoom;
	
	//normalShadow();
	blockCtx.clearRect(0,0,block_canvas.width,block_canvas.height); //Clears previous frame!!!!!!
	
	for (var i in Block.list) {
		var imgBlock = Img.block;
		blockCtx.globalAlpha = 1;
		if (Block.list[i].type == "red"){
			imgBlock = Img.redBlock;
		}
		else if (Block.list[i].type == "blue"){
			imgBlock = Img.blueBlock;
		}
		else if (Block.list[i].type == "warp1" || Block.list[i].type == "warp2"){
			continue;
		}
		else if (Block.list[i].type == "pushUp"){
			imgBlock = Img.pushUpBlock;
			blockCtx.globalAlpha = 0.3;
		}
		else if (Block.list[i].type == "pushRight"){
			imgBlock = Img.pushRightBlock;
			blockCtx.globalAlpha = 0.3;
		}
		else if (Block.list[i].type == "pushDown"){
			imgBlock = Img.pushDownBlock;
			blockCtx.globalAlpha = 0.3;
		}
		else if (Block.list[i].type == "pushLeft"){
			imgBlock = Img.pushLeftBlock;
			blockCtx.globalAlpha = 0.3;
		}
		
		drawImageOnBlockCanvas(imgBlock, Math.round((Block.list[i].x + 75) * zoom), Math.round((Block.list[i].y + 75) * zoom), Math.round(Block.list[i].width * zoom), Math.round(Block.list[i].height * zoom));				
	}
}

var warpImageSwapper = 1;
function drawBlockCanvas(){
	//noShadow();
	var drawX = centerX - (myPlayer.x + 75) * zoom;
	var drawY = centerY - (myPlayer.y + 75) * zoom;
	ctx.drawImage(block_canvas, drawX, drawY);
	
	//Draw warps every frame
	if (map == "crik"){
		warpImageSwapper++;
		if (warpImageSwapper > 8){
			warpImageSwapper = 1;
		}
		for (var i in Block.list) {
		
			if (centerX - myPlayer.x * zoom + Block.list[i].x * zoom > -Block.list[i].width * zoom - drawDistance && centerX - myPlayer.x * zoom + Block.list[i].x * zoom < canvasWidth + drawDistance && centerY - myPlayer.y * zoom + Block.list[i].y * zoom > -Block.list[i].height * zoom - drawDistance && centerY - myPlayer.y * zoom + Block.list[i].y * zoom < canvasHeight + drawDistance){
				var imgBlock = Img.warp1;
				if (Block.list[i].type == "warp1" || Block.list[i].type == "warp2"){
					if (warpImageSwapper == 1 || warpImageSwapper == 2)
						imgBlock = Img.warp1;
					else if (warpImageSwapper == 3 || warpImageSwapper == 4)
						imgBlock = Img.warp2;
					else if (warpImageSwapper == 5 || warpImageSwapper == 6)
						imgBlock = Img.warp3;
					else if (warpImageSwapper == 7 || warpImageSwapper == 8)
						imgBlock = Img.warp4;
				}
				else {
					continue;
				}
				drawImage(imgBlock, centerX - myPlayer.x * zoom + Block.list[i].x * zoom, centerY - myPlayer.y * zoom + Block.list[i].y * zoom, Block.list[i].width * zoom, Block.list[i].height * zoom);
			}		
		}
	}
}

function drawPickups(){	
	if (pickupFlash > -3){
		pickupFlash -= 0.05;
	}
	else {
		pickupFlash = 1;
	}
	
	for (var i in Pickup.list) {
		if (centerX - myPlayer.x * zoom + Pickup.list[i].x * zoom > -Img.pickupDP.width * zoom - drawDistance && centerX - myPlayer.x * zoom + Pickup.list[i].x * zoom < canvasWidth + drawDistance && centerY - myPlayer.y * zoom + Pickup.list[i].y * zoom > -Img.pickupDP.height * zoom - drawDistance && centerY - myPlayer.y * zoom + Pickup.list[i].y * zoom < canvasHeight + drawDistance){
			ctx.globalAlpha = 1;
			normalShadow();
			
			var pickupImg = Img.pickupDP;
			var pickupImg2 = Img.pickupDP2;
			if (Pickup.list[i].type == 1){
				pickupImg = Img.pickupMD;
				pickupImg2 = Img.pickupMD2;
			}
			else if (Pickup.list[i].type == 2){
				pickupImg = Img.pickupDP;
				pickupImg2 = Img.pickupDP2;
			}
			else if (Pickup.list[i].type == 3){
				pickupImg = Img.pickupMG;
				pickupImg2 = Img.pickupMG2;
			}
			else if (Pickup.list[i].type == 4){
				pickupImg = Img.pickupSG;
				pickupImg2 = Img.pickupSG2;
			}
			else if (Pickup.list[i].type == 5){
				pickupImg = Img.pickupBA;
				pickupImg2 = Img.pickupBA2;
			}
			
			if (Pickup.list[i].respawnTimer != 0){
				ctx.globalAlpha = .2; //Make transparent if pickup is queued to respawn
			}
			drawImage(pickupImg, centerX - myPlayer.x * zoom + Pickup.list[i].x * zoom, centerY - myPlayer.y * zoom + Pickup.list[i].y * zoom, pickupImg.width * zoom, pickupImg.height * zoom);
			
			if (Pickup.list[i].respawnTimer == 0){				
				if (pickupFlash < 0){
					ctx.globalAlpha = 0;
				}
				else {
					ctx.globalAlpha = pickupFlash.toFixed(2);
				}
				drawImage(pickupImg2, centerX - myPlayer.x * zoom + Pickup.list[i].x * zoom, centerY - myPlayer.y * zoom + Pickup.list[i].y * zoom, pickupImg.width * zoom, pickupImg.height * zoom);
			}
			else if (!gameOver){
				//Draw pickup respawn timer
				ctx.globalAlpha = 1;
				ctx.textAlign = "center";
				ctx.font = (18 * zoom).toString() + 'px Electrolize';
				ctx.shadowColor = "black";
				ctx.lineWidth=3;
				if (Pickup.list[i].type == 1){
					ctx.fillStyle="white";
					ctx.strokeStyle="#981b1e";
					ctx.shadowColor = "#981b1e";
				}
				else if (Pickup.list[i].type >= 2 && Pickup.list[i].type <= 4){
					ctx.fillStyle="white";
					ctx.strokeStyle="#247747";
					ctx.shadowColor = "#247747";
				}
				else if (Pickup.list[i].type == 5){
					ctx.fillStyle="white";
					ctx.strokeStyle="#005b98";
					ctx.shadowColor = "#005b98";
				}
				ctx.shadowOffsetX = 0; 
				ctx.shadowOffsetY = 0;
				ctx.shadowBlur = 0;		

				strokeAndFillText(Pickup.list[i].respawnTimer, centerX - myPlayer.x * zoom + Pickup.list[i].x * zoom + Pickup.list[i].width/2 * zoom, centerY - myPlayer.y * zoom + Pickup.list[i].y * zoom + (Pickup.list[i].height/2 + 7) * zoom);
				ctx.fillStyle="black";
			}
		}
	}
	ctx.globalAlpha = 1;
	ctx.strokeStyle="#000";
}

function drawBags(){
	normalShadow();
	if (gametype == "ctf"){
		if (bagRed.captured == false){
			if (centerX - myPlayer.x * zoom + bagRed.x * zoom - Img.bagRed.width/2 * zoom > -Img.bagRed.width * zoom - drawDistance && centerX - myPlayer.x * zoom + bagRed.x * zoom - Img.bagRed.width/2 * zoom < canvasWidth + drawDistance && centerY - myPlayer.y * zoom + bagRed.y * zoom - Img.bagRed.height/2 * zoom > -Img.bagRed.height * zoom - drawDistance && centerY - myPlayer.y * zoom + bagRed.y * zoom - Img.bagRed.height/2 * zoom < canvasHeight + drawDistance){
				drawImage(Img.bagRed, centerX - myPlayer.x * zoom + bagRed.x * zoom - Img.bagRed.width/2 * zoom, centerY - myPlayer.y * zoom + bagRed.y * zoom - Img.bagRed.height/2 * zoom, Img.bagRed.width * zoom, Img.bagRed.height * zoom);
			}
		}
		if (bagBlue.captured == false){
			if (centerX - myPlayer.x * zoom + bagBlue.x * zoom - Img.bagBlue.width/2 * zoom > -Img.bagBlue.width * zoom - drawDistance && centerX - myPlayer.x * zoom + bagBlue.x * zoom - Img.bagBlue.width/2 * zoom < canvasWidth + drawDistance && centerY - myPlayer.y * zoom + bagBlue.y * zoom - Img.bagBlue.height/2 * zoom > -Img.bagBlue.height * zoom - drawDistance && centerY - myPlayer.y * zoom + bagBlue.y * zoom - Img.bagBlue.height/2 * zoom < canvasHeight + drawDistance){
				drawImage(Img.bagBlue, centerX - myPlayer.x * zoom + bagBlue.x * zoom - Img.bagBlue.width/2 * zoom, centerY - myPlayer.y * zoom + bagBlue.y * zoom - Img.bagBlue.height/2 * zoom, Img.bagBlue.width * zoom, Img.bagBlue.height * zoom);
			}
		}
	}
}

function drawTorsos(){
		
	for (var i in Player.list) {		
		if (Player.list[i].health > 0 && Player.list[i].team != "none"){
			if (Player.list[i].x * zoom + 47 * zoom + drawDistance > cameraX && Player.list[i].x * zoom - 47 * zoom - drawDistance < cameraX + canvasWidth && Player.list[i].y * zoom + 47 * zoom + drawDistance > cameraY && Player.list[i].y * zoom - 47 * zoom - drawDistance < cameraY + canvasHeight){
				normalShadow();
				var img = Img.whitePlayerPistol;
				if (Player.list[i].team == "white"){
					if (Player.list[i].weapon == 2){
						img = Img.whitePlayerDP;
					}
					else if (Player.list[i].weapon == 3){
						img = Img.whitePlayerMG;
					}
					else if (Player.list[i].weapon == 4){
						img = Img.whitePlayerSG;
					}
				}
				else if (Player.list[i].team == "black"){
					if (Player.list[i].weapon == 3){
						img = Img.blackPlayerMG;
					}
					else if (Player.list[i].weapon == 2){
						img = Img.blackPlayerDP;
					}
					else if (Player.list[i].weapon == 4){
						img = Img.blackPlayerSG;
					}
					else {
						img = Img.blackPlayerPistol;
					}
				}
				
                ctx.save();
				ctx.translate(centerX - myPlayer.x * zoom + Player.list[i].x * zoom, centerY - myPlayer.y * zoom + Player.list[i].y * zoom); //Center camera on controlled player			
				ctx.rotate(getRotation(Player.list[i].shootingDir));
									
					//draw bag on players back
					if (Player.list[i].holdingBag == true && Player.list[i].team == "white"){
						ctx.save();
                        ctx.translate(5 * zoom,5 * zoom);
						ctx.rotate(315*Math.PI/180);
							drawImage(Img.bagBlue, -Img.bagBlue.width/2 * zoom, -Img.bagBlue.height/2 * zoom, Img.bagBlue.width * zoom, Img.bagBlue.height * zoom); 
						//ctx.rotate(-315*Math.PI/180);
						//ctx.translate(-5 * zoom,-5 * zoom);
                        ctx.restore();

					}
					else if (Player.list[i].holdingBag == true && Player.list[i].team == "black"){
						ctx.save();
                        ctx.translate(5 * zoom,5 * zoom);
						ctx.rotate(315*Math.PI/180);
							drawImage(Img.bagRed, -Img.bagRed.width/2 * zoom, -Img.bagRed.height/2 * zoom, Img.bagRed.width * zoom, Img.bagRed.height * zoom); 
						//ctx.rotate(-315*Math.PI/180);
						//ctx.translate(-5 * zoom,-5 * zoom);
                        ctx.restore();
					}			
					
					////RELOADING////
					if (Player.list[i].reloading > 0){
						Player.list[i].reloading--;
						////!!! Move erything below to different function
						if (Player.list[i].weapon == 1){
							if (Player.list[i].reloading < 12){
								if (Player.list[i].team == "black"){
									img = Img.blackPlayerPistolReloading3;
								}
								else if (Player.list[i].team == "white"){
									img = Img.whitePlayerPistolReloading3;
								}
							}
							else if (Player.list[i].reloading < 24){
								if (Player.list[i].team == "black"){
									img = Img.blackPlayerPistolReloading4;
								}
								else if (Player.list[i].team == "white"){
									img = Img.whitePlayerPistolReloading4;
								}
							}
							else if (Player.list[i].reloading < 36){
								if (Player.list[i].team == "black"){
									img = Img.blackPlayerPistolReloading3;
								}
								else if (Player.list[i].team == "white"){
									img = Img.whitePlayerPistolReloading3;
								}
							}
							else if (Player.list[i].reloading < 48){
								if (Player.list[i].team == "black"){
									img = Img.blackPlayerPistolReloading2;
								}
								else if (Player.list[i].team == "white"){
									img = Img.whitePlayerPistolReloading2;
								}
							}
							else if (Player.list[i].reloading <= 60){
								if (Player.list[i].team == "black"){
									img = Img.blackPlayerPistolReloading1;
								}
								else if (Player.list[i].team == "white"){
									img = Img.whitePlayerPistolReloading1;
								}
							}
						}
						if (Player.list[i].weapon == 2){
							if (Player.list[i].reloading < 20){
								if (Player.list[i].team == "black"){
									img = Img.blackPlayerDPReloading3;
								}
								else if (Player.list[i].team == "white"){
									img = Img.whitePlayerDPReloading3;
								}
							}
							else if (Player.list[i].reloading < 60){
								if (Player.list[i].team == "black"){
									img = Img.blackPlayerDPReloading2;
								}
								else if (Player.list[i].team == "white"){
									img = Img.whitePlayerDPReloading2;
								}
							}
							else if (Player.list[i].reloading <= 80){
								if (Player.list[i].team == "black"){
									img = Img.blackPlayerDPReloading1;
								}
								else if (Player.list[i].team == "white"){
									img = Img.whitePlayerDPReloading1;
								}
							}
						}
						else if (Player.list[i].weapon == 3){
							if (Player.list[i].reloading < 22){
								if (Player.list[i].team == "black"){
									img = Img.blackPlayerMGReloading4;
								}
								else if (Player.list[i].team == "white"){
									img = Img.whitePlayerMGReloading4;
								}
							}
							else if (Player.list[i].reloading < 30){
								if (Player.list[i].team == "black"){
									img = Img.blackPlayerMGReloading5;
								}
								else if (Player.list[i].team == "white"){
									img = Img.whitePlayerMGReloading5;
								}
							}
							else if (Player.list[i].reloading < 48){
								if (Player.list[i].team == "black"){
									img = Img.blackPlayerMGReloading4;
								}
								else if (Player.list[i].team == "white"){
									img = Img.whitePlayerMGReloading4;
								}
							}
							else if (Player.list[i].reloading < 60){
								if (Player.list[i].team == "black"){
									img = Img.blackPlayerMGReloading1;
								}
								else if (Player.list[i].team == "white"){
									img = Img.whitePlayerMGReloading1;
								}
							}
							else if (Player.list[i].reloading <= 72){
								if (Player.list[i].team == "black"){
									img = Img.blackPlayerMGReloading2;
								}
								else if (Player.list[i].team == "white"){
									img = Img.whitePlayerMGReloading2;
								}
							}
							else if (Player.list[i].reloading < 90){
								if (Player.list[i].team == "black"){
									img = Img.blackPlayerMGReloading3;
								}
								else if (Player.list[i].team == "white"){
									img = Img.whitePlayerMGReloading3;
								}
							}
							else if (Player.list[i].reloading < 102){
								if (Player.list[i].team == "black"){
									img = Img.blackPlayerMGReloading2;
								}
								else if (Player.list[i].team == "white"){
									img = Img.whitePlayerMGReloading2;
								}
							}
							else if (Player.list[i].reloading <= 114){
								if (Player.list[i].team == "black"){
									img = Img.blackPlayerMGReloading1;
								}
								else if (Player.list[i].team == "white"){
									img = Img.whitePlayerMGReloading1;
								}
							}						
						}
						if (Player.list[i].weapon == 4){
							if (Player.list[i].reloading < 10){
								if (Player.list[i].team == "black"){
									img = Img.blackPlayerSGReloading3;
								}
								else if (Player.list[i].team == "white"){
									img = Img.whitePlayerSGReloading3;
								}
							}
							else if (Player.list[i].reloading < 20){
								if (Player.list[i].team == "black"){
									img = Img.blackPlayerSGReloading2;
								}
								else if (Player.list[i].team == "white"){
									img = Img.whitePlayerSGReloading2;
								}
							}
							else if (Player.list[i].reloading <= 30){
								if (Player.list[i].team == "black"){
									img = Img.blackPlayerSGReloading1;
								}
								else if (Player.list[i].team == "white"){
									img = Img.whitePlayerSGReloading1;
								}
							}
							if (Player.list[i].reloading == 20 && !mute){								
								var randy = randomInt(0,2);
								if (randy == 0){
									sfxSGReload1.play();
								}
								else if (randy == 1){
									sfxSGReload2.play();
								}
								else if (randy == 2){
									sfxSGReload3.play();
								}
								else {
									sfxSGReload1.play();
								}									
							}
						}
					}
					//SG Cocking
					if (Player.list[i].triggerTapLimitTimer > 0){					
						Player.list[i].triggerTapLimitTimer--;
						if (Player.list[i].weapon == 4){
							if (Player.list[i].triggerTapLimitTimer == 30){
								sfxSGEquip.play();
							}
							if (Player.list[i].triggerTapLimitTimer > 30){
								if (Player.list[i].team == "white"){
									img = Img.whitePlayerSG;
								}
								else if (Player.list[i].team == "black"){
									img = Img.blackPlayerSG;
								}
							}
							else if (Player.list[i].triggerTapLimitTimer > 10){
								if (Player.list[i].team == "white"){
									img = Img.whitePlayerSGCock;
								}
								else if (Player.list[i].team == "black"){
									img = Img.blackPlayerSGCock;
								}
							}
							else {
								if (Player.list[i].team == "white"){
									img = Img.whitePlayerSG;
								}
								else if (Player.list[i].team == "black"){
									img = Img.blackPlayerSG;
								}							
							}
						}
					}

					
					//Player damage flashing under
					if (!(Player.list[i].cloakEngaged && Player.list[i].team != Player.list[myPlayer.id].team)){
						if (Player.list[i].health < 100){
							healthFlashTimer--;
							if (healthFlashTimer <= 4){
								ctx.shadowColor = "red";
								ctx.shadowOffsetX = 0; 
								ctx.shadowOffsetY = 0;
								ctx.shadowBlur = 0;		
							}
							if (Player.list[i].health < 30 && healthFlashTimer > 3 && healthFlashTimer <= 6){
								ctx.shadowColor = "white";
								ctx.shadowOffsetX = 0; 
								ctx.shadowOffsetY = 0;
								ctx.shadowBlur = 0;		
							}
							if (healthFlashTimer <= 0 || healthFlashTimer > Player.list[i].health){
								//healthFlashTimer = Player.list[i].health * .75; 						
							}
						}
					}

					/*
					var dArr = [-1,-1, 0,-1, 1,-1, -1,0, 1,0, -1,1, 0,1, 1,1], // offset array
					sd = 2,  // thickness scale
					xd = -35.25,  // final position
					yd = -31.5;
						var xy = 0;
						var yy = 0;

					for(var itera = 0; itera < dArr.length; itera += 2){
						
						xy = xd + dArr[itera]*sd;
						yy = yd + dArr[itera+1]*sd;
						
						//console.log("drawing x:" + xy + " y:" + yy);
						
						drawImage(img, xd + dArr[itera]*sd, yd + dArr[itera+1]*sd, img.width * zoom, img.height * zoom);
						
					}
					
					xy = -img.width/2 * zoom;
					yy = (-img.height/2+5) * zoom;
					
					ctx.globalCompositeOperation = "source-in";
					ctx.fillStyle = "blue";
					ctx.fillRect(-50,-50,100,100);
					
					// draw original image in normal mode
					ctx.globalCompositeOperation = "source-over";	
					*/
					
					//Actually draw the torso
					//if (Player.list[i].cloak > 0.98){noShadow();}
					ctx.globalAlpha = 1 - Player.list[i].cloak;
					if (Player.list[i].cloak > maxCloakStrength){ctx.globalAlpha = 1 - maxCloakStrength;}
					if (Player.list[i].team == Player.list[myPlayer.id].team && Player.list[i].cloak > (1 - maxAlliedCloakOpacity)){ctx.globalAlpha = maxAlliedCloakOpacity;}
						
					drawImage(img,-img.width/2 * zoom, (-img.height/2+5) * zoom, img.width * zoom, img.height * zoom);	//Draw torso	
					ctx.globalAlpha = 1;
					
					//Player damage flashing over
					if (!(Player.list[i].cloakEngaged && Player.list[i].team != Player.list[myPlayer.id].team)){
						noShadow();
						if (Player.list[i].health < 100){
							healthFlashTimer--;
							if (healthFlashTimer <= 4){
								drawImage(Img.redFlash,-img.width/2 * zoom, (-img.height/2+5) * zoom, Img.redFlash.width * zoom, Img.redFlash.height * zoom);
							}
							if (Player.list[i].health < 30 && healthFlashTimer > 4 && healthFlashTimer <= 6){
								drawImage(Img.whiteFlash,-img.width/2 * zoom, (-img.height/2+5) * zoom, Img.whiteFlash.width * zoom, Img.whiteFlash.height * zoom);
							}
							if (healthFlashTimer <= 0 || healthFlashTimer > Player.list[i].health){
								healthFlashTimer = Player.list[i].health; 						
							}
						}
					}
						
					//Strap
					if (Player.list[i].holdingBag == true){
						if (Player.list[i].weapon == 1 || Player.list[i].weapon == 2){drawImage(Img.bagBlueStrap,-(img.width/2) * zoom,(-img.height/2+5) * zoom, Img.bagBlueStrap.width * zoom, Img.bagBlueStrap.height * zoom);}
						else if (Player.list[i].weapon == 3){drawImage(Img.bagBlueStrap,-(img.width/2) * zoom,(-img.height/2+10) * zoom, Img.bagBlueStrap.width * zoom, Img.bagBlueStrap.height * zoom);}
					}				
				//ctx.rotate(-(getRotation(Player.list[i].shootingDir)));
				//ctx.translate(-(centerX - myPlayer.x * zoom + Player.list[i].x * zoom), -(centerY - myPlayer.y * zoom + Player.list[i].y * zoom)); //Center camera on controlled player		
                ctx.restore();	
			}
		}//End health > 0 check
	} //End player for loop
}

function drawThugs(){ //TODO!!! Rouge image of thug appears after attacking (What?)
	for (var i in Thug.list){
		if (Thug.list[i].health > 0){
			if (Thug.list[i].x * zoom + 47 * zoom + drawDistance > cameraX && Thug.list[i].x * zoom - 47 * zoom - drawDistance < cameraX + canvasWidth && Thug.list[i].y * zoom + 47 * zoom + drawDistance > cameraY && Thug.list[i].y * zoom - 47 * zoom - drawDistance < cameraY + canvasHeight){				
				ctx.save();
                ctx.translate(centerX + Thug.list[i].x * zoom - myPlayer.x * zoom, centerY + Thug.list[i].y * zoom - myPlayer.y * zoom); //Center camera on controlled player
				ctx.rotate(Thug.list[i].rotation);
					
					var thugImg = Img.blackThugTorso;
					
					if (Thug.list[i].team == "black"){
						legs = Img.blackThugLegs;
						if (Thug.list[i].legHeight < 0){legs = Img.blackThugLegs2;}
						thugImg = Img.blackThugTorso;
					}
					else if (Thug.list[i].team == "white"){
						legs = Img.whiteThugLegs;
						if (Thug.list[i].legHeight < 0){legs = Img.whiteThugLegs2;}
						thugImg = Img.whiteThugTorso;
					}
					//Draw Legs
					
					drawImage(legs, -thugImg.width/2 * zoom, -Thug.list[i].legHeight/2 * zoom, thugImg.width * zoom, Thug.list[i].legHeight * zoom);
					
					//Draw Torso
					ctx.rotate(Thug.list[i].legHeight/400); //Rotate shoulders a bit based on leg's gait
						drawImage(thugImg, -thugImg.width/2 * zoom, -thugImg.height/2 * zoom, thugImg.width * zoom, thugImg.height * zoom);
					ctx.rotate(-Thug.list[i].legHeight/400);

                ctx.restore();
			}
		}
	}
}

function drawShots(){
	for (var i in Player.list) {
		if (Shot.list[Player.list[i].id]){
			var shot = Shot.list[Player.list[i].id];			
			if (shot.decay > 0){
                ctx.save();
				ctx.translate(centerX - myPlayer.x * zoom + Player.list[i].x * zoom, centerY - myPlayer.y * zoom + Player.list[i].y * zoom); //Center camera on controlled player
				ctx.rotate(getRotation(Player.list[i].shootingDir));
					noShadow();
					var xOffset = 0;
					var yOffset = 0;
					var SGscale = .6; //!!!! Remove
					if (Player.list[i].weapon == 3){xOffset = 6; yOffset = -3;}
					else if (Player.list[i].weapon == 2){xOffset = -3; yOffset = 0;}					
					else if (Player.list[i].weapon == 4){xOffset = -310 * SGscale; yOffset = -680 * SGscale;}

					if (Player.list[i].weapon == 4){
						
						drawImage(Img.shotShotgun,(xOffset) * zoom, (yOffset) * zoom, Img.shotShotgun.width * zoom * SGscale, Img.shotShotgun.height * zoom * SGscale);
						
						shot.width *= 2;
						shot.height *= 2;
						if (shot.width < 100) shot.width = 100;
						if (shot.height < 90) shot.height = 90;
						
						drawImage(Img.shotFlash, (6 - shot.width/2 - 2) * zoom * SGscale, (-42 - shot.height) * zoom * SGscale, shot.width * zoom * SGscale, shot.height * zoom * SGscale);
					}
					else {
						drawImage(Img.shot,(-4 + xOffset) * zoom, (-shot.distance - 40 + yOffset) * zoom, Img.shot.width * zoom, shot.distance * zoom);
						drawImage(Img.shotFlash, (xOffset - shot.width/2 - 2) * zoom, (yOffset - 34 - shot.height) * zoom, shot.width * zoom, shot.height * zoom);
						if (shot.spark){
							drawImage(Img.shotSpark, (-22 + xOffset) * zoom, (-shot.distance - 60) * zoom, Img.shotSpark.width * zoom, Img.shotSpark.height * zoom);
						}					
						if (Player.list[i].weapon == 2){
							xOffset = 6; yOffset = -1;
							drawImage(Img.shot, (-4 + xOffset) * zoom, (-shot.distance - 40 + yOffset) * zoom, Img.shot.width * zoom, shot.distance * zoom);
							drawImage(Img.shotFlash, (xOffset - shot.width/2 - 2) * zoom, (yOffset - 34 - shot.height) * zoom, shot.width * zoom, shot.height * zoom);
							if (shot.spark){
								drawImage(Img.shotSpark, (-22 + xOffset) * zoom, (-shot.distance - 60) * zoom, Img.shotSpark.width * zoom, Img.shotSpark.height * zoom);					
							}
						}
					}
				//ctx.rotate(-(getRotation(Player.list[i].shootingDir)));
				//ctx.translate(-(centerX - myPlayer.x * zoom + Player.list[i].x * zoom), -(centerY - myPlayer.y * zoom + Player.list[i].y * zoom)); //Center camera on controlled player
                ctx.restore();
			}
			shot.decay--;
			if (shot.decay <= 0){delete Shot.list[Player.list[i].id];}
		} 
	}
}

var laserOn = true;
function drawLaser(){
	if (myPlayer.pressingShift && !shop.active && Player.list[myPlayer.id].reloading <= 0){
		if (laserOn == false){
			laserOn = true;
			return;
		}
		laserOn = false;
		
		var laserOffset = 2;
		var shot = {};
		shot.distance = canvasWidth * 2;
		shot.width = 20;
		shot.height = 20;
		
        ctx.save();
		ctx.translate(centerX - myPlayer.x * zoom + Player.list[myPlayer.id].x * zoom, centerY - myPlayer.y * zoom + Player.list[myPlayer.id].y * zoom); //Center camera on controlled player
		ctx.rotate(getRotation(Player.list[myPlayer.id].shootingDir));
			noShadow();
			var xOffset = 0 + laserOffset;
			var yOffset = 0;
			if (Player.list[myPlayer.id].weapon == 3){xOffset = 6 + laserOffset; yOffset = -3;}
			else if (Player.list[myPlayer.id].weapon == 2){xOffset = -3 + laserOffset; yOffset = 0;}					
			else if (Player.list[myPlayer.id].weapon == 4){xOffset = 5; yOffset = -277;}

			if (Player.list[myPlayer.id].weapon == 4){
				
				drawImage(Img.redLaser,(xOffset) * zoom, (yOffset - 15) * zoom, Img.shot.width/2 * zoom, 250 * zoom);
				
				shot.width *= 2;
				shot.height *= 2;
				if (shot.width < 100) shot.width = 100;
				if (shot.height < 90) shot.height = 90;
				
			}
			else {
				drawImage(Img.redLaser,(-4 + xOffset) * zoom, (-shot.distance - 40 + yOffset) * zoom, Img.shot.width/2 * zoom, shot.distance * zoom);
				if (Player.list[myPlayer.id].weapon == 2){
					xOffset = 6 + laserOffset; yOffset = -1;
					drawImage(Img.redLaser, (-4 + xOffset) * zoom, (-shot.distance - 40 + yOffset) * zoom, Img.shot.width/2 * zoom, shot.distance * zoom);
				}
			}
		//ctx.rotate(-(getRotation(Player.list[myPlayer.id].shootingDir)));
		//ctx.translate(-(centerX - myPlayer.x * zoom + Player.list[myPlayer.id].x * zoom), -(centerY - myPlayer.y * zoom + Player.list[myPlayer.id].y * zoom)); //Center camera on controlled player                
		//normalShadow();
		//ctx.globalAlpha = 1;
        ctx.restore();
	}
}

function drawBoosts(){
	for (var i in Player.list) {
		if (BoostBlast.list[Player.list[i].id]){
            var blast = BoostBlast.list[Player.list[i].id];
            var blastDir = Player.list[i].walkingDir - 4;
            if (blastDir < 1) 
                    blastDir += 8;
            var imgblast = Img.boostBlast;
            
            ctx.save();
            noShadow();
            ctx.globalAlpha = blast.alpha;
            blast.alpha -= .2;
            
            var distanceOffset = blast.width;
            
            if (Player.list[i].x * zoom + 47 * zoom + drawDistance > cameraX && Player.list[i].x * zoom - 47 * zoom - drawDistance < cameraX + canvasWidth && Player.list[i].y * zoom + 47 * zoom + drawDistance > cameraY && Player.list[i].y * zoom - 47 - drawDistance < cameraY + canvasHeight){
                ctx.translate(centerX - myPlayer.x * zoom + Player.list[i].x * zoom, centerY - myPlayer.y * zoom + Player.list[i].y * zoom); //Center camera on controlled player
                ctx.rotate(getRotation(blastDir));
                    drawImage(imgblast, (-blast.width/2 - 15) * zoom, (-blast.height - 10) * zoom, blast.width * zoom, blast.height * zoom);
                    drawImage(imgblast, (-blast.width/2 + 15) * zoom, (-blast.height - 10) * zoom, blast.width * zoom, blast.height * zoom);
                //ctx.rotate(-(getRotation(blastDir)));
                //ctx.translate(-(centerX - myPlayer.x * zoom + Player.list[i].x * zoom), -(centerY - myPlayer.y * zoom + Player.list[i].y * zoom)); //Center camera on controlled player
            }
            blast.width = blast.width + 20 * 1;
            blast.height = blast.height + 20 * 1;
            if (blast.alpha <= 0){
                delete BoostBlast.list[blast.id];
            }	
            //ctx.globalAlpha = 1;
            ctx.restore();	
		}
	}
}

function drawBlood(){
	noShadow();	
	for (var i in Blood.list) {
		var blood = Blood.list[i];
		var rotate = getRotation(blood.direction);
		
		var bloodRand = blood.bloodRand;
		var imgBlood = Img.blood1;
		if (bloodRand == 2){imgBlood = Img.blood2;}
		else if (bloodRand == 3){imgBlood = Img.blood3;}
		else if (bloodRand == 4){imgBlood = Img.blood4;}
		var minusAlpha = (Number(Math.round(((blood.width - 100) / 150)+'e1')+'e-1'));
		if (minusAlpha > 1){minusAlpha = 1;}
		
		if (Blood.list[i].x * zoom + 100 * zoom + drawDistance > cameraX && Blood.list[i].x * zoom - 100 * zoom - drawDistance < cameraX + canvasWidth && Blood.list[i].y * zoom + 100 * zoom + drawDistance > cameraY && Blood.list[i].y * zoom - 100 - drawDistance < cameraY + canvasHeight){
			ctx.save();
            ctx.translate(centerX + blood.x * zoom - myPlayer.x * zoom, centerY + blood.y * zoom - myPlayer.y * zoom); //Center camera on controlled player
			ctx.rotate(rotate);
			ctx.globalAlpha = 1 - minusAlpha;
				drawImage(imgBlood, -blood.width/2 * zoom, (-blood.height+25) * zoom, blood.width * zoom, blood.height * zoom);
			//ctx.rotate(-rotate);
			//ctx.translate(-(centerX + blood.x * zoom - myPlayer.x * zoom), -(centerY + blood.y * zoom - myPlayer.y * zoom)); //Center camera on controlled player
            ctx.restore();
		}
		
		blood.width = blood.width + 21 * 1.2;
		blood.height = blood.height + 24.25 * 1.2;
		if (blood.width >= 350){
			delete Blood.list[blood.id];	
		}
	}
	ctx.globalAlpha = 1;
}
	
function drawSmashes(){
	for (var i in Smash.list) {
		var smash = Smash.list[i];
		
		var smashRand = smash.smashRand;
		var imgsmash = Img.smashRed;
		if (smashRand == 2){imgsmash = Img.smashBlue;}
		else if (smashRand == 3){imgsmash = Img.smashGreen;}
		else if (smashRand == 4){imgsmash = Img.smashYellow;}
		
		ctx.save();
        ctx.translate(centerX + smash.x * zoom - myPlayer.x * zoom, centerY + smash.y * zoom - myPlayer.y * zoom); //Center camera on controlled player
			var minusAlpha = (Number(Math.round(((smash.width - 100) / 150)+'e1')+'e-1'));
			if (minusAlpha > 1){minusAlpha = 1;}
			ctx.globalAlpha = 1 - minusAlpha;
			drawImage(imgsmash, -smash.width/2 * zoom, -smash.height/2 * zoom, smash.width * zoom, smash.height * zoom);
		//ctx.translate(-(centerX + smash.x * zoom - myPlayer.x * zoom), -(centerY + smash.y * zoom - myPlayer.y * zoom)); //Center camera on controlled player
		ctx.restore();

		smash.width = smash.width + 20 * 1.2;
		smash.height = smash.height + 20 * 1.2;
		if (smash.width >= 150){
			delete Smash.list[smash.id];
		}		
	}
	ctx.globalAlpha = 1;
}

function drawNotifications(){	
	for (var n in Notification.list){
		if (!Player.list[Notification.list[n].playerId]){
			delete Notification.list[n];
			continue;
		}
		Notification.list[n].age++;
		
		var noteY = ((-Img.whitePlayerPistol.height/2 - Notification.list[n].age/1.5 + 25) - Notification.list[n].yOffset);
	
		if (Player.list[Notification.list[n].playerId].x * zoom + 47 * zoom + drawDistance > cameraX && Player.list[Notification.list[n].playerId].x * zoom - 47 * zoom - drawDistance < cameraX + canvasWidth && Player.list[Notification.list[n].playerId].y * zoom + 47 * zoom + drawDistance > cameraY && Player.list[Notification.list[n].playerId].y * zoom - 47 * zoom - drawDistance < cameraY + canvasHeight){
			var noteFontSize = (60 - Notification.list[n].age * 2) * zoom;
			if (noteFontSize < 20 * zoom){noteFontSize = 20 * zoom;}
			ctx.save();
            ctx.globalAlpha = Math.round((1 - ((Notification.list[n].age / 50) - 0.7)) * 100) / 100;
			ctx.translate(centerX + Player.list[Notification.list[n].playerId].x * zoom - myPlayer.x * zoom, centerY + Player.list[Notification.list[n].playerId].y * zoom - myPlayer.y  * zoom); //Center camera on controlled player
				noShadow();
				ctx.lineWidth=4 * zoom;
				ctx.fillStyle="#19BE44";
				if (Notification.list[n].text.includes("Benedict")){ctx.fillStyle="#9A0606";}
				if (Notification.list[n].text.includes("**")){ctx.fillStyle="#1583e4"; noteFontSize += 10;}
				ctx.font = 'bold ' + noteFontSize + 'px Electrolize';
				strokeAndFillText(Notification.list[n].text,0, noteY * zoom);
			//ctx.translate(-(centerX + Player.list[Notification.list[n].playerId].x * zoom - myPlayer.x * zoom), -(centerY + Player.list[Notification.list[n].playerId].y * zoom - myPlayer.y  * zoom)); //Center camera on controlled player
            ctx.restore();
		}
		if (Notification.list[n].age > 84){
			delete Notification.list[n];
			continue;
		}
	}	
	normalShadow();
	ctx.globalAlpha = 1;
}

//draw usernames
function drawPlayerTags(){
	ctx.fillStyle = "#000000";
	ctx.textAlign="center";
	ctx.font = 'bold 12px Electrolize';
	for (var i in Player.list){
		if (Player.list[i].chat && Player.list[i].chatDecay > 0){
			Player.list[i].chatDecay--;
		}
		if (Player.list[i].x * zoom + 47 * zoom + drawDistance > cameraX && Player.list[i].x * zoom - 47 * zoom - drawDistance < cameraX + canvasWidth && Player.list[i].y * zoom + 47 * zoom + drawDistance > cameraY && Player.list[i].y * zoom - 47 * zoom - drawDistance < cameraY + canvasHeight){
			var playerUsername = Player.list[i].name.substring(0, 15);
			ctx.save();
            ctx.translate(centerX - myPlayer.x * zoom + Player.list[i].x * zoom, centerY - myPlayer.y * zoom + Player.list[i].y * zoom); //Center camera on controlled player
				if (Player.list[i].health > 0 && Player.list[i].team != "none" && !(Player.list[i].cloakEngaged == true && Player.list[i].team != Player.list[myPlayer.id].team)){
					ctx.shadowColor = "white";
					ctx.shadowOffsetX = 0; 
					ctx.shadowOffsetY = 0;
					ctx.shadowBlur = 3;
					ctx.fillText(playerUsername,0, -Img.whitePlayerPistol.height/2 * zoom); //Draw myPlayer name above head, draw username, draw names			
				}			
				if (Player.list[i].team != "none" && Player.list[i].chat && Player.list[i].chatDecay > 0 && !(Player.list[i].cloakEngaged && Player.list[i].team != Player.list[myPlayer.id].team)){
					if (Player.list[i].chat.length > 0){
						smallCenterShadow();
						ctx.font = '16px Electrolize';
						ctx.fillStyle="#FFFFFF";
						ctx.fillText(Player.list[i].chat,0, -Img.whitePlayerPistol.height/2 * zoom - 20); //Draw chats above head
					}
				}
			//ctx.translate(-(centerX - myPlayer.x * zoom + Player.list[i].x * zoom), -(centerY - myPlayer.y * zoom + Player.list[i].y * zoom)); //Center camera on controlled player
            ctx.restore();
		}
	}
	normalShadow();
}

function drawShop(){
	if (shop.active){
		if (Player.list[myPlayer.id].team == "white"){
			Player.list[myPlayer.id].shootingDir = 7;
			myPlayer.shootingDir = 7;
		}
		else if (Player.list[myPlayer.id].team == "black"){
			Player.list[myPlayer.id].shootingDir = 3;
			myPlayer.shootingDir = 3;
		}
		
		//Offset to determine whether to print Black Market on right or left of screen
		var teamBlackMarketXOffset = 100;
		if (Player.list[myPlayer.id].team ==  "black"){
			teamBlackMarketXOffset = 400;
		}
			
		var ownerText1 = "";
		var ownerText2 = "";
		
		if (leftArrowX > 77){
			arrowsGoingOut = true;
		}
		else if (leftArrowX < 67){
			arrowsGoingOut = false;
		}
		if (arrowsGoingOut){
			leftArrowX -= .5;
			rightArrowX += .5;		
		}
		else {
			leftArrowX += .5;
			rightArrowX -= .5;
		}
		
		var moveArrow = 0;		
		if (shop.selection == 1)
			moveArrow = -138;
		else if (shop.selection == 2)
			moveArrow = -69;
		else if (shop.selection == 4)
			moveArrow = 69;
		else if (shop.selection == 5)
			moveArrow = 138;
		
		var inventoryYoffset = 100;

		drawImage(Img.black50, 50 + teamBlackMarketXOffset, 0, 495, canvasHeight);
		drawImage(Img.shopInventory, 124 + teamBlackMarketXOffset, 250 + inventoryYoffset);
		drawImage(Img.upArrow, 249 + moveArrow + teamBlackMarketXOffset, 175 + inventoryYoffset - shop.purchaseEffectTimer);
		drawImage(Img.downArrow, 207 + teamBlackMarketXOffset, 370 + inventoryYoffset);
		drawImage(Img.leftArrow, leftArrowX + teamBlackMarketXOffset, 275 + inventoryYoffset);
		drawImage(Img.rightArrow, rightArrowX + teamBlackMarketXOffset, 275 + inventoryYoffset);


		var alph = (leftArrowX - 66) / 10;
		if (alph < 0){
			alph = 0;
		}	
		ctx.globalAlpha = alph;
		if (shop.selection == 1){
			drawImage(Img.shopMG2, 123 + teamBlackMarketXOffset, 250 + inventoryYoffset);
			ownerText1 = "Fully automatic machine gun.";
			ownerText2 = "60 rounds for $" + shop.price1 + ".";
			if (shop.purchaseEffectTimer > 0){
				ctx.globalAlpha = .8;
				if (shop.uniqueText != "Heh heh heh heh... Thank you.")
					drawImage(Img.red,127 + teamBlackMarketXOffset, 254 + inventoryYoffset)
				else
					drawImage(Img.white,127 + teamBlackMarketXOffset, 254 + inventoryYoffset)
			}			
		}
		else if (shop.selection == 2){
			drawImage(Img.shopSG2, 192 + teamBlackMarketXOffset, 250 + inventoryYoffset);
			ownerText1 = "Pump action Shotgun. Devastating at close range.";
			ownerText2 = "24 shells for $" + shop.price2 + ".";
			if (shop.purchaseEffectTimer > 0){
				ctx.globalAlpha = .8;
				if (shop.uniqueText != "Heh heh heh heh... Thank you.")
					drawImage(Img.red,196 + teamBlackMarketXOffset, 254 + inventoryYoffset)
				else
					drawImage(Img.white,196 + teamBlackMarketXOffset, 254 + inventoryYoffset)
			}
		}
		else if (shop.selection == 3){
			drawImage(Img.shopDP2, 261 + teamBlackMarketXOffset, 250 + inventoryYoffset);
			ownerText1 = "Two pistols instead of one. Double your firepower.";
			ownerText2 = "40 rounds for $" + shop.price3 + ".";
			if (shop.purchaseEffectTimer > 0){
				ctx.globalAlpha = .8;
				if (shop.uniqueText != "Heh heh heh heh... Thank you.")
					drawImage(Img.red,265 + teamBlackMarketXOffset, 254 + inventoryYoffset)
				else
					drawImage(Img.white,265 + teamBlackMarketXOffset, 254 + inventoryYoffset)
			}
		}
		else if (shop.selection == 4){
			drawImage(Img.shopBA2, 330 + teamBlackMarketXOffset, 250 + inventoryYoffset);
			ownerText1 = "Extra damage protection.";
			ownerText2 = "Temporarily increases HP by 100.";
			if (shop.purchaseEffectTimer > 0){
				ctx.globalAlpha = .8;
				if (shop.uniqueText != "Heh heh heh heh... Thank you.")
					drawImage(Img.red,334 + teamBlackMarketXOffset, 254 + inventoryYoffset)
				else
					drawImage(Img.white,334 + teamBlackMarketXOffset, 254 + inventoryYoffset)
			}
		}
		else if (shop.selection == 5){
			drawImage(Img.shopEB2, 399 + teamBlackMarketXOffset, 250 + inventoryYoffset);
			ownerText1 = "Extends your battery capacity."
			ownerText2 = "Increases energy by 100%.";
			if (shop.purchaseEffectTimer > 0){
				ctx.globalAlpha = .8;
				if (shop.uniqueText != "Heh heh heh heh... Thank you.")
					drawImage(Img.red,403 + teamBlackMarketXOffset, 254 + inventoryYoffset)
				else
					drawImage(Img.white,403 + teamBlackMarketXOffset, 254 + inventoryYoffset)
			}
		}
		ctx.globalAlpha = 1;
		
		if (shop.purchaseEffectTimer > 0){
			shop.purchaseEffectTimer--;
		}

		ctx.fillStyle="#19BE44";
		ctx.fillText("$"+shop.price1, 160 + teamBlackMarketXOffset, 349 + inventoryYoffset);
		ctx.fillText("$"+shop.price2, 229 + teamBlackMarketXOffset, 349 + inventoryYoffset);
		ctx.fillText("$"+shop.price3, 298 + teamBlackMarketXOffset, 349 + inventoryYoffset);
		ctx.fillText("$"+shop.price4, 367 + teamBlackMarketXOffset, 349 + inventoryYoffset);
		ctx.fillText("$"+shop.price5, 436 + teamBlackMarketXOffset, 349 + inventoryYoffset);
		
		ctx.font = '24px Electrolize';		
		ctx.fillText("$"+myPlayer.cash, 298 + teamBlackMarketXOffset, 690);		
		ctx.fillStyle="#FFFFFF";
		ctx.fillText("You have:", 298 + teamBlackMarketXOffset, 660);		

		
		drawImage(Img.spy, 263 + teamBlackMarketXOffset, 75);
		ctx.font = '20px Electrolize';	
		if (shop.uniqueTextTimer > 0){
			ctx.fillText(shop.uniqueText, 298 + teamBlackMarketXOffset, 175);	
			shop.uniqueTextTimer--;
		}
		else {
			ctx.fillText(ownerText1, 298 + teamBlackMarketXOffset, 175);		
			ctx.fillText(ownerText2, 298 + teamBlackMarketXOffset, 195);		
		}	
		
		ctx.fillStyle="#000000";		
	}
}

function drawUILayer(){	
	if (myPlayer.team != "none"){
		drawBloodyBorder();
		drawHUD();
	}
	else {
		drawSpectatingInfo();
	}
	drawInformation();
	ctx.font = 'bold 11px Electrolize';
	drawChat();
	drawStatOverlay();
	drawTopScoreboard();
	drawPostGameProgress();
	drawGameEventText();
	drawMute();
}

function drawSpectatingInfo(){
	//Draw spectating info
	var spectatingText = "";
	
	if (gametype != "ctf" && (spectatingPlayerId == "bagRed" || spectatingPlayerId == "bagBlue")){
		spectatingPlayerId = "";
	}
	
	if (typeof Player.list[spectatingPlayerId] != 'undefined'){
		spectatingText = "Spectating " + Player.list[spectatingPlayerId].name + " [cash: " + Player.list[spectatingPlayerId].cashEarnedThisGame + "]";
	}
	else if (spectatingPlayerId == "bagRed"){
		if (pcMode == 2){
			spectatingText = "Spectating Red's Bag";
		}
		else {
			spectatingText = "Spectating Whites' Bag";
		}
	}
	else if (spectatingPlayerId == "bagBlue"){
		if (pcMode == 2){
			spectatingText = "Spectating Blue's Bag";
		}
		else {
			spectatingText = "Spectating Blacks' Bag";
		}
	}
	else {
		spectatingText = "Spectating...";
	}
		
	drawImage(Img.spectatingOverlay, -5, -5, canvasWidth + 10, canvasHeight + 10); 
	
	if(!showStatOverlay){
		smallCenterShadow();
		ctx.fillStyle="#FFFFFF";
		ctx.font = 'bold 30px Electrolize';
		ctx.lineWidth = 4;
		strokeAndFillText(spectatingText,canvasWidth/2,775);
		strokeAndFillText("Waiting for current game to finish. You will join the next game.",canvasWidth/2,100);		
		ctx.font = 'bold 15px Electrolize';
		ctx.lineWidth = 3;
		strokeAndFillText("Use the arrow keys to switch targets",canvasWidth/2,800);		
	}
}

function updateSpectatingView(){ //updates spectating camera
	updateOrderedPlayerList();
	if (spectatingPlayerId == "bagBlue" && gametype == "ctf"){
		myPlayer.x = bagBlue.x;
		myPlayer.y = bagBlue.y;		
	}
	else if (spectatingPlayerId == "bagRed" && gametype == "ctf"){
		myPlayer.x = bagRed.x;
		myPlayer.y = bagRed.y;
	}
	else if (typeof Player.list[spectatingPlayerId] != 'undefined' && Player.list[spectatingPlayerId].team != "none"){
		myPlayer.x = Player.list[spectatingPlayerId].x;
		myPlayer.y = Player.list[spectatingPlayerId].y;		
	}
	else {
		myPlayer.x = mapWidth/2;
		myPlayer.y = mapHeight/2;			
	}
}

function drawInformation(){
	if (!gameOver && debugText == true){
		noShadow();
		ctx.fillStyle="#FFFFFF";
		ctx.font = 'bold 14px Electrolize';
		ctx.textAlign="left";

		//Version and debug text label1 //debug lable1

		if (showStatOverlay == true){
			fillText("Health:" + Player.list[myPlayer.id].health, 5, 35); //debug
			fillText(version + "  |  ping:" + ping, 5, 15);

		}
		//fillText("walkingDir:" + Player.list[myPlayer.id].walkingDir, 5, 35); //debug
		//fillText("legSwingForward:" + Player.list[myPlayer.id].legSwingForward, 5, 55); //debug
		//fillText("LegHeight:" + Player.list[myPlayer.id].legHeight, 5, 75); //debug
	}
}

//Bloody border
function drawBloodyBorder(){
	noShadow();
	if (Player.list[myPlayer.id].health < 100){
		var alph2 = 1 - (Player.list[myPlayer.id].health / 100);
		alph2 += .1; 
		if (alph2 < 0){
			alph2 = 0;
		}	
		if (Player.list[myPlayer.id].health < 0){
			Player.list[myPlayer.id].health = 0;
		}
		ctx.globalAlpha = Math.round(alph2 * 100) / 100;
		var bloodyBorderScale = 3; //increase to push blood more to edges upon low damage
		drawImage(Img.bloodyBorder, -(Player.list[myPlayer.id].health * bloodyBorderScale)/2, -(Player.list[myPlayer.id].health * bloodyBorderScale)/2, canvasWidth + Player.list[myPlayer.id].health*bloodyBorderScale, canvasHeight + Player.list[myPlayer.id].health*bloodyBorderScale);
		ctx.globalAlpha = 1;
	}
}

//Ammo HUD ammohud
function drawHUD(){
	if (!gameOver){
		var liftBottomHUD = 6;
		smallCenterShadow();
		
		//Weapon selection (1,2,3,4) HUD//////////////
		if (!gameOver){
		
			//Weapon selected highlight
			ctx.globalAlpha = 0.3;
			ctx.fillStyle="#FFFFFF";						
			if (Player.list[myPlayer.id].weapon == 1){ ctx.fillRect(canvasWidth - 195, canvasHeight - 130 - liftBottomHUD, Img.weapon1Key.width*0.75 - 10, Img.weapon1Key.height*0.75); }
			else if (Player.list[myPlayer.id].weapon == 2){ ctx.fillRect(canvasWidth - 150,canvasHeight - 130 - liftBottomHUD,Img.weapon2Key.width*0.75 - 10,Img.weapon2Key.height*0.75); }
			else if (Player.list[myPlayer.id].weapon == 3){ ctx.fillRect(canvasWidth - 108, canvasHeight - 130 - liftBottomHUD, Img.weapon3Key.width*0.75, Img.weapon3Key.height*0.75); }
			else if (Player.list[myPlayer.id].weapon == 4){ ctx.fillRect(canvasWidth - 55, canvasHeight - 130 - liftBottomHUD, Img.weapon4Key.width*0.75, Img.weapon4Key.height*0.75); }
			ctx.globalAlpha = 1.0;


			drawImage(Img.weapon1Key, canvasWidth - 200, canvasHeight - 130 - liftBottomHUD, Img.weapon1Key.width*0.75, Img.weapon1Key.height*0.75);			
			if (myPlayer.DPAmmo > 0 || myPlayer.DPClip > 0){

				drawImage(Img.weapon2Key, canvasWidth - 155, canvasHeight - 130 - liftBottomHUD, Img.weapon2Key.width*0.75, Img.weapon2Key.height*0.75);
			}
			if (myPlayer.MGAmmo > 0 || myPlayer.MGClip > 0){
				drawImage(Img.weapon3Key, canvasWidth - 108, canvasHeight - 130 - liftBottomHUD, Img.weapon3Key.width*0.75, Img.weapon3Key.height*0.75);
			}
			if (myPlayer.SGAmmo > 0 || myPlayer.SGClip > 0){
				drawImage(Img.weapon4Key, canvasWidth - 55, canvasHeight - 130 - liftBottomHUD, Img.weapon4Key.width*0.75, Img.weapon4Key.height*0.75);
			}
		}

		//Energy HUD
		if (myPlayer.drawnEnergy == undefined || myPlayer.energy <= 1 || myPlayer.drawnEnergy < myPlayer.energy || myPlayer.energy == 0){
			myPlayer.drawnEnergy = myPlayer.energy;
		}
		else if (myPlayer.drawnEnergy > myPlayer.energy){
			myPlayer.drawnEnergy -= 4;
			if (myPlayer.drawnEnergy <= myPlayer.energy + 4 && myPlayer.drawnEnergy >= myPlayer.energy - 4){
				myPlayer.drawnEnergy = myPlayer.energy;
			}
		}	
		if (myPlayer.drawnEnergy == 100 || myPlayer.drawnEnergy >= 200){
			drawImage(Img.white, canvasWidth - (canvasWidth * (myPlayer.drawnEnergy / 200)), canvasHeight - 4 - liftBottomHUD, canvasWidth * (myPlayer.drawnEnergy / 200), 6);
		}
		else if (myPlayer.drawnEnergy <= 25 && myPlayer.drawnEnergy > 0){
			drawImage(Img.red, canvasWidth - (canvasWidth * (myPlayer.drawnEnergy / 200)), canvasHeight - 4 - liftBottomHUD, canvasWidth * (myPlayer.drawnEnergy / 200), 6);
		}
		else if (myPlayer.drawnEnergy > 0){
			drawImage(Img.yellow, canvasWidth - (canvasWidth * (myPlayer.drawnEnergy / 200)), canvasHeight - 4 - liftBottomHUD, canvasWidth * (myPlayer.drawnEnergy / 200), 6);
		}
		if (myPlayer.energy <= 25) {
			if (energyRedAlpha <= 0)
				energyRedAlpha = 0.7;
			ctx.globalAlpha = energyRedAlpha;
			
			drawImage(Img.energyRed, canvasWidth - Img.energyRed.width * 2, canvasHeight - Img.energyRed.height * 2, Img.energyRed.width * 2, Img.energyRed.height * 2);
			energyRedAlpha -= .1;
		}
		ctx.globalAlpha = 1;

		var clipCount = "0";
		var ammoCount = "0";
		if (Player.list[myPlayer.id].weapon == 1){
			clipCount = Player.list[myPlayer.id].PClip;
			ammoWidth = 136 - ((15 - Player.list[myPlayer.id].PClip) * 9);
			ctx.drawImage(Img.ammo9mm, 600 - ammoWidth, 0, ammoWidth, 80, canvasWidth - ammoWidth - 205, canvasHeight - 86 - liftBottomHUD, ammoWidth, 80);
		}
		else if (Player.list[myPlayer.id].weapon == 2){
			clipCount = Player.list[myPlayer.id].DPClip;
			ammoCount = Player.list[myPlayer.id].DPAmmo;		
			ammoWidth = 180 - ((20 - Player.list[myPlayer.id].DPClip) * 9) + 1;
			ctx.drawImage(Img.ammoDP, 600 - ammoWidth, 0, ammoWidth, 80, canvasWidth - ammoWidth - 205, canvasHeight - 86 - liftBottomHUD, ammoWidth, 80);
		}
		else if (Player.list[myPlayer.id].weapon == 3){
			clipCount = Player.list[myPlayer.id].MGClip;
			ammoCount = Player.list[myPlayer.id].MGAmmo;		
			ammoWidth = 152 - ((30 - Player.list[myPlayer.id].MGClip) * 5);
			ctx.drawImage(Img.ammoMG, 600 - ammoWidth, 0, ammoWidth, 80, canvasWidth - ammoWidth - 205, canvasHeight - 86 - liftBottomHUD, ammoWidth, 80);
		}
		else if (Player.list[myPlayer.id].weapon == 4){
			clipCount = Player.list[myPlayer.id].SGClip;
			ammoCount = Player.list[myPlayer.id].SGAmmo;		
			ammoWidth = 135 - ((12 - Player.list[myPlayer.id].SGClip) * 11);
			ctx.drawImage(Img.ammoSG, 600 - ammoWidth, 0, ammoWidth, 80, canvasWidth - ammoWidth - 205, canvasHeight - 86 - liftBottomHUD, ammoWidth, 80);
		}
		
		//Draw separating line
		ctx.strokeStyle = "#FFF";
		ctx.lineWidth  = 1;
		ctx.beginPath();
		ctx.moveTo(canvasWidth - 202, canvasHeight - 54);
		ctx.lineTo(canvasWidth - 202, canvasHeight - 14);
		ctx.stroke();
				
		//Draw Ammmo Count
		ctx.font = '72px Electrolize';
		ctx.fillStyle="#FFFFFF";
		ctx.lineWidth=4;
		ctx.textAlign="right";
		fillText(clipCount, canvasWidth - 101, canvasHeight - 9 - liftBottomHUD);
		ctx.font = '63px Electrolize';
		fillText("/", canvasWidth - 65, canvasHeight - 15 - liftBottomHUD);
		if (Player.list[myPlayer.id].weapon == 1){
			drawImage(Img.infinity, canvasWidth - 77, canvasHeight - 44 - liftBottomHUD);		
		}
		else {
			ctx.font = '44px Electrolize';
			ctx.textAlign="left";
			fillText(ammoCount,canvasWidth - 70, canvasHeight - 9 - liftBottomHUD);
		}

		ctx.strokeStyle = "#000";
		ctx.lineWidth  = 3;
		
	}
}

function drawChat(){
	if (chatStale < hideChatTimer && !shop.active){chatText.style.display = "inline-block";}
	else {chatText.style.display = "none";}
	if (chatInput.style.display == "none"){chatStale++;}
	
	//black box behind chat
	if (chatInput.style.display == "inline"){
		ctx.globalAlpha = 0.3;
		ctx.fillStyle="#000"; //black
		ctx.fillRect(0, canvasHeight - 205, 310, 205);
		ctx.globalAlpha = 1;
	}
}

//Top Scoreboard top scoreboard topscoreboard	
function drawTopScoreboard(){
	noShadow();
	if (!gameOver){
		ctx.textAlign="center";
		ctx.globalAlpha = 0.50;
		if (pcMode == 2){
			ctx.fillStyle="#2e3192"; //blue
		}
		else {
			ctx.fillStyle="#000000";
		}
		ctx.fillStyle="#2e3192"; //blue
		ctx.fillRect((canvasWidth/2 - 25) + 70,0,50,50);
		if (pcMode == 2){
			ctx.fillStyle="#9e0b0f"; //red
		}
		else {
			ctx.fillStyle="#FFFFFF";
		}
		ctx.fillStyle="#9e0b0f"; //red
		ctx.fillRect((canvasWidth/2 - 25) - 70,0,50,50);
		ctx.globalAlpha = 1.0;
			
		ctx.fillStyle="#FFFFFF";
		ctx.font = '28px Electrolize';
		ctx.lineWidth=4;
		
		if (clockHeight >= 30){clockHeight -= 5;}
		if (clockHeight < 30){clockHeight = 30;}
		
		if (timeLimit == false && scoreToWin > 0){
			ctx.font = 16 + 'px Electrolize';	
			strokeAndFillText("First to " + scoreToWin, canvasWidth/2, 23);
		}
		else if (timeLimit == true){
			ctx.font = 16 + 'px Electrolize';
			if (gameOver == false && secondsLeft == 0 && minutesLeft == 0){
				ctx.fillStyle="red";
				strokeAndFillText("SD", canvasWidth/2, 53);
			}
			else if (scoreToWin > 0){
				strokeAndFillText("First to " + scoreToWin, canvasWidth/2, 53);
			}
			if (parseInt(minutesLeft)*60 + parseInt(secondsLeft) <= 60 && timeLimit){
				ctx.fillStyle="red";
			}
			ctx.lineWidth=5;
			ctx.font = clockHeight + 'px Electrolize';	
			strokeAndFillText(minutesLeft + ":" + secondsLeft, canvasWidth/2, (clockHeight + (clockHeight/2 + 16))/2);
		}
	}
	
	//Top scoreboard Score Numbers
	ctx.fillStyle="#FFFFFF";
	ctx.lineWidth=6;
	ctx.font = '36px Electrolize';
	if (whiteScoreHeight >= 36){whiteScoreHeight -= 7;}
	if (whiteScoreHeight < 36){whiteScoreHeight = 36;}
	ctx.font = whiteScoreHeight + 'px Electrolize';

	var whiteScoreX = canvasWidth/2 - 70;
	var whiteScoreY = (whiteScoreHeight + (whiteScoreHeight/2 + 16))/2;	
	if (gameOver){
		whiteScoreX = 375;
		whiteScoreY = 200;
	}
	strokeAndFillText(whiteScore,whiteScoreX,whiteScoreY);
	
	if (blackScoreHeight >= 36){blackScoreHeight -= 7;}
	if (blackScoreHeight < 36){blackScoreHeight = 36;}
	ctx.font = blackScoreHeight + 'px Electrolize';		

	var blackScoreX = canvasWidth/2 + 70;
	var blackScoreY = (blackScoreHeight + (blackScoreHeight/2 + 16))/2;	
	if (gameOver){
		blackScoreX = 375;
		blackScoreY = 445;
	}
	strokeAndFillText(blackScore,blackScoreX,blackScoreY);
}

var postGameReady = false;
var postGameProgressCounter = 0;
var postGameProgressBlackBoxY = 0;
var postGameProgressPlayerNameY = 0;
var postGameProgressPlayerRankY = 0;
var postGameProgressRankIconY = 0;
var postGameProgressRatingBarY = 0;
var postGameProgressExpBarY = 0;
var postGameProgressRatingTicks = 0;
var postGameProgressExpTicks = 0;
var postGameProgressRatingGainedSize = 0;
var postGameProgressExpGainedSize = 0;
var postGameRankingsDone = false;
var postGameProgressStopRatingTicks = false;
var postGameProgressStopExpTicks = false;
var postGameProgressRankUpDown = false;
var postGameProgressY = 0;
var rankUpRectHeight = 0;
var postGameProgressRankUpXOffset = 0;
var postGameProgressRankDownSize = 0;
var postGameProgressLevelUpSize = 0;
var postGameProgressLevelUp = false;
var postGameProgressInfo = {};

var postGameProgressDelay = 100;
var postGameProgressSpeed = 5;
var postGameProgressBlackBoxTargetY = 7;
var postGameProgressPlayerNameTargetY = 30;
var postGameProgressPlayerRankTargetY = 45;
var postGameProgressRankIconTargetY = -15;
var rankIconWidth = 90;
var postGameProgressRatingBarTargetY = 65;
var nextRankIconWidth = 25;
var postGameProgressExpBarTargetY = 105;
var postGameBarWidth = 860;
var postGameBarHeight = 2;

/*
	postGameProgressInfo.originalRating 
	postGameProgressInfo.ratingDif 
	postGameProgressInfo.originalExp 
	postGameProgressInfo.expDif 
	postGameProgressInfo.rank 
	postGameProgressInfo.nextRank
	postGameProgressInfo.rankFloor 
	postGameProgressInfo.rankCeiling 
	postGameProgressInfo.level 
	postGameProgressInfo.expFloor
	postGameProgressInfo.expCeiling
	ratingPercentageToNext
	expPercentageToNext
*/
function resetPostGameProgressVars(){
	postGameReady = false;
	postGameProgressRankUpDown = false;
	postGameRankingsDone = false;
	postGameProgressInfo = {};
	postGameProgressCounter = 0;
	postGameProgressY = 0;
	postGameProgressRankUpXOffset = -300;
	rankUpRectHeight = 0;
	postGameProgressBlackBoxY = -130;
	postGameProgressPlayerNameY = -45;
    postGameProgressPlayerRankY = -30;
    postGameProgressRankIconY = -90;
    postGameProgressRatingBarY = -85;
    postGameProgressExpBarY = -45;
    postGameProgressRatingGainedSize = 100;
    postGameProgressExpGainedSize = 100;
	postGameProgressRankDownSize = 100;
	postGameProgressLevelUpSize = 180;
	postGameProgressRatingTicks = 0;
	postGameProgressExpTicks = 0;
	postGameProgressStopRatingTicks = false;
	postGameProgressStopExpTicks = false;
	postGameProgressLevelUp = false;
}

function drawPostGameProgress(){
	if (gameOver == true && postGameReady == true && myPlayer.team != "none"){
		if (postGameProgressCounter != postGameProgressDelay){
			postGameProgressCounter++;
		}

		//1 black background bar
		if (postGameProgressCounter == postGameProgressDelay){
			ctx.globalAlpha = 0.6;			
			ctx.fillStyle="#000";
			if (postGameProgressBlackBoxY < postGameProgressBlackBoxTargetY){
				postGameProgressBlackBoxY += postGameProgressSpeed + 5;
			}
			else if (postGameProgressBlackBoxY > postGameProgressBlackBoxTargetY){
				postGameProgressBlackBoxY = postGameProgressBlackBoxTargetY;
			}
			ctx.fillRect(0, postGameProgressBlackBoxY + postGameProgressY, canvasWidth, 130); //drawrect draw rectangle
		}
		//4 Large rank icon behind name
		if (postGameProgressPlayerNameY == postGameProgressPlayerNameTargetY) {
			ctx.globalAlpha = 1;
			if (postGameProgressRankIconY < postGameProgressRankIconTargetY){
				postGameProgressRankIconY += postGameProgressSpeed;
			}
			else if (postGameProgressRankIconY > postGameProgressRankIconTargetY){
				postGameProgressRankIconY = postGameProgressRankIconTargetY;
			}
			var currentRankIcon = postGameProgressInfo.rankIcon;
			if (postGameProgressRankUpXOffset > -300){
				currentRankIcon = postGameProgressInfo.nextRankIcon;
			}
			else if (postGameProgressRankDownSize <= 14){
				currentRankIcon = postGameProgressInfo.previousRankIcon;
			}
			drawImage(currentRankIcon, canvasWidth/2 - rankIconWidth/2, postGameProgressRankIconY + postGameProgressY, rankIconWidth, rankIconWidth);			
		}
		//5 Rating bar
		if (postGameProgressRankIconY == postGameProgressRankIconTargetY) {
			if (postGameProgressRatingBarY < postGameProgressRatingBarTargetY){
				postGameProgressRatingBarY += postGameProgressSpeed;
			}
			else if (postGameProgressRatingBarY > postGameProgressRatingBarTargetY){
				postGameProgressRatingBarY = postGameProgressRatingBarTargetY;
			}
			ctx.fillStyle="#000"; //Border rect
			ctx.fillRect(canvasWidth/2 - postGameBarWidth/2 - 1, postGameProgressRatingBarY - 1 + postGameProgressY, postGameBarWidth + 2, postGameBarHeight + 2); //drawrect draw rectangle
			ctx.fillStyle="#7d7d7d"; //Unfilled grey
			ctx.fillRect(canvasWidth/2 - postGameBarWidth/2, postGameProgressRatingBarY + postGameProgressY, postGameBarWidth, postGameBarHeight); //drawrect draw rectangle
			ctx.fillStyle="#ffde00"; //Experience Yellow
			ctx.fillRect(canvasWidth/2 - postGameBarWidth/2, postGameProgressRatingBarY + postGameProgressY, (postGameBarWidth * postGameProgressInfo.ratingPercentageToNext), postGameBarHeight); //drawrect draw rectangle
			
			ctx.textAlign="left";
			ctx.font = 'bold 11px Electrolize';
			ctx.lineWidth=4;
			ctx.fillStyle="#FFFFFF";
			var ratingText = postGameProgressStopRatingTicks ? (parseInt(postGameProgressInfo.originalRating) + parseInt(Math.round(postGameProgressInfo.ratingDif))) : (parseInt(postGameProgressInfo.originalRating) + parseInt(Math.round(postGameProgressRatingTicks)));

			strokeAndFillText("Rating: " + ratingText, canvasWidth/2 - postGameBarWidth/2, postGameProgressRatingBarY - 7 + postGameProgressY);
			ctx.textAlign="right";
			var nextNext = "Next ";
			if (postGameProgressRankUpXOffset > -300){
				nextNext = "";
			}
			else if (postGameProgressRankDownSize <= 14){
				nextNext = "Next Next ";
			}
			strokeAndFillText(nextNext + "Rank: " + postGameProgressInfo.nextRank, canvasWidth/2 + postGameBarWidth/2, postGameProgressRatingBarY - 7 + postGameProgressY);

			drawImage(postGameProgressInfo.nextRankIcon, canvasWidth/2 + postGameBarWidth/2 + 7, postGameProgressRatingBarY - nextRankIconWidth + 5 + postGameProgressY, nextRankIconWidth, nextRankIconWidth);			
		}
		//6 plus/minus rating number below bar
		if (postGameProgressRatingBarY == postGameProgressRatingBarTargetY) {
			if (postGameProgressRatingGainedSize > 11){
				postGameProgressRatingGainedSize -= 3;
			}
			else if (postGameProgressRatingGainedSize < 11){
				postGameProgressRatingGainedSize = 11;
				if (!mute){
					if (postGameProgressInfo.ratingDif >= 0){
						sfxProgressBar.play();
					}
					else {
						sfxProgressBarReverse.play();
					}
				}
			}
			var symbol = postGameProgressInfo.ratingDif >= 0 ? "+" : "";
			ctx.textAlign="center";
			ctx.font = 'bold '+postGameProgressRatingGainedSize+'px Electrolize';
			ctx.lineWidth=2;
			ctx.fillStyle="#FFFFFF";
			strokeAndFillText(symbol + postGameProgressInfo.ratingDif,
			(canvasWidth/2 - postGameBarWidth/2) + (postGameBarWidth * postGameProgressInfo.ratingPercentageToNext) + (postGameBarWidth * getProgressBarPercentage(postGameProgressInfo.rankFloor + postGameProgressRatingTicks, postGameProgressInfo.rankFloor, postGameProgressInfo.rankCeiling)),
			postGameProgressRatingBarY + postGameProgressRatingGainedSize/2 + 9.5 + postGameProgressY); 
		}
		//7 white difference bar on rating
		if (postGameProgressRatingGainedSize == 11) {
			if (!postGameProgressStopRatingTicks){
				if (postGameProgressRatingTicks != postGameProgressInfo.ratingDif){
					if (postGameProgressRatingTicks > postGameProgressInfo.ratingDif){
						postGameProgressRatingTicks -= 0.1;
						if (postGameProgressInfo.originalRating + postGameProgressRatingTicks < postGameProgressInfo.rankFloor && postGameProgressInfo.rankFloor > 0){
							//rank down
							postGameProgressRankUpDown = true;
							postGameProgressStopRatingTicks = true;
							if (!mute){sfxDecharge.play();}
							sfxProgressBar.stop();
							sfxProgressBarReverse.stop();
						}
					}
					else if (postGameProgressRatingTicks < postGameProgressInfo.ratingDif){
						postGameProgressRatingTicks += 0.1;
						if (postGameProgressInfo.originalRating + postGameProgressRatingTicks == postGameProgressInfo.rankCeiling){
							//rank up
							postGameProgressRankUpDown = true;
							postGameProgressStopRatingTicks = true;
							sfxProgressBar.stop();
							sfxProgressBarReverse.stop();
							if (!mute){
								sfxDefeatMusic.volume(.2);
								sfxVictoryMusic.volume(.2);
								sfxLevelUp.play();
							}
						}
					}
					postGameProgressRatingTicks = Math.round(postGameProgressRatingTicks * 10) / 10;
				}
				else if (postGameProgressRatingTicks == postGameProgressInfo.ratingDif){
					postGameProgressStopRatingTicks = true;
					sfxProgressBar.stop();
					sfxProgressBarReverse.stop();
				}
			}
		
			ctx.fillStyle = postGameProgressInfo.ratingDif >= 0 ? "#FFF" : "#cc0000";
			ctx.fillRect((canvasWidth/2 - postGameBarWidth/2) + (postGameBarWidth * postGameProgressInfo.ratingPercentageToNext),
			postGameProgressRatingBarY + postGameProgressY,
			(postGameBarWidth * getProgressBarPercentage(postGameProgressInfo.rankFloor + postGameProgressRatingTicks, postGameProgressInfo.rankFloor, postGameProgressInfo.rankCeiling)),
			postGameBarHeight);
		}
		//8 Rank up/down
		if (postGameProgressRankUpDown == true) {
			if (postGameProgressInfo.ratingDif > 0){ //rank up
				if (postGameProgressY > -130 && postGameProgressRankUpXOffset < canvasWidth + 300){
					postGameProgressY -= 10;
				}
				if (postGameProgressY <= -130 && rankUpRectHeight < 400 && postGameProgressRankUpXOffset < canvasWidth + 300){
					rankUpRectHeight += 15;
				}
				if (rankUpRectHeight >= 400 && postGameProgressRankUpXOffset < canvasWidth + 300){
					ctx.textAlign="center";
					if (postGameProgressRankUpXOffset < canvasWidth/2 - 20){
						postGameProgressRankUpXOffset += 35;
					}
					else if (postGameProgressRankUpXOffset < canvasWidth/2 + 20){
						postGameProgressRankUpXOffset += 0.2;
					}
					else if (postGameProgressRankUpXOffset > canvasWidth/2 + 20 && postGameProgressRankUpXOffset < canvasWidth + 300){
						postGameProgressRankUpXOffset += 35;
					}
					
				}
				if (postGameProgressRankUpXOffset >= canvasWidth + 300 && rankUpRectHeight > 0){
					rankUpRectHeight -=15;
					if (rankUpRectHeight < 0){rankUpRectHeight = 0;}
				}
				if (postGameProgressRankUpXOffset >= canvasWidth + 300 && rankUpRectHeight <= 0 && postGameProgressY < 0){
					postGameProgressY += 10;
					if (postGameProgressY > 0){postGameProgressY = 0;}
				}
				if (postGameProgressRankUpXOffset >= canvasWidth + 300 && rankUpRectHeight <= 0 && postGameProgressY >= 0){
					postGameProgressRankUpDown = false;
				}
				ctx.fillStyle = "#000";
				ctx.fillRect(0, 230 - rankUpRectHeight/2, canvasWidth, rankUpRectHeight); //drawrect draw rectangle
				drawImage(postGameProgressInfo.nextRankIcon, canvasWidth - postGameProgressRankUpXOffset - postGameProgressInfo.nextRankIcon.width/2, 85);								
				ctx.textAlign="center";
				ctx.fillStyle="#FFFFFF";
				ctx.lineWidth=6;
				ctx.font = 'bold 32px Electrolize';
				strokeAndFillText(postGameProgressInfo.nextRank, canvasWidth - postGameProgressRankUpXOffset, 95);
				ctx.font = 'bold 100px Electrolize';
				strokeAndFillText("RANK UP!!!",postGameProgressRankUpXOffset,365);
			}
			else if (postGameProgressInfo.ratingDif < 0){ //rank down
				if (postGameProgressRankDownSize > 14){
					postGameProgressRankDownSize -= 3;
				}
				else if (postGameProgressRankDownSize < 14){
					postGameProgressRankDownSize = 14;
				}
				if (postGameProgressRankDownSize <= 14){
					postGameProgressRankUpDown = false;
				}				
				ctx.textAlign="left";
				ctx.font = 'bold '+postGameProgressRankDownSize+'px Electrolize';
				ctx.lineWidth=2;
				ctx.fillStyle="#cc0000";
				strokeAndFillText("Rank Down", canvasWidth/2 - postGameBarWidth/2, postGameProgressRatingBarY - 15 - postGameProgressRankDownSize/2 + postGameProgressY);
			}
		}
		//9 experience bar
		if (postGameProgressRankUpDown == false && postGameProgressStopRatingTicks == true) {
			//Propigating rank down beyond the bounds of the rankup/down section
			if (postGameProgressInfo.originalRating + postGameProgressInfo.ratingDif < postGameProgressInfo.rankFloor){
				ctx.textAlign="left";
				ctx.font = 'bold 14px Electrolize';
				ctx.lineWidth=2;
				ctx.fillStyle="#cc0000";
				strokeAndFillText("Rank Down", canvasWidth/2 - postGameBarWidth/2, postGameProgressRatingBarY - 15 - 14/2 + postGameProgressY);
			}

			if (postGameProgressExpBarY < postGameProgressExpBarTargetY){
				postGameProgressExpBarY += postGameProgressSpeed + 1;
			}
			else if (postGameProgressExpBarY > postGameProgressExpBarTargetY){
				postGameProgressExpBarY = postGameProgressExpBarTargetY;
			}
			ctx.fillStyle="#000"; //Border rect
			ctx.fillRect(canvasWidth/2 - postGameBarWidth/2 - 1, postGameProgressExpBarY - 1 + postGameProgressY, postGameBarWidth + 2, postGameBarHeight + 2); //drawrect draw rectangle
			ctx.fillStyle="#7d7d7d"; //Unfilled grey
			ctx.fillRect(canvasWidth/2 - postGameBarWidth/2, postGameProgressExpBarY + postGameProgressY, postGameBarWidth, postGameBarHeight); //drawrect draw rectangle
			ctx.fillStyle="#0eb80e"; //Experience green
			ctx.fillRect(canvasWidth/2 - postGameBarWidth/2, postGameProgressExpBarY + postGameProgressY, (postGameBarWidth * postGameProgressInfo.expPercentageToNext), postGameBarHeight); //drawrect draw rectangle
			
			ctx.textAlign="left";
			ctx.font = 'bold 11px Electrolize';
			ctx.lineWidth=4;
			ctx.fillStyle="#FFFFFF";
			var expText = postGameProgressStopExpTicks ? (parseInt(postGameProgressInfo.originalExp) + parseInt(Math.round(postGameProgressInfo.expDif))) : (parseInt(postGameProgressInfo.originalExp) + parseInt(Math.round(postGameProgressExpTicks)));
			expText = numberWithCommas(expText);
			strokeAndFillText("Experience: " + expText, canvasWidth/2 - postGameBarWidth/2, postGameProgressExpBarY - 7 + postGameProgressY);
			ctx.textAlign="right";
			var nextLevelNext = postGameProgressLevelUp ? "" : "Next "
			strokeAndFillText(nextLevelNext + "Level: " + (parseInt(postGameProgressInfo.level) + 1), canvasWidth/2 + postGameBarWidth/2, postGameProgressExpBarY - 7 + postGameProgressY);
		}
		//10 plus/minus exp number below bar
		if (postGameProgressExpBarY == postGameProgressExpBarTargetY) {
			if (postGameProgressExpGainedSize > 11){
				postGameProgressExpGainedSize -= 3;
			}
			else if (postGameProgressExpGainedSize < 11){
				postGameProgressExpGainedSize = 11;
				if (!mute){sfxProgressBar.play();}
			}
			ctx.textAlign="center";
			ctx.font = 'bold '+postGameProgressExpGainedSize+'px Electrolize';
			ctx.lineWidth=2;
			ctx.fillStyle="#FFFFFF";
			strokeAndFillText("+" + postGameProgressInfo.expDif,
			Math.round((canvasWidth/2 - postGameBarWidth/2) + (postGameBarWidth * postGameProgressInfo.expPercentageToNext) + (postGameBarWidth * getProgressBarPercentage(postGameProgressInfo.expFloor + postGameProgressExpTicks, postGameProgressInfo.expFloor, postGameProgressInfo.expCeiling))),
			postGameProgressExpBarY + postGameProgressExpGainedSize/2 + 9.5 + postGameProgressY); 
		}
		//11 white difference bar on exp
		if (postGameProgressExpGainedSize == 11) {
			if (postGameProgressExpTicks != postGameProgressInfo.expDif && !postGameProgressStopExpTicks){
				if (postGameProgressExpTicks < postGameProgressInfo.expDif){
					postGameProgressExpTicks += 10;
					if (postGameProgressInfo.originalExp + postGameProgressExpTicks >= postGameProgressInfo.expCeiling){
						postGameProgressLevelUp = true;
						postGameProgressStopExpTicks = true;
						sfxProgressBar.stop();
						if (!mute){
							sfxDefeatMusic.volume(.2);
							sfxVictoryMusic.volume(.2);
							sfxLevelUp.play();
						}
					}
				}
				postGameProgressExpTicks = Math.round(postGameProgressExpTicks);
			}
			else if (postGameProgressExpTicks >= postGameProgressInfo.expDif){
				sfxProgressBar.stop();
				postGameProgressStopExpTicks = true;
			}
		
			ctx.fillStyle = "#FFF";
			ctx.fillRect((canvasWidth/2 - postGameBarWidth/2) + (postGameBarWidth * postGameProgressInfo.expPercentageToNext),
			postGameProgressExpBarY + postGameProgressY,
			(postGameBarWidth * getProgressBarPercentage(postGameProgressInfo.expFloor + postGameProgressExpTicks, postGameProgressInfo.expFloor, postGameProgressInfo.expCeiling)),
			postGameBarHeight);
		}
		//12 level up
		if (postGameProgressLevelUp) {
			if (postGameProgressLevelUpSize > 30){
				postGameProgressLevelUpSize -= 8;
			}
			else if (postGameProgressLevelUpSize < 30){
				postGameProgressLevelUpSize = 30;
			}
			ctx.textAlign="center";
			ctx.font = 'bold '+postGameProgressLevelUpSize+'px Electrolize';
			ctx.lineWidth=4;
			ctx.fillStyle="#FFF";
			ctx.globalAlpha = 1;

			strokeAndFillText("Level Up!",
			Math.round(canvasWidth/2),
			postGameProgressLevelUpSize/2 + postGameProgressExpBarY + postGameProgressY - 6); 
		}
		//3 current rank under name
		if (postGameProgressPlayerNameY == postGameProgressPlayerNameTargetY) {
			ctx.textAlign="center";
			ctx.font = 'bold 11px Electrolize';
			ctx.lineWidth=4;
			ctx.fillStyle="#FFFFFF";
			ctx.globalAlpha = 1;
			if (postGameProgressPlayerRankY < postGameProgressPlayerRankTargetY){
				postGameProgressPlayerRankY += postGameProgressSpeed;
			}
			else if (postGameProgressPlayerRankY > postGameProgressPlayerRankTargetY){
				postGameProgressPlayerRankY = postGameProgressPlayerRankTargetY;
			}
			var currentRank = postGameProgressInfo.rank;
			if (postGameProgressRankUpXOffset > -300){
				currentRank = postGameProgressInfo.nextRank;
			}
			else if (postGameProgressRankDownSize <= 14){
				currentRank = postGameProgressInfo.previousRank;
			}
			strokeAndFillText(currentRank,canvasWidth/2,postGameProgressPlayerRankY + postGameProgressY);
		}
		//2 player name
		if (postGameProgressBlackBoxY == postGameProgressBlackBoxTargetY) {
			ctx.textAlign="center";
			ctx.font = 'bold 22px Electrolize';
			ctx.lineWidth=4;
			ctx.fillStyle="#FFFFFF";
			ctx.globalAlpha = 1;
			if (postGameProgressPlayerNameY < postGameProgressPlayerNameTargetY){
				postGameProgressPlayerNameY += postGameProgressSpeed;
			}
			else if (postGameProgressPlayerNameY > postGameProgressPlayerNameTargetY){
				postGameProgressPlayerNameY = postGameProgressPlayerNameTargetY;
			}
			strokeAndFillText(myPlayer.name,canvasWidth/2,postGameProgressPlayerNameY + postGameProgressY);
		}


		ctx.globalAlpha = 1;			
	}
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

//GAME STATUS UPDATES: END GAME/PREGAME/SUDDEN DEATH/TEAM WINS
function drawGameEventText(){
	if (pregame == true && showStatOverlay == false){
		heavyCenterShadow();
		ctx.textAlign="right";
		ctx.font = '118px Electrolize';
		ctx.lineWidth=16;
		ctx.fillStyle="#FFFFFF";
		strokeAndFillText("PREGAME",canvasWidth - 10,750);	
		noShadow();
	}
	else {
		if (gameStartAlpha > 0){
			if (gameStartAlpha > 0.95){
				showStatOverlay = false;
			}
			ctx.textAlign="center";
			ctx.font = '118px Electrolize';
			ctx.lineWidth=16;
			ctx.fillStyle="#FFFFFF";
			ctx.globalAlpha = gameStartAlpha;
			strokeAndFillText("MATCH START!",canvasWidth/2,canvasHeight/2);
			if (gameStartAlpha > 0){gameStartAlpha-=.01;}
			ctx.globalAlpha = 1;	
		} else {gameStartAlpha = 0;}
		
		if (minutesLeft == 0 && secondsLeft == 0 || gameOver == true){
			heavyCenterShadow();
			ctx.textAlign="right";
			ctx.font = '40px Electrolize';
			ctx.lineWidth=6;
			ctx.fillStyle="#FFFFFF";
			if (gameOver == true){
				strokeAndFillText("Next game in: " + nextGameTimer, canvasWidth - 10,828);
			}

			ctx.lineWidth=12;
			if ((whiteScore > blackScore || whiteScore < blackScore) && gameOver == true && myPlayer.team != "none"){
				var actualVictoryPumpSize = victoryPumpSize;

				victoryPumpSize -= 1;
				if (victoryPumpSize <= 70){
					victoryPumpSize = 150;
				}

				if (actualVictoryPumpSize < 118){
					actualVictoryPumpSize = 118;
				}
				var endGameText = "DEFEAT...";
				if ((myPlayer.team == "white" && whiteScore > blackScore) || (myPlayer.team == "black" && whiteScore < blackScore)){
					endGameText = "VICTORY!!!";
				}
				else {
					actualVictoryPumpSize = 118;
				}
				ctx.font = actualVictoryPumpSize + 'px Electrolize';
				ctx.fillStyle="#FFFFFF";				
				strokeAndFillText(endGameText,canvasWidth - 10,743 + (actualVictoryPumpSize/3), 575);
			}
			/*
			else if (whiteScore < blackScore && gameOver == true){
				var blackWinsText = "BLACKS WIN";
				if (pcMode == 2){
					blackWinsText = "BLUE WINS";
				}
				ctx.fillStyle="#000000";
				ctx.strokeStyle="#FFFFFF";
				ctx.strokeText(blackWinsText,canvasWidth - 10,778);
				noShadow();
				ctx.fillText(blackWinsText,canvasWidth - 10,778);	
				ctx.strokeStyle="#000000";
			}
			*/
			else if (timeLimit && whiteScore == blackScore){
				ctx.font = '118px Electrolize';
				ctx.fillStyle="#FFFFFF";
				if (suddenDeathAlpha > 0){
					ctx.globalAlpha = suddenDeathAlpha;
				strokeAndFillText("SUDDEN DEATH",canvasWidth - 10,778);
				}
				if (suddenDeathAlpha > 0){suddenDeathAlpha-=.01;} else {suddenDeathAlpha = 0;}
				ctx.globalAlpha = 1;	
			}			
		}
	}
}

// STAT OVERLAY scoreboard
function drawStatOverlay(){	
	noShadow();
		
	if (gameOver){
		showStatOverlay = true;		
	}
	if (showStatOverlay == true){
		chatStale = 0;		
		drawImage(Img.statOverlay, Math.round(canvasWidth/2 - Img.statOverlay.width/2), Math.round(canvasHeight/2 - Img.statOverlay.height/2 + -50));	

		if (pcMode == 2){
			ctx.fillStyle="#9e0b0f"; //red/white
			ctx.fillRect(120, 160, 283, 56); //drawrect draw rectangle
			ctx.fillStyle="#2e3192"; //blue/black
			ctx.fillRect(120, 405, 283, 56);
			ctx.fillStyle="#FFFFFF";
			ctx.font = 'bold 45px Electrolize';
			ctx.textAlign="left";
			fillText("RED",125,200);
			fillText("BLUE",125,445);			
		}
		else {
			ctx.fillStyle="#9e0b0f"; //red/white
			ctx.fillRect(120, 160, 283, 56); //drawrect draw rectangle
			ctx.fillStyle="#2e3192"; //blue/black
			ctx.fillRect(120, 405, 283, 56);
			ctx.fillStyle="#FFFFFF";		
			ctx.font = 'bold 45px Electrolize';
			ctx.textAlign="left";
			fillText("WHITES",125,200);
			fillText("BLACKS",125,445);			
		}

		ctx.lineWidth=4;
		if (gameOver){
			ctx.font = 'bold 17px Electrolize';
			ctx.textAlign="center";
			ctx.fillStyle="#19BE44";
			fillText("Total",439,170);
			fillText("Earned",439,190);
			fillText("Total",439,170 + 245);
			fillText("Earned",439,190 + 245);
		}
		ctx.font = '20px Electrolize';
		
		var blackPlayers = [];
		var whitePlayers = [];		
		for (var a in Player.list){
			if (Player.list[a].team == "white"){
				whitePlayers.push(Player.list[a]);
			}
			else if (Player.list[a].team == "black"){
				blackPlayers.push(Player.list[a]);
			}
		}
		whitePlayers.sort(compare);
		blackPlayers.sort(compare);
		
		var whiteScoreY = 237;
		var blackScoreY = 482; //245 difference in these 2
		var scoreboardPlayerNameGap = 29;
		for (var a in blackPlayers){
			ctx.textAlign="left";			
			if (blackPlayers[a].id == myPlayer.id || (myPlayer.team == "none" && spectatingPlayerId == blackPlayers[a].id)){
				var arrowIcon = Img.statArrow;
				if (myPlayer.team == "none"){arrowIcon = Img.statCamera;}
				drawImage(arrowIcon, 123, blackScoreY - 13); //scoreboard arrow
				ctx.fillStyle="#FFFFFF";
			}
			else {
				ctx.fillStyle="#AAAAAA";
			}
			strokeAndFillText(blackPlayers[a].name,143,blackScoreY);
			ctx.textAlign="center";
			ctx.fillStyle="#19BE44";
			if (gameOver == false){
				strokeAndFillText("$"+blackPlayers[a].cash,439,blackScoreY);
			}
			else {
				strokeAndFillText("$"+blackPlayers[a].cashEarnedThisGame,439,blackScoreY);
			}
			if (blackPlayers[a].id == myPlayer.id || (myPlayer.team == "none" && spectatingPlayerId == blackPlayers[a].id)){ctx.fillStyle="#FFFFFF";}
			else {ctx.fillStyle="#AAAAAA";}
			
			var kdSpread = blackPlayers[a].kills - blackPlayers[a].deaths;
			if (kdSpread > -1){
				kdSpread = "[+" + kdSpread +  "]";
			}
			else {
				kdSpread = "[" + kdSpread +  "]";
			}
			strokeAndFillText(blackPlayers[a].kills+" "+kdSpread,536,blackScoreY);
			strokeAndFillText(blackPlayers[a].deaths,628,blackScoreY);
			strokeAndFillText(blackPlayers[a].steals,723,blackScoreY);
			strokeAndFillText(blackPlayers[a].returns,821,blackScoreY);
			strokeAndFillText(blackPlayers[a].captures,913,blackScoreY);		
			blackScoreY += scoreboardPlayerNameGap;
		}
		
		for (var a in whitePlayers){
			ctx.textAlign="left";
			if (whitePlayers[a].id == myPlayer.id || (myPlayer.team == "none" && spectatingPlayerId == whitePlayers[a].id)){
				var arrowIcon = Img.statArrow;
				if (myPlayer.team == "none"){arrowIcon = Img.statCamera;}
				drawImage(arrowIcon, 123, whiteScoreY - 13);	
				ctx.fillStyle="#FFFFFF";
			}
			else {
				ctx.fillStyle="#AAAAAA";
			}
			strokeAndFillText(whitePlayers[a].name.substring(0, 15),143,whiteScoreY);
			ctx.textAlign="center";
			ctx.fillStyle="#19BE44";
			if (gameOver == false){
				strokeAndFillText("$"+whitePlayers[a].cash,439,whiteScoreY);
			}
			else {
				strokeAndFillText("$"+whitePlayers[a].cashEarnedThisGame,439,whiteScoreY);
			}
			if (whitePlayers[a].id == myPlayer.id || (myPlayer.team == "none" && spectatingPlayerId == whitePlayers[a].id)){ctx.fillStyle="#FFFFFF";}
			else {ctx.fillStyle="#AAAAAA";}
			
			var kdSpread = whitePlayers[a].kills - whitePlayers[a].deaths;
			if (kdSpread > -1){
				kdSpread = "[+" + kdSpread +  "]";
			}
			else {
				kdSpread = "[" + kdSpread +  "]";
			}
			strokeAndFillText(whitePlayers[a].kills+" "+kdSpread,536,whiteScoreY);
			strokeAndFillText(whitePlayers[a].deaths,628,whiteScoreY);
			strokeAndFillText(whitePlayers[a].steals,723,whiteScoreY);
			strokeAndFillText(whitePlayers[a].returns,821,whiteScoreY);
			strokeAndFillText(whitePlayers[a].captures,913,whiteScoreY);
			whiteScoreY += scoreboardPlayerNameGap;
		}	
		//controls
	}
}

function drawMute(){
	if (mute){
		noShadow();
		drawImage(Img.mute, canvasWidth - 30, 0);			
	}
	if (lowGraphicsMode == false){
		normalShadow();
	}
	else {
		noShadow();
	}
}

//Client timer1 teimer1



//Option1
/*
setInterval(function(){	
	drawEverything();	
},1000/60);// End timer1()

*/

/*
//Option2
let request;
const animate = () => {
    request = requestAnimationFrame(animate);
    drawEverything();
}
animate();
*/

/*
*/
//Option3
var fps, fpsInterval, startTime, now, then, elapsed;
startAnimating(60);
function startAnimating(fps) {
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;
    animate();
}
function animate() {
    // request another frame
    requestAnimationFrame(animate);
    // calc elapsed time since last loop
    now = Date.now();
    elapsed = now - then;

    // if enough time has elapsed, draw the next frame
    if (elapsed > fpsInterval) {
        // Get ready for next frame by setting then=now, but...
        // Also, adjust for fpsInterval not being multiple of 16.67
        then = now - (elapsed % fpsInterval);
        drawEverything();
    }
}

var m_canvas = document.createElement('canvas');
var mCtx = m_canvas.getContext("2d", { alpha: false });

var UI_canvas = document.createElement('canvas');
var uiCtx = UI_canvas.getContext("2d", { alpha: false });

var block_canvas = document.createElement('canvas');
var blockCtx = block_canvas.getContext("2d", { alpha: true });

function drawEverything(){
	//Don't draw anything if the user hasn't entered the game with a player id and name
	if (myPlayer.name == "" || !Player.list[myPlayer.id])
		return;

	if (myPlayer.team == "none")
		updateSpectatingView();

	updateCamera();	
	noShadow();
	ctx.clearRect(0,0,canvasWidth,canvasHeight); //Clears previous frame
	
	//drawMap();
	drawMapCanvas();
	//drawBlackMarkets();
	drawMissingBags();
	drawBodies();	
	drawLegs();
	drawLaser();
	//drawBlocks();
	drawBlockCanvas();	
	drawWallBodies();
	drawPickups();
	drawBags();
	drawThugs();
	drawTorsos();
	drawBoosts();
	drawShots();
	drawBlood();
	drawSmashes();
	drawPlayerTags();
	drawNotifications();

	calculateShopMechanics();
	drawShop();	
	drawUILayer();
}

//--------------------------------END TIMER 1--------------------------------	
	

var clientTimeoutSeconds = 60000;
var clientTimeoutTicker = clientTimeoutSeconds;
var newTipSeconds = 45;
var newTipTicker = newTipSeconds;

//EVERY 1 SECOND
setInterval( 
	function(){
		//clientTimeoutTicker--;
		if (clientTimeoutTicker < clientTimeoutSeconds - 5){
			logg("No server messages detected, " + clientTimeoutTicker + " until timeout");
		}
		if (clientTimeoutTicker < 1){
			logg("ERROR: Server Timeout. Reloading page...");
			disconnect();
			location.reload();
			clientTimeoutTicker = clientTimeoutSeconds;
		}
		
		if (document.getElementById("leftMenu") && document.getElementById("leftMenu").style.display != 'none'){
			newTipTicker--;
			if (newTipTicker < 1){
				newTipTicker = newTipSeconds;
				getNewTip();
			}
			
		}

		
	},
	1000/1 //Ticks per second
);

setInterval( 
	function(){
		//ping		
		if (stopStopwatch() > 999 && waitingOnPing){
			ping = 999;
			waitingOnPing = false;
		}
		if (Player.list[myPlayer.id] && waitingOnPing == false){
			startStopwatch();
			waitingOnPing = true;
			socket.emit('pingServer', myPlayer.id);
		}

	},
	2000 //2 seconds
);

function compare(a,b) {
  if (a.cashEarnedThisGame < b.cashEarnedThisGame)
    return 1;
  if (a.cashEarnedThisGame > b.cashEarnedThisGame)
    return -1;
  return 0;
}
	
	
//Socket On
socket.on('sendLog', function(log){
	console.log(log);
});

socket.on('endGameProgressResults', function(endGameProgressResults){
	postGameProgressInfo.originalRating = endGameProgressResults.originalRating;
	postGameProgressInfo.ratingDif = endGameProgressResults.ratingDif;
	postGameProgressInfo.rank = getFullRankName(endGameProgressResults.rank);
	postGameProgressInfo.rankIcon = Img[endGameProgressResults.rank];
	postGameProgressInfo.previousRank = getFullRankName(endGameProgressResults.previousRank);
	postGameProgressInfo.previousRankIcon = Img[endGameProgressResults.previousRank];	
	postGameProgressInfo.nextRank = getFullRankName(endGameProgressResults.nextRank);
	postGameProgressInfo.nextRankIcon = Img[endGameProgressResults.nextRank];
	postGameProgressInfo.rankFloor = endGameProgressResults.rankFloor;
	postGameProgressInfo.rankCeiling = endGameProgressResults.rankCeiling;
	postGameProgressInfo.ratingPercentageToNext = getProgressBarPercentage(endGameProgressResults.originalRating, endGameProgressResults.rankFloor, endGameProgressResults.rankCeiling);
	//postGameProgressInfo.ratingDifPercentage = getProgressBarPercentage(Math.abs(endGameProgressResults.ratingDif), endGameProgressResults.rankFloor, endGameProgressResults.rankCeiling);
	postGameProgressInfo.originalExp = endGameProgressResults.originalExp;
	postGameProgressInfo.expDif = endGameProgressResults.expDif;
	postGameProgressInfo.level = endGameProgressResults.level;
	postGameProgressInfo.expFloor = endGameProgressResults.experienceFloor;
	postGameProgressInfo.expCeiling = endGameProgressResults.experienceCeiling;
	postGameProgressInfo.expPercentageToNext = getProgressBarPercentage(endGameProgressResults.originalExp, endGameProgressResults.experienceFloor, endGameProgressResults.experienceCeiling);
	//postGameProgressInfo.expDifPercentage = getProgressBarPercentage(Math.abs(endGameProgressResults.expDif), endGameProgressResults.experienceFloor, endGameProgressResults.experienceCeiling);
	console.log(postGameProgressInfo);
	postGameReady = true;
});

function getProgressBarPercentage(value, floor, ceiling){
	if (value < floor){ //This should never happen. If it does, problem is server code
		//log("ERROR: Experience or Ranking is lower than the floor of the current level or rank");
		//return 0;
	}
	value -= floor;
	ceiling -= floor;	
	return Math.round((value/ceiling) * 1000) / 1000;
}

//------------------------------BLOOD FUNCTIONS----------------------------------
//hit //gethit
socket.on('sprayBloodOntoTarget', function(data){
	var blood = Blood(data.targetX, data.targetY, data.shootingDir);	
	if (data.targetId == myPlayer.id){ screenShakeCounter = 8; } 
	if (!mute){
		var dx1 = myPlayer.x - data.targetX;
		var dy1 = myPlayer.y - data.targetY;
		var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
		var vol = (Math.round((1 - (dist1 / 1000)) * 100)/100) + .3;
		if (vol > 1)
			vol = 1;
		else if (vol < 0 && vol >= -.1)
			vol = 0.01;
		if (vol < -.1 || mute)
			vol = 0;

		
		var rand = Math.floor((Math.random() * 2) + 1);
		if (rand == 1){
			sfxHit1.volume(vol);
			sfxHit1.play();
		}
		else {
			sfxHit2.volume(vol);
			sfxHit2.play();
		}
	}
});

var Blood = function(x, y, direction){
	var self = {
		id:Math.random(),
		x:x,
		y:y,
		//width:84, full size
		//height:97, full size
		width:21,
		height:24.25,
		direction:direction,
		bloodRand:Math.floor((Math.random() * 4) + 1),
	}	
	Blood.list[self.id] = self;		
}
Blood.list = {};

var Smash = function(x, y){
	var self = {
		id:Math.random(),
		x:x,
		y:y,
		//width:100, full size
		//height:100, full size
		width:25,
		height:25,
		smashRand:Math.floor((Math.random() * 4) + 1),
	}	
	Smash.list[self.id] = self;		
}
Smash.list = {};

var BoostBlast = function(id){
	var self = {
		id:id,
		alpha:1.5,
		//width:100, full size
		//height:100, full size
		width:Math.floor((Math.random() * 36) + 16),
		height:Math.floor((Math.random() * 55) + 75),		
	}	
	BoostBlast.list[self.id] = self;		
}
BoostBlast.list = [];


socket.on('shootUpdate', function(shotData){	
	var newShot = false; //To keep double shot sounds from playing when shooting diagonally (pressing 2 "shoot" keys at once)
	if (!Shot.list[shotData.id]){
		var shot = Shot(shotData.id);
		newShot = true;
	}
	//Distance calc for volume
	var dx1 = myPlayer.x - Player.list[shotData.id].x;
	var dy1 = myPlayer.y - Player.list[shotData.id].y;
	var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
	var vol = Math.round((1 - (dist1 / 1000)) * 100)/100;
	if (vol < 0 && vol >= -.1)
		vol = 0.01;
	if (vol < -.1 || mute)
		vol = 0;
	if (Player.list[shotData.id].weapon == 3 && newShot == true){
		sfxMG.volume(vol * .35);
		sfxMG.play();
		if (shotData.id == myPlayer.id && Player.list[shotData.id].MGClip <= 7){
			sfxClick.volume(vol);
			sfxClick.play();
		}
	}
	else if (Player.list[shotData.id].weapon == 2 && newShot == true) {
		sfxDP.volume(vol);
		sfxDP.play();
		if (shotData.id == myPlayer.id && Player.list[shotData.id].DPClip <= 5){
			sfxClick.volume(vol);
			sfxClick.play();
		}
	}
	else if (Player.list[shotData.id].weapon == 1 && newShot == true) {
		sfxPistol.volume(vol);
		sfxPistol.play();
		if (shotData.id == myPlayer.id && Player.list[shotData.id].PClip <= 5){
			sfxClick.volume(vol);
			sfxClick.play();
		}
	}
	else if (Player.list[shotData.id].weapon == 4 && newShot == true) {
		sfxSG.volume(vol);
		sfxSG.play();
		if (shotData.id == myPlayer.id && Player.list[shotData.id].SGClip <= 3){
			sfxClick.volume(vol);
			sfxClick.play();
		}
		Player.list[shotData.id].triggerTapLimitTimer = SGTriggerTapLimitTimer;
	}
	if (shotData.shootingDir){
		Player.list[shotData.id].shootingDir = shotData.shootingDir;
	}
	Shot.list[shotData.id].distance = shotData.distance;
	Shot.list[shotData.id].spark = shotData.spark;	
});

var Shot = function(id){
	
	var self = {
		id:id,
		distance:10000,
		decay:2,
		spark:false,
		width:Math.floor((Math.random() * 46) + 26),   //36
		height:Math.floor((Math.random() * 45) + 65),  //55
	}	
	Shot.list[self.id] = self;		
}
Shot.list = {};



// ---------------------------------- CREATE BODY -----------------------------
function createBody(targetX, targetY, pushSpeed, shootingDir, bodyType){
	if (Object.size(Body.list) < bodyLimit){
		var body = Body(targetX, targetY, shootingDir, bodyType, pushSpeed);	
	}	
	if (!mute){
		var dx1 = myPlayer.x - targetX;
		var dy1 = myPlayer.y - targetY;
		var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
		var vol = (Math.round((1 - (dist1 / 1000)) * 100)/100) + .3;
		if (vol > 1)
			vol = 1;
		else if (vol < 0 && vol >= -.1)
			vol = 0.01;
		if (vol < -.1 || mute)
			vol = 0;
	
		sfxKill.volume(vol);
		sfxKill.play();	
	}	
}

var Body = function(x, y, direction, bodyType, speed){
	var self = {
		id:Math.random(),
		x:x,
		y:y,
		speed:(speed + randomInt(5,15)),
		//width:84, full size
		//height:97, full size
		direction:direction,
		bodyType:bodyType,
		bodyRand: Math.floor((Math.random() * 4) + 1),
		age:0,
		poolHeight: Math.floor((Math.random() * 50) + 1),
		poolHeightMax: Math.floor((Math.random() * 100) + 80),
	}	
	Body.list[self.id] = self;		
}
Body.list = {};




//---------------------------KEY INPUTS--------------------------------

//Key Presses
document.onkeydown = function(event){
	if(event.keyCode === 87 && chatInput.style.display == "none"){ //W
		myPlayer.pressingW = true;
		if (!shop.active){
			socket.emit('keyPress',{inputId:87,state:true});
		}
	}
	else if(event.keyCode === 68 && chatInput.style.display == "none"){ //D
		myPlayer.pressingD = true;
		if (!shop.active){
			socket.emit('keyPress',{inputId:68,state:true});
		}
	}
	else if(event.keyCode === 83 && chatInput.style.display == "none"){ //S
		myPlayer.pressingS = true;
		if (!shop.active){
			socket.emit('keyPress',{inputId:83,state:true});
		}
	}
	else if(event.keyCode === 65 && chatInput.style.display == "none"){ //A
		myPlayer.pressingA = true;
		if (!shop.active){
			socket.emit('keyPress',{inputId:65,state:true});
		}
	}		
	else if((event.keyCode === 38 || event.keyCode === 80) && chatInput.style.display == "none"){ //Up
		//if (event.keyCode === 38)
			//event.preventDefault();
		if (myPlayer.team != "none"){
			myPlayer.pressingUp = true;
			if (!shop.active){
				socket.emit('keyPress',{inputId:38,state:true});
			}
			else {
				purchase();
			}
		}
		else {
			getNextOrderedPlayer(spectatingPlayerId, true);
		}
	}
	else if((event.keyCode === 39 || event.keyCode === 222) && chatInput.style.display == "none"){ //Right
		//if (event.keyCode === 39)
			//event.preventDefault();
		if (myPlayer.team != "none"){
			myPlayer.pressingRight = true;
			if (!shop.active){
				socket.emit('keyPress',{inputId:39,state:true});
			}
			else if (shop.selection < 5) {
				shop.selection++;
				if (!mute)
					sfxMenuMove.play();
			}
		}
		else {
			if (spectatingPlayerId == "bagRed"){
				spectatingPlayerId = "";
			}
			else {
				spectatingPlayerId = "bagBlue";
			}
		}
	}
	else if((event.keyCode === 40 || event.keyCode === 186) && chatInput.style.display == "none"){ //Down
		//if (event.keyCode === 40)
			//event.preventDefault();
		if (myPlayer.team != "none"){
			myPlayer.pressingDown = true;
			if (!shop.active){
				socket.emit('keyPress',{inputId:40,state:true});
			}
		}
		else {
			getNextOrderedPlayer(spectatingPlayerId, false);
		}
	}
	else if((event.keyCode === 37 || event.keyCode === 76) && chatInput.style.display == "none"){ //Left
		//if (event.keyCode === 37)
			//event.preventDefault();
		if (myPlayer.team != "none"){
			myPlayer.pressingLeft = true;
			if (!shop.active){
				socket.emit('keyPress',{inputId:37,state:true});
			}
			else if (shop.selection > 1) {
				shop.selection--;
				if (!mute)
					sfxMenuMove.play();			
			}
		}	
		else {
			if (spectatingPlayerId == "bagBlue"){
				spectatingPlayerId = "";
			}
			else {
				spectatingPlayerId = "bagRed";
			}
		}	
	}		
	else if(event.keyCode === 32 && chatInput.style.display == "none" && !shop.active){ //Space
		socket.emit('keyPress',{inputId:32,state:true});
		if ((myPlayer.pressingW || myPlayer.pressingD || myPlayer.pressingS || myPlayer.pressingA) && Player.list[myPlayer.id].boosting == 0 && !mute){
			if (!Player.list[myPlayer.id].holdingBag && Player.list[myPlayer.id].energy >= 1){
				//Boosting!
			}				
			else if (!Player.list[myPlayer.id].holdingBag && Player.list[myPlayer.id].energy <= 0 && !sfxBoostEmpty.playing())
				sfxBoostEmpty.play();
			else if (Player.list[myPlayer.id].holdingBag)
				sfxWhoosh.play();
		}

	}		
	else if(event.keyCode === 81 && chatInput.style.display == "none" && !shop.active){ //Q
		socket.emit('keyPress',{inputId:81,state:true});
	}	
	else if(event.keyCode === 69 && chatInput.style.display == "none" && !shop.active){ //E
		socket.emit('keyPress',{inputId:69,state:true});
	}	
	else if(event.keyCode === 82 && chatInput.style.display == "none" && !shop.active){ //R
		socket.emit('keyPress',{inputId:82,state:true});
	}
	else if(event.keyCode === 17 && chatInput.style.display == "none" && !shop.active){ //Ctrl
		event.preventDefault();
		socket.emit('keyPress',{inputId:82,state:true});
	}
	else if(event.keyCode === 16 && chatInput.style.display == "none"){ //Shift
		myPlayer.pressingShift = true;
			camOffSet = shiftCamOffSet;
			diagCamOffSet = shiftDiagCamOffSet;
			camMaxSpeed = 300;
		socket.emit('keyPress',{inputId:16,state:true});
	}
	else if(event.keyCode === 49 && chatInput.style.display == "none"){ //1
		socket.emit('keyPress',{inputId:49,state:true});
	}	
	else if(event.keyCode === 50 && chatInput.style.display == "none"){ //2
		socket.emit('keyPress',{inputId:50,state:true});
	}	
	else if(event.keyCode === 51 && chatInput.style.display == "none"){ //3
		socket.emit('keyPress',{inputId:51,state:true});
	}	
	else if(event.keyCode === 52 && chatInput.style.display == "none"){ //4
		socket.emit('keyPress',{inputId:52,state:true});
	}	
	
	else if(event.keyCode === 13){ //Enter
		canvasDiv.style.backgroundColor="black";
		if (chatInput.style.display == "inline"){
			if (chatInput.value != "") {
				if(chatInput.value[0] === '/' && chatInput.value[1] === '.'){
					if (chatInput.value == '//shadow' || chatInput.value == '//shadows'){
						if (noShadows){
							noShadows = false;
						}
						else {
							noShadows = true;
						}
					}
					else if (chatInput.value == '/zoom'){
						if (zoom == 1){
							zoom = 0.75;
						}
						else {
							zoom = 1;
						}
					}
					socket.emit('evalServer',chatInput.value.substring(2));
				}

				else {
					socket.emit('chat',[myPlayer.id, chatInput.value]);
				}
			}
			chatInput.value = '';
			chatInput.style.display = "none";
			chatStale = 0;
		}
		else if (chatInput.style.display == "none" && myPlayer.name != ""){
			chatInput.style.display = "inline";
			chatInput.focus();
			chatText.style.display = "inline-block"; 
			chatStale = 0;
		}
	}
	else if(event.keyCode === 27){ //Esc
		if (showStatOverlay == false){
			chatInput.value = '';
			chatInput.style.display = "none";
			showStatOverlay = true;
		}
		else if (showStatOverlay == true){
			showStatOverlay = false;
		}		
	}
	
	else if(event.keyCode === 77 && chatInput.style.display == "none"){ //M //togglemute toggle mute
		if (Player.list[myPlayer.id]){
			if (mute){
				mute = false;
			}
			else{
				mute = true;		
				sfxVictoryMusic.stop();
				sfxDefeatMusic.stop();
			}
		}
	}
	else if(event.keyCode === 71 && myPlayer.id && chatInput.style.display == "none"){ //"G" //G 
		if (Player.list[myPlayer.id]){
			if (lowGraphicsMode == false){
				lowGraphicsMode = true;
				//noShadows = true;
				//addToChat('---!Low Graphics Mode ENABLED!---');
			}
			else {
				lowGraphicsMode = false; 
				//noShadows = false;
				//addToChat('---!Low Graphics Mode DISABLED!---');
			}
		}		
	}
	
	else if(event.keyCode === 85 && myPlayer.id && chatInput.style.display == "none"){ //"U" //U (TESTING BUTTON) DEBUG BUTTON testing
	getNewTip();
		console.log("TESTING BUTTON");
		ctx.beginPath();
		if (Player.list[myPlayer.id]){

			//drawMapElementsOnMapCanvas();
			//socket.emit('keyPress',{inputId:85,state:true});
		}		
	}
	
	
}

//Key Up
document.onkeyup = function(event){
	if(event.keyCode === 87){ //W
		myPlayer.pressingW = false;
		socket.emit('keyPress',{inputId:87,state:false});
	}
	else if(event.keyCode === 68){ //D
		myPlayer.pressingD = false;
		socket.emit('keyPress',{inputId:68,state:false});
	}
	else if(event.keyCode === 83){ //S
		myPlayer.pressingS = false;
		socket.emit('keyPress',{inputId:83,state:false});
	}
	else if(event.keyCode === 65){ //A
		myPlayer.pressingA = false;
		socket.emit('keyPress',{inputId:65,state:false});
	}		
	else if((event.keyCode === 38 || event.keyCode === 80) && chatInput.style.display == "none"){ //Up
		myPlayer.pressingUp = false;
		if (!shop.active){
			socket.emit('keyPress',{inputId:38,state:false});
		}
	}
	else if((event.keyCode === 39 || event.keyCode === 222) && chatInput.style.display == "none"){ //Right
		myPlayer.pressingRight = false;
		if (!shop.active){
			socket.emit('keyPress',{inputId:39,state:false});
		}
	}
	else if((event.keyCode === 40 || event.keyCode === 186) && chatInput.style.display == "none"){ //Down
		myPlayer.pressingDown = false;
		if (shop.active){
			shop.active = false;
			
			if (myPlayer.pressingW == true){
				socket.emit('keyPress',{inputId:87,state:true});
			}
			if (myPlayer.pressingD == true){
				socket.emit('keyPress',{inputId:68,state:true});
			}
			if (myPlayer.pressingS == true){
				socket.emit('keyPress',{inputId:83,state:true});
			}
			if (myPlayer.pressingA == true){
				socket.emit('keyPress',{inputId:65,state:true});
			}
			
		}
		else {
			socket.emit('keyPress',{inputId:40,state:false});
		}
	}
	else if((event.keyCode === 37 || event.keyCode === 76) && chatInput.style.display == "none"){ //Left
		myPlayer.pressingLeft = false;
		if (!shop.active){
			socket.emit('keyPress',{inputId:37,state:false});
		}
	}
	
	else if(event.keyCode === 16){ //Shift
		myPlayer.pressingShift = false;
			camOffSet = 300;
			diagCamOffSet = 200;
			camMaxSpeed = 300;
		socket.emit('keyPress',{inputId:16,state:false});
	}
	
	else if(event.keyCode === 84 && chatInput.style.display == "none" && myPlayer.name != ""){ //T
		chatInput.style.display = "inline";
		chatInput.focus();
		chatText.style.display = "inline-block";
		chatStale = 0;
	}	
	

}

var tips = [
	"Cloaked enemies are only 99% invisible. If you stop moving, they are easier to spot.",
	"Shooting a cloaked enemy will make them visible and cause extra damage. Try shooting places you think they may be hiding.",
	"Careful not to use up all your energy. It will take longer to recharge. If the energy bar is red, using another boost will deplete it.",
	"You can party up with friends by searching their username on the homepage.",
	"Attack with teammates. There is strength in numbers.",
	"You are slower while carrying the bag. Try throwing it ahead of yourself with [Space]. However, this will deplete almost all your energy.",
	"If you’re dying a lot, try sticking with your teammates and using them as meat shields.",
	"Shooting enemies in the back does much more damage. Use cloak to get behind unsuspecting enemies.",
	"If you are running away from a deadly situation, make an effort to stay away from the 8 angles the enemy can shoot.",
	" Controlling powerups is key to victory. Be aware of the powerups’ spawn timers.",
	"Press [Enter] to use chat and taunt your foes!",
	"Stand still and press [Space] to use cloak. Press [Space] while moving to boost.",
	"Boosting into your opponents will cause heavy damage if you can hit them.",
	"Don't be racist.",
	"For best game performance, close all other browser tabs and applications."
];

function getNewTip(){
	if (document.getElementById("tipContent")){
		var newTip = tips[randomInt(0, tips.length-1)];
		document.getElementById("tipContent").innerHTML = newTip;
	}
}



//Handy handy functions
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function removeIndexesFromArray(array, indexes){
	for (var i = 0; i < indexes.length; i++){
		array.splice(indexes[i], 1);
	}
	return array;
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};


function distance(entity1, entity2){
	var dx1 = entity1.x - entity2.x;
	var dy1 = entity1.y - entity2.y;
	return Math.round(Math.sqrt(dx1*dx1 + dy1*dy1) * 10)/10;	
}

//Stopwatch
var timeBegan = new Date();
var waitingOnPing = false;

function startStopwatch(){
	timeBegan = new Date();
}

function stopStopwatch(){
	var timePassed = new Date(new Date() - timeBegan);
	return timePassed.getTime();
}

function disconnect(){
	socket.disconnect();
}

window.onbeforeunload = function(){
	if ((myPlayer.team == "white" || myPlayer.team == "black") && (!gameOver && !pregame)){
		return "warn";
	}
	else {
		disconnect();
	}
};

window.onunload = function(){
  disconnect();
};

window.addEventListener("beforeunload", function (e) {
	if (myPlayer.team == "white" || myPlayer.team == "black" && (!gameOver && !pregame)){
		return "warn";
	}
	else {
		disconnect();
	}
});

function randomInt(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

