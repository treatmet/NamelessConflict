page = "game";
//document.oncontextmenu =new Function("return false;")
initializePage();
function initializePage(){
	getTokenFromUrlParameterAndLogin(); 	
}

function loginSuccess(){
	logg("game loginSuccess function");
	autoPlayNow();
	if (document.getElementById("homeLink")){
		document.getElementById("homeLink").href = serverHomePage;
	}		
}

function loginFail(){
	logg("game loginFail function");
	// alert("Authentication failed while trying to join game."); 
	// window.location.href = serverHomePage;
	if (tempCognitoSub){
		autoPlayNow();
		if (document.getElementById("homeLink")){
			document.getElementById("homeLink").href = serverHomePage;
		}	
	}
}

function loginAlways(){
	updateProfileLink();
	document.getElementById('performanceInstructions').innerHTML = getPerformanceInstrucitons();
}

function showPerformanceInstructionsGame(){
	
	show('performanceInstructions');
}

function voteEndgame(voteType, voteSelection){
	if (voteType == "gametype"){
		document.getElementById("voteCTF").disabled = true;
		document.getElementById("voteElimination").disabled = true;
		document.getElementById("voteDeathmatch").disabled = true;		
	}
	else if (voteType == "map"){
		document.getElementById("voteLongest").disabled = true;
		document.getElementById("voteCrik").disabled = true;
		document.getElementById("voteThePit").disabled = true;		
	}
	else if (voteType == "rebalance"){
		document.getElementById("voteRebalanceYes").disabled = true;
		document.getElementById("voteRebalanceNo").disabled = true;
	}
	socket.emit("voteEndgame", myPlayer.id, voteType, voteSelection);
}

socket.on('votesUpdate', function(votesData){
	document.getElementById("voteCTF").innerHTML = "CTF - [" + votesData.ctfVotes + "]";
	document.getElementById("voteDeathmatch").innerHTML = "Killfest - [" + votesData.slayerVotes + "]";	
	document.getElementById("voteElimination").innerHTML = "Elimination - [" + votesData.elimVotes + "]";	
	document.getElementById("voteLongest").innerHTML = "<span style='color: #408fe0;font-size: 13px;'>Longer </span>Hallway - [" + votesData.longestVotes + "]";
	document.getElementById("voteThePit").innerHTML = "<span style='color: #408fe0;font-size: 13px;'>ThePitiful </span>Warehouse - [" + votesData.thePitVotes + "]";	
	document.getElementById("voteCrik").innerHTML = "<span style='color: #408fe0;font-size: 13px;'>Babble Creek </span>Bunkers - [" + votesData.crikVotes + "]";
	document.getElementById("voteRebalanceYes").innerHTML = "Yes - [" + votesData.voteRebalanceTeamsYes + "]";
	document.getElementById("voteRebalanceNo").innerHTML = "No - [" + votesData.voteRebalanceTeamsNo + "]";
});

socket.on('betrayalKick', function(){
	forceToLeave = true;
	alert("You were kicked for being a Benedict Arnold.");
	window.location.href = serverHomePage;
});


var debugTimer = 60;
var debugText = true;
var localGame = false;
//'use strict';


//-----------------Config----------------------
var version = "v 0.5.0"; //Scalable + customizations

const spectateMoveSpeed = 10;
var screenShakeScale = 0.5;
var drawDistance = 10; 
var playerCenterOffset = 4;
var noPlayerBorders = false;
var timeInGameRankingThresh = 60; //seconds

var camOffSet = 350;//Offset is how many pixels away from the center the camera will go when aiming, greater value means player closer to edge of screen
var diagCamOffSet = 200;
var camMaxSpeed = 300;
var camAccelerationMultiplier = 1.9;
var shiftCamOffSet = 450;
var shiftDiagCamOffSet = 325;
const spectateZoom = 0.5;
var defaultZoom = 0.75;
var zoom = defaultZoom;

const maxCloakStrength = 0.98; //minCloak
const maxAlliedCloakOpacity = .2; 
var dualBoostXOffset = 15;

var shopEnabled = false;

//Player Config
var SGTriggerTapLimitTimer = 50;
var hordeKills = 0;
var hordeGlobalBest = 0;
var hordePersonalBest = 0;
var hordeGlobalBestNames = "RTPM3";

var legSwingSpeed = 1;
var maxLegHeight = 116;

const BODY_AGE = 1500;
const bodyScale = 0.9; //To account for bodies being on the ground, farther down on Z axis
var bodyLimit = 16;


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
var chatSpam = 0;
const chatSpamGain = 120;
const chatSpamThresh = 300;
var pressShiftTimer = 300;

var	showStatOverlay = false;

var spectatingPlayerId = "";

var canvasDiv = document.getElementById("canvasDiv"); 

var map = "map2";
var gametype = "ctf";
var scoreToWin = 0;
var timeLimit = true; //true for time limit victory condition, false if score limit victory condition.
var customServer = false;
var minutesLeft = "9";
var secondsLeft = "99";
var nextGameTimer = 0;
var ping = 0;
var previousPing = 0;

var lowGraphicsMode = true;
var noShadows = false;

//Initialize client-side code variables



function normalShadow() {
	if (noShadows){
		noShadow();
		return;
	}
	ctx.shadowColor = "#000000";
	ctx.shadowOffsetX = 2; 
	ctx.shadowOffsetY = 2;
	if (lowGraphicsMode){
		ctx.shadowBlur = 0;		
	}
	else {
		ctx.shadowBlur = 4;
	}
}
const damageFlashWidth = 3;
function redShadow1(){
	ctx.shadowColor = "#FF0000";
	ctx.shadowOffsetX = damageFlashWidth; 
	ctx.shadowOffsetY = 0;
}
function redShadow2(){
	ctx.shadowColor = "#FF0000";
	ctx.shadowOffsetX = -damageFlashWidth; 
	ctx.shadowOffsetY = 0;
}
function redShadow3(){
	ctx.shadowColor = "#FF0000";
	ctx.shadowOffsetX = 0; 
	ctx.shadowOffsetY = damageFlashWidth;
}
function redShadow4(){
	ctx.shadowColor = "#FF0000";
	ctx.shadowOffsetX = 0; 
	ctx.shadowOffsetY = -damageFlashWidth;
}
function whiteShadow1(){
	ctx.shadowColor = "#FFFFFF";
	ctx.shadowOffsetX = damageFlashWidth; 
	ctx.shadowOffsetY = 0;
}
function whiteShadow2(){
	ctx.shadowColor = "#FFFFFF";
	ctx.shadowOffsetX = -damageFlashWidth; 
	ctx.shadowOffsetY = 0;
}
function whiteShadow3(){
	ctx.shadowColor = "#FFFFFF";
	ctx.shadowOffsetX = 0; 
	ctx.shadowOffsetY = damageFlashWidth;
}
function whiteShadow4(){
	ctx.shadowColor = "#FFFFFF";
	ctx.shadowOffsetX = 0; 
	ctx.shadowOffsetY = -damageFlashWidth;
}
const blueShadowColor = "#00385e";
//const blueShadowColor = "#005b98";
function blueShadow1(borderLength){
	ctx.shadowColor = blueShadowColor;
	ctx.shadowOffsetX = 0; 
	ctx.shadowOffsetY = borderLength;
}
function blueShadow2(borderLength){
	ctx.shadowColor = blueShadowColor;
	ctx.shadowOffsetX = -borderLength; 
	ctx.shadowOffsetY = 0;
}
function blueShadow3(borderLength){
	ctx.shadowColor = blueShadowColor;
	ctx.shadowOffsetX = borderLength; 
	ctx.shadowOffsetY = 0;
}
function blueShadow4(borderLength){
	ctx.shadowColor = blueShadowColor;
	ctx.shadowOffsetX = 0; 
	ctx.shadowOffsetY = -borderLength;
}

function redShadow0() {
	ctx.shadowColor = "red";
	ctx.shadowOffsetX = 0; 
	ctx.shadowOffsetY = 0;
	ctx.shadowBlur = 3;
}

function redShadow00() {
	ctx.shadowColor = "red";
	ctx.shadowOffsetX = 0; 
	ctx.shadowOffsetY = 0;
	ctx.shadowBlur = 0;
}

function noShadow() {
	ctx.shadowColor = "#000000";
	ctx.shadowOffsetX = 0; 
	ctx.shadowOffsetY = 0;
	ctx.shadowBlur = 0;
}
function heavyCenterShadow() {
	noShadow();
	return;

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

var strapOffset = 18;

var laserMaxCharge = 150;

var triggeredPerformanceTips = false;
socket.on('pingResponse', function (socketId){
	if (Player.list[socketId]){
		checkPreviousPingsAndShowPerfInstructions(false);
		ping = stopStopwatch();
		waitingOnPing = false;
	}		
});

var blinkOn = false;
socket.on('sendClock', function(secondsLeftPlusZeroData, minutesLeftData){
	if (typeof myPlayer == 'undefined' || myPlayer.name == "" || !Player.list[myPlayer.id])
		return;
		
	minutesLeft = minutesLeftData;
	secondsLeft = secondsLeftPlusZeroData;
	if (minutesLeft > 0 || secondsLeft > 0){suddenDeath = false; suddenDeathAlpha = 1;}
	
	if (parseInt(minutesLeft)*60 + parseInt(secondsLeftPlusZeroData) == 60){
		if (!mute){
			sfxTimeWarning.play();
		}
		clockHeight = 266;
	}
	//log("CLOCK timeLimit:" + timeLimit.toString());
	//var timerleft = parseInt(minutesLeft)*60 + parseInt(secondsLeftPlusZeroData);
	//log("timeleft:" + timerleft);
	if (parseInt(minutesLeft)*60 + parseInt(secondsLeftPlusZeroData) == 0 && suddenDeath == false && blackScore == whiteScore && timeLimit == true && !mute){
		sfxSuddenDeath.play();
		suddenDeath = true;
	}
	
	//Border (blink on flag stolen)
	if (myPlayer.team == 1 && bagRed.captured == true && blinkOn == false){
		canvas.style.border = "2px solid #FF0000";
		blinkOn = true;
	}
	else if (myPlayer.team == 2 && bagBlue.captured == true && blinkOn == false){
		canvas.style.border = "2px solid #FF0000";
		blinkOn = true;
	}
	else {
		determineBorderStyle();
		blinkOn = false;
	}

});

function determineBorderStyle(){
	canvas.style.border = "2px solid #000000";
	if (myPlayer.health >= 101){
		canvas.style.border = "2px solid #005b98";			
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
var rightArrowX = 549;
var pickupFlash = 1.0;

var gameOver = false;
var roundOver = false;
var roundVictor = 1;
var pregame = true;
var pregameIsHorde = true;
var suddenDeath = false;

var healthFlashTimer = 100;

//----------------Loading Images----------------
var Img = {};
Img.small = new Image();
Img.small.src = "/src/client/img/small.png";

Img.quickChatKeys = new Image();
Img.quickChatKeys.src = "/src/client/img/quickChatKeys.png";
Img.block = new Image();
Img.block.src = "/src/client/img/block.png";
Img.redBlock = new Image();
Img.redBlock.src = "/src/client/img/blockRed.png";
Img.redDeath = new Image();
Img.redDeath.src = "/src/client/img/red-death.png";
Img.blueBlock = new Image();
Img.blueBlock.src = "/src/client/img/blockBlue.png";
Img.pushUpBlock = new Image();
Img.pushUpBlock.src = "/src/client/img/blockPushUp.png";
Img.pushRightBlock = new Image();
Img.pushRightBlock.src = "/src/client/img/blockPushRight.png";
Img.pushDownBlock = new Image();
Img.pushDownBlock.src = "/src/client/img/blockPushDown.png";
Img.pushLeftBlock = new Image();
Img.pushLeftBlock.src = "/src/client/img/blockPushLeft.png";
Img.warp1 = new Image();
Img.warp1.src = "/src/client/img/beam1.png";
Img.warp2 = new Image();
Img.warp2.src = "/src/client/img/beam2.png";
Img.warp3 = new Image();
Img.warp3.src = "/src/client/img/beam3.png";
Img.warp4 = new Image();
Img.warp4.src = "/src/client/img/beam4.png";
Img.tile = new Image();
Img.tile.src = "/src/client/img/factory-floor.png";
Img.tileWhite = new Image();
Img.tileWhite.src = "/src/client/img/factory-floor-white.png";
Img.tileBlack = new Image();
Img.tileBlack.src = "/src/client/img/factory-floor-black.png";
Img.statOverlay = new Image();
Img.statOverlay.src = "/src/client/img/stat-overlay.png";
Img.statArrow = new Image();
Img.statArrow.src = "/src/client/img/arrow.png";
Img.statCamera = new Image();
Img.statCamera.src = "/src/client/img/cameraIconScoreboard.png";
Img.mute = new Image();
Img.mute.src = "/src/client/img/mute.png";
Img.yellow = new Image();
Img.yellow.src = "/src/client/img/yellow.png";
Img.orange = new Image();
Img.orange.src = "/src/client/img/orange.png";
Img.lightGreen = new Image();
Img.lightGreen.src = "/src/client/img/light-green.png";
Img.lightYellow = new Image();
Img.lightYellow.src = "/src/client/img/light-yellow.png";
Img.redLaser = new Image();
Img.redLaser.src = "/src/client/img/red-pixel-trans.png";
Img.laserCanonBeam = new Image();
Img.laserCanonBeam.src = "/src/client/img/laserBeam.png";
Img.laserRing = new Image();
Img.laserRing.src = "/src/client/img/laserRing.png";
Img.laserFlare = new Image();
Img.laserFlare.src = "/src/client/img/laserFlare.png";
Img.laserFlare2 = new Image();
Img.laserFlare2.src = "/src/client/img/laserFlare2.png";
Img.spectatingOverlay = new Image();
Img.spectatingOverlay.src = "/src/client/img/spectating-overlay.png";

Img.hudIndicatorCaptBlue = new Image();
Img.hudIndicatorCaptBlue.src = "/src/client/img/hudIndicatorCaptureBlue.png";
Img.hudIndicatorHeart = new Image();
Img.hudIndicatorHeart.src = "/src/client/img/hudIndicatorHeart.png";
Img.hudIndicatorBringHome = new Image();
Img.hudIndicatorBringHome.src = "/src/client/img/hudIndicatorBringHome.png";
Img.hudIndicatorCaptRed = new Image();
Img.hudIndicatorCaptRed.src = "/src/client/img/hudIndicatorCaptureRed.png";
Img.hudIndicatorRed = new Image();
Img.hudIndicatorRed.src = "/src/client/img/hudIndicatorRed.png";
Img.hudIndicatorBlue = new Image();
Img.hudIndicatorBlue.src = "/src/client/img/hudIndicatorBlue.png";
Img.hudIndicatorProtectRed = new Image();
Img.hudIndicatorProtectRed.src = "/src/client/img/hudIndicatorProtectRed.png";
Img.hudIndicatorProtectBlue = new Image();
Img.hudIndicatorProtectBlue.src = "/src/client/img/hudIndicatorProtectBlue.png";
Img.hudIndicatorDead = new Image();
Img.hudIndicatorDead.src = "/src/client/img/hudIndicatorDead.png";

Img.redFlash = new Image();
Img.redFlash.src = "/src/client/img/red-flash.png";
Img.whiteFlash = new Image();
Img.whiteFlash.src = "/src/client/img/white-flash.png";
Img.smashRed = new Image();
Img.smashRed.src = "/src/client/img/smash-red.png";
Img.smashBlue = new Image();
Img.smashBlue.src = "/src/client/img/smash-blue.png";
Img.smashYellow = new Image();
Img.smashYellow.src = "/src/client/img/smash-yellow.png";
Img.smashGreen = new Image();
Img.smashGreen.src = "/src/client/img/smash-green.png";

Img.boostBlast = new Image();
Img.boostBlast.src = "/src/client/img/shot-flash.png";
Img.boostLightning2 = new Image();
Img.boostLightning2.src = "/src/client/img/dynamic/boost/lightning2.png";


Img.blackPlayerPistol = new Image();
Img.blackPlayerPistol.src = "/src/client/img/blackPlayerPistolNaked.png";
Img.blackPlayerPistolReloading1 = new Image();
Img.blackPlayerPistolReloading1.src = "/src/client/img/blackPlayerPistolReloading1.png";
Img.blackPlayerPistolReloading2 = new Image();
Img.blackPlayerPistolReloading2.src = "/src/client/img/blackPlayerPistolReloading2.png";
Img.blackPlayerPistolReloading3 = new Image();
Img.blackPlayerPistolReloading3.src = "/src/client/img/blackPlayerPistolReloading3.png";
Img.blackPlayerPistolReloading4 = new Image();
Img.blackPlayerPistolReloading4.src = "/src/client/img/blackPlayerPistolReloading4.png";
Img.blackPlayerDP = new Image();
Img.blackPlayerDP.src = "/src/client/img/blackPlayerDP.png";
Img.blackPlayerDPReloading1 = new Image();
Img.blackPlayerDPReloading1.src = "/src/client/img/blackPlayerDPReloading1.png";
Img.blackPlayerDPReloading2 = new Image();
Img.blackPlayerDPReloading2.src = "/src/client/img/blackPlayerDPReloading2.png";
Img.blackPlayerDPReloading3 = new Image();
Img.blackPlayerDPReloading3.src = "/src/client/img/blackPlayerDPReloading3.png";
Img.blackPlayerMGReloading1 = new Image();
Img.blackPlayerMGReloading1.src = "/src/client/img/blackPlayerMGReloading1.png";
Img.blackPlayerMGReloading2 = new Image();
Img.blackPlayerMGReloading2.src = "/src/client/img/blackPlayerMGReloading2.png";
Img.blackPlayerMGReloading3 = new Image();
Img.blackPlayerMGReloading3.src = "/src/client/img/blackPlayerMGReloading3.png";
Img.blackPlayerMGReloading4 = new Image();
Img.blackPlayerMGReloading4.src = "/src/client/img/blackPlayerMGReloading4.png";
Img.blackPlayerMGReloading5 = new Image();
Img.blackPlayerMGReloading5.src = "/src/client/img/blackPlayerMGReloading5.png";

Img.whitePlayerPistol = new Image();
Img.whitePlayerPistol.src = "/src/client/img/whitePlayerPistolNaked.png";
Img.whitePlayerPistolReloading1 = new Image();
Img.whitePlayerPistolReloading1.src = "/src/client/img/whitePlayerPistolReloading1.png";
Img.whitePlayerPistolReloading2 = new Image();
Img.whitePlayerPistolReloading2.src = "/src/client/img/whitePlayerPistolReloading2.png";
Img.whitePlayerPistolReloading3 = new Image();
Img.whitePlayerPistolReloading3.src = "/src/client/img/whitePlayerPistolReloading3.png";
Img.whitePlayerPistolReloading4 = new Image();
Img.whitePlayerPistolReloading4.src = "/src/client/img/whitePlayerPistolReloading4.png";
Img.whitePlayerDP = new Image();
Img.whitePlayerDP.src = "/src/client/img/whitePlayerDP.png";
Img.whitePlayerDPReloading1 = new Image();
Img.whitePlayerDPReloading1.src = "/src/client/img/whitePlayerDPReloading1.png";
Img.whitePlayerDPReloading2 = new Image();
Img.whitePlayerDPReloading2.src = "/src/client/img/whitePlayerDPReloading2.png";
Img.whitePlayerDPReloading3 = new Image();
Img.whitePlayerDPReloading3.src = "/src/client/img/whitePlayerDPReloading3.png";
Img.whitePlayerMGReloading1 = new Image();
Img.whitePlayerMGReloading1.src = "/src/client/img/whitePlayerMGReloading1.png";
Img.whitePlayerMGReloading2 = new Image();
Img.whitePlayerMGReloading2.src = "/src/client/img/whitePlayerMGReloading2.png";
Img.whitePlayerMGReloading3 = new Image();
Img.whitePlayerMGReloading3.src = "/src/client/img/whitePlayerMGReloading3.png";
Img.whitePlayerMGReloading4 = new Image();
Img.whitePlayerMGReloading4.src = "/src/client/img/whitePlayerMGReloading4.png";
Img.whitePlayerMGReloading5 = new Image();
Img.whitePlayerMGReloading5.src = "/src/client/img/whitePlayerMGReloading5.png";
Img.blackPlayerMG = new Image();
Img.blackPlayerMG.src = "/src/client/img/blackPlayerMG.png";
Img.whitePlayerMG = new Image();
Img.whitePlayerMG.src = "/src/client/img/whitePlayerMG.png";
Img.whitePlayerSG = new Image();
Img.whitePlayerSG.src = "/src/client/img/whitePlayerSG.png";
Img.whitePlayerSGCock = new Image();
Img.whitePlayerSGCock.src = "/src/client/img/whitePlayerSGCock.png";
Img.whitePlayerSGReloading1 = new Image();
Img.whitePlayerSGReloading1.src = "/src/client/img/whitePlayerSGReloading1.png";
Img.whitePlayerSGReloading2 = new Image();
Img.whitePlayerSGReloading2.src = "/src/client/img/whitePlayerSGReloading2.png";
Img.whitePlayerSGReloading3 = new Image();
Img.whitePlayerSGReloading3.src = "/src/client/img/whitePlayerSGReloading3.png";
Img.blackPlayerSG = new Image();
Img.blackPlayerSG.src = "/src/client/img/blackPlayerSG.png";
Img.blackPlayerSGCock = new Image();
Img.blackPlayerSGCock.src = "/src/client/img/blackPlayerSGCock.png";
Img.blackPlayerSGReloading1 = new Image();
Img.blackPlayerSGReloading1.src = "/src/client/img/blackPlayerSGReloading1.png";
Img.blackPlayerSGReloading2 = new Image();
Img.blackPlayerSGReloading2.src = "/src/client/img/blackPlayerSGReloading2.png";
Img.blackPlayerSGReloading3 = new Image();
Img.blackPlayerSGReloading3.src = "/src/client/img/blackPlayerSGReloading3.png";

Img.shot = new Image();
Img.shot.src = "/src/client/img/shot-streak2.png";
Img.shotFlash = new Image();
Img.shotFlash.src = "/src/client/img/shot-flash.png";
Img.shotSpark = new Image();
Img.shotSpark.src = "/src/client/img/shot-spark.png";
Img.laserSpark = new Image();
Img.laserSpark.src = "/src/client/img/laserFlare2.png";
Img.shotShotgun = new Image();
Img.shotShotgun.src = "/src/client/img/shotgun-shot.png";


Img.ammo9mm = new Image();
Img.ammo9mm.src = "/src/client/img/ammo-9mm-30.png";
Img.ammoMG = new Image();
Img.ammoMG.src = "/src/client/img/ammo-MG-60.png";
Img.ammoDP = new Image();
Img.ammoDP.src = "/src/client/img/ammo-double-9mm-30.png";
Img.ammoSG = new Image();
Img.ammoSG.src = "/src/client/img/ammo-SG-24.png";
Img.ammoLZ = new Image();
Img.ammoLZ.src = "/src/client/img/ammo-laser-10.png";
Img.infinity = new Image();
Img.infinity.src = "/src/client/img/infinity2.png";
Img.weapon1Key = new Image();
Img.weapon1Key.src = "/src/client/img/1p.png";
Img.weapon2Key = new Image();
Img.weapon2Key.src = "/src/client/img/2dp.png";
Img.weapon3Key = new Image();
Img.weapon3Key.src = "/src/client/img/3mg.png";
Img.weapon4Key = new Image();
Img.weapon4Key.src = "/src/client/img/4sg.png";
Img.weapon5Key = new Image();
Img.weapon5Key.src = "/src/client/img/5lz.png";
Img.energyIcon = new Image();
Img.energyIcon.src = "/src/client/img/energyIcon.png";
Img.energyBoostIcon = new Image();
Img.energyBoostIcon.src = "/src/client/img/energyBoostIcon.png";
Img.energyEyeIcon = new Image();
Img.energyEyeIcon.src = "/src/client/img/energyEyeIcon.png";
Img.energyIconRed = new Image();
Img.energyIconRed.src = "/src/client/img/energyIconRed.png";
Img.energyIconX = new Image();
Img.energyIconX.src = "/src/client/img/energyIconX.png";
Img.energyBoostIconRed = new Image();
Img.energyBoostIconRed.src = "/src/client/img/energyBoostIconRed.png";
Img.energyEyeIconRed = new Image();
Img.energyEyeIconRed.src = "/src/client/img/energyEyeIconRed.png";
Img.energyIconYellow = new Image();
Img.energyIconYellow.src = "/src/client/img/energyIconYellow.png";
Img.energyBoostIconYellow = new Image();
Img.energyBoostIconYellow.src = "/src/client/img/energyBoostIconYellow.png";
Img.energyEyeIconYellow = new Image();
Img.energyEyeIconYellow.src = "/src/client/img/energyEyeIconYellow.png";


Img.pickupDP = new Image();
Img.pickupDP.src = "/src/client/img/DPammo.png";
Img.pickupDP2 = new Image();
Img.pickupDP2.src = "/src/client/img/DPammo2.png";
Img.pickupSG = new Image();
Img.pickupSG.src = "/src/client/img/SGammo.png";
Img.pickupSG2 = new Image();
Img.pickupSG2.src = "/src/client/img/SGammo2.png";
Img.pickupMG = new Image();
Img.pickupMG.src = "/src/client/img/MGammo.png";
Img.pickupMG2 = new Image();
Img.pickupMG2.src = "/src/client/img/MGammo2.png";
Img.pickupBA = new Image();
Img.pickupBA.src = "/src/client/img/BAammo.png";
Img.pickupBA2 = new Image();
Img.pickupBA2.src = "/src/client/img/BAammo2.png";
Img.pickupLaser = new Image();
Img.pickupLaser.src = "/src/client/img/LaserAmmo.png";
Img.pickupLaser2 = new Image();
Img.pickupLaser2.src = "/src/client/img/LaserAmmo2.png";
Img.pickupMD = new Image();
Img.pickupMD.src = "/src/client/img/MDammo.png";
Img.pickupMD2 = new Image();
Img.pickupMD2.src = "/src/client/img/MDammo2.png";

Img.pressShiftInstructions = new Image();
Img.pressShiftInstructions.src = "/src/client/img/pressShiftInstructions.png";
Img.wasdInstructions = new Image();
Img.wasdInstructions.src = "/src/client/img/wasdInstructions.png";
Img.arrowInstructions = new Image();
Img.arrowInstructions.src = "/src/client/img/arrowInstructions.png";
Img.cloakInstructions = new Image();
Img.cloakInstructions.src = "/src/client/img/cloakInstructions.png";
Img.boostInstructions = new Image();
Img.boostInstructions.src = "/src/client/img/boostInstructions.png";
Img.teamInstructions = new Image();
Img.teamInstructions.src = "/src/client/img/teamInstructions.png";



Img.blackPlayerLegs = new Image();
Img.blackPlayerLegs.src = "/src/client/img/blackPlayerLegs.png";
Img.whitePlayerLegs = new Image();
Img.whitePlayerLegs.src = "/src/client/img/whitePlayerLegs.png";
Img.blackPlayerLegs2 = new Image();
Img.blackPlayerLegs2.src = "/src/client/img/blackPlayerLegs2.png";
Img.whitePlayerLegs2 = new Image();
Img.whitePlayerLegs2.src = "/src/client/img/whitePlayerLegs2.png";
	
Img.blood1 = new Image();
Img.blood1.src = "/src/client/img/blood1.png";
Img.blood2 = new Image();
Img.blood2.src = "/src/client/img/blood2.png";
Img.blood3 = new Image();
Img.blood3.src = "/src/client/img/blood3.png";
Img.blood4 = new Image();
Img.blood4.src = "/src/client/img/blood4.png";

Img.bodyBlack = new Image();
Img.bodyBlack.src = "/src/client/img/body-black.png";
Img.bodyWhite = new Image();
Img.bodyWhite.src = "/src/client/img/body-white.png";
Img.bodyBlackWall1 = new Image();
Img.bodyBlackWall1.src = "/src/client/img/body-black-wall1.png";
Img.bodyWhiteWall1 = new Image();
Img.bodyWhiteWall1.src = "/src/client/img/body-white-wall1.png";
Img.bloodPool = new Image();
Img.bloodPool.src = "/src/client/img/blood-pool.png";

Img.blackThugTorso = new Image();
Img.blackThugTorso.src = "/src/client/img/blackThugTorso.png";
Img.blackThugLegs = new Image();
Img.blackThugLegs.src = "/src/client/img/blackThugLegs.png";
Img.blackThugLegs2 = new Image();
Img.blackThugLegs2.src = "/src/client/img/blackThugLegs2.png";
Img.whiteThugTorso = new Image();
Img.whiteThugTorso.src = "/src/client/img/whiteThugTorso.png";
Img.whiteThugLegs = new Image();
Img.whiteThugLegs.src = "/src/client/img/whiteThugLegs.png";
Img.whiteThugLegs2 = new Image();
Img.whiteThugLegs2.src = "/src/client/img/whiteThugLegs2.png";

Img.bagRed = new Image();
Img.bagRed.src = "/src/client/img/bag-red.png";
Img.bagRedStrap = new Image();
Img.bagRedStrap.src = "/src/client/img/bag-black-strap.png";
Img.bagBlue = new Image();
Img.bagBlue.src = "/src/client/img/bag-blue.png";
Img.bagBlueStrap = new Image();
Img.bagBlueStrap.src = "/src/client/img/bag-black-strap.png";
Img.bagMissing = new Image();
Img.bagMissing.src = "/src/client/img/bag-missing.png";

Img.bmDoorWhite = new Image();
Img.bmDoorWhite.src = "/src/client/img/black-market-white.png";
Img.bmDoorBlack = new Image();
Img.bmDoorBlack.src = "/src/client/img/black-market-black.png";
Img.shopEB2 = new Image();
Img.shopEB2.src = "/src/client/img/shop-eb2.png";
Img.shopBA2 = new Image();
Img.shopBA2.src = "/src/client/img/shop-ba2.png";
Img.shopDP2 = new Image();
Img.shopDP2.src = "/src/client/img/shop-dp2.png";
Img.shopSG2 = new Image();
Img.shopSG2.src = "/src/client/img/shop-sg2.png";
Img.shopMG2 = new Image();
Img.shopMG2.src = "/src/client/img/shop-mg2.png";
Img.shopLZ2 = new Image();
Img.shopLZ2.src = "/src/client/img/shop-lz2.png";
Img.downArrow = new Image();
Img.downArrow.src = "/src/client/img/down-arrow-small.png";
Img.rightArrow = new Image();
Img.rightArrow.src = "/src/client/img/right-arrow-small.png";
Img.leftArrow = new Image();
Img.leftArrow.src = "/src/client/img/left-arrow-small.png";
Img.upArrow = new Image();
Img.upArrow.src = "/src/client/img/up-arrow-small.png";
Img.shopInventory = new Image();
Img.shopInventory.src = "/src/client/img/shop-inventory.png";
Img.spy = new Image();
Img.spy.src = "/src/client/img/spy-new.png";

Img.black50 = new Image();
Img.black50.src = "/src/client/img/black50.png";
Img.white = new Image();
Img.white.src = "/src/client/img/white.png";
Img.red = new Image();
Img.red.src = "/src/client/img/red.png";
Img.energyRed = new Image();
Img.energyRed.src = "/src/client/img/energy-red.png";

Img.bronze1 = new Image();
Img.bronze1.src = "/src/client/img/ranks/full-size/bronze1.png";
Img.bronze2 = new Image();
Img.bronze2.src = "/src/client/img/ranks/full-size/bronze2.png";
Img.bronze3 = new Image();
Img.bronze3.src = "/src/client/img/ranks/full-size/bronze3.png";
Img.silver1 = new Image();
Img.silver1.src = "/src/client/img/ranks/full-size/silver1.png";
Img.silver2 = new Image();
Img.silver2.src = "/src/client/img/ranks/full-size/silver2.png";
Img.silver3 = new Image();
Img.silver3.src = "/src/client/img/ranks/full-size/silver3.png";
Img.gold1 = new Image();
Img.gold1.src = "/src/client/img/ranks/full-size/gold1.png";
Img.gold2 = new Image();
Img.gold2.src = "/src/client/img/ranks/full-size/gold2.png";
Img.gold3 = new Image();
Img.gold3.src = "/src/client/img/ranks/full-size/gold3.png";
Img.diamond = new Image();
Img.diamond.src = "/src/client/img/ranks/full-size/diamond.png";
Img.diamond2 = new Image();
Img.diamond2.src = "/src/client/img/ranks/full-size/diamond2.png";


//----------------------------- Final image to load--------------------------------
Img.bloodyBorder = new Image();
Img.bloodyBorder.src = "/src/client/img/bloody-border.png";
//-----------------------------Loading Sounds-------------------------------
var mute = false;

var sfx = {};
var sfxPistol = new Howl({src: ['/src/client/sfx/pistol.mp3']});
var sfxPistolMine = new Howl({src: ['/src/client/sfx/pistol.mp3']});
var sfxMG = new Howl({src: ['/src/client/sfx/mgShot.mp3']});
var sfxMGMine = new Howl({src: ['/src/client/sfx/mgShot.mp3']});
var sfxDP = new Howl({src: ['/src/client/sfx/double_pistolsLoud.mp3']});
var sfxDPMine = new Howl({src: ['/src/client/sfx/double_pistolsLoud.mp3']});
var sfxSG = new Howl({src: ['/src/client/sfx/shotgun.mp3']});
var sfxCapture = new Howl({src: ['/src/client/sfx/capture1.mp3']});
var sfxHit1 = new Howl({src: ['/src/client/sfx/hit1.mp3']});
//sfxHit1.volume(.5);
var sfxHit2 = new Howl({src: ['/src/client/sfx/hit2.mp3']});
var sfxKill = new Howl({src: ['/src/client/sfx/kill.mp3']});
sfxKill.volume(.8);
var sfxStealGood = new Howl({src: ['/src/client/sfx/drumroll.mp3']});
var sfxStealBad = new Howl({src: ['/src/client/sfx/steal2.mp3']});
sfxStealGood.volume(0.75);
sfxStealBad.volume(0.75);
var sfxBagGrab = new Howl({src: ['/src/client/sfx/bagGrab.mp3']});
sfxBagGrab.volume(.6);
var sfxTimeWarning = new Howl({src: ['/src/client/sfx/30sec.mp3']});
sfxTimeWarning.volume(.7);
var sfxSuddenDeath = new Howl({src: ['/src/client/sfx/suddenDeath.mp3']});

var sfxPistolReload = new Howl({src: ['/src/client/sfx/pistolReload.mp3']});
var sfxDPReload = new Howl({src: ['/src/client/sfx/DPReload.mp3']});
var sfxMGReload = new Howl({src: ['/src/client/sfx/MGReload.mp3']});
var sfxSGReload1 = new Howl({src: ['/src/client/sfx/SGReload3.mp3']});
var sfxSGReload2 = new Howl({src: ['/src/client/sfx/SGReload4.mp3']});
var sfxSGReload3 = new Howl({src: ['/src/client/sfx/SGReload2.mp3']});
var sfxSGReload4 = new Howl({src: ['/src/client/sfx/SGReload1.mp3']});

var sfxPistolEquip = new Howl({src: ['/src/client/sfx/Pistolequip2.mp3']});
var sfxDPEquip = new Howl({src: ['/src/client/sfx/dpPick.mp3']});
var sfxMGEquip = new Howl({src: ['/src/client/sfx/MGequip.mp3']});
var sfxSGEquip = new Howl({src: ['/src/client/sfx/SGequipLoud.mp3']});
var sfxLaserEquip = new Howl({src: ['/src/client/sfx/laserEquip.mp3']});
var sfxLaserCharging = new Howl({src: ['/src/client/sfx/laserChargingFast.mp3']});
sfxLaserCharging.volume(0.6);
var sfxLaserDischarge = new Howl({src: ['/src/client/sfx/laserDischarge.mp3']});

var sfxClick = new Howl({src: ['/src/client/sfx/click.mp3']});
sfxClick.volume(0.6);
var sfxHealthPackGrab = new Howl({src: ['/src/client/sfx/healthPackGrab.mp3']});
sfxHealthPackGrab.volume(.5);
var sfxWeaponDrop = new Howl({src: ['/src/client/sfx/weaponDrop2.mp3']});
sfxWeaponDrop.volume(.3);

var sfxPurchase = new Howl({src: ['/src/client/sfx/purchase.mp3']});
var sfxError = new Howl({src: ['/src/client/sfx/error2.mp3']});
var sfxMenuMove = new Howl({src: ['/src/client/sfx/comp-beep.wav']});
sfxMenuMove.volume(.5);

var sfxWhoosh = new Howl({src: ['/src/client/sfx/whoosh.mp3']});
sfxWhoosh.volume(.25);
var sfxPunch = new Howl({src: ['/src/client/sfx/punch.mp3']});
var sfxWarning = new Howl({src: ['/src/client/sfx/warning.mp3']});
sfxWarning.on('fade', function(){
	sfxWarning.stop();
});
var sfxWarning2 = new Howl({src: ['/src/client/sfx/warning2.mp3']});
sfxWarning2.on('fade', function(){
	sfxWarning2.stop();
});
var sfxCharge = new Howl({src: ['/src/client/sfx/charging3.mp3']});
//sfxCharge.volume(.9);
sfxCharge.on('fade', function(){
	sfxCharge.stop();
});
var sfxDecharge = new Howl({src: ['/src/client/sfx/decharge3.mp3']});
//sfxDecharge.volume(.6);
var sfxBoost = new Howl({src: ['/src/client/sfx/boost5.mp3']});
var sfxBoostRainbow = new Howl({src: ['/src/client/sfx/boostRainbow.mp3']});
var sfxBoostBlast = new Howl({src: ['/src/client/sfx/boostBlast.mp3']});
var sfxBoostLightning = new Howl({src: ['/src/client/sfx/boostLightning.mp3']});
var sfxBoostIon = new Howl({src: ['/src/client/sfx/boostIon.mp3']});
var sfxBoostSlime = new Howl({src: ['/src/client/sfx/boostSlime.mp3']});
var sfxBoostEmpty = new Howl({src: ['/src/client/sfx/boostEmpty.mp3']});
sfxBoostEmpty.volume(1);
var sfxCloak = new Howl({src: ['/src/client/sfx/cloak2.mp3']});
sfxCloak.volume(.6);
var sfxWarp = new Howl({src: ['/src/client/sfx/warp.mp3']});

var sfxNextGameTimer = new Howl({src: ['/src/client/sfx/haloStartBeeps.mp3']});
var sfxLevelUp = new Howl({src: ['/src/client/sfx/gsLevelUp.mp3']});
sfxLevelUp.volume(.7);

var sfxDefeatMusic = new Howl({src: ['/src/client/sfx/music/theme-sad-short.mp3']});
var sfxVictoryMusic = new Howl({src: ['/src/client/sfx/music/theme-victory-short.mp3']});
sfxDefeatMusic.volume(.3);
sfxVictoryMusic.volume(.3);
var sfxProgressBar = new Howl({src: ['/src/client/sfx/progressBar.mp3']});
sfxProgressBar.volume(.18);
var sfxProgressBarReverse = new Howl({src: ['/src/client/sfx/progressBarReverse.mp3']});
sfxProgressBarReverse.volume(.18);


//-----------------------------PLAYER INITIALIZATION-------------------------------
var numPlayers = 0;
var myPlayer = {
	id:0,
	name:"",
	x:mapWidth/2,
	y:mapHeight/2,
	cash:1,
	kills:0,
	deaths:0,
	steals:0,
	returns:0,
	captures:0,
	reloading:0,
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

//new player
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
		healthFlashTimer:100,
		customizations: defaultCustomizations,
		settings: false,
		images:{ 1:{}, 2:{} }
	}
	Player.list[id] = self;
}
Player.list = [];
var orderedPlayerList = [];

function updateOrderedPlayerList(){
	var blackPlayers = [];
	var whitePlayers = [];		
	for (var a in Player.list){
		if (Player.list[a].team == 1){
			whitePlayers.push(Player.list[a]);
		}
		else if (Player.list[a].team == 2){
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
		team:1,
		x:0,
		y:0,	
		health:100,
		legHeight:47,
		legSwingForward:true,
		rotation:0,
		height:94,
		width:94,
		moving:5,
		target:{x:0,y:0},
		attacking:0
	}

	self.engine = function (){
		if (self.attacking > 0){
			self.attacking--;
		}
		self.swingLegs();
		if (self.target)
			self.rotation = Math.atan2((self.y - self.target.y),(self.x - self.target.x)) + 4.71239;

	}

	self.attack = function(){
		self.legHeight = -94;
	}

	self.swingLegs = function(){
		if (self.attacking > 0){
			self.legHeight = -94;
		}
		else if ((self.moving > 0 || gametype == "horde") && self.attacking <= 0){
			if (self.legSwingForward == true){
				self.legHeight += 7 * 1.3;
				if (self.legHeight > 94){
					self.legSwingForward = false;
				}
			}
			else if (self.legSwingForward == false){
				self.legHeight -= 7 * 1.3;
				if (self.legHeight < -94){
					self.legSwingForward = true;
				}
			}
		}
		else if (self.moving <= 0 && self.attacking <= 0){
			self.standThereAwkwardly();
		}
	}

	self.standThereAwkwardly = function(){
		if (self.legHeight != 45){
			self.legHeight = 45;
		}
	}





	Thug.list[id] = self;
}
Thug.list = {};

socket.on('removeThug', function(id){
	if (id == "all"){
		Thug.list = [];
	}
	else if (Thug.list[id]){
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
	log("signInResponse result: ");
	logg(data);

	if(data.success){
		///////////////////////// INITIALIZE ////////////////////////		
		log("Sign into server successful - INITIALIZING GRAPHICS");
		if (getCookie("lowGraphics") == "true"){
			log("Setting low graphics to true from cookie");
			reallyLowGraphicsMode = true;
		} else {
			reallyLowGraphicsMode = false;
		}

		myPlayer.id = data.id;
		mapWidth = data.mapWidth;
		mapHeight = data.mapHeight;
		showCanvas();
		whiteScore = data.whiteScore;
		blackScore = data.blackScore;	
		logg("ID: " + myPlayer.id);
		//mute = false;
	}
	else {
		alert(data.message);
	}
});

socket.on('killScore', function(team, dataWhiteScore, dataBlackScore){
	whiteScore = dataWhiteScore;
	blackScore = dataBlackScore;
});

socket.on('score', function(team, dataWhiteCaptures, dataBlackCaptures){
	if (gametype == "elim"){
		roundOver = true;
		roundVictor = team;
	}


	whiteScore = dataWhiteCaptures;
	blackScore = dataBlackCaptures;
	if (team == 1){
		whiteScoreHeight = 266;
	}
	else if (team == 2){
		blackScoreHeight = 266;
	}
	else {
		blackScoreHeight = 266;
		whiteScoreHeight = 266;
	}
	if (!mute)
		sfxCapture.play();
});

socket.on('gameStart', function(){ //startGame restartGame
	gameOver = false;
	timeInGame = 0;
	if (gametype == "elim"){
		roundOver = false;
		shop.active = false;
	}
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
	Body.list = [];
	drawMapElementsOnMapCanvas();
	drawBlocksOnBlockCanvas();
	resetPostGameProgressVars();
	clearChat();


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
chatText.innerHTML = '<div class="chatElement" style="font-weight:600">Welcome to SocketShot!</div>';
//chatText.innerHTML = '<div class="chatElement" style="font-weight:600">Welcome! Teams will be auto balanced next game.</div>';

socket.on('addToChat', function(data, playerId){ //Player chat
var color = "#FFFFFF";
	if (Player.list[playerId]){
		if (Player.list[playerId].team == 1){
			color = "#e09f9f";
		}
		else if (Player.list[playerId].team == 2){
			color = "#93b3d8";
		}
	}
	var bold = false;
	if (playerId == 0)
		bold = true;
		
	addToChat(data, color, bold);
});

socket.on('addMessageToChat', function(text){ //Server message
	addToChat(text, "#FFFFFF");
});

var maxChatMessages = 9;
function addToChat(data, color, bold = false){
	var nodes = chatText.childNodes.length;
	for (var i=0; i<nodes - (maxChatMessages - 1); i++){
		chatText.childNodes[i].remove();
	}

	var boldStyle = "";
	if (bold)
		boldStyle = " font-weight:600;";

	chatText.innerHTML = chatText.innerHTML + '<div class="chatElement" style="color:' + color + ';' + boldStyle + '">' + data + '</div>';
	chatStale = 0;			
}

function clearChat(){
	var chatLength = chatText.childNodes.length;
	for (var i=chatLength-1; i>=0; i--){
		chatText.childNodes[i].remove();
	}
}

socket.on('evalAnswer', function(data){
	if (data)
		logg(data);	
});

chatForm.onsubmit = function(e){
	e.preventDefault();
}

socket.on('sfx', function(sfx){
	sfxPlay(sfx);
});
function sfxPlay(sfx){
	if (!mute)
		eval(sfx + ".play();");	
}

socket.on('sfxStop', function(sfx){
	sfxStop(sfx);
});
function sfxStop(sfx){
	if (!mute)
		eval(sfx + ".stop();");	
}

socket.on('sfxRanged', function(sfx, x, y){
	sfxRanged(sfx, x, y);
});

function sfxRanged(sfx, x, y){
	var dx1 = myPlayer.x - x;
	var dy1 = myPlayer.y - y;
	var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
	var vol = (Math.round((1 - (dist1 / 1000)) * 100)/100) - .3;
	if (vol > 1)
		vol = 1;
	else if (vol < 0 && vol >= -.1)
		vol = 0.01;
	if (vol < -.1 || mute)
		return;

	eval(sfx + ".volume(" + vol + ");");	
	eval(sfx + ".play();");	
}

//----------------Player Functionality----------------
socket.on('sendPlayerNameToClient',function(data){
	myPlayer.name = data;
	logg("My name is " + myPlayer.name + ". Id: " + myPlayer.id);
});

function getRotation(direction){
	return (direction-1) * (45*Math.PI/180);
}
////////////////////////////////////////////////////////////////////////////////////

var clientInitialized = false;
socket.on('update', function(playerDataPack, thugDataPack, pickupDataPack, notificationPack, updateEffectPack, miscPack){
	if (clientInitialized){
		updateFunction(playerDataPack, thugDataPack, pickupDataPack, notificationPack, updateEffectPack, miscPack);
	}
});

function updateFunction(playerDataPack, thugDataPack, pickupDataPack, notificationPack, updateEffectPack, miscPack){
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

		var warningVol = 0.15
		//Play Charging/Decharge sounds
		if (playerDataPack[i].id == myPlayer.id && !mute){
			if (playerDataPack[i].property == "energy" && playerDataPack[i].value == 0){
				sfxDecharge.play();
				sfxCharge.fade(.3, 0, 100);

				sfxWarning.fade(warningVol, 0, 100);
				sfxWarning2.volume(warningVol);
				sfxWarning2.play();
			}
			else if (playerDataPack[i].property == "energy" && playerDataPack[i].value > Player.list[playerDataPack[i].id].energy && !sfxCharge.playing()){
				sfxCharge.volume(.3);
				sfxCharge.play();
				sfxWarning2.fade(warningVol, 0, 100);
			}
			else if (playerDataPack[i].property == "energy" && (playerDataPack[i].value % 100 == 0 || playerDataPack[i].value == 1 || playerDataPack[i].value < Player.list[playerDataPack[i].id].energy) && sfxCharge.playing()){
				sfxCharge.fade(.3, 0, 100);
			}

			//Using Energy flag
			if (playerDataPack[i].property == "energy" && playerDataPack[i].id == myPlayer.id && playerDataPack[i].value < myPlayer.energy){
				usingEnergy = 20;
			}
			
			//Warning sounds			
			if (playerDataPack[i].property == "energy" && playerDataPack[i].value <= 25 && playerDataPack[i].value < Player.list[playerDataPack[i].id].energy && !sfxWarning.playing()){
				sfxWarning.volume(warningVol);
				sfxWarning.play();
			}
			else if (playerDataPack[i].property == "energy" && playerDataPack[i].value > 25 && sfxWarning.playing()){
				sfxWarning.fade(warningVol, 0, 100);
				//sfxWarning.stop();
			}
		}
								
		//Add blue border for armor
		if (playerDataPack[i].property == "health" && playerDataPack[i].value == 175){
			determineBorderStyle();
		}

		//Laser charging sounds
		if (playerDataPack[i].property == "chargingLaser"){
			if (playerDataPack[i].id == myPlayer.id){ //sfx only for myPlayer charging laser
				if (playerDataPack[i].value == 1 && !Player.list[playerDataPack[i].id].chargingLaser){
					sfxPlay("sfxLaserCharging");
				}
				else if (playerDataPack[i].value == 0 && Player.list[playerDataPack[i].id].chargingLaser){
					sfxStop("sfxLaserCharging");
				}
			}
			if (playerDataPack[i].value == 0){
				Player.list[playerDataPack[i].id].laserChargeGraphic = 0;
			}
			else if (playerDataPack[i].value > 1){
				Player.list[playerDataPack[i].id].laserChargeGraphic = laserMaxCharge - 40;
			}
		}
	
		//Update player list. This has to be last because of previous code comparisons between Pack and player.list[i] values
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		if (!Player.list[playerDataPack[i].id]){
			Player(playerDataPack[i].id);
		}
		Player.list[playerDataPack[i].id][playerDataPack[i].property] = playerDataPack[i].value;
		if (playerDataPack[i].id == myPlayer.id)
			myPlayer[playerDataPack[i].property] = playerDataPack[i].value;

		//Draw customizations
		if (playerDataPack[i].property == "customizations"){	
			drawCustomizations(Player.list[playerDataPack[i].id].customizations, playerDataPack[i].id, async function(playerAnimations, id){
				if (Player.list[id]){
					Player.list[id].images = playerAnimations;
					for (var t in teams){
						getUserIconImg(Player.list[id].customizations[teams[t]].icon, teams[t], function(iconImg, team){
							Player.list[id].images[team].icon = iconImg;
						});
					}
				}
			});
		}
////////////Put future client updates after this line /////////////////
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
			var vol = (Math.round((1 - (dist1 / 1000)) * 100)/100) - .6; // -.x is the Volume offset
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
			else if (playerDataPack[i].value == 5){
				sfxLaserEquip.volume(vol);
				sfxLaserEquip.play();
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
			Thug(thugDataPack[i].id);
			Thug.list[thugDataPack[i].id][thugDataPack[i].property] = thugDataPack[i].value;
		}
		if (thugDataPack.property == "x" || thugDataPack.property == "y"){
			Thug.list[thugDataPack[i].id].moving == 5;
		}
	}	
	
	for (var i = 0; i < notificationPack.length; i++) {

		var noteText = notificationPack[i].text;
		var notePlayerId = notificationPack[i].playerId;
		if (!Player.list[notePlayerId]){
			continue;
		}
		
		var notification = Notification(noteText, notePlayerId);
		if (noteText.includes("Stolen") && !mute){
			if (Player.list[notePlayerId].team == myPlayer.team || myPlayer.team == 0){
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
		var id = updateEffectPack[i].playerId;

		if (updateEffectPack[i].type == 3){//boost
			if (!Player.list[id])
				continue;

			var team = Player.list[id].team;
			if (!Player.list[id].customizations[team])
				continue;
				
			BoostBlast(id);			
			if (!mute){
				var dx1 = myPlayer.x - Player.list[id].x;
				var dy1 = myPlayer.y - Player.list[id].y;
				var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
				var vol = (Math.round((1 - (dist1 / 1000)) * 100)/100) - .3; // -.x is the Volume offset
				if (vol > 1)
					vol = 1;
				else if (vol < 0 && vol >= -.1)
					vol = 0.01;
				if (vol < -.1 || mute)
					vol = 0;

				var playerBoostSfx = sfxBoost;
				if (!Player.list[id])
					continue;

				if (Player.list[id].customizations[team].boost == "hearts2" || Player.list[id].customizations[team].boost == "rainbow"){
					playerBoostSfx = sfxBoostRainbow;
				}
				else if (Player.list[id].customizations[team].boost.indexOf("streaks") > -1){
					playerBoostSfx = sfxBoostIon;
				}
				else if (Player.list[id].customizations[team].boost == "blast"){
					playerBoostSfx = sfxBoostBlast;
				}
				else if (Player.list[id].customizations[team].boost == "lightning"){
					playerBoostSfx = sfxBoostLightning;
				}
				else if (Player.list[id].customizations[team].boost.indexOf("slime") > -1){
					playerBoostSfx = sfxBoostSlime;
				}
				playerBoostSfx.volume(vol);
				playerBoostSfx.play();
			}
		} 				
		else if (updateEffectPack[i].type == 4){ //smash
			if (!Player.list[id])
				continue;
		//Play punch sfx if boosting gets halted (contact)
			var dx1 = myPlayer.x - Player.list[id].x;
			var dy1 = myPlayer.y - Player.list[id].y;
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
			Smash(Player.list[id].x, Player.list[id].y);	
		}
		else if (updateEffectPack[i].type == 5){ //body
			createBody(updateEffectPack[i].targetX, updateEffectPack[i].targetY, updateEffectPack[i].pushSpeed, updateEffectPack[i].shootingDir, id);
		}
		else if (updateEffectPack[i].type == 7){ //chat
			if (!Player.list[id])
				continue;
			Player.list[id].chat = updateEffectPack[i].text;
			Player.list[id].chatDecay = 300;
		} 				
	}
	if (miscPack.roundOver === true){
		shop.active = true;
		roundOver = true;
	}
	else if (miscPack.roundOver === false){
		myPlayer.eliminationSpectate = false;
		myPlayer.willHaveBA = false;
		shop.active = false;
		setZoom(defaultZoom);
		roundOver = false;
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
		gameOver = miscPack.gameOver.gameIsOver;
		if (miscPack.gameOver.gameIsOver == true){
			endGame();
			showUnset("voteMenu");

			if (miscPack.gameOver.voteMap)
				showUnset("voteMapTable");
			else
				hide("voteMapTable");
			if (miscPack.gameOver.voteGametype)
				showUnset("voteGametypeTable");
			else {
				hide("voteGametypeTable");
			}
			if (miscPack.gameOver.voteRebalance)
				showUnset("voteRebalanceTable");
			else {
				hide("voteRebalanceTable");
			}

			document.getElementById("voteCTF").disabled = false;
			document.getElementById("voteDeathmatch").disabled = false;	
			document.getElementById("voteElimination").disabled = false;	
			document.getElementById("voteLongest").disabled = false;
			document.getElementById("voteCrik").disabled = false;
			document.getElementById("voteThePit").disabled = false;				
			document.getElementById("voteRebalanceYes").disabled = false;				
			document.getElementById("voteRebalanceNo").disabled = false;				
		}
		else if (miscPack.gameOver.gameIsOver == false){
			document.getElementById("voteMenu").style.display = 'none';
		}
		if (debugUpdates){
			logg("GameOver:" + miscPack.gameOver.gameIsOver);
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
		customServer = miscPack.variant.customServer;
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
	if (miscPack.hordeKills === 0 || miscPack.hordeKills){
		hordeKills = miscPack.hordeKills;
	}
	if (miscPack.hordeGlobalBestNames){
		hordeGlobalBestNames = miscPack.hordeGlobalBestNames;
	}
	if (miscPack.hordeGlobalBest){
		hordeGlobalBest = miscPack.hordeGlobalBest;
	}
	if (miscPack.playerDied){
		playerDied = miscPack.playerDied;
		playerDiedTimer = playerDiedTimerMax;
	}

	drawEverything();
}
var playerDied = "";
var playerDiedTimer = 0;
var playerDiedTimerMax = 300;

//Goes to only a single player init initialize 
socket.on('sendFullGameStatus',function(playerPack, thugPack, pickupPack, blockPack, miscPack){
	log("FULL GAME STATUS RECIEVED");
	sendFullGameStatusFunction(playerPack, thugPack, pickupPack, blockPack, miscPack);
	clientInitialized = true;
});
var pickupCount = 0;
function sendFullGameStatusFunction(playerPack, thugPack, pickupPack, blockPack, miscPack){
	Player.list = [];
	for (var i = 0; i < playerPack.length; i++) {
		//Update myPlayer
		if (playerPack[i].id == myPlayer.id){
			if (playerPack[i].settings){
				playerPack[i].settings.keybindings = hydrateKeybindingSettings(playerPack[i].settings.keybindings);
			}
			myPlayer = playerPack[i];
			myPlayer.reloading = 0;
		}
		if (Player.list[playerPack[i].id]){ //It's fine that this overwrites client-side values like legSwing since this only happens on respawn or gamestart where those values should be reset anyway
			Player.list[playerPack[i].id] = playerPack[i];
		}
		else {
			Player(playerPack[i].id);
			Player.list[playerPack[i].id] = playerPack[i];
		}

		drawCustomizations(Player.list[playerPack[i].id].customizations, playerPack[i].id, function(playerAnimations, id = 0){
			if (Player.list[id]){
				Player.list[id].images = playerAnimations;
				for (var t in teams){
					getUserIconImg(Player.list[id].customizations[teams[t]].icon, teams[t], function(iconImg, team){
						Player.list[id].images[team].icon = iconImg;
					});
				}
			}
		});
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
	pickupCount = 0;
	for (var p in Pickup.list){
		pickupCount++;
	}
	for (var i = 0; i < pickupPack.length; i++) { 
		if (typeof pickupPack[i] == "string"){
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
		customServer = miscPack.variant.customServer;
	}
	gameOver = miscPack.gameOver.gameIsOver;
	pregame = miscPack.pregame;
	pregameIsHorde = miscPack.pregameIsHorde;
	if (miscPack.mapWidth){
		mapWidth = miscPack.mapWidth;
	}
	if (miscPack.mapHeight){
		mapHeight = miscPack.mapHeight;
	}

	if (miscPack.shopEnabled){
		shopEnabled = miscPack.shopEnabled;
	}
	if (miscPack.hordeKills){
		hordeKills = miscPack.hordeKills;
	}
	
	if (numPlayers != miscPack.numPlayers) {
		logg(miscPack.numPlayers + ' players here.');			
		numPlayers = miscPack.numPlayers;
	}	
	if (miscPack.hordeGlobalBestNames){
		hordeGlobalBestNames = miscPack.hordeGlobalBestNames;
	}
	if (miscPack.hordeGlobalBest){
		hordeGlobalBest = miscPack.hordeGlobalBest;
	}
	logg("Server URL: " + miscPack.ip+":"+miscPack.port);
	
	BoostBlast.list = [];	
	if (Player.list[myPlayer.id])
		logg("myPlayer:");

	log(Player.list[myPlayer.id]);
	drawMapElementsOnMapCanvas();
	drawBlocksOnBlockCanvas();
}

socket.on('showShop', function(){
	//Elimination mode Show Shop on player death, or spwan in middle of round
	console.log("SHOP");
	myPlayer.eliminationSpectate = true;
	shop.active = true;
});

function endGame(){
	shop.active = false;
	if (!mute){
		sfxStealGood.play();		
		//Conditional win sfx
		if ((myPlayer.team == 1 && whiteScore > blackScore) || (myPlayer.team == 2 && blackScore > whiteScore)){
			if (!mute){
				sfxVictoryMusic.play();
			}
		}
		else if(myPlayer.team != 0){
			if (!mute){
				sfxDefeatMusic.play();
			}
		}
	}	
}

function calculateShopMechanics(){
	if (shopEnabled){

		// if (myPlayer.team == 1 && myPlayer.pressingA && myPlayer.x <= 0 && myPlayer.y <= 235 && shop.active == false && !gameOver){
		// 	if (!myPlayer.pressingS && !myPlayer.pressingD && !myPlayer.pressingW && !myPlayer.pressingUp && !myPlayer.pressingRight && !myPlayer.pressingDown && !myPlayer.pressingLeft){
		// 		socket.emit('keyPress',{inputId:65,state:false});
		// 		socket.emit('keyPress',{inputId:83,state:false});
		// 		socket.emit('keyPress',{inputId:87,state:false});

		// 		shop.active = true;
		// 		shop.uniqueText = "Welcome to the Black Market!";
		// 		shop.uniqueTextTimer = 60;
		// 	}
		// }
		// if (myPlayer.team == 2 && myPlayer.pressingD && myPlayer.x >= mapWidth && myPlayer.y >= mapHeight - 235 && shop.active == false && !gameOver){
		// 	if (!myPlayer.pressingS && !myPlayer.pressingA && !myPlayer.pressingW && !myPlayer.pressingUp && !myPlayer.pressingRight && !myPlayer.pressingDown && !myPlayer.pressingLeft){
		// 		socket.emit('keyPress',{inputId:68,state:false});
		// 		socket.emit('keyPress',{inputId:83,state:false});
		// 		socket.emit('keyPress',{inputId:87,state:false});

		// 		shop.active = true;
		// 		shop.uniqueText = "Welcome to the Black Market!";
		// 		shop.uniqueTextTimer = 60;
		// 	}
		// }
		// //Failsafe in case wrongly stuck in shop
		// if (shop.active == true && myPlayer.team == 1 && (myPlayer.x > 0 || myPlayer.y > 235)){
		// 	shop.active = false;
		// }
		// if (shop.active == true && myPlayer.team == 2 && (myPlayer.x < mapWidth || myPlayer.y < mapHeight - 235)){
		// 	shop.active = false;
		// }
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
	else if (shop.selection == 5 && Player.list[myPlayer.id].cash < shop.price5){
		shop.uniqueText = "Not enough cash, stranger!";
		shop.uniqueTextTimer = 90;
		if (!mute)
			sfxError.play();
		return;
	}
	else if (shop.selection == 6 && Player.list[myPlayer.id].cash < shop.price6){
		shop.uniqueText = "Not enough cash, stranger!";
		shop.uniqueTextTimer = 90;
		if (!mute)
			sfxError.play();
		return;
	}
	else if (shop.selection == 5 && (myPlayer.health >= 175 || myPlayer.willHaveBA)){
		shop.uniqueText = "You're already wearing body armor, mate.";
		shop.uniqueTextTimer = 90;
		if (!mute)
			sfxError.play();
		return;
	}
	else if (shop.selection == 6 && myPlayer.energy > 100){
		shop.uniqueText = "You're already overcharged ya greedy bast!";
		shop.uniqueTextTimer = 90;
		if (!mute)
			sfxError.play();
		return;
	}
	else if (shop.selection == 1 && myPlayer.MGAmmo >= 120){
		shop.uniqueText = "You can't carry any more!";
		shop.uniqueTextTimer = 90;
		if (!mute)
			sfxError.play();
		return;
	}
	else if (shop.selection == 2 && myPlayer.SGAmmo >= 18){
		shop.uniqueText = "You can't carry any more!";
		shop.uniqueTextTimer = 90;
		if (!mute)
			sfxError.play();
		return;
	}
	else if (shop.selection == 3 && myPlayer.DPAmmo >= 45){
		shop.uniqueText = "You can't carry any more!";
		shop.uniqueTextTimer = 90;
		if (!mute)
			sfxError.play();
		return;
	}
	else if (shop.selection == 4 && myPlayer.laserClip >= 10){
		shop.uniqueText = "You can't carry any more!";
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
	else if (shop.selection == 6 && Player.list[myPlayer.id].cash >= shop.price6){
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
	
	if ((!myPlayer.pressingShift) || myPlayer.team == 0){
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
			// centerX = targetCenterX;
			// centerY = targetCenterY;
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

function drawImageCtx(context, img, x, y, width = 0, height = 0){
	if (width == 0 || height == 0){
		context.drawImage(img, Math.round(x), Math.round(y));
	}
	else {
		context.drawImage(img, Math.round(x), Math.round(y), Math.round(width), Math.round(height));
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
	logg("Drawing map elements...");
	m_canvas.width = mapWidth * zoom;
	m_canvas.height = mapHeight * zoom;
	mCtx.clearRect(0,0,m_canvas.width,m_canvas.height); //Clears previous frame

	var tile = Img.tile;
	log("MAP: " + map);

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
			else if (map == "horde"){
				if (y >= (mapHeight - tile.height*3) * zoom && y < (mapHeight - tile.height*3) && x <= 0){
					drawImageOnMapCanvas(Img.tileWhite, x, y, tile.width * zoom, tile.height * zoom);
				}
				else if (y >= (tile.height*2) * zoom && y <= (tile.height*2) && x >= mapWidth - tile.width*3){
					drawImageOnMapCanvas(Img.tileWhite, x, y, tile.width * zoom, tile.height * zoom);
				}
				else if (x >= (mapWidth - tile.width*3) * zoom && x < (mapWidth - tile.width*3) && y >= mapHeight - tile.height*3){
					drawImageOnMapCanvas(Img.tileWhite, x, y, tile.width * zoom, tile.height * zoom);
				}
				else if (x >= (tile.width*2) * zoom && x <= (tile.width*2) && y <= 0){
					drawImageOnMapCanvas(Img.tileWhite, x, y, tile.width * zoom, tile.height * zoom);
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
		if (Player.list[myPlayer.id].team == 1){
			if (centerX - myPlayer.x * zoom - 44 * zoom > -Img.bmDoorWhite.width * zoom - drawDistance && centerX - myPlayer.x * zoom - 44 * zoom < canvasWidth + drawDistance && centerY - myPlayer.y * zoom > -Img.bmDoorWhite.height * zoom - drawDistance && centerY - myPlayer.y * zoom < canvasHeight + drawDistance){
				drawImage(Img.bmDoorWhite, centerX - myPlayer.x * zoom - 44 * zoom, centerY - myPlayer.y * zoom, Img.bmDoorWhite.width * zoom, Img.bmDoorWhite.height * zoom);
			}
		}
		else if (Player.list[myPlayer.id].team == 2){
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
			 delete Body.list.splice(b, 1);
			 continue;
		}
		
		var rotate = getRotation(body.direction);
		var img = Img.bodyWhite;

		var team = 1;
		if (Player.list[body.playerId]){
			team = Player.list[body.playerId].team;
			if (Player.list[body.playerId].images[team] && Player.list[body.playerId].images[team].body1)
				img = Player.list[body.playerId].images[team].body1;
		}
		else if (Thug.list[body.playerId]){
			team = Thug.list[body.playerId].team;
			if (team == 2)
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
					bodyOnWallLegsYOffset = 12;
					continue;
				}
			}
		}	
		
		if (centerX - Player.list[myPlayer.id].x * zoom + body.x * zoom > -75 * zoom - drawDistance && centerX - Player.list[myPlayer.id].x * zoom + body.x * zoom < 20 * zoom + canvasWidth + drawDistance && centerY - Player.list[myPlayer.id].y * zoom + body.y * zoom > -75 * zoom - drawDistance && centerY - Player.list[myPlayer.id].y * zoom + body.y * zoom < 20 * zoom + canvasHeight + drawDistance){		
            ctx.save();
			ctx.translate(centerX + body.x * zoom - myPlayer.x * zoom, centerY + body.y * zoom - myPlayer.y * zoom); //Center camera on controlled player
			ctx.rotate(rotate);
			ctx.globalAlpha = 0.8;			
				//Draw blood
				if (!reallyLowGraphicsMode)
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
                drawImage(img, -(img.width * bodyScale)/2 * zoom, -(img.height * bodyScale)/2 * zoom, img.width * zoom * bodyScale, (img.height - bodyOnWallLegsYOffset) * zoom * bodyScale);
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

			var team = 1;
			if (Player.list[body.playerId]){
				team = Player.list[body.playerId].team;
				if (team && Player.list[body.playerId].images && Player.list[body.playerId].images[team] && Player.list[body.playerId].images[team].bodyWall)
					img = Player.list[body.playerId].images[team].bodyWall;
			}
			else if (Thug.list[body.playerId]){
				team = Thug.list[body.playerId].team;
				if (team == 2)
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
	if (gametype != "ctf")
		return;
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
		if (Player.list[i].health > 0 && Player.list[i].team != 0 && Player.list[i].cloakEngaged == false){
		
			//Calculate LegSwing
			if (!Player.list[i].legHeight){
				Player.list[i].legHeight = 1;
			}
			if (Player.list[i].walkingDir != 0){
				if (Player.list[i].legSwingForward == true){
					Player.list[i].legHeight += 7 * legSwingSpeed;
					if (Player.list[i].legHeight > maxLegHeight){
						Player.list[i].legSwingForward = false;
					}
				}
				else {
					Player.list[i].legHeight -= 7 * legSwingSpeed;
					if (Player.list[i].legHeight < -maxLegHeight){
						Player.list[i].legSwingForward = true;
					}
				}
				if (Player.list[i].boosting > 0){
					Player.list[i].legHeight = maxLegHeight; 
				}
			}
			else if(Player.list[i].walkingDir == 0 || isNaN(Player.list[i].walkingDir)){ //No movement input
				Player.list[i].legHeight = 1;
				Player.list[i].legSwingForward = true;
				continue; //If not moving, don't draw legs
			}
		
			if (Player.list[i].x * zoom + 47 * zoom + drawDistance > cameraX && Player.list[i].x * zoom - 47 * zoom - drawDistance < cameraX + canvasWidth && Player.list[i].y * zoom + 47 * zoom + drawDistance > cameraY && Player.list[i].y * zoom - 47 - drawDistance < cameraY + canvasHeight){
				var legs = Player.list[i].images[1].legs;
				if (Player.list[i].team == 2){legs = Player.list[i].images[2].legs;}
				
				if (typeof legs == 'undefined'){ //Load default images if animation frames not yet drawn
					legs = Img.blackPlayerLegs;
				}
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
                ctx.translate(centerX - myPlayer.x * zoom + Player.list[i].x * zoom, centerY - myPlayer.y * zoom + Player.list[i].y  * zoom); //Center camera on controlled player

				ctx.rotate(getRotation(Player.list[i].shootingDir));
					ctx.translate(0, playerCenterOffset);
				ctx.rotate(-getRotation(Player.list[i].shootingDir));

				ctx.rotate(getRotation(Player.list[i].walkingDir));
				if (Player.list[i].legHeight >= 0){
					ctx.scale(-1, 1);
				}
					normalShadow();
					
					var weaponYoffset = 0;
					if (Player.list[i].weapon == 3){weaponYoffset = 5;}
					if (Player.list[i].shootingDir != Player.list[i].walkingDir){ //if walking dir different than shooting dir, calculate different rotation for legs than body
						drawImage(legs,(-width/2 + twistOffset) * zoom, (-Player.list[i].legHeight/2) * zoom, width * zoom, Player.list[i].legHeight * zoom);
					}
					else { 
						drawImage(legs,(-width/2 + twistOffset) * zoom, (-Player.list[i].legHeight/2) * zoom, width * zoom, Player.list[i].legHeight * zoom);
					}
                ctx.restore();
			}
		}		
	}
}

function drawBlocksOnBlockCanvas(){
	logg("Drawing block elements...");

	block_canvas.width = (mapWidth + 150) * zoom; //+150 to offset the block border which is behind 0,0
	block_canvas.height = (mapHeight + 150) * zoom;
	
	//normalShadow();
	blockCtx.clearRect(0,0,block_canvas.width,block_canvas.height); //Clears previous frame
	
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

var slowDown = 30;
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
			else if (Pickup.list[i].type == 6){
				pickupImg = Img.pickupLaser;
				pickupImg2 = Img.pickupLaser2;
			}


			if (Pickup.list[i].respawnTimer != 0){
				ctx.globalAlpha = .15; //Make transparent if pickup is queued to respawn
			}
			drawImage(pickupImg, centerX - myPlayer.x * zoom + Pickup.list[i].x * zoom, centerY - myPlayer.y * zoom + Pickup.list[i].y * zoom, Pickup.list[i].width * zoom, Pickup.list[i].height * zoom);
			
			if (Pickup.list[i].respawnTimer == 0){				
				if (pickupFlash < 0){
					ctx.globalAlpha = 0;
				}
				else {
					ctx.globalAlpha = pickupFlash.toFixed(2);
				}
				drawImage(pickupImg2, centerX - myPlayer.x * zoom + Pickup.list[i].x * zoom, centerY - myPlayer.y * zoom + Pickup.list[i].y * zoom, Pickup.list[i].width * zoom, Pickup.list[i].height * zoom);
			}
			else if (!gameOver){
				//Draw pickup respawn timer
				ctx.globalAlpha = 1;
				ctx.textAlign = "center";
				ctx.font = (18 * zoom).toString() + 'px Electrolize';
				ctx.shadowColor = "black";
				ctx.lineWidth=3;
				if (Pickup.list[i].type == 1){
					ctx.fillStyle="#FFFFFF";
					ctx.strokeStyle="#981b1e";
					ctx.shadowColor = "#981b1e";
				}
				else if (Pickup.list[i].type >= 2 && Pickup.list[i].type <= 4){
					ctx.fillStyle="#FFFFFF";
					ctx.strokeStyle="#247747";
					ctx.shadowColor = "#247747";
				}
				else if (Pickup.list[i].type == 5){
					ctx.fillStyle="#FFFFFF";
					ctx.strokeStyle="#005b98";
					ctx.shadowColor = "#005b98";
				}
				else if (Pickup.list[i].type == 6){
					ctx.fillStyle="#FFFFFF";
					ctx.strokeStyle="#3f3eaa";
					ctx.shadowColor = "#3f3eaa";
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
	if (gametype == "ctf" && !(gametype == "horde" || (pregame && pregameIsHorde))){
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
	tCtx.clearRect(0,0, torso_canvas.width, torso_canvas.height); //Clears previous frame

	for (var i in Player.list) {		
		const team = Player.list[i].team;
		if (Player.list[i].health > 0 && team != 0){
			if (Player.list[i].x * zoom + 47 * zoom + drawDistance > cameraX && Player.list[i].x * zoom - 47 * zoom - drawDistance < cameraX + canvasWidth && Player.list[i].y * zoom + 47 * zoom + drawDistance > cameraY && Player.list[i].y * zoom - 47 * zoom - drawDistance < cameraY + canvasHeight){
				normalShadow();
				var img = Player.list[i].images[team].pistol;
				if (Player.list[i].weapon == 2){
					img = Player.list[i].images[team].DP;
				}
				else if (Player.list[i].weapon == 3){
					img = Player.list[i].images[team].MG;
				}
				else if (Player.list[i].weapon == 4){
					img = Player.list[i].images[team].SG;
				}
				else if (Player.list[i].weapon == 5){
					img = Player.list[i].images[team].Laser;
				}
                ctx.save();
				ctx.translate(centerX - myPlayer.x * zoom + Player.list[i].x * zoom, centerY - myPlayer.y * zoom + Player.list[i].y * zoom); //Center camera on controlled player			
				ctx.rotate(getRotation(Player.list[i].shootingDir));
									
					//draw bag on players back, bags on backs
					if (Player.list[i].holdingBag == true){
						var bagImage = team == 1 ? Img.bagBlue : Img.bagRed;
						ctx.save();
                        ctx.translate(8 * zoom, 10 * zoom);
						ctx.rotate(315*Math.PI/180);
							drawImage(bagImage, -Img.bagBlue.width/2 * zoom, -Img.bagBlue.height/2 * zoom, Img.bagBlue.width * zoom, Img.bagBlue.height * zoom); 
                        ctx.restore();
					}
					
					////RELOADING////
					if (Player.list[i].reloading > 0){
						Player.list[i].reloading--;
						////!!! Move erything below to different function
						if (Player.list[i].weapon == 1){
							if (Player.list[i].reloading < 12)
								img = Player.list[i].images[team].pistolReloading3;
							else if (Player.list[i].reloading < 24)
								img = Player.list[i].images[team].pistolReloading4;
							else if (Player.list[i].reloading < 36)
								img = Player.list[i].images[team].pistolReloading3;
							else if (Player.list[i].reloading < 48)
								img = Player.list[i].images[team].pistolReloading2;
							else if (Player.list[i].reloading <= 60)
								img = Player.list[i].images[team].pistolReloading1;
						}
						if (Player.list[i].weapon == 2){
							if (Player.list[i].reloading < 20)
								img = Player.list[i].images[team].DPReloading3;
							else if (Player.list[i].reloading < 60)
								img = Player.list[i].images[team].DPReloading2;
							else if (Player.list[i].reloading <= 80)
								img = Player.list[i].images[team].DPReloading1;
						}
						else if (Player.list[i].weapon == 3){
							if (Player.list[i].reloading < 30)
								img = Player.list[i].images[team].MGReloading4;
							else if (Player.list[i].reloading < 37)
								img = Player.list[i].images[team].MGReloading5;
							else if (Player.list[i].reloading < 54)
								img = Player.list[i].images[team].MGReloading4;
							else if (Player.list[i].reloading < 65)
								img = Player.list[i].images[team].MGReloading1;
							else if (Player.list[i].reloading <= 76)
								img = Player.list[i].images[team].MGReloading2;
							else if (Player.list[i].reloading < 93)
								img = Player.list[i].images[team].MGReloading3;
							else if (Player.list[i].reloading < 104)
								img = Player.list[i].images[team].MGReloading2;
							else if (Player.list[i].reloading <= 115)
								img = Player.list[i].images[team].MGReloading1;
						}
						if (Player.list[i].weapon == 4){
							if (Player.list[i].reloading < 10)
								img = Player.list[i].images[team].SGReloading3;
							else if (Player.list[i].reloading < 20)
								img = Player.list[i].images[team].SGReloading2;
							else if (Player.list[i].reloading <= 30)
								img = Player.list[i].images[team].SGReloading1;
							if (Player.list[i].reloading == 20 && !mute){								
								var randy = randomInt(0,2);
								if (randy == 0)
									sfxSGReload1.play();
								else if (randy == 1)
									sfxSGReload2.play();
								else if (randy == 2)
									sfxSGReload3.play();
								else
									sfxSGReload1.play();
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
							if (Player.list[i].triggerTapLimitTimer > 30)
								img = Player.list[i].images[team].SG;
							else if (Player.list[i].triggerTapLimitTimer > 10)
								img = Player.list[i].images[team].SGCock;
							else
								img = Player.list[i].images[team].SG;
						}
					}
					


					if (typeof img == 'undefined'){ //Load default images if animation frames not yet drawn
						img = Player.list[i].team == 1 ? Img.whitePlayerPistol : Img.blackPlayerPistol;
					}

					
					ctx.globalAlpha = 1 - Player.list[i].cloak;
					//if (Player.list[i].cloak > 0){noShadow();}
					if (Player.list[i].cloak > maxCloakStrength){ctx.globalAlpha = 1 - maxCloakStrength;}
					if ((Player.list[myPlayer.id].team == 0 || Player.list[i].team == Player.list[myPlayer.id].team) && Player.list[i].cloak > (1 - maxAlliedCloakOpacity)){ctx.globalAlpha = maxAlliedCloakOpacity;}
					if (myPlayer.eliminationSpectate && Player.list[i].cloak >= 1 && Player.list[i].team != myPlayer.team){ctx.globalAlpha = 0;}
					
					var canX = -img.width/2 * zoom;
					var canY = (-img.height/2 + playerCenterOffset) * zoom;

					//Player damage flashing
					var drewPlayerBorder = false;
					if (!(Player.list[i].cloakEngaged && team != Player.list[myPlayer.id].team) && !noPlayerBorders){
						if (Player.list[i].health < 100){
							if (typeof Player.list[i].healthFlashTimer == 'undefined')
								Player.list[i].healthFlashTimer = 100;
							Player.list[i].healthFlashTimer--;
							const redFlashLength = 7;
							const whiteFlashLength = 3;
							if (Player.list[i].healthFlashTimer <= redFlashLength && Player.list[i].healthFlashTimer > whiteFlashLength && Player.list[i].health < 80){
								redShadow1();
								drawImage(img, canX, canY, img.width * zoom, img.height * zoom); //actually draw the torso Actually	
								redShadow2();
								drawImage(img, canX, canY, img.width * zoom, img.height * zoom); //actually draw the torso Actually	
								redShadow3();
								drawImage(img, canX, canY, img.width * zoom, img.height * zoom); //actually draw the torso Actually	
								redShadow4();
								drawImage(img, canX, canY, img.width * zoom, img.height * zoom); //actually draw the torso Actually				
								drewPlayerBorder = true;
							}
							else if (Player.list[i].healthFlashTimer <= whiteFlashLength && Player.list[i].health < 30){
								whiteShadow1();
								drawImage(img, canX, canY, img.width * zoom, img.height * zoom); //actually draw the torso Actually	
								whiteShadow2();
								drawImage(img, canX, canY, img.width * zoom, img.height * zoom); //actually draw the torso Actually	
								whiteShadow3();
								drawImage(img, canX, canY, img.width * zoom, img.height * zoom); //actually draw the torso Actually	
								whiteShadow4();
								drawImage(img, canX, canY, img.width * zoom, img.height * zoom); //actually draw the torso Actually				
								drewPlayerBorder = true;
							}
							if (Player.list[i].healthFlashTimer <= 0 || Player.list[i].healthFlashTimer > Player.list[i].health){
								Player.list[i].healthFlashTimer = Player.list[i].health * 0.75; 						
							}
						}
						else if (Player.list[i].health > 100){
							var borderLength = Math.ceil((Player.list[i].health - 100) / 25);
							ctx.shadowBlur = 0;
							blueShadow1(borderLength);
							drawImage(img, canX, canY, img.width * zoom, img.height * zoom); //actually draw the torso Actually	
							blueShadow2(borderLength);
							drawImage(img, canX, canY, img.width * zoom, img.height * zoom); //actually draw the torso Actually	
							blueShadow3(borderLength);
							drawImage(img, canX, canY, img.width * zoom, img.height * zoom); //actually draw the torso Actually	
							blueShadow4(borderLength);
							drawImage(img, canX, canY, img.width * zoom, img.height * zoom); //actually draw the torso Actually				
							drewPlayerBorder = true;
						}

					}

					if (!drewPlayerBorder){
						drawImage(img, canX, canY, img.width * zoom, img.height * zoom); //actually draw the torso Actually	
					}

					//-------------------------------------------------------------------------------------	
					
					ctx.globalAlpha = 1;
											
					//Strap //drawStraps
					if (Player.list[i].holdingBag == true){
						noShadow();
						if (Player.list[i].weapon == 1 || Player.list[i].weapon == 2){drawImage(Img.bagBlueStrap,-(img.width/2) * zoom,(-img.height/2 + strapOffset) * zoom, Img.bagBlueStrap.width * zoom, Img.bagBlueStrap.height * zoom);}
						else if (Player.list[i].weapon == 3){drawImage(Img.bagBlueStrap,-(img.width/2) * zoom,(-img.height/2+10) * zoom, Img.bagBlueStrap.width * zoom, Img.bagBlueStrap.height * zoom);}
					}				
				ctx.restore();	
			}
		}//End health > 0 check
	} //End player for loop
}

function getThugLength(){
	length = 0;
	for (var i in Thug.list){
		length++;
	}
	return length;
}

function drawThugs(){
	for (var i in Thug.list){
		if (Thug.list[i].health > 0){
			if (Thug.list[i].engine)
				Thug.list[i].engine();
			if (Thug.list[i].x * zoom + 47 * zoom + drawDistance > cameraX && Thug.list[i].x * zoom - 47 * zoom - drawDistance < cameraX + canvasWidth && Thug.list[i].y * zoom + 47 * zoom + drawDistance > cameraY && Thug.list[i].y * zoom - 47 * zoom - drawDistance < cameraY + canvasHeight){				
				ctx.save();
                ctx.translate(centerX + Thug.list[i].x * zoom - myPlayer.x * zoom, centerY + Thug.list[i].y * zoom - myPlayer.y * zoom); //Center camera on controlled player
				ctx.rotate(Thug.list[i].rotation);
					
					var thugImg = Img.whiteThugTorso;
					var legs = Img.whiteThugLegs;
					if (Thug.list[i].team == 2){
						legs = Img.blackThugLegs;
						if (Thug.list[i].legHeight < 0){legs = Img.blackThugLegs2;}
						thugImg = Img.blackThugTorso;
					}
					else if (Thug.list[i].team == 1){
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
		else {
			delete Thug.list[i];
		}
	}
}

function drawShots(){
	for (var s in Shot.list) {
		var shot = Shot.list[s];		
		var player = Player.list[shot.playerId];	
		if (shot.decay > 0 && player){
			ctx.save();
			ctx.translate(centerX - myPlayer.x * zoom + player.x * zoom, centerY - myPlayer.y * zoom + player.y * zoom); //Center camera on controlled player
			ctx.rotate(getRotation(shot.shootingDir));
				noShadow();
				var xOffset = shot.x;
				var yOffset = 0;
				var SGscale = .6;

				if (shot.weapon == 1){
					var calc = (-shot.distance - 40 + yOffset) * zoom;
					drawImage(Img.shot,(-4 + xOffset) * zoom, (-shot.distance - 40 + yOffset) * zoom, Img.shot.width * zoom, shot.distance * zoom);
					drawImage(Img.shotFlash, (xOffset - shot.width/2 - 2) * zoom, (yOffset - 34 - shot.height) * zoom, shot.width * zoom, shot.height * zoom);
					if (shot.spark){
						drawImage(Img.shotSpark, (-22 + xOffset) * zoom, (-shot.distance - 60) * zoom, Img.shotSpark.width * zoom, Img.shotSpark.height * zoom);
					}					
				}
				else if (shot.weapon == 2){
					drawImage(Img.shot, (-4 + xOffset) * zoom, (-shot.distance - 40) * zoom, Img.shot.width * zoom, shot.distance * zoom);
					drawImage(Img.shotFlash, (xOffset - shot.width/2 - 2) * zoom, (yOffset - 34 - shot.height) * zoom, shot.width * zoom, shot.height * zoom);
					if (shot.spark){
						drawImage(Img.shotSpark, (-22 + xOffset) * zoom, (-shot.distance - 60) * zoom, Img.shotSpark.width * zoom, Img.shotSpark.height * zoom);
					}					

					// xOffset = 22; yOffset = -2;
					// drawImage(Img.shot, (-4 + xOffset) * zoom, (-shot.distance - 40 + yOffset) * zoom, Img.shot.width * zoom, shot.distance * zoom);
					// drawImage(Img.shotFlash, (xOffset - shot.width/2 - 2) * zoom, (yOffset - 34 - shot.height) * zoom, shot.width * zoom, shot.height * zoom);
					// if (shot.spark){
					// 	drawImage(Img.shotSpark, (-22 + xOffset) * zoom, (-shot.distance - 60) * zoom, Img.shotSpark.width * zoom, Img.shotSpark.height * zoom);					
					// }
				}
				else if (player.weapon == 3){
					xOffset = 6; yOffset = -3;
					drawImage(Img.shot,(-4 + xOffset) * zoom, (-shot.distance - 40 + yOffset) * zoom, Img.shot.width * zoom, shot.distance * zoom);
					drawImage(Img.shotFlash, (xOffset - shot.width/2 - 2) * zoom, (yOffset - 34 - shot.height) * zoom, shot.width * zoom, shot.height * zoom);
					if (shot.spark){
						drawImage(Img.shotSpark, (-22 + xOffset) * zoom, (-shot.distance - 60) * zoom, Img.shotSpark.width * zoom, Img.shotSpark.height * zoom);
					}					
				}
				else if (player.weapon == 5){
					xOffset = -10; yOffset = -3;
					ctx.globalAlpha = shot.decay / 10;
					drawImage(Img.laserCanonBeam, (-4 + xOffset) * zoom, (-shot.distance - 40 + yOffset) * zoom, 50 * zoom, shot.distance * zoom);
					//drawImage(Img.shotFlash, (xOffset - shot.width/2 - 2) * zoom, (yOffset - 34 - shot.height) * zoom, shot.width * zoom, shot.height * zoom);
					if (shot.spark){
						var sparkWidth = Img.laserSpark.width * 1.5;
						drawImage(Img.laserSpark, (-sparkWidth/2 + xOffset + 20) * zoom, (-shot.distance - (sparkWidth/2) - 70) * zoom, sparkWidth * zoom, sparkWidth * zoom);
					}					
				}
				else if (player.weapon == 4){
					xOffset = -310 * SGscale; yOffset = -680 * SGscale;

					drawImage(Img.shotShotgun,(xOffset) * zoom, (yOffset) * zoom, Img.shotShotgun.width * zoom * SGscale, Img.shotShotgun.height * zoom * SGscale);
					
					shot.width *= 2;
					shot.height *= 2;
					if (shot.width < 100) shot.width = 100;
					if (shot.height < 90) shot.height = 90;
					
					drawImage(Img.shotFlash, (6 - shot.width/2 - 2) * zoom * SGscale, (-42 - shot.height) * zoom * SGscale, shot.width * zoom * SGscale, shot.height * zoom * SGscale);
				}
			//ctx.rotate(-(getRotation(player.shootingDir)));
			//ctx.translate(-(centerX - myPlayer.x * zoom + player.x * zoom), -(centerY - myPlayer.y * zoom + player.y * zoom)); //Center camera on controlled player
			ctx.restore();
		}
		shot.decay--;
		if (shot.decay <= -2){
			delete Shot.list[shot.id];
		}
		
	}
}

var laserOn = true;
const laserOffset = 2;
function drawLaser(){
	if (myPlayer.pressingShift && !shop.active && Player.list[myPlayer.id].reloading <= 0 && myPlayer.health > 0){
		if (laserOn == false){
			laserOn = true;
			return;
		}
		laserOn = false;
		
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
			if (Player.list[myPlayer.id].weapon == 1){
				drawImage(Img.redLaser,(-4 + xOffset) * zoom, (-shot.distance - 40 + yOffset) * zoom, Img.shot.width/2 * zoom, shot.distance * zoom);
			}
			else if (Player.list[myPlayer.id].weapon == 2){
				xOffset = -18 + laserOffset; yOffset = 0;
				drawImage(Img.redLaser,(-4 + xOffset) * zoom, (-shot.distance - 40 + yOffset) * zoom, Img.shot.width/2 * zoom, shot.distance * zoom);
				xOffset = 22 + laserOffset; yOffset = -1;
				drawImage(Img.redLaser, (-4 + xOffset) * zoom, (-shot.distance - 40 + yOffset) * zoom, Img.shot.width/2 * zoom, shot.distance * zoom);
			}					
			else if (Player.list[myPlayer.id].weapon == 3){
				xOffset = 6 + laserOffset; yOffset = -3;
				drawImage(Img.redLaser,(-4 + xOffset) * zoom, (-shot.distance - 40 + yOffset) * zoom, Img.shot.width/2 * zoom, shot.distance * zoom);
			}
			else if (Player.list[myPlayer.id].weapon == 4){
				xOffset = 5; yOffset = -277;
				drawImage(Img.redLaser,(xOffset) * zoom, (yOffset - 15) * zoom, Img.shot.width/2 * zoom, 250 * zoom);				
				shot.width *= 2;
				shot.height *= 2;
				if (shot.width < 100) shot.width = 100;
				if (shot.height < 90) shot.height = 90;
			}
        ctx.restore();
	}
}

function drawBlockLasers(){
	var laserCenterX = 0;
	var laserCenterY = 0;

	var startX = 0;
	var startY = 0;
	var endX = 0;
	var endY = 0;
	ctx.strokeStyle = "blue";
	ctx.lineWidth  = 1;

	for (var b in Block.list){
		for (var s = 1; s <= 4; s++){
			switch(s){
				case 1:
					laserCenterX = -cameraX + (Block.list[b].x) * zoom;
					laserCenterY = -cameraY + (Block.list[b].y) * zoom;
					break;
				case 2:
					laserCenterX = -cameraX + (Block.list[b].x + Block.list[b].width) * zoom;
					laserCenterY = -cameraY + (Block.list[b].y) * zoom;
					break;
				case 3:
					laserCenterX = -cameraX + (Block.list[b].x + Block.list[b].width) * zoom;
					laserCenterY = -cameraY + (Block.list[b].y + Block.list[b].height) * zoom;
					break;
				case 4:
					laserCenterX = -cameraX + (Block.list[b].x) * zoom;
					laserCenterY = -cameraY + (Block.list[b].y + Block.list[b].height) * zoom;
					break;
				default:
					break;
			}

			switch(myPlayer.shootingDir){
				case 1:
					if (s != 3 && s != 4) {laserCenterX = 0; laserCenterY = 0;}
					startX = laserCenterX;
					startY = 0;
					endX = laserCenterX;
					endY = canvasHeight;
					break;
				case 2:
					if (s != 1 && s != 3) {laserCenterX = 0; laserCenterY = 0;}
					startX = laserCenterX + laserCenterY;
					startY = 0;
					endX = -canvasHeight + (laserCenterX + laserCenterY);
					endY = canvasHeight;
					break;
				case 3:
					if (s != 1 && s != 4) {laserCenterX = 0; laserCenterY = 0;}
					startX = 0;
					startY = laserCenterY;
					endX = canvasWidth;
					endY = laserCenterY;
					break;
				case 4:
					if (s != 2 && s != 4) {laserCenterX = 0; laserCenterY = 0;}
					startX = laserCenterX - laserCenterY;
					startY = 0;
					endX = canvasHeight + laserCenterX - laserCenterY;
					endY = canvasHeight;
					break;
				case 5:
					if (s != 1 && s != 2) {laserCenterX = 0; laserCenterY = 0;}
					startX = laserCenterX;
					startY = 0;
					endX = laserCenterX;
					endY = canvasHeight;
					break;
				case 6:
					if (s != 1 && s != 3) {laserCenterX = 0; laserCenterY = 0;}
					startX = laserCenterX + laserCenterY;
					startY = 0;
					endX = -canvasHeight + (laserCenterX + laserCenterY);
					endY = canvasHeight;
					break;
				case 7:
					if (s != 2 && s != 3) {laserCenterX = 0; laserCenterY = 0;}
					startX = 0;
					startY = laserCenterY;
					endX = canvasWidth;
					endY = laserCenterY;
					break;
				case 8:
					if (s != 2 && s != 4) {laserCenterX = 0; laserCenterY = 0;}
					startX = laserCenterX - laserCenterY;
					startY = 0;
					endX = canvasHeight + laserCenterX - laserCenterY;
					endY = canvasHeight;
					break;
				}

			if (laserCenterY == 0 && laserCenterX == 0){continue;}
			ctx.beginPath();
			ctx.moveTo(startX, startY);
			ctx.lineTo(endX, endY);
			ctx.stroke();
		}
	}


}

var personalInstructions = {
	laser:{image:Img.pressShiftInstructions, life:400},
	move:{life:400, image:Img.wasdInstructions},
	shoot:{life:400, image:Img.arrowInstructions},
	cloak:{life:400, image:Img.cloakInstructions},
	boost:{life:400, image:Img.boostInstructions},
	team:{life:600, image:Img.teamInstructions}
};

//DrawInstructions
function drawPersonalInstructions(){
	if (shop.active){return;}
	if (personalInstructions.team.life > 0 && myPlayer.settings && myPlayer.settings.display && myPlayer.settings.display.find(setting => setting.key == "tutorialCompleted") && myPlayer.settings.display.find(setting => setting.key == "tutorialCompleted").value == true){
		personalInstructions.move.life = -1;
		personalInstructions.shoot.life = -1;
		personalInstructions.cloak.life = -1;
		personalInstructions.boost.life = -1;
		personalInstructions.team.life = -1;
	}

	var instructionName = "";
	if (personalInstructions["laser"].life > 0 && myPlayer.weapon == 5 && myPlayer.health > 0){
		instructionName = "laser";
	}
	else if (personalInstructions["move"].life > 0 && myPlayer.health > 0){
		instructionName = "move";
		if (myPlayer.pressingW || myPlayer.pressingA || myPlayer.pressingS || myPlayer.pressingD){personalInstructions[instructionName].life--;}
	}
	else if (personalInstructions["shoot"].life > 0 && myPlayer.health > 0){
		instructionName = "shoot";
		if (myPlayer.pressingUp || myPlayer.pressingLeft || myPlayer.pressingDown || myPlayer.pressingRight){personalInstructions[instructionName].life--;}
	}
	else if (personalInstructions["cloak"].life > 0 && myPlayer.health > 0){
		instructionName = "cloak";
		if (myPlayer.cloakEngaged){personalInstructions[instructionName].life--;}
	}
	else if (personalInstructions["boost"].life > 0 && myPlayer.health > 0){
		instructionName = "boost";
		if (myPlayer.boosting){personalInstructions[instructionName].life--;}
	}
	else if (personalInstructions["team"].life > 0 && myPlayer.health > 0){
		instructionName = "team";
		personalInstructions[instructionName].life--;
	}

	if (instructionName){
		if (personalInstructions[instructionName].life < 400){
			personalInstructions[instructionName].life--;
		}

		ctx.save();
		ctx.translate(centerX - myPlayer.x * zoom + Player.list[myPlayer.id].x * zoom, centerY - myPlayer.y * zoom + Player.list[myPlayer.id].y * zoom); //Center camera on controlled player
			drawImage(personalInstructions[instructionName].image, -(personalInstructions[instructionName].image.width * zoom)/2, -((personalInstructions[instructionName].image.height + 50) * zoom), personalInstructions[instructionName].image.width * zoom, personalInstructions[instructionName].image.height * zoom);
		ctx.restore();
	}

	if (personalInstructions["team"].life == 0){
		//TUTORIAL COMPLETED
		personalInstructions["team"].life = -1;
		log("TUTORIAL COMPLETED");
		socket.emit("tutorialCompleted");
	}
}


var laserCanonBlinkTime = 4;
var laserCanonBlink = laserCanonBlinkTime;
var drawingLaserChargingLaser = true;
function drawLaserCanonLaser(){
	if (drawingLaserChargingLaser){
		for (var i in Player.list) {
			if (Player.list[i].chargingLaser && Player.list[i].weapon == 5){
				if (Player.list[i].id == myPlayer.id)
					personalInstructions["laser"].life--;
				var laser = {};
				if (laserCanonBlink <= 1 || typeof Player.list[i].laserDistance === 'undefined'){
					Player.list[i].laserDistance = getLaserDistance(Player.list[i]);
				}
				laser.distance = Player.list[i].laserDistance;

				ctx.save();
				ctx.translate(centerX - myPlayer.x * zoom + Player.list[i].x * zoom, centerY - myPlayer.y * zoom + Player.list[i].y * zoom); //Center camera on lasering player
				ctx.rotate(getRotation(Player.list[i].shootingDir));
					noShadow();
					var xOffset = 9; var yOffset = -20;
					drawImage(Img.redLaser, xOffset * zoom, (-laser.distance + yOffset) * zoom, 4 * zoom, laser.distance * zoom);
				ctx.restore();

			}
		}//End player loop
	}

	laserCanonBlink--;
	if (laserCanonBlink <= 0){
		laserCanonBlink = laserCanonBlinkTime;
		if (drawingLaserChargingLaser)
			drawingLaserChargingLaser = false;
		else {
			drawingLaserChargingLaser = true;
		}
	}
}

function getLaserDistance(shooter){
	var potentialTargets = [];
	var shot = {x:9};
	var laserRange = 22 * 75;
	for (var b in Block.list){
		if (!(Block.list[b].type == "normal" || Block.list[b].type == "red" || Block.list[b].type == "blue"))
			continue;

		var target = Block.list[b];

		var overlapTop = shooter.y - target.y;  
		var overlapBottom = (target.y + target.height) - shooter.y;
		var overlapLeft = shooter.x - target.x;
		var overlapRight = (target.x + target.width) - shooter.x;		
		
		if (shooter.shootingDir == 1){
			if (target.x + target.width > shooter.x + shot.x &&
				target.x < shooter.x + shot.x &&
				target.y < shooter.y){
				var dist = (shooter.y - (target.y + target.height)) + 5;
				if (dist < laserRange)
				potentialTargets.push(dist);
			}
		}
		else if (shooter.shootingDir == 2){
			distFromDiag = (target.x + target.width/2) - ((shooter.x + shot.x * 1.5) + (shooter.y - (target.y + target.height/2)));
			if (Math.abs(distFromDiag) < target.width/2 + target.height/2 &&
				target.y < shooter.y &&
				target.x + target.width > shooter.x){
				var dist = 0;
				if (overlapBottom >= overlapLeft){
					//Hitting the left side of block
					dist = target.x - (shooter.x + shot.x * 0.8);
				}
				else if (overlapLeft >= overlapBottom){
					//Hitting bottom of block
					dist = ((shooter.y + shot.x * 0.8) - (target.y + target.height));
				}
				if (dist < laserRange * 1.5){
					potentialTargets.push(dist);
				}
			}
		}
		else if (shooter.shootingDir == 3){
			if (shooter.y + shot.x < target.y + target.height &&
				shooter.y + shot.x > target.y &&
				shooter.x < target.x + target.width){
				var dist = (target.x - shooter.x) + 5;
				if (dist < laserRange)
					potentialTargets.push(dist);
			}
		}
		else if (shooter.shootingDir == 4){
			distFromDiag = (target.x + target.width/2) - (shooter.x - shot.x * 1.5) + (shooter.y - (target.y + target.height/2));
			if (Math.abs(distFromDiag) < target.width/2 + target.height/2 &&
				target.y + target.height > shooter.y &&
				target.x + target.width > shooter.x){
				var dist = 0;
				if (overlapTop >= overlapLeft){
					//Hitting the left side of block
					dist = target.x - (shooter.x - shot.x * 0.8);
				}
				else if (overlapLeft >= overlapTop){
					//Hitting top of block
					dist = target.y - (shooter.y + shot.x * 0.8);
				}
				if (dist < laserRange){
					potentialTargets.push(dist);
				}
			}
		}
		else if (shooter.shootingDir == 5){
			if (target.x + target.width > shooter.x - shot.x &&
				target.x < shooter.x - shot.x &&
				target.y + target.height > shooter.y){
				var dist = (target.y - shooter.y) + 5;
				if (dist < laserRange)
				potentialTargets.push(dist);
			}
		}
		else if (shooter.shootingDir == 6){
			distFromDiag = (target.x + target.width/2) - ((shooter.x - shot.x * 1.5) + (shooter.y - (target.y + target.height/2)));
			if (Math.abs(distFromDiag) < target.width/2 + target.height/2 && target.y + target.height > shooter.y && target.x < shooter.x){
				var dist = 0;
				if (overlapTop >= overlapRight){
					//Hitting the right side of block
					dist = shooter.x - (target.x + target.width) - shot.x * 0.8;
				}
				else if (overlapRight >= overlapTop){
					//Hitting top of block
					dist = target.y - shooter.y + shot.x * 0.8;
				}
				if (dist < laserRange){
					potentialTargets.push(dist);
				}
			}
		}
		else if (shooter.shootingDir == 7){
			if (target.y + target.height > shooter.y - shot.x &&
				target.y < shooter.y - shot.x &&
				target.x < shooter.x){
				var dist = (shooter.x - (target.x + target.width)) + 5;
				if (dist < laserRange)
					potentialTargets.push(dist);
			}
		}
		else if (shooter.shootingDir == 8){
			//distFromDiag = (target.x + target.width/2) - shooter.x + (shooter.y - (target.y + target.height/2));
			distFromDiag = (target.x + target.width/2) - shooter.x - shot.x * 1.5 + (shooter.y - (target.y + target.height/2));
			if (Math.abs(distFromDiag) < target.width/2 + target.height/2 && target.y < shooter.y && target.x < shooter.x){
				var dist = 0;
				if (overlapBottom >= overlapRight){
					//Hitting the right side of block
					dist = shooter.x - (target.x + target.width) + shot.x * 0.8;
				}
				else if (overlapRight >= overlapBottom){
					//Hitting bottom of block
					dist = (shooter.y - (target.y + target.height)) - shot.x * 0.8;
				}
				if (dist < laserRange){
					potentialTargets.push(dist);
				}
			}
		}
	}// Block loop
	for (var t in potentialTargets){
		if (potentialTargets[t] < laserRange){
			laserRange = potentialTargets[t];
		}
	}
	if (shooter.shootingDir % 2 == 0){
		laserRange= laserRange * 1.42 - 10;
	}
	return laserRange - 10;
}

function drawBoosts(){
	for (var i in Player.list) {
		if (BoostBlast.list[Player.list[i].id]){
            var blast = BoostBlast.list[Player.list[i].id];
            var blastDir = blast.dir;
			if (!blastDir){
				blastDir = Player.list[i].walkingDir;
			}

			var imgblast = Player.list[i].images[1].boost;
			if (Player.list[i].team == 2){imgblast = Player.list[i].images[2].boost;}			
			if (typeof imgblast == 'undefined'){ //Load default images if animation frames not yet drawn
				imgblast = Img.boostBlast;
			}
            
            ctx.save();
            noShadow();
            ctx.globalAlpha = blast.alpha;
            blast.alpha -= .2;
            blast.width = blast.width + 20 * 1;
            blast.height = blast.height + 20 * 1;
            
            
            if (Player.list[i].x * zoom + 47 * zoom + drawDistance > cameraX && Player.list[i].x * zoom - 47 * zoom - drawDistance < cameraX + canvasWidth && Player.list[i].y * zoom + 47 * zoom + drawDistance > cameraY && Player.list[i].y * zoom - 47 - drawDistance < cameraY + canvasHeight){
                ctx.translate(centerX - myPlayer.x * zoom + Player.list[i].x * zoom, centerY - myPlayer.y * zoom + Player.list[i].y * zoom); //Center camera on controlled player
                ctx.rotate(getRotation(blastDir));
					if (Player.list[i].customizations[Player.list[i].team].boost == "blast"){
						drawImage(imgblast, (-blast.width/2 - dualBoostXOffset * 2) * zoom, 25 * zoom, blast.width * zoom, blast.height * zoom);
						drawImage(imgblast, (-blast.width/2 + dualBoostXOffset * 2) * zoom, 25 * zoom, blast.width * zoom, blast.height * zoom);						
						drawImage(imgblast, (-blast.width/2) * zoom, 15 * zoom, blast.width * zoom, blast.height * zoom);
					}
					else if (Player.list[i].customizations[Player.list[i].team].boost.indexOf('streaks') > -1){
						drawImage(imgblast, (-blast.width/2 - dualBoostXOffset) * zoom, 25 * zoom, blast.width * zoom, blast.height * zoom);
						drawImage(imgblast, (-blast.width/2 + dualBoostXOffset) * zoom, 25 * zoom, blast.width * zoom, blast.height * zoom);						
						drawImage(imgblast, (-blast.width/2) * zoom, 15 * zoom, blast.width * zoom, blast.height * zoom);
					}
					else if (Player.list[i].customizations[Player.list[i].team].boost == "rainbow"){
						blast.width = 60;
						drawImage(imgblast, (-blast.width/2) * zoom, 10 * zoom, blast.width * zoom, blast.height * zoom);
					}
					else if (Player.list[i].customizations[Player.list[i].team].boost == "lightning"){
						blast.width = 150;
						blast.height = 150;
						ctx.globalAlpha = 1;
						if (randomInt(0,1) >= .5)
						 	imgblast = Img.boostLightning2;
						if (blast.alpha >= .8)
							drawImage(imgblast, (-blast.width/2) * zoom, 10 * zoom, blast.width * zoom, blast.height * zoom);
					}
					else if (Player.list[i].customizations[Player.list[i].team].boost == "hearts2"){
						drawImage(imgblast, (-blast.width/2) * zoom, 20 * zoom, blast.width * zoom, blast.height * zoom);
					}
					else {
						drawImage(imgblast, (-blast.width/2 - dualBoostXOffset) * zoom, 15 * zoom, blast.width * zoom, blast.height * zoom);
						drawImage(imgblast, (-blast.width/2 + dualBoostXOffset) * zoom, 15 * zoom, blast.width * zoom, blast.height * zoom);
					}
                //ctx.rotate(-(getRotation(blastDir)));
                //ctx.translate(-(centerX - myPlayer.x * zoom + Player.list[i].x * zoom), -(centerY - myPlayer.y * zoom + Player.list[i].y * zoom)); //Center camera on controlled player
            }
            if (blast.alpha <= 0){
                delete BoostBlast.list[blast.id];
            }	
            ctx.restore();	
		}
	}
}


var reallyLowGraphicsMode = false;
if (gpu.tier == 0){
	bodyLimit = 2;
	log("Setting low graphics to true");
	reallyLowGraphicsMode = true;
}


function drawBlood(){
	if (reallyLowGraphicsMode)
		return;

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
				drawImage(imgBlood, -(blood.width*blood.scale)/2 * zoom, (-blood.height*blood.scale+25) * zoom, blood.width*blood.scale * zoom, blood.height*blood.scale * zoom);
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
				if (Notification.list[n].text.includes("Betrayal")){ctx.fillStyle="#9A0606";}
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

//draw usernames drawNames
function drawPlayerTags(){
	if (zoom == 1){return;}
	ctx.textAlign="center";
	ctx.font = 'bold 12px Electrolize';
	for (var i in Player.list){
		if (Player.list[i].chat && Player.list[i].chatDecay > 0){
			Player.list[i].chatDecay--;
		}
		if (Player.list[i].id == myPlayer.id && personalInstructions.team.life > 0){continue;}
		if (Player.list[i].x * zoom + 47 * zoom + drawDistance > cameraX && Player.list[i].x * zoom - 47 * zoom - drawDistance < cameraX + canvasWidth && Player.list[i].y * zoom + 47 * zoom + drawDistance > cameraY && Player.list[i].y * zoom - 47 * zoom - drawDistance < cameraY + canvasHeight){
			var playerUsername = Player.list[i].name.substring(0, 15);
			ctx.save();
            ctx.translate(centerX - myPlayer.x * zoom + Player.list[i].x * zoom, centerY - myPlayer.y * zoom + Player.list[i].y * zoom); //Center camera on controlled player
				if (Player.list[i].health > 0 && Player.list[i].team != 0 && !(Player.list[i].cloakEngaged == true && Player.list[i].team != Player.list[myPlayer.id].team)){
					var nameColor = Player.list[i].customizations[Player.list[i].team].nameColor;
					if (myPlayer.settings && myPlayer.settings.display.find(setting => setting.key == "forceTeamNameColors").value == true && Player.list[i].id != myPlayer.id){
						nameColor = Player.list[i].team == 1 ? "#9e0b0f" : "#2e3192";
					}
					
					drawName(ctx, playerUsername, nameColor, 0, -Img.whitePlayerPistol.height/2 * zoom, Player.list[i].images[Player.list[i].team].icon);
				}			
				if (Player.list[i].team != 0 && Player.list[i].chat && Player.list[i].chatDecay > 0 && !(Player.list[i].cloakEngaged && Player.list[i].team != Player.list[myPlayer.id].team)){
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

function activateShop(active){
	shop.active = active;


}

function drawShop(){
	calculateShopMechanics();
	if (shop.active){
		
		if (showStatOverlay == true){showStatOverlay = false;}

		var teamBlackMarketXOffset = 0;
			
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
		else if (shop.selection == 6)
			moveArrow = 207;
		
		var inventoryYoffset = 100;

		drawImage(Img.black50, 50 + teamBlackMarketXOffset, 0, 564, canvasHeight);
		drawImage(Img.shopInventory, 124 + teamBlackMarketXOffset, 250 + inventoryYoffset);
		drawImage(Img.upArrow, 249 + moveArrow + teamBlackMarketXOffset, 175 + inventoryYoffset - shop.purchaseEffectTimer);
		drawImage(Img.downArrow, 241.5 + teamBlackMarketXOffset, 370 + inventoryYoffset);
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
			ownerText2 = shop.amount1 + " rounds for $" + shop.price1 + ".";
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
			ownerText2 = shop.amount2 + " shells for $" + shop.price2 + ".";
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
			ownerText2 = shop.amount3 + " rounds for $" + shop.price3 + ".";
			if (shop.purchaseEffectTimer > 0){
				ctx.globalAlpha = .8;
				if (shop.uniqueText != "Heh heh heh heh... Thank you.")
					drawImage(Img.red,265 + teamBlackMarketXOffset, 254 + inventoryYoffset)
				else
					drawImage(Img.white,265 + teamBlackMarketXOffset, 254 + inventoryYoffset)
			}
		}
		else if (shop.selection == 4){
			drawImage(Img.shopLZ2, 330 + teamBlackMarketXOffset, 250 + inventoryYoffset);
			ownerText1 = "Once charged, it obliterates targets in one hit."
			ownerText2 = shop.amount4 + " charges for $" + shop.price4 + ".";
			if (shop.purchaseEffectTimer > 0){
				ctx.globalAlpha = .8;
				if (shop.uniqueText != "Heh heh heh heh... Thank you.")
					drawImage(Img.red,334 + teamBlackMarketXOffset, 254 + inventoryYoffset)
				else
					drawImage(Img.white,334 + teamBlackMarketXOffset, 254 + inventoryYoffset)
			}
		}
		else if (shop.selection == 5){
			drawImage(Img.shopBA2, 399 + teamBlackMarketXOffset, 250 + inventoryYoffset);
			ownerText1 = "Extra damage protection.";
			ownerText2 = "Temporarily increases HP by " + shop.amount5 + ".";
			if (shop.purchaseEffectTimer > 0){
				ctx.globalAlpha = .8;
				if (shop.uniqueText != "Heh heh heh heh... Thank you.")
					drawImage(Img.red,403 + teamBlackMarketXOffset, 254 + inventoryYoffset)
				else
					drawImage(Img.white,403 + teamBlackMarketXOffset, 254 + inventoryYoffset)
			}
		}
		else if (shop.selection == 6){
			drawImage(Img.shopEB2, 468 + teamBlackMarketXOffset, 250 + inventoryYoffset);
			ownerText1 = "Extends your battery capacity."
			ownerText2 = "Increases energy by " + shop.amount6 + "%.";
			if (shop.purchaseEffectTimer > 0){
				ctx.globalAlpha = .8;
				if (shop.uniqueText != "Heh heh heh heh... Thank you.")
					drawImage(Img.red,472 + teamBlackMarketXOffset, 254 + inventoryYoffset)
				else
					drawImage(Img.white,472 + teamBlackMarketXOffset, 254 + inventoryYoffset)
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
		ctx.fillText("$"+shop.price6, 505 + teamBlackMarketXOffset, 349 + inventoryYoffset);
		
		ctx.font = '24px Electrolize';	
		var textCenteredX = 332.5;
		ctx.fillText("$"+myPlayer.cash, textCenteredX + teamBlackMarketXOffset, 690);		
		ctx.fillStyle="#FFFFFF";
		ctx.fillText("You have:", textCenteredX + teamBlackMarketXOffset, 660);		

		
		drawImage(Img.spy, 297.5 + teamBlackMarketXOffset, 75);
		ctx.font = '20px Electrolize';	
		if (shop.uniqueTextTimer > 0){
			ctx.fillText(shop.uniqueText, textCenteredX + teamBlackMarketXOffset, 175);	
			shop.uniqueTextTimer--;
		}
		else {
			ctx.fillText(ownerText1, textCenteredX + teamBlackMarketXOffset, 175);		
			ctx.fillText(ownerText2, textCenteredX + teamBlackMarketXOffset, 195);		
		}	
		
		ctx.fillStyle="#000000";		
	}
}

function drawUILayer(){	
	if (myPlayer.team != 0 && myPlayer.eliminationSpectate != true){		
		drawIndicators();
		drawBloodyBorder();
		drawHUD();
	}
	else {
		drawSpectatingInfo();
		if (myPlayer.eliminationSpectate && shop.active){
			drawHUD();
		}
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

const indicatorEdgeOffset = 60;
const scaleBubbleSize = false;
function drawIndicators(){
	if (!myPlayer.team || reallyLowGraphicsMode){return;}
	noShadow();

	//Ally indicators
	for (var p in Player.list){
		if (Player.list[p].team != myPlayer.team || Player.list[p].holdingBag == true){ //Will be drawn in bag drawings
			continue;
		}
		var imgIndicator = Img.hudIndicatorBlue;
		if (myPlayer.team == 1){imgIndicator = Img.hudIndicatorRed;}
		var object = Player.list[p];
		var imgIcon = Img.hudIndicatorHeart;
		if (Player.list[p].health <= 0){imgIcon = Img.hudIndicatorDead;}
		drawIndicator(object, imgIndicator, imgIcon);
	}	

	//Bag indicators
	if (gametype == "ctf" && !(pregame && pregameIsHorde)){ 
		var imgIndicator = Img.hudIndicatorBlue;
		var object = bagBlue;
		var imgIcon = Img.hudIndicatorCaptBlue;

		if (myPlayer.team == 1){
			imgIndicator = Img.hudIndicatorBlue;
			object = bagBlue;
			if (myPlayer.holdingBag){
				imgIcon = Img.hudIndicatorBringHome;
				object = {x:bagRed.homeX, y:bagRed.homeY};
			}
			else if (object.captured == true){
				imgIndicator = Img.hudIndicatorRed;
				imgIcon = Img.hudIndicatorProtectRed;
			}
			else {
				imgIcon = Img.hudIndicatorCaptBlue;
			}
		}
		else if (myPlayer.team == 2){
			imgIndicator = Img.hudIndicatorRed;
			object = bagRed;
			if (myPlayer.holdingBag){
				imgIcon = Img.hudIndicatorBringHome;
				object = {x:bagBlue.homeX, y:bagBlue.homeY};
			}
			else if (object.captured == true){
				imgIndicator = Img.hudIndicatorBlue;
				imgIcon = Img.hudIndicatorProtectBlue;
			}
			else {
				imgIcon = Img.hudIndicatorCaptRed;
			}
		}
		drawIndicator(object, imgIndicator, imgIcon);
	}
}
const indicatorTypeScale = 2/3;
function drawIndicator(object, img, imgIcon){
	var imageDimensions = {width:img.width, height:img.height};
		
	var onScreenPos = {x:centerX - myPlayer.x * zoom + object.x * zoom, y:centerY - myPlayer.y * zoom + object.y * zoom};
	var offScreen = false;
	if (onScreenPos.x < -indicatorEdgeOffset/2){offScreen = true;}
	if (onScreenPos.x > canvasWidth + indicatorEdgeOffset/2){offScreen = true;}
	if (onScreenPos.y < -indicatorEdgeOffset/2){offScreen = true;}
	if (onScreenPos.y > canvasHeight + indicatorEdgeOffset/2){offScreen = true;}
	if (!offScreen){
		return;
	}

	var indicatorEdgeOffsetAdjusted = indicatorEdgeOffset;
	if (scaleBubbleSize){
		var distFromPlayer = getDistance(myPlayer, object);
		if (distFromPlayer > 1400){distFromPlayer = 1400;}
		imageDimensions.width = img.width * (1/(distFromPlayer/900)); //scale from 700 = 1 to 1400 = 2 
		imageDimensions.height = img.height * (1/(distFromPlayer/900)); //scale from 700 = 1 to 1400 = 2 
		if (imageDimensions.width > img.width){imageDimensions.width = img.width; imageDimensions.height = img.height;}
		indicatorEdgeOffsetAdjusted = indicatorEdgeOffset - (Math.abs(imageDimensions.width - img.width)/2);
		if (indicatorEdgeOffsetAdjusted > 60){indicatorEdgeOffsetAdjusted = 60;}
	}
	if (imgIcon == Img.hudIndicatorHeart || imgIcon == Img.hudIndicatorDead){imageDimensions.width *= indicatorTypeScale; imageDimensions.height *= indicatorTypeScale; indicatorEdgeOffsetAdjusted *= indicatorTypeScale;}
	else if (imgIcon == Img.hudIndicatorBringHome){imageDimensions.width /= indicatorTypeScale*1.2; imageDimensions.height /= indicatorTypeScale*1.2; indicatorEdgeOffsetAdjusted /= indicatorTypeScale*1.2;}

	if (onScreenPos.x < indicatorEdgeOffsetAdjusted){onScreenPos.x = indicatorEdgeOffsetAdjusted;}
	if (onScreenPos.x > canvasWidth - indicatorEdgeOffsetAdjusted){onScreenPos.x = canvasWidth - indicatorEdgeOffsetAdjusted;}
	if (onScreenPos.y < indicatorEdgeOffsetAdjusted){onScreenPos.y = indicatorEdgeOffsetAdjusted;}
	if (onScreenPos.y > canvasHeight - indicatorEdgeOffsetAdjusted){onScreenPos.y = canvasHeight - indicatorEdgeOffsetAdjusted;}

	ctx.save();
		ctx.translate(onScreenPos.x, onScreenPos.y); //Center camera on edge of screen
		ctx.save();
			ctx.rotate(getAngledRotation(object, myPlayer));
			drawImage(img, -imageDimensions.width/2, -imageDimensions.height/2, imageDimensions.width, imageDimensions.height);
		ctx.restore();
		drawImage(imgIcon, -imageDimensions.width/2, -imageDimensions.height/2, imageDimensions.width, imageDimensions.height);
	ctx.restore();

}

function getDistance(point1, point2){
	var dx1 = point1.x - point2.x;
	var dy1 = point1.y - point2.y;
	return Math.sqrt(dx1*dx1 + dy1*dy1);
}

function getAngledRotation(point1, point2){
	return -Math.atan2(point1.y - point2.y, point2.x - point1.x) - ((Math.PI / 180.0) * 90);
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
	else if (gametype == "elim" && !(pregameIsHorde && pregame)) {
		spectatingText = "Spectating. You will join the next round!";
	}
	else {
		spectatingText = "Spectating...";
	}
	drawImage(Img.spectatingOverlay, -5, -5, canvasWidth + 10, canvasHeight + 10); 
	
	if(!showStatOverlay && !shop.active){
		smallCenterShadow();
		ctx.fillStyle="#FFFFFF";
		ctx.font = 'bold 30px Electrolize';
		ctx.lineWidth = 4;
		strokeAndFillText(spectatingText,canvasWidth/2,775);
		//strokeAndFillText("Waiting for current game to finish. You will join the next game.",canvasWidth/2,100);		
		ctx.font = 'bold 15px Electrolize';
		ctx.lineWidth = 3;
		if (!gametype == "elim" || (pregame && pregameIsHorde)){
			strokeAndFillText("Use the arrow keys to move camera",canvasWidth/2,800);		
		}
		else {
			strokeAndFillText("[U] To open shop | Use the arrow keys to move camera",canvasWidth/2,800);		
		}
	}
}

var spectatePlayers = false;
function updateSpectatingView(){ //updates spectating camera
	if (myPlayer.x === 0 && myPlayer.y === 0){
		myPlayer.x = mapWidth/2;
		myPlayer.y = mapHeight/2;
	}

	if (!shop.active){
		if (myPlayer.pressingDown)
			myPlayer.y += spectateMoveSpeed;
		if (myPlayer.pressingUp)
			myPlayer.y -= spectateMoveSpeed;
		if (myPlayer.pressingLeft)
			myPlayer.x -= spectateMoveSpeed;
		if (myPlayer.pressingRight)
			myPlayer.x += spectateMoveSpeed;
	}

	if (spectatePlayers){
		updateOrderedPlayerList();
		if (spectatingPlayerId == "bagBlue" && gametype == "ctf"){
			myPlayer.x = bagBlue.x;
			myPlayer.y = bagBlue.y;		
		}
		else if (spectatingPlayerId == "bagRed" && gametype == "ctf"){
			myPlayer.x = bagRed.x;
			myPlayer.y = bagRed.y;
		}
		else if (typeof Player.list[spectatingPlayerId] != 'undefined' && Player.list[spectatingPlayerId].team != 0){
			myPlayer.x = Player.list[spectatingPlayerId].x;
			myPlayer.y = Player.list[spectatingPlayerId].y;		
		}
		else {
			myPlayer.x = mapWidth/2;
			myPlayer.y = mapHeight/2;			
		}
	}
}

function drawInformation(){
	if (!gameOver && debugText == true){
		noShadow();
		ctx.fillStyle="#FFFFFF";
		ctx.font = '14px Electrolize';
		ctx.textAlign="left";

		//Version and debug text label1 //debug lable1

		fillText("Health:" + Player.list[myPlayer.id].health, 5, 15); //debug
		fillText("ping:" + ping, 5, 35);
		if (showStatOverlay == true){
			fillText("" + version, 5, 55); //debug
			// fillText("x: " + Player.list[myPlayer.id].x, 5, 95); //debug info
			//fillText("boosting: " + Player.list[myPlayer.id].boosting, 5, 55); //debug info
			//fillText("speedX: " + Player.list[myPlayer.id].speedX, 5, 75); //debug
			//fillText("speedY: " + Player.list[myPlayer.id].speedY, 5, 95); //debug
			// fillText("PressingD: " + myPlayer.pressingD, 5, 115); //debug

		}
		//fillText("walkingDir:" + Player.list[myPlayer.id].walkingDir, 5, 35); //debug
		//fillText("legSwingForward:" + Player.list[myPlayer.id].legSwingForward, 5, 55); //debug
		//fillText("LegHeight:" + Player.list[myPlayer.id].legHeight, 5, 75); //debug
	}
}

//Bloody border
function drawBloodyBorder(){
	noShadow();
	if (Player.list[myPlayer.id].health < 100 && !myPlayer.eliminationSpectate){ 
		var bloodyScale = Player.list[myPlayer.id].health;

		// if (bloodyScale > 0)
		// 	bloodyScale += ((100 - bloodyScale) / 3); // increase this last number to increase the amount of blood on damage levels less than dead. Remove this line entirely to have the bloodyBorder scale smoothly all the way up until death

		var alph2 = 1 - (bloodyScale / 100);
		alph2 += .1; 
		if (alph2 < 0){
			alph2 = 0;
		}	
		if (bloodyScale < 0){
			bloodyScale = 0;
		}
		ctx.globalAlpha = Math.round(alph2 * 100) / 100;
		var bloodyBorderScale = 3; //increase to push blood more to edges upon low damage
		drawImage(Img.bloodyBorder, -(bloodyScale * bloodyBorderScale)/2, -(bloodyScale * bloodyBorderScale)/2, canvasWidth + bloodyScale*bloodyBorderScale, canvasHeight + bloodyScale*bloodyBorderScale);
		if (Player.list[myPlayer.id].health <= 0){
			drawImage(Img.redDeath, -(bloodyScale * bloodyBorderScale)/2, -(bloodyScale * bloodyBorderScale)/2, canvasWidth + bloodyScale*bloodyBorderScale, canvasHeight + bloodyScale*bloodyBorderScale);
		}
		ctx.globalAlpha = 1;
	}
}

//Ammo HUD ammohud
var usingEnergy = 0;
function drawHUD(){
	if (!gameOver){
		var liftBottomHUD = 8;
		smallCenterShadow();
		
		//Weapon selection (1,2,3,4) HUD//////////////
		var iconWidth = Img.energyIcon.width + 4;
		if (!gameOver){
		
			//Weapon selected highlight
			ctx.globalAlpha = 0.3;
			ctx.fillStyle="#FFFFFF";						
			if (Player.list[myPlayer.id].weapon == 1){ ctx.fillRect(canvasWidth - 248 - iconWidth, canvasHeight - 130 - liftBottomHUD, Img.weapon1Key.width*0.75 - 10, Img.weapon1Key.height*0.75); }
			else if (Player.list[myPlayer.id].weapon == 2){ ctx.fillRect(canvasWidth - 203 - iconWidth,canvasHeight - 130 - liftBottomHUD,Img.weapon2Key.width*0.75 - 10,Img.weapon2Key.height*0.75); }
			else if (Player.list[myPlayer.id].weapon == 3){ ctx.fillRect(canvasWidth - 161 - iconWidth, canvasHeight - 130 - liftBottomHUD, Img.weapon3Key.width*0.75, Img.weapon3Key.height*0.75); }
			else if (Player.list[myPlayer.id].weapon == 4){ ctx.fillRect(canvasWidth - 108 - iconWidth, canvasHeight - 130 - liftBottomHUD, Img.weapon4Key.width*0.75, Img.weapon4Key.height*0.75); }
			else if (Player.list[myPlayer.id].weapon == 5){ ctx.fillRect(canvasWidth - 55 - iconWidth, canvasHeight - 130 - liftBottomHUD, Img.weapon4Key.width*0.75, Img.weapon4Key.height*0.75); }
			ctx.globalAlpha = 1.0;

			//Weapon keys
			drawImage(Img.weapon1Key, canvasWidth - 254 - iconWidth, canvasHeight - 130 - liftBottomHUD, Img.weapon1Key.width*0.75, Img.weapon1Key.height*0.75);			
			if (myPlayer.DPAmmo > 0 || myPlayer.DPClip > 0){

				drawImage(Img.weapon2Key, canvasWidth - 208 - iconWidth, canvasHeight - 130 - liftBottomHUD, Img.weapon2Key.width*0.75, Img.weapon2Key.height*0.75);
			}
			if (myPlayer.MGAmmo > 0 || myPlayer.MGClip > 0){
				drawImage(Img.weapon3Key, canvasWidth - 161 - iconWidth, canvasHeight - 130 - liftBottomHUD, Img.weapon3Key.width*0.75, Img.weapon3Key.height*0.75);
			}
			if (myPlayer.SGAmmo > 0 || myPlayer.SGClip > 0){
				drawImage(Img.weapon4Key, canvasWidth - 108 - iconWidth, canvasHeight - 130 - liftBottomHUD, Img.weapon4Key.width*0.75, Img.weapon4Key.height*0.75);
			}
			if (myPlayer.laserClip > 0){
				drawImage(Img.weapon5Key, canvasWidth - 55 - iconWidth, canvasHeight - 130 - liftBottomHUD, Img.weapon4Key.width*0.75, Img.weapon4Key.height*0.75);
			}
		}


		ctx.globalAlpha = 1;

		var clipCount = "0";
		var ammoCount = "0";
		var img = Img.ammo9mm;
		var ammoWidth = 0;
		if (Player.list[myPlayer.id].weapon == 1){
			clipCount = Player.list[myPlayer.id].PClip;
			ammoWidth = 136 - ((15 - Player.list[myPlayer.id].PClip) * 9);
			img = Img.ammo9mm;
		}
		else if (Player.list[myPlayer.id].weapon == 2){
			clipCount = Player.list[myPlayer.id].DPClip;
			ammoCount = Player.list[myPlayer.id].DPAmmo;		
			ammoWidth = 180 - ((20 - Player.list[myPlayer.id].DPClip) * 9) + 1;
			img = Img.ammoDP;
		}
		else if (Player.list[myPlayer.id].weapon == 3){
			clipCount = Player.list[myPlayer.id].MGClip;
			ammoCount = Player.list[myPlayer.id].MGAmmo;		
			ammoWidth = 182 - ((30 - Player.list[myPlayer.id].MGClip) * 6);
			img = Img.ammoMG;
		}
		else if (Player.list[myPlayer.id].weapon == 4){
			clipCount = Player.list[myPlayer.id].SGClip;
			ammoCount = Player.list[myPlayer.id].SGAmmo;		
			ammoWidth = 190 - ((12 - Player.list[myPlayer.id].SGClip) * 16); //Was 135, 11
	 		img = Img.ammoSG;
		}
		else if (Player.list[myPlayer.id].weapon == 5){
			clipCount = Player.list[myPlayer.id].laserClip;
			ammoCount = "xx";		
			ammoWidth = (Player.list[myPlayer.id].laserClip * 52); //Final number is bullet width
			img = Img.ammoLZ;
		}
 		ctx.drawImage(img, 600 - ammoWidth, 0, ammoWidth, 80, canvasWidth - ammoWidth - 205 - iconWidth, canvasHeight - 86 - liftBottomHUD, ammoWidth, 80);
		
		//Draw separating line
		ctx.strokeStyle = "#FFF";
		ctx.lineWidth  = 1;
		ctx.beginPath();
		ctx.moveTo(canvasWidth - 202 - iconWidth, canvasHeight - 54);
		ctx.lineTo(canvasWidth - 202 - iconWidth, canvasHeight - 14);
		ctx.stroke();
				
		//Draw Ammmo Count
		ctx.font = '72px Electrolize';
		ctx.fillStyle="#FFFFFF";
		ctx.lineWidth=4;
		ctx.textAlign="right";
		fillText(clipCount, canvasWidth - 99 - iconWidth, canvasHeight - 9 - liftBottomHUD);
		ctx.font = '63px Electrolize';
		fillText("/", canvasWidth - 63 - iconWidth, canvasHeight - 15 - liftBottomHUD);
		if (Player.list[myPlayer.id].weapon == 1){
			drawImage(Img.infinity, canvasWidth - 82 - iconWidth, canvasHeight - 42 - liftBottomHUD);		
		}
		else {
			ctx.font = '38px Electrolize';
			ctx.textAlign="left";
			fillText(ammoCount,canvasWidth - 74 - iconWidth, canvasHeight - 9 - liftBottomHUD);
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

		var energyLineThickness = 8;
		var iconDistFromRight = 4;
		var liftEnergyBarY = 4;
		var scaledCanvasWidth = canvasWidth - (energyLineThickness*6) - Img.energyIcon.width;

		var energyStartingX = (canvasWidth - Img.energyIcon.width - (energyLineThickness*3) - 1.5) - (scaledCanvasWidth * (myPlayer.drawnEnergy / 200));
		var energyStartingY = canvasHeight - liftBottomHUD + liftEnergyBarY;
		var energyWidth = scaledCanvasWidth * (myPlayer.drawnEnergy / 200);

		var imgEnergyIcon = Img.energyIcon;
		var imgEnergyBoostIcon = Img.energyBoostIcon;
		var imgEnergyEyeIcon = Img.energyEyeIcon;

		if (usingEnergy > 0){usingEnergy--;}

   		if (myPlayer.drawnEnergy <= 25){
			if (myPlayer.drawnEnergy <= 0){
				imgEnergyIcon = Img.energyIconX;
				imgEnergyBoostIcon = "";
				imgEnergyEyeIcon = "";
			}
			else {
				ctx.fillStyle = 'red';			
				imgEnergyIcon = Img.energyIconRed;
				imgEnergyBoostIcon = Img.energyBoostIconRed;
				imgEnergyEyeIcon = Img.energyEyeIconRed;	
			}
		}
		else if (usingEnergy > 0){
			ctx.fillStyle = 'yellow';
			imgEnergyIcon = Img.energyIconYellow;
			imgEnergyBoostIcon = Img.energyBoostIconYellow;
			imgEnergyEyeIcon = Img.energyEyeIconYellow;	
		}
		else {
			ctx.fillStyle = 'white';
			
		}

		if (myPlayer.drawnEnergy > 0){
			ctx.beginPath();
			ctx.moveTo(energyStartingX, energyStartingY); //bottom left
			ctx.lineTo(energyStartingX + energyLineThickness, energyStartingY - energyLineThickness); //Top left (diag up right)
			ctx.lineTo(energyStartingX + energyLineThickness + energyWidth, energyStartingY - energyLineThickness); //To base of energy action icon
			ctx.lineTo(energyStartingX + (energyLineThickness*3) + energyWidth, energyStartingY - (energyLineThickness*3)); //Up to energy action icon
			ctx.lineTo(energyStartingX + (energyLineThickness*6) + energyWidth, energyStartingY); //Down to energy action icon base
			ctx.lineTo(energyStartingX, energyStartingY); //Back to start (bottom left)
			ctx.fill();
		}
		else {
		}

		noShadow();		
		drawImage(imgEnergyIcon, canvasWidth - Img.energyIcon.width - iconDistFromRight, canvasHeight - Img.energyIcon.height + liftEnergyBarY - liftBottomHUD);
		if ((myPlayer.pressingW || myPlayer.pressingD || myPlayer.pressingS || myPlayer.pressingA) && !myPlayer.cloakEngaged && imgEnergyBoostIcon){
			drawImage(imgEnergyBoostIcon, canvasWidth - Img.energyIcon.width - iconDistFromRight, canvasHeight - Img.energyIcon.height + liftEnergyBarY - liftBottomHUD);
		}
		else if (imgEnergyEyeIcon){
			drawImage(imgEnergyEyeIcon, canvasWidth - Img.energyIcon.width - iconDistFromRight, canvasHeight - Img.energyIcon.height + liftEnergyBarY - liftBottomHUD);
		}
		if (myPlayer.energy > 0){
			//drawImage(Img.space, canvasWidth - Img.energyIcon.width - iconDistFromRight, canvasHeight - Img.energyIcon.height + liftEnergyBarY - liftBottomHUD - 42, 76, 40);
		}

		//Energy Flashing
		if (myPlayer.energy <= 25) {
			if (energyRedAlpha <= 0)
				energyRedAlpha = 0.7;
			ctx.globalAlpha = energyRedAlpha;
			
			drawImage(Img.energyRed, canvasWidth - Img.energyRed.width * 2, canvasHeight - Img.energyRed.height * 2, Img.energyRed.width * 2, Img.energyRed.height * 2);
			energyRedAlpha -= .1;
		}


		ctx.globalAlpha = 1;
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

		//QuickChat keys
		if (myPlayer.settings && myPlayer.team && myPlayer.settings.quickChat){
			smallCenterShadow();
			ctx.font = 'bold 15px Electrolize';
			ctx.fillStyle="#FFFFFF";
			ctx.textAlign="left";
			fillText("QuickChat Keys", 315, 794);
			ctx.font = '15px Electrolize';
			drawImage(Img.quickChatKeys, 315, 800, Img.quickChatKeys.width * 0.5, Img.quickChatKeys.height * 0.5);
			fillText(myPlayer.settings.quickChat[0].value, 345, 816);
			fillText(myPlayer.settings.quickChat[3].value, 345, 840);
			fillText(myPlayer.settings.quickChat[1].value, 345, 862);
			fillText(myPlayer.settings.quickChat[2].value, 345, 885);
		}
	}
}

//Top Scoreboard top scoreboard topscoreboard	
function drawTopScoreboard(){
	noShadow();
	if (!(gametype == "horde" || (pregame && pregameIsHorde))){
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

			if (timeLimit == false){
				ctx.font = 16 + 'px Electrolize';	
				var smallText = getGametypeSymbol();
				if (scoreToWin > 0){
					smallText = "First to " + scoreToWin + getGametypeSymbol();
				}
				strokeAndFillText(smallText, canvasWidth/2, 23);
			}
			else if (timeLimit == true){
				ctx.font = 16 + 'px Electrolize';
				if (gameOver == false && secondsLeft == 0 && minutesLeft == 0){
					ctx.fillStyle="#FF0000";
					strokeAndFillText("SD" + getGametypeSymbol(), canvasWidth/2, 53);
				}
				else {
					var smallText = getGametypeSymbol();
					if (scoreToWin > 0){
						smallText = "First to " + scoreToWin + getGametypeSymbol();
					}
					strokeAndFillText(smallText, canvasWidth/2, 53);
				}
				if (parseInt(minutesLeft)*60 + parseInt(secondsLeft) <= 60 && timeLimit){
					ctx.fillStyle="#FF0000";
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
}

function getGametypeSymbol(){
	var symbol = "⊕";
	if (gametype == "ctf"){
		symbol = "🖵";
	}
	return ""; //No symbol for now
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
//drawEndgame
function drawPostGameProgress(){
	if (gameOver == true && postGameReady == true && myPlayer.team != 0){
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
							if (!mute && isLoggedIn()){
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
			ctx.fillStyle="#7d7d7d"; //unfilled grey
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
						if (!mute && isLoggedIn()){
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
			if (!isLoggedIn()){
				ctx.fillStyle="#FF0000";
				strokeAndFillText("PROGRESS WILL NOT BE SAVED!!!",canvasWidth/2 - 300,postGameProgressPlayerNameY + postGameProgressY);
				strokeAndFillText("CREATE ACCOUNT TO SAVE PROGRESS!",canvasWidth/2 + 320,postGameProgressPlayerNameY + postGameProgressY);
			}
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

function getGameStartText(){
	var text = "GAME START!";
	if (gametype == "ctf"){
		text = "CAPTURE THE BAG!"
	}
	else if (gametype == "slayer"){
		text = "KILLFEST!"
	}
	else if (gametype == "horde"){
		text = "INVASION!"
	}
	else if (gametype == "elim"){
		text = "ELIMINATION!"
	}
	return text;
}

function allPlayersAreDead(){	
	for (var p in Player.list){
		if (Player.list[p].health > 0 ){
			return false;
		}
	}
	return true;
}

//GAME STATUS UPDATES: END GAME/PREGAME/SUDDEN DEATH/TEAM WINS
function drawGameEventText(){
	if (!myPlayer.hordeKills){myPlayer.hordeKills = 0;}
	if (playerDiedTimer > 0){playerDiedTimer--;}
	if (playerDiedTimer <= 0){playerDied = "";}
	if ((gametype == "horde" || (pregame && pregameIsHorde)) && myPlayer.team != 0){
		if (Player.list[myPlayer.id].health <= 0){
			ctx.textAlign="center";
			ctx.font = '70px Electrolize';
			ctx.lineWidth=10;
			ctx.fillStyle="#FFFFFF";
			var killsText= "YOU ARE DEAD";
			strokeAndFillText(killsText,canvasWidth/2,canvasHeight/2 - 100);
			ctx.font = '50px Electrolize';
			ctx.lineWidth=7;
			killsText= "Kills: " + myPlayer.hordeKills;
			if (myPlayer.hordeKills >= myPlayer.hordePersonalBest) {killsText += " - NEW RECORD!!!"; ctx.fillStyle="yellow";}			
			strokeAndFillText(killsText,canvasWidth/2,canvasHeight/2);
			ctx.font = '30px Electrolize';
			ctx.fillStyle="#FFFFFF";
			killsText= "Press [Space] to reset kills and respawn";
			ctx.lineWidth=5;
			strokeAndFillText(killsText,canvasWidth/2,canvasHeight/2 + 50);
		}
		else {
			ctx.textAlign="right";
			ctx.font = '30px Electrolize';
			ctx.lineWidth=0;
			ctx.fillStyle="#FFFFFF";
			var killsText= "Kills since last respawn: " + myPlayer.hordeKills;
			strokeAndFillText(killsText,canvasWidth - 10,30);
			ctx.font = '20px Electrolize';
			ctx.lineWidth=0;
			killsText= "Personal best: " + myPlayer.hordePersonalBest;
			strokeAndFillText(killsText,canvasWidth - 10,55);
			ctx.font = '20px Electrolize';
			ctx.lineWidth=0;
			killsText= "Global best: " + hordeGlobalBest + " by " + hordeGlobalBestNames;
			strokeAndFillText(killsText,canvasWidth - 10,80);
		}
	}
	if (customServer && pregame){
		noShadow();
		ctx.lineWidth=16;
		ctx.fillStyle="#FFFFFF";
		ctx.font = '70px Electrolize';
		ctx.textAlign="right";
		strokeAndFillText("Chat: './start' to start game",canvasWidth - 10,750);
	}
	else if (showStatOverlay == false && (gametype == "horde" || (pregame && pregameIsHorde))){
		noShadow();
		ctx.font = '118px Electrolize';
		var pregameText= "PREGAME";
		var players = 0;
		for (var p in Player.list){
			players++;
		}		
		if (pregame && players >= 4){
			ctx.font = '80px Electrolize';
			pregameText = "MATCH STARTING!";
		}
		else if (gametype == "horde" || (pregame && pregameIsHorde)){
			ctx.font = '40px Electrolize';
			if (playerDiedTimer > 0 && playerDied){				
				ctx.lineWidth=4;
				pregameText = playerDied + " DIED!!";
				ctx.textAlign="center";
				ctx.fillStyle="red";
				strokeAndFillText(pregameText,canvasWidth/2,canvasHeight/2 + 100);	
			}
			if (Player.list[myPlayer.id].health > 0 && gametype != "horde" && pregame){
				pregameText = "Waiting for players to join...";
			}
			else {
				pregameText = "";
			}
		}
		ctx.lineWidth=4;
		ctx.fillStyle="#FFFFFF";
		ctx.textAlign="right";
		strokeAndFillText(pregameText,canvasWidth - 10,750);			
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
			strokeAndFillText(getGameStartText(),canvasWidth/2,canvasHeight/2);
			if (gameStartAlpha > 0){gameStartAlpha-=.01;}
			ctx.globalAlpha = 1;	
		} else {gameStartAlpha = 0;}
		
		if (!gameOver && roundOver){
			heavyCenterShadow();
			ctx.textAlign="right";
			ctx.font = '40px Electrolize';
			ctx.lineWidth=6;
			ctx.fillStyle="#FFFFFF";
			strokeAndFillText("Next round in: " + nextGameTimer, canvasWidth - 10,748);
			ctx.font = '90px Electrolize';
			ctx.lineWidth=12;
			var endGameText = "ROUND LOST...";
			if (roundVictor == myPlayer.team){
				endGameText = "ROUND WON!!!";
			}
			strokeAndFillText(endGameText,canvasWidth - 10, 703);

		}
		else if (minutesLeft == 0 && secondsLeft == 0 || gameOver == true){
			heavyCenterShadow();
			ctx.textAlign="right";
			ctx.font = '40px Electrolize';
			ctx.lineWidth=6;
			ctx.fillStyle="#FFFFFF";
			if (gameOver == true){
				strokeAndFillText("Next game in: " + nextGameTimer, canvasWidth - 10,828);
			}

			ctx.lineWidth=12;
			if ((whiteScore > blackScore || whiteScore < blackScore) && gameOver == true && myPlayer.team != 0){
				var actualVictoryPumpSize = victoryPumpSize;

				victoryPumpSize -= 1;
				if (victoryPumpSize <= 70){
					victoryPumpSize = 150;
				}

				if (actualVictoryPumpSize < 118){
					actualVictoryPumpSize = 118;
				}
				var endGameText = "DEFEAT...";
				if ((myPlayer.team == 1 && whiteScore > blackScore) || (myPlayer.team == 2 && whiteScore < blackScore)){
					endGameText = "VICTORY!!!";
				}
				else {
					actualVictoryPumpSize = 118;
				}
				ctx.font = actualVictoryPumpSize + 'px Electrolize';
				ctx.fillStyle="#FFFFFF";				
				strokeAndFillText(endGameText,canvasWidth - 10,743 + (actualVictoryPumpSize/3), 575);
			}
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
			if (Player.list[a].team == 1){
				whitePlayers.push(Player.list[a]);
			}
			else if (Player.list[a].team == 2){
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
			if (blackPlayers[a].id == myPlayer.id || (myPlayer.team == 0 && spectatingPlayerId == blackPlayers[a].id)){
				var arrowIcon = Img.statArrow;
				if (myPlayer.team == 0){arrowIcon = Img.statCamera;}
				drawImage(arrowIcon, 123, blackScoreY - 13); //scoreboard arrow
				ctx.fillStyle="#FFFFFF";
			}
			else {
				ctx.fillStyle="#AAAAAA";
			}
			strokeAndFillText(blackPlayers[a].name.substring(0, 15),143,blackScoreY);
			ctx.textAlign="center";
			ctx.fillStyle="#19BE44";
			if (gameOver == false){
				strokeAndFillText("$"+blackPlayers[a].cash,439,blackScoreY);
			}
			else {
				strokeAndFillText("$"+blackPlayers[a].cashEarnedThisGame,439,blackScoreY);
			}
			if (blackPlayers[a].id == myPlayer.id || (myPlayer.team == 0 && spectatingPlayerId == blackPlayers[a].id)){ctx.fillStyle="#FFFFFF";}
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
			if (whitePlayers[a].id == myPlayer.id || (myPlayer.team == 0 && spectatingPlayerId == whitePlayers[a].id)){
				var arrowIcon = Img.statArrow;
				if (myPlayer.team == 0){arrowIcon = Img.statCamera;}
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
			if (whitePlayers[a].id == myPlayer.id || (myPlayer.team == 0 && spectatingPlayerId == whitePlayers[a].id)){ctx.fillStyle="#FFFFFF";}
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


function drawRedEffectsLayer(){
	noShadow();

	rCtx.globalCompositeOperation = "source-over";
	rCtx.clearRect(0,0,red_canvas.width,red_canvas.height); //Clears previous frame

	//draw torso outlines


	//rCtx.globalCompositeOperation = "source-in";
	rCtx.fillStyle = "red";
	rCtx.fillRect(0,0, red_canvas.width, red_canvas.height);
	

	rCtx.fillRect(0,0, red_canvas.width, red_canvas.height);
	
	ctx.drawImage(red_canvas, 0, 0);
}

//LaserEffects
function drawLaserChargingEffect(){
	for (var p in Player.list){
		if (Player.list[p].chargingLaser >= 1){
			if (!Player.list[p].laserChargeGraphic)
				Player.list[p].laserChargeGraphic = 0;

			Player.list[p].laserChargeGraphic++;


			var ringWidth = 10 + 1.6*(100 - (Player.list[p].laserChargeGraphic * (100/170)));
			var flareWidth = (Img.laserFlare.width/100) * Player.list[p].laserChargeGraphic;
			var flareHeight = (Img.laserFlare.height/100) * Player.list[p].laserChargeGraphic * 2;

			if (!isCenteredObjVisible(Player.list[p].x, Player.list[p].y, flareWidth, flareHeight))
				continue;

			var rotRing = rotateAndCache(Img.laserRing,(Player.list[p].laserChargeGraphic/30) * (Player.list[p].laserChargeGraphic/30))
			var rotFlare = rotateAndCache(Img.laserFlare,90)

			ctx.save();
			ctx.translate(centerX - myPlayer.x * zoom + Player.list[p].x * zoom, centerY - myPlayer.y * zoom + Player.list[p].y * zoom); //Center camera on lasering player
				ctx.rotate(getRotation(Player.list[p].shootingDir));
				ctx.globalAlpha = Player.list[p].laserChargeGraphic / 170;
				noShadow();
				ctx.drawImage(rotRing,  10 - ringWidth/2, -35 - ringWidth/2, ringWidth, ringWidth); //rotating ring
				ctx.drawImage(rotFlare,  10 - flareWidth/2, -35 - flareHeight/2, flareWidth, flareHeight); //Slowly growing flare

			ctx.restore();

		}
	}
}

function isVisible(x, y, width, height){
	if ((x + width)*zoom + drawDistance > cameraX && x*zoom - drawDistance < cameraX + canvasWidth && (y + height)*zoom + drawDistance > cameraY && y*zoom - drawDistance < cameraY + canvasHeight){
		return true;
	}
	return false;
}

function isCenteredObjVisible(x, y, width, height){
	if ((x + width/2)*zoom + drawDistance > cameraX && (x - width/2)*zoom - drawDistance < cameraX + canvasWidth && (y + height/2)*zoom + drawDistance > cameraY && (y-height/2)*zoom - drawDistance < cameraY + canvasHeight){
		return true;
	}
	return false;
}

rotateAndCache = function(image,angle) {
	var offscreenCanvas = document.createElement('canvas');
	var offscreenCtx = offscreenCanvas.getContext('2d');
  
	var size = Math.max(image.width, image.height);
	offscreenCanvas.width = size;
	offscreenCanvas.height = size;
  
	offscreenCtx.translate(size/2, size/2);
	offscreenCtx.rotate(angle + Math.PI/2);
	offscreenCtx.drawImage(image, -(image.width/2), -(image.height/2));
  
	return offscreenCanvas;
  }

var m_canvas = document.createElement('canvas');
var mCtx = m_canvas.getContext("2d", { alpha: false });

var block_canvas = document.createElement('canvas');
var blockCtx = block_canvas.getContext("2d", { alpha: true });

var torso_canvas = document.createElement('canvas');
var tCtx = torso_canvas.getContext("2d", { alpha: false });
torso_canvas.width = canvas.width;
torso_canvas.height = canvas.height;

var fpsCounter = 0;
var fpsInLastSecond = 0;
var updatesInLastSecond = 0;

//Client timer1 teimer1
function drawEverything(){
	// console.log(myPlayer.eliminationSpectate);
	// console.log(shop.active);
	if (chatSpam > 0)
		chatSpam--;
	//Don't draw anything if the user hasn't entered the game with a player id and name
	if (myPlayer.name == "" || !Player.list[myPlayer.id] || !clientInitialized)
		return;

	if (myPlayer.team == 0 || myPlayer.eliminationSpectate == true)
		updateSpectatingView();

	updateCamera();	
	noShadow();
	ctx.fillStyle = "#101010";
	ctx.fillRect(0, 0, canvasWidth, canvasHeight); 	
	
	drawMapCanvas();
	//drawBlackMarkets();
	drawMissingBags();
	drawBodies();	
	drawLegs();
	drawLaser();
	//drawBlockLasers();
	drawBlockCanvas();	
	drawLaserCanonLaser();
	drawWallBodies();
	drawPickups();
	drawBags();
	drawThugs();
	drawBoosts();
	drawTorsos();
	drawLaserChargingEffect();
	drawShots();
	drawBlood();
	drawSmashes();
	drawPlayerTags();
	drawNotifications();

	
	drawPersonalInstructions();
	drawShop();	
	drawUILayer();
	fpsCounter++;
}



//drawExperiments



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
// var fps, fpsInterval, startTime, now, then, elapsed;
// startAnimating(60);
// function startAnimating(fps) {
//     fpsInterval = 1000 / fps;
//     then = Date.now();
//     startTime = then;
//     animate();
// }
// function animate() {
//     // request another frame
//     requestAnimationFrame(animate);
//     // calc elapsed time since last loop
//     now = Date.now();
//     elapsed = now - then;

//     // if enough time has elapsed, draw the next frame
//     if (elapsed > fpsInterval) {
//         // Get ready for next frame by setting then=now, but...
//         // Also, adjust for fpsInterval not being multiple of 16.67
//         then = now - (elapsed % fpsInterval);
// 		drawEverything();
//     }
// }

// //Option4
// var HighResolutionTimer = function(options) {
//     this.timer = false;

//     this.total_ticks = 0;

//     this.start_time = undefined;
//     this.current_time = undefined;

//     this.duration = (options.duration) ? options.duration : 1000;
//     this.callback = (options.callback) ? options.callback : function() {};

//     this.run = function() {
//       this.current_time = Date.now();
//       if (!this.start_time) { this.start_time = this.current_time; }
      
//       this.callback(this);

// 	  var nextTick = this.duration - (this.current_time - (this.start_time + (this.total_ticks * this.duration) ) );
// 	  if (nextTick < this.duration - this.duration/2){nextTick = this.duration/2;}

// 	  this.total_ticks++;

//       (function(i) {
//         i.timer = setTimeout(function() {
//           i.run();
//         }, nextTick);
//       }(this));

//       return this;
//     };

//     this.stop = function(){
//       clearTimeout(this.timer);
//       return this;
//     };
    
//     return this;
// };
// const tickLengthMs = 1000/60;
// var _timer = HighResolutionTimer({
//     duration: tickLengthMs,
//     callback: drawEverything
// });
// _timer.run();
/////////////////////////////////////////////////////////////////////////////////////////
//Option 5
//PUT drawEverything() in socket.on('update') function


//--------------------------------END TIMER 1--------------------------------	
	
function setZoom(zoomLevel){
	zoom = zoomLevel;
	drawMapElementsOnMapCanvas();
	drawBlocksOnBlockCanvas();
}


var clientTimeoutSeconds = 45 * 1000;
var clientTimeoutTicker = clientTimeoutSeconds;
var newTipSeconds = 45;
var newTipTicker = newTipSeconds;
var reloadOnServerTimeout = false; //Server Afk
var countdownToRedrawGraphics = 0;

//EVERY 1 SECOND
setInterval( 
	function(){
		if (!gameOver && !pregame && myPlayer.team){timeInGame++;}
		if (countdownToRedrawGraphics != -1){
			countdownToRedrawGraphics++;
		}
		if (countdownToRedrawGraphics >= 7){
			countdownToRedrawGraphics = -1;
			logg("Redrawing map and blocks on timer");
			drawMapElementsOnMapCanvas();
			drawBlocksOnBlockCanvas();
			if (!customServer && !pregame)
				Thug.list = [];
		}
		if ((myPlayer.team == 0 || myPlayer.eliminationSpectate) && zoom != spectateZoom){
			setZoom(spectateZoom);
		}
		else if (myPlayer.team != 0 && !myPlayer.eliminationSpectate && zoom != defaultZoom) {
			setZoom(defaultZoom);
		}

		fpsInLastSecond = fpsCounter;
		fpsCounter = 0;

		if (reloadOnServerTimeout){
			clientTimeoutTicker--;
			if (clientTimeoutTicker < clientTimeoutSeconds - 5){
				logg("No server messages detected, " + clientTimeoutTicker + " until timeout");
			}
			if (clientTimeoutTicker < 1){
				forceToLeave = true;
				logg("ERROR: Server Timeout. Reloading page...");
				disconnect();
				location.reload();
				clientTimeoutTicker = clientTimeoutSeconds;
			}
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
			checkPreviousPingsAndShowPerfInstructions(true);
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

function checkPreviousPingsAndShowPerfInstructions(stopwatch = false){
	previousPing = ping; //Last ping
	//logg("ping:" + ping + " previousPing:" + previousPing + " stopwatch:" + stopwatch);

	if (ping >= 999 && previousPing >= 999 && !triggeredPerformanceTips && countdownToRedrawGraphics == -1){
		logg("PERFORMANCE ERROR: ping:" + ping + " previousPing:" + previousPing + ". Disconnecting and triggering performance tips.");
		show("unplayableHeader");
		triggeredPerformanceTips = true;

		//document.getElementById("closePerfInstructions").innerHTML = '<a href="' + serverHomePage + '" style="font-size: 16px;">I verify I have followed these instructions, and am ready to reload the game.</a>'
		//disconnect(); //Force disconnect

		show("performanceInstructions");
	}
}

function compare(a,b) {
  if (a.cashEarnedThisGame < b.cashEarnedThisGame)
    return 1;
  if (a.cashEarnedThisGame > b.cashEarnedThisGame)
    return -1;
  return 0;
}
	
	
//Socket On
socket.on('sendLog', function(msg){
	log("SERVER: " + msg);
});

socket.on('endGameProgressResults', function(endGameProgressResults){
	endGameProgressResultsFunction(endGameProgressResults);
});

function endGameProgressResultsFunction(endGameProgressResults){
	log("endGameProgressResults");
	console.log(endGameProgressResults);
	//Player.list[myPlayer.id].cashEarnedThisGame = endGameProgressResults.expDif;
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
	postGameReady = true;
}

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
	sprayBloodOntoTargetFunction(data);
});

function sprayBloodOntoTargetFunction(data){
	var scale = 1;
	if (Player.list[data.targetId]){
		if (getDirDif(data.shootingDir, Player.list[data.targetId].shootingDir) <= 1){
			scale = 1.5;
		}
		else if (getDirDif(data.shootingDir, Player.list[data.targetId].shootingDir) >= 3){
			scale = 0.6;
		}

	}
	Blood(data.targetX, data.targetY, data.shootingDir, scale);	
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
}

var Blood = function(x, y, direction, scale = 1){
	var self = {
		id:Math.random(),
		x:x,
		y:y,
		//width:84, full size
		//height:97, full size
		width:21,
		height:24.25,
		direction:direction,
		scale:scale,
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
		dir:0,
		
		
		width:Math.floor(10), //width:100, full size
		height:Math.floor(10), //height:100, full size
	}	
	if (Player.list[id] && Player.list[id].walkingDir){
		self.dir = Player.list[id].walkingDir;
	}
	BoostBlast.list[id] = self;		
}
BoostBlast.list = [];


socket.on('shootUpdate', function(shotData){	
	// log("new shot");
	// console.log(shotData);
	shootUpdateFunction(shotData);
});

function shootUpdateFunction(shotData){
	if (!myPlayer.x || !Player.list[shotData.playerId])
		return;

	var newShot = true; //To keep double shot sounds from playing when shooting diagonally (pressing 2 "shoot" keys at once)
	if (!Shot.list[shotData.id]){

		for (var s in Shot.list){
			if (Shot.list[s].playerId == shotData.playerId && Shot.list[s].weapon == shotData.weapon){newShot = false;}
		}
		shotData.decay = shotData.weapon == 5 ? 10 : 2;
		Shot.list[shotData.id] = shotData;

		Shot.list[shotData.id].width = Math.floor((Math.random() * 46) + 26);
		Shot.list[shotData.id].height = Math.floor((Math.random() * 45) + 65);
	}
	//Distance calc for volume
	var dx1 = myPlayer.x - Player.list[shotData.playerId].x;
	var dy1 = myPlayer.y - Player.list[shotData.playerId].y;
	var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
	var vol = Math.round((1 - (dist1 / 1000)) * 100)/100;
	if (vol < 0 && vol >= -.1)
		vol = 0.01;
	if (vol < -.1 || mute)
		vol = 0;

	if (newShot == true){
		if (Player.list[shotData.playerId].weapon == 3){
			if (shotData.playerId == myPlayer.id){
				sfxMGMine.volume(vol * .35);
				sfxMGMine.play();
				if (Player.list[shotData.playerId].MGClip <= 7){
					sfxClick.play();
				}
			}
			else {
				sfxMG.volume(vol * .35);
				sfxMG.play();	
			}
		}
		else if (Player.list[shotData.playerId].weapon == 2 && !mute) {
			if (shotData.playerId == myPlayer.id){
				sfxDPMine.volume(vol);
				sfxDPMine.play();	

				if (Player.list[shotData.playerId].DPClip <= 4){
					sfxClick.play();
				}
			}
			else {
				sfxDP.volume(vol);
				sfxDP.play();	
			}
		}
		else if (Player.list[shotData.playerId].weapon == 1) {
			if (shotData.playerId == myPlayer.id){				
				sfxPistolMine.volume(vol);
				sfxPistolMine.play();
				if (Player.list[shotData.playerId].PClip <= 4){
					sfxClick.play();
				}
			}
			else {
				sfxPistol.volume(vol);
				sfxPistol.play();	
			}
		}
		else if (Player.list[shotData.playerId].weapon == 5) {
			sfxLaserDischarge.volume(vol * 0.8);
			sfxLaserDischarge.play();
			if (dist1 < 1000){
				screenShakeCounter = 8;
			}
		}
		else if (Player.list[shotData.playerId].weapon == 4) {
			sfxSG.volume(vol);
			sfxSG.play();
			if (shotData.playerId == myPlayer.id && Player.list[shotData.playerId].SGClip <= 3 && !mute){
				sfxClick.play();
			}
			Player.list[shotData.playerId].triggerTapLimitTimer = SGTriggerTapLimitTimer;
		}
	}
	if (shotData.shootingDir){
		Player.list[shotData.playerId].shootingDir = shotData.shootingDir;
	}
}

// var Shot = function(playerId, decay = 2){
	
// 	var self = {
// 		id:Math.random(),
// 		playerId:playerId,
// 		distance:10000,
// 		decay:decay,
// 		spark:false,
// 		width:Math.floor((Math.random() * 46) + 26),   //36
// 		height:Math.floor((Math.random() * 45) + 65),  //55
// 	}	
// 	Shot.list[self.id] = self;		
// }
var Shot = {};
Shot.list = [];



// ---------------------------------- CREATE BODY -----------------------------
function createBody(targetX, targetY, pushSpeed, shootingDir, playerId){
	if (Body.list.length >= bodyLimit){
		Body.list.splice(0, 1);
	}	
	Body(targetX, targetY, shootingDir, playerId, pushSpeed);	

	if (!mute){
		var dx1 = myPlayer.x - targetX;
		var dy1 = myPlayer.y - targetY;
		var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
		var vol = (Math.round((1 - (dist1 / 1000)) * 100)/100) + .0; //Boost vol with this last num
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

var Body = function(x, y, direction, playerId, speed){
	var self = {
		id:Math.random(),
		x:x,
		y:y,
		speed:(speed + randomInt(5,15)),
		//width:84, full size
		//height:97, full size
		direction:direction,
		playerId:playerId,
		bodyRand: Math.floor((Math.random() * 4) + 1),
		age:0,
		poolHeight: Math.floor((Math.random() * 50) + 1),
		poolHeightMax: Math.floor((Math.random() * 100) + 80),
	}	
	Body.list.push(self);		
}
Body.list = [];




//---------------------------KEY INPUTS--------------------------------

//Key Presses
document.onkeydown = function(event){
	var hitKeyCode = event.keyCode;
	if (chatInput.style.display == "none" && hitKeyCode != 123){
		event.preventDefault();
	}
	if (myPlayer.settings){
		const keyHit = myPlayer.settings.keybindings.find(key => key.primary == event.keyCode || key.secondary == event.keyCode);
		if (keyHit && keyHit.default){
			hitKeyCode = keyHit.default;
		}
	}

	if(hitKeyCode === 87 && chatInput.style.display == "none"){ //W
		if (!myPlayer.pressingW && !shop.active){
			keyPress(87, true);
		}
		myPlayer.pressingW = true;
	}
	else if(hitKeyCode === 68 && chatInput.style.display == "none"){ //D
		if (!myPlayer.pressingD && !shop.active){
			keyPress(68, true);
		}
		myPlayer.pressingD = true;
	}
	else if(hitKeyCode === 83 && chatInput.style.display == "none"){ //S
		if (!myPlayer.pressingS && !shop.active){
			keyPress(83, true);
		}
		myPlayer.pressingS = true;
	}
	else if(hitKeyCode === 65 && chatInput.style.display == "none"){ //A
		if (!myPlayer.pressingA && !shop.active){
			keyPress(65, true);
		}
		myPlayer.pressingA = true;
	}		
	else if(hitKeyCode === 38 && chatInput.style.display == "none"){ //Up
		if (myPlayer.pressingUp != true){
			myPlayer.pressingUp = true;
			if (myPlayer.team != 0){
				if (!shop.active){
					keyPress(38, true);
				}
				else {
					purchase();
				}
			}
			else {
				if (!spectatePlayers){
				}
				else {
					getNextOrderedPlayer(spectatingPlayerId, true);
				}
			}
		}
	}
	else if(hitKeyCode === 39 && chatInput.style.display == "none"){ //Right
		if (myPlayer.pressingRight != true){
			myPlayer.pressingRight = true;
			if (myPlayer.team != 0){
				if (!shop.active){
					keyPress(39, true);
				}
				else if (shop.selection < 6) {
					shop.selection++;
					if (!mute)
						sfxMenuMove.play();
				}
			}
			else {
				if (!spectatePlayers){
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
		}
	}
	else if(hitKeyCode === 40 && chatInput.style.display == "none"){ //Down
		if (myPlayer.pressingDown != true){
			myPlayer.pressingDown = true;
			if (myPlayer.team != 0){
				if (!shop.active){
					keyPress(40, true);
				}
			}
			else {
				if (!spectatePlayers){
				}
				else {
					getNextOrderedPlayer(spectatingPlayerId, false);
				}
			}
		}
	}
	else if(hitKeyCode === 37 && chatInput.style.display == "none"){ //Left
		if (myPlayer.pressingLeft != true){
			myPlayer.pressingLeft = true;
			if (myPlayer.team != 0){
				if (!shop.active){
					keyPress(37, true);
				}
				else if (shop.selection > 1) {
					shop.selection--;
					if (!mute)
						sfxMenuMove.play();			
				}
			}	
			else {
				if (!spectatePlayers){
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
		}
	}	//Quick Chat
	else if (event.keyCode == 38 && chatInput.style.display != "none" && chatInput.value == ""){ //Up 
		const quickChat = myPlayer.settings.quickChat[0].value;
		if (quickChat){
			if (chatSpam < chatSpamThresh){
				chatSpam += chatSpamGain;
				socket.emit('chat',[myPlayer.id, quickChat]);
			}
			hideChatBox();
		}
	}
	else if (event.keyCode == 39 && chatInput.style.display != "none" && chatInput.value == ""){ //Right 
		const quickChat = myPlayer.settings.quickChat[1].value;
		if (quickChat){
			if (chatSpam < chatSpamThresh){
				chatSpam += chatSpamGain;
				socket.emit('chat',[myPlayer.id, quickChat]);
			}
			hideChatBox();
		}
	}
	else if (event.keyCode == 40 && chatInput.style.display != "none" && chatInput.value == ""){ //Down
		const quickChat = myPlayer.settings.quickChat[2].value;
		if (quickChat){
			if (chatSpam < chatSpamThresh){
				chatSpam += chatSpamGain;
				socket.emit('chat',[myPlayer.id, quickChat]);
			}
			hideChatBox();
		}
	}
	else if (event.keyCode == 37 && chatInput.style.display != "none" && chatInput.value == ""){ //Left
		const quickChat = myPlayer.settings.quickChat[3].value;
		if (quickChat){
			if (chatSpam < chatSpamThresh){
				chatSpam += chatSpamGain;
				socket.emit('chat',[myPlayer.id, quickChat]);
			}
			hideChatBox();
		}
	}

	else if(hitKeyCode === 32 && chatInput.style.display == "none" && !shop.active){ //Space
		keyPress(32, true);
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
	else if(hitKeyCode === 81 && chatInput.style.display == "none"){ //Q
		keyPress(81, true);
	}	
	else if(hitKeyCode === 69 && chatInput.style.display == "none"){ //E
		keyPress(69, true);
	}	
	else if(hitKeyCode === 82 && chatInput.style.display == "none" && !shop.active){ //R
		keyPress(82, true);
	}
	else if(hitKeyCode === 16 && chatInput.style.display == "none"){ //Shift
		myPlayer.pressingShift = true;
		camOffSet = shiftCamOffSet;
		diagCamOffSet = shiftDiagCamOffSet;
		camMaxSpeed = 300;
		keyPress(16, true);
	}
	else if(hitKeyCode === 49 && chatInput.style.display == "none"){ //1
		keyPress(49, true);
	}	
	else if(hitKeyCode === 50 && chatInput.style.display == "none"){ //2
		keyPress(50, true);
	}	
	else if(hitKeyCode === 51 && chatInput.style.display == "none"){ //3
		keyPress(51, true);
	}	
	else if(hitKeyCode === 52 && chatInput.style.display == "none"){ //4
		keyPress(52, true);
	}	
	else if(hitKeyCode === 53 && chatInput.style.display == "none"){ //5
		keyPress(53, true);
	}	
	
	else if(hitKeyCode === 13){ //Enter
		canvasDiv.style.backgroundColor="black";
		if (chatInput.style.display == "inline"){
			if (chatInput.value != "") {
				if (chatInput.value == './shadow' || chatInput.value == './shadows'){
					if (noShadows){
						noShadows = false;
					}
					else {
						noShadows = true;
					}
				}
				else if (chatInput.value == './zoom' || chatInput.value == './zoom1'){
					if (defaultZoom == 1){
						defaultZoom = 0.75;
					}
					else {
						defaultZoom = 1;
					}
					drawMapElementsOnMapCanvas();
					drawBlocksOnBlockCanvas();
				}
				else if (chatInput.value == './g' || chatInput.value == './graphics'){
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
 				else if (!localGame && chatInput.value != "[Team] " && chatInput.value != "[Team]"){
					if (chatSpam < chatSpamThresh){
						chatSpam += chatSpamGain;
						socket.emit('chat',[myPlayer.id, chatInput.value]);
					}		
				}
			}
			hideChatBox();
		}
		else if (chatInput.style.display == "none" && myPlayer.name != ""){
			if (shop.active){
				purchase();
			}
			else {
				showChatBox();
			}
		}
	}
	else if(hitKeyCode === 84){ //T
		canvasDiv.style.backgroundColor="black";
		if (chatInput.style.display == "inline"){
			//Do nothing
		}
		else if (chatInput.style.display == "none" && myPlayer.name != ""){
			showChatBox("[Team] ");
		}
	}
	else if(hitKeyCode === 27){ //Esc
		if (document.getElementById("performanceInstructions").style.display == "inline-block"){
			hide('performanceInstructions');
		}
		else {
			if (showStatOverlay == false && !shop.active){
				chatInput.value = '';
				chatInput.style.display = "none";
				showStatOverlay = true;
			}
			else if (showStatOverlay == true){
				showStatOverlay = false;
			}	
			shop.active = false;
		}
	}
	
	else if(hitKeyCode === 77 && chatInput.style.display == "none"){ //M //togglemute toggle mute
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
	else if(hitKeyCode === 71 && myPlayer.id && chatInput.style.display == "none"){ //"G" //G 
	}
	
	else if(hitKeyCode === 85 && myPlayer.id && chatInput.style.display == "none"){ //"U" //U (TESTING BUTTON) DEBUG BUTTON testing
		if (isLocal || myPlayer.eliminationSpectate || roundOver){	
			shop.active = true;
		}
	}
}//end key down

function keyPress(code, state){
	socket.emit('keyPress',{inputId:code,state:state});
}

//Key Up
document.onkeyup = function(event){
	var hitKeyCode = event.keyCode;
	if (myPlayer.settings){
		const keyHit = myPlayer.settings.keybindings.find(key => key.primary == event.keyCode || key.secondary == event.keyCode);
		if (keyHit && keyHit.default){
			hitKeyCode = keyHit.default;
		}
		else {
			return;
		}
	}

	if(hitKeyCode === 87){ //W
		myPlayer.pressingW = false;
		keyPress(87, false);
	}
	else if(hitKeyCode === 68){ //D
		myPlayer.pressingD = false;
		keyPress(68, false);
	}
	else if(hitKeyCode === 83){ //S
		myPlayer.pressingS = false;
		keyPress(83, false);
	}
	else if(hitKeyCode === 65){ //A
		myPlayer.pressingA = false;
		keyPress(65, false);
	}		
	else if(hitKeyCode === 38 && chatInput.style.display == "none"){ //Up
		myPlayer.pressingUp = false;
		keyPress(38, false);
	}
	else if(hitKeyCode === 39 && chatInput.style.display == "none"){ //Right
		myPlayer.pressingRight = false;
		keyPress(39, false);
	}
	else if(hitKeyCode === 40 && chatInput.style.display == "none"){ //Down
		myPlayer.pressingDown = false;
		keyPress(40, false);
	}
	else if(hitKeyCode === 37 && chatInput.style.display == "none"){ //Left
		myPlayer.pressingLeft = false;
		keyPress(37, false);
	}
	
	else if(hitKeyCode === 16){ //Shift
		myPlayer.pressingShift = false;
			camOffSet = 300;
			diagCamOffSet = 200;
			camMaxSpeed = 300;
			keyPress(16, false);
	}
	
	else if(hitKeyCode === 84 && chatInput.style.display == "none" && myPlayer.name != ""){ //T
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
	"Controlling weapons and armor is key to victory. Be aware of the spawn timers for pickups.",
	"Press [Enter] to use chat and taunt your foes!",
	"Stand still and press [Space] to use cloak. Press [Space] while moving to boost.",
	"Boosting into your opponents will cause heavy damage if you can hit them.",
	"Don't be racist.",
	"Like playing with one of your teammates? Search them on the homepage, and invite them to your party to stay teamed up!",
	"For best game performance, close all other browser tabs and applications."
];

function getNewTip(){
	if (!gameOver && document.getElementById("tipContent")){
		var newTip = tips[randomInt(0, tips.length-1)];
		document.getElementById("tipContent").innerHTML = newTip;
	}
}



//Handy handy functions

function getDirDif(shootingDirA, shootingDirB){
	var shootingDirAPlus = shootingDirA + 8;
	var shootingDirAMinus = shootingDirA - 8;

	if (Math.abs(shootingDirA - shootingDirB) <= Math.abs(shootingDirAPlus - shootingDirB) && Math.abs(shootingDirA - shootingDirB) <= Math.abs(shootingDirAMinus - shootingDirB)){
		return Math.abs(shootingDirA - shootingDirB);
	}
	else if (Math.abs(shootingDirAPlus - shootingDirB) <= Math.abs(shootingDirA - shootingDirB) && Math.abs(shootingDirAPlus - shootingDirB) <= Math.abs(shootingDirAMinus - shootingDirB)){
		return Math.abs(shootingDirAPlus - shootingDirB);
	}
	else {
		return Math.abs(shootingDirAMinus - shootingDirB);
	}
}

function showChatBox(prefix = "") {
	chatInput.value += prefix;
	chatInput.style.display = "inline";
	chatInput.focus();
	chatText.style.display = "inline-block"; 
	chatStale = 0;
}
function hideChatBox(){
	chatInput.value = '';
	chatInput.style.display = "none";
	chatStale = 0;
}


function hexToDarkness(H) {
	// Convert hex to RGB first
	let r = 0, g = 0, b = 0;
	if (H.length == 4) {
		r = "0x" + H[1] + H[1];
		g = "0x" + H[2] + H[2];
		b = "0x" + H[3] + H[3];
	} else if (H.length == 7) {
		r = "0x" + H[1] + H[2];
		g = "0x" + H[3] + H[4];
		b = "0x" + H[5] + H[6];
	}

	const darkness = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 100; 

	return darkness;
}

function hexToHSL(H) {
	// Convert hex to RGB first
	let r = 0, g = 0, b = 0;
	if (H.length == 4) {
		r = "0x" + H[1] + H[1];
		g = "0x" + H[2] + H[2];
		b = "0x" + H[3] + H[3];
	} else if (H.length == 7) {
		r = "0x" + H[1] + H[2];
		g = "0x" + H[3] + H[4];
		b = "0x" + H[5] + H[6];
	}
	// Then to HSL
	r /= 255;
	g /= 255;
	b /= 255;
	let cmin = Math.min(r,g,b),
		cmax = Math.max(r,g,b),
		delta = cmax - cmin,
		h = 0,
		s = 0,
		l = 0;

	if (delta == 0)
		h = 0;
	else if (cmax == r)
		h = ((g - b) / delta) % 6;
	else if (cmax == g)
		h = (b - r) / delta + 2;
	else
		h = (r - g) / delta + 4;

	h = Math.round(h * 60);

	if (h < 0)
		h += 360;

	l = (cmax + cmin) / 2;
	s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
	s = +(s * 100).toFixed(1);
	l = +(l * 100).toFixed(1); //Round to decimal place

	return "hsl(" + h + "," + s + "%," + l + "%)";
}

function hexToHSL(H) {
	// Convert hex to RGB first
	let r = 0, g = 0, b = 0;
	if (H.length == 4) {
	  r = "0x" + H[1] + H[1];
	  g = "0x" + H[2] + H[2];
	  b = "0x" + H[3] + H[3];
	} else if (H.length == 7) {
	  r = "0x" + H[1] + H[2];
	  g = "0x" + H[3] + H[4];
	  b = "0x" + H[5] + H[6];
	}
	// Then to HSL
	r /= 255;
	g /= 255;
	b /= 255;
	let cmin = Math.min(r,g,b),
		cmax = Math.max(r,g,b),
		delta = cmax - cmin,
		h = 0,
		s = 0,
		l = 0;
  
	if (delta == 0)
	  h = 0;
	else if (cmax == r)
	  h = ((g - b) / delta) % 6;
	else if (cmax == g)
	  h = (b - r) / delta + 2;
	else
	  h = (r - g) / delta + 4;
  
	h = Math.round(h * 60);
  
	if (h < 0)
	  h += 360;
  
	l = (cmax + cmin) / 2;
	s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
	s = +(s * 100).toFixed(1);
	l = +(l * 100).toFixed(1);
  
	return "hsl(" + h + "," + s + "%," + l + "%)";
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
var forceToLeave = false;

var timeInGame = 0;
window.onbeforeunload = function(){
	console.log("Leaving page");
	if (!gameOver && !pregame && !forceToLeave && !customServer && timeInGame > timeInGameRankingThresh) {
		return 'Are you sure you want to leave?'; //Leave site? unsaved changes
	}
	return;
};

socket.on('bootAfk', function(){
	forceToLeave = true;
	socket.disconnect();
	window.location.href = serverHomePage;
});

logg("game.js loaded");

//////////MODS///////////////

//Frog's Mouse Mod
let pressing = [];
var press=(c)=>{
    if (pressing[c]) return;
    document.dispatchEvent(new KeyboardEvent('keydown', {'keyCode': c})); pressing[c]=1
}; 
var release=(c)=>{
    if (!pressing[c]) return;
    document.dispatchEvent(new KeyboardEvent('keyup', {'keyCode': c})); pressing[c]=0
};

var mousepos = [0, 0];
var mouseangle = 0;
var dot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
document.onmousemove=(evt)=>{
    let rect = document.getElementById("ctx").getBoundingClientRect();
    mousepos = [((evt.clientX - rect.left)-centerX)/canvasHeight, ((evt.clientY - rect.top)-centerY)/canvasWidth]; // mouse
    mouseangle = Math.atan2(mousepos[1], mousepos[0]);
}

var mouseDown = 0;
document.onmousedown=(etx)=>{
    if (etx.button == 0) mouseDown = 1;
    else mouseDown = 0;
}
document.onmouseup=(etx)=>{
    mouseDown = 0;
}

var threshold = 0.4;

var update=()=>{
    if (mouseDown != 0) {

        if (Math.cos(mouseangle) < -threshold){
			if (!myPlayer.pressingLeft)
				press(37);
		} 
		else if (myPlayer.pressingLeft){
			release(37);
		}

        if (Math.sin(mouseangle) < -threshold){
			if (!myPlayer.pressingUp)
				press(38);
		} 
		else if (myPlayer.pressingUp){
			release(38);
		} 

		if (Math.cos(mouseangle) > threshold){ 
			if (!myPlayer.pressingRight)
				press(39);
		}
		else if (myPlayer.pressingRight){
			release(39);
		}

        if (Math.sin(mouseangle) > threshold){
			if (!myPlayer.pressingDown)
				press(40);
		} 
		else if (myPlayer.pressingDown){
			release(40);
		}
    } else {
		if (myPlayer.pressingLeft)
			release(37);
		if (myPlayer.pressingUp)
			release(38); 
		if (myPlayer.pressingRight)
			release(39);
		if (myPlayer.pressingDown)
	        release(40);
	}
	setTimeout(update, 1);
}
setTimeout(update, 1);

//Gamepad by Frog
var gamepad_lastsent = 0;
function gamepad() {
    if (navigator.getGamepads()[0] != null) {
        let movedir = [navigator.getGamepads()[0].axes[0], navigator.getGamepads()[0].axes[1]];
        let movedist = Math.sqrt(Math.hypot(movedir[0], movedir[1]));
        let moveangle = Math.atan2(movedir[1], movedir[0]);
        if (movedist > 0.6) {
            if (Math.cos(moveangle) > threshold) press(68)
            else release(68);
            if (Math.cos(moveangle) < -threshold) press(65) 
            else release(65);
    
            if (Math.sin(moveangle) > threshold) press(83) 
            else release(83);
            if (Math.sin(moveangle) < -threshold) press(87) 
            else release(87); 
        } else {
            release(68);
            release(65);
            release(83);
            release(87); 
        }
        let aimdir = [navigator.getGamepads()[0].axes[2], navigator.getGamepads()[0].axes[3]];
        let aimdist = Math.sqrt(Math.hypot(aimdir[0], aimdir[1]));
        let aimangle = (Math.atan2(aimdir[1], aimdir[0])/(Math.PI/4))*(Math.PI/4);
        if (aimdist > 0.7) {
            if (Math.cos(aimangle) > threshold) keyPress(39, true);
            else keyPress(39, false);
            if (Math.cos(aimangle) < -threshold) keyPress(37, true) 
            else keyPress(37, false);
    
            if (Math.sin(aimangle) > threshold) keyPress(40, true) 
            else keyPress(40, false);
            if (Math.sin(aimangle) < -threshold) keyPress(38, true) 
            else keyPress(38, false); 
        } else {
            keyPress(39, false);
            keyPress(37, false);
            keyPress(40, false);
            keyPress(38, false);
        }
        navigator.getGamepads()[0].buttons[7].pressed? press(32) : release(32); //R-Trig // Space
        navigator.getGamepads()[0].buttons[6].pressed? press(16) : release(16); //L-Trig // Shift
		
		//Face buttons
		if (navigator.getGamepads()[0].buttons[6].pressed) {
            navigator.getGamepads()[0].buttons[0].pressed? press(53) : release(53);
        } else {
			navigator.getGamepads()[0].buttons[0].pressed? press(52) : release(52); //A // 4
        }
        navigator.getGamepads()[0].buttons[1].pressed? press(50) : release(50); //B // 2
		navigator.getGamepads()[0].buttons[2].pressed? press(82) : release(82); //X // Reload
		navigator.getGamepads()[0].buttons[3].pressed? press(51) : release(51); //Y // 3

		//Shoulders
        navigator.getGamepads()[0].buttons[4].pressed? press(81) : release(81); //Weapon back
		navigator.getGamepads()[0].buttons[5].pressed? press(69) : release(69); //Weapon forward
		
        navigator.getGamepads()[0].buttons[9].pressed? press(27) : release(27);


        if ((navigator.getGamepads()[0].timestamp - gamepad_lastsent) > 500) {
            if (navigator.getGamepads()[0].buttons[12].pressed) {
                socket.emit('chat',[myPlayer.id,  myPlayer.settings.quickChat[0].value]);
                gamepad_lastsent = navigator.getGamepads()[0].timestamp;
            }
            if (navigator.getGamepads()[0].buttons[15].pressed) {
                socket.emit('chat',[myPlayer.id,  myPlayer.settings.quickChat[1].value]);
                gamepad_lastsent = navigator.getGamepads()[0].timestamp;
            }
            if (navigator.getGamepads()[0].buttons[13].pressed) {
                socket.emit('chat',[myPlayer.id,  myPlayer.settings.quickChat[2].value]);
                gamepad_lastsent = navigator.getGamepads()[0].timestamp;
            }
            if (navigator.getGamepads()[0].buttons[14].pressed) {
                socket.emit('chat',[myPlayer.id,  myPlayer.settings.quickChat[3].value]);
                gamepad_lastsent = navigator.getGamepads()[0].timestamp;
            }
        }
    } 


    setTimeout(gamepad, 1);
} gamepad();