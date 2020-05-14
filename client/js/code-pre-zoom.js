var debugTimer = 60;
var debugText = true;
//'use strict';
var socket = io();


//-----------------Config----------------------
var version = "v 0.1.17";
var clientTimeoutSeconds = 60;

var screenShakeScale = 0.5;
var drawDistance = 9000; 

//Offset is how many pixels away from the center the camera will go when aiming, greater value means player closer to edge of screen
var camOffSet = 300;
var diagCamOffSet = 200;
var camMaxSpeed = 300;
var zoom = 1;

var BODY_AGE = 1500;

var shopEnabled = false;

//-----------------Variables-------------------

//Document Variables and Initialization
var ctx = document.getElementById("ctx").getContext("2d");
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

var loginForm = document.getElementById("loginForm"); 
loginForm.style.display = "block";
var usernameText = document.getElementById("usernameText");
var passwordText = document.getElementById("passwordText"); 
var canvasDiv = document.getElementById("canvasDiv"); 
var signIn = document.getElementById("logIn"); 

//Initialize client-side code variables
var clientTimeoutTicker = clientTimeoutSeconds;
function normalShadow() {
	ctx.shadowColor = "black";
	ctx.shadowOffsetX = 3; 
	ctx.shadowOffsetY = 3;
	ctx.shadowBlur = 5;
}
function noShadow() {
	ctx.shadowColor = "black";
	ctx.shadowOffsetX = 0; 
	ctx.shadowOffsetY = 0;
	ctx.shadowBlur = 0;
}
function heavyCenterShadow() {
	ctx.shadowColor = "black";
	ctx.shadowOffsetX = 0; 
	ctx.shadowOffsetY = 0;
	ctx.shadowBlur = 20;
}
function smallCenterShadow() {
	ctx.shadowColor = "black";
	ctx.shadowOffsetX = 0; 
	ctx.shadowOffsetY = 0;
	ctx.shadowBlur = 3;
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

var whiteCaptures = 0;
var blackCaptures = 0;

var bagRedHomeX = 0;
var bagRedHomeY = 0;
var bagBlueHomeX = 0;
var bagBlueHomeY = 0;

var bagRed = {
	x:150,
	y:150,
	captured:false,
};

var bagBlue = {
	x:mapWidth - 150,
	y:mapHeight -150,
	captured:false,
};

var minutesLeft = "99";
var secondsLeft = "00";
var nextGameTimer = 0;

socket.on('populateLoginPage', function(leaderboard){
	//Leaderboard
	document.getElementById('tablePrint').innerHTML = leaderboard;	
});

var blinkOn = false;
socket.on('sendClock', function(secondsLeftPlusZeroData, minutesLeftData){
	minutesLeft = minutesLeftData;
	secondsLeft = secondsLeftPlusZeroData;

	//Border
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
		canvas.style.margin = "-2px";
		canvas.style.border = "2px solid #000000";
		if (myPlayer.health > 100){
			canvas.style.margin = "-5px";
			canvas.style.border = "5px solid #005b98";			
		}
		blinkOn = false;
	}

});

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

var healthFlashTimer = 100;

logg('Connected to server.');
//----------------Loading Images----------------
var Img = {};
Img.block = new Image();
Img.block.src = "/client/img/block.png";
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

Img.shot = new Image();
Img.shot.src = "/client/img/shot-streak.png";
Img.shotFlash = new Image();
Img.shotFlash.src = "/client/img/shot-flash.png";
Img.shotSpark = new Image();
Img.shotSpark.src = "/client/img/shot-spark.png";

Img.ammo9mm = new Image();
Img.ammo9mm.src = "/client/img/ammo-9mm-30.png";
Img.ammoMG = new Image();
Img.ammoMG.src = "/client/img/ammo-MG-60.png";
Img.ammoDP = new Image();
Img.ammoDP.src = "/client/img/ammo-double-9mm-30.png";
var ammoWidth = 0;
Img.infinity = new Image();
Img.infinity.src = "/client/img/infinity.png";

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


//-----------------------------Loading Sounds-------------------------------
var mute = false;

var sfxPistol = new Howl({src: ['client/sfx/pistol.mp3']});
var sfxMG = new Howl({src: ['client/sfx/mgShot.mp3']});
var sfxDP = new Howl({src: ['client/sfx/double_pistolsLoud.mp3']});
var sfxCapture = new Howl({src: ['client/sfx/capture1.mp3']});
var sfxHit1 = new Howl({src: ['client/sfx/hit1.mp3']});
//sfxHit1.volume(.5);
var sfxHit2 = new Howl({src: ['client/sfx/hit2.mp3']});
var sfxKill = new Howl({src: ['client/sfx/kill.mp3']});
sfxKill.volume(.8);
var sfxStealGood = new Howl({src: ['client/sfx/drumroll.mp3']});
var sfxStealBad = new Howl({src: ['client/sfx/steal2.mp3']});
sfxStealGood.volume(0.75);
sfxStealBad.volume(0.75);
var sfxBagGrab = new Howl({src: ['client/sfx/bagGrab.mp3']});
sfxBagGrab.volume(.6);
var sfxPistolReload = new Howl({src: ['client/sfx/pistolReload.mp3']});
var sfxMGReload = new Howl({src: ['client/sfx/MGReload.mp3']});
var sfxDPReload = new Howl({src: ['client/sfx/DPReload.mp3']});

var sfxPistolEquip = new Howl({src: ['client/sfx/Pistolequip2.mp3']});
var sfxDPEquip = new Howl({src: ['client/sfx/dpPick.mp3']});
var sfxMGEquip = new Howl({src: ['client/sfx/MGequip.mp3']});
var sfxClick = new Howl({src: ['client/sfx/click.mp3']});
var sfxHealthPackGrab = new Howl({src: ['client/sfx/healthPackGrab.mp3']});

var sfxPurchase = new Howl({src: ['client/sfx/purchase.mp3']});
var sfxError = new Howl({src: ['client/sfx/error2.mp3']});
var sfxMenuMove = new Howl({src: ['client/sfx/comp-beep.wav']});
sfxMenuMove.volume(.5);

var sfxWhoosh = new Howl({src: ['client/sfx/whoosh.mp3']});
sfxWhoosh.volume(.25);
var sfxPunch = new Howl({src: ['client/sfx/punch.mp3']});
var sfxCharge = new Howl({src: ['client/sfx/recharge-plus-halo.mp3']});
sfxCharge.volume(.7);
var sfxDecharge = new Howl({src: ['client/sfx/decharge-loud.mp3']});
sfxDecharge.volume(.6);
var sfxBoost = new Howl({src: ['client/sfx/boost5.mp3']});
var sfxBoostEmpty = new Howl({src: ['client/sfx/boostEmpty.mp3']});
sfxBoostEmpty.volume(1);

var sfxNextGameTimer = new Howl({src: ['client/sfx/haloStartBeeps.mp3']});

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
	}
	Player.list[id] = self;
}
Player.list = {};

socket.on('removePlayer', function(id){
	if (Player.list[id]){
		delete Player.list[id];
	}
});

//-----------------------------THUG INITIALIZATION-------------------------------
var Thug = function(id){
	var self = {
		id:0,
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
	}
	Block.list[id] = self;
}
Block.list = {};


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
	}
	Notification.list[self.id] = self;
}
Notification.list = {};


//----------------------Login-----------------

function userNameClick(){			
		usernameText.style.color = "#000000";
		if (usernameText.value == "Username"){usernameText.value = "";}		
}		
function passwordClick() {
	passwordText.style.color = "#000000";
	if (passwordText.value == "Password"){passwordText.value = ""; passwordText.type = "password";}
}

function signInClick(){
	if (usernameText.value != ""){
		socket.emit('signIn', {username:usernameText.value,password:passwordText.value});
	}
	else {usernameText.style.color = "red"; usernameText.value = 'Username';}		
}
function signUpClick(){
	if (usernameText.value != ""){
		socket.emit('signUp', {username:usernameText.value,password:passwordText.value});
	}
	else {usernameText.style.color = "red"; usernameText.value = 'Username';}	
}

socket.on('signInResponse', function(data){
	if(data.success){
		///////////////////////// INITIALIZE ////////////////////////		
		myPlayer.id = data.id;
		mapWidth = data.mapWidth;
		mapHeight = data.mapHeight;
		showCanvas();
		whiteCaptures = data.whiteCaptures;
		blackCaptures = data.blackCaptures;	
		logg("ID: " + myPlayer.id);
	}
	else {
		alert(data.message);
	}
});

loginForm.onsubmit = function(e){
	e.preventDefault();
}

socket.on('capture', function(team, dataWhiteCaptures, dataBlackCaptures){
	whiteCaptures = dataWhiteCaptures;
	blackCaptures = dataBlackCaptures;
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
	gameStartAlpha = 1.0;
	suddenDeathAlpha = 1.0;
});



/////////////////////////////// INITIALIZE /////////////////////////////////	
function showCanvas() {
	canvasDiv.style.display = '';
	document.getElementById("topBar").style.display = 'none';
	document.getElementById("mainContent").style.display = 'none';
}

//----------------Chat Functionality----------------

for (var i=0; i<chatText.childNodes[i].length; i++){
		chatText.childNodes[i].remove();
}
chatText.innerHTML = '<div>---Welcome to RW3000!---</div>';

socket.on('addToChat', function(data){
	var nodes = chatText.childNodes.length;
	for (var i=0; i<nodes - 6; i++){
		chatText.childNodes[i].remove();
	}
	chatText.innerHTML = chatText.innerHTML + '<div>' + data + '</div>';	
	chatStale = 0;		
});
socket.on('evalAnswer', function(data){
	logg(data);	
});

chatForm.onsubmit = function(e){
	e.preventDefault();
}

socket.on('sfx', function(sfx){
	eval(sfx + ".play();");	
});


//----------------Player Functionality----------------
socket.on('sendPlayerNameToClient',function(data){
	myPlayer.name = data;
	logg("My name is " + myPlayer.name + ".");
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
socket.on('update',function(playerDataPack, thugDataPack, pickupDataPack, notificationPack, updateEffectPack, miscPack){
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
			eval("Player.list[playerDataPack[i].id]." + playerDataPack[i].property + " = playerDataPack[i].value");
		}
		else {
			var player = Player(playerDataPack[i].id);
			eval("Player.list[playerDataPack[i].id]." + playerDataPack[i].property + " = playerDataPack[i].value");
		}
		

		//Update myPlayer AND create Player in local client PLayer list if they don't exist yet on this Client
		if (playerDataPack[i].id == myPlayer.id){
			eval("myPlayer." + playerDataPack[i].property + " = playerDataPack[i].value");
			if (playerDataPack[i].property == "health" && ((myPlayer.team == "black" && bagBlue.captured == false) || (myPlayer.team == "white" && bagRed.captured == false))){
				if (myPlayer.health > 100){
						canvas.style.margin = "-5px";
						canvas.style.border = "5px solid #005b98";			
				}
				else if (myPlayer.health < 100){
						canvas.style.margin = "-3px";
						canvas.style.border = "3px solid #000000";	
				}
			}
		}
		
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
			else if (vol < -.1)
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
			else if (vol < -.1)
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
			else if (vol < -.1)
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
		
		//play equip sfx
		if (playerDataPack[i].property == "weapon" && !mute){
			var dx1 = myPlayer.x - Player.list[playerDataPack[i].id].x;
			var dy1 = myPlayer.y - Player.list[playerDataPack[i].id].y;
			var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
			var vol = (Math.round((1 - (dist1 / 1000)) * 100)/100) - .3; // -.x is the Volume offset
			if (vol > 1)
				vol = 1;
			else if (vol < 0 && vol >= -.1)
				vol = 0.01;
			else if (vol < -.1)
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
			//Stop all reloading sfx upon weapon change
			sfxDPReload.stop();
			sfxMGReload.stop();
			sfxPistolReload.stop();
		}
	}//END Player loop

	for (var i = 0; i < pickupDataPack.length; i++) {
		if (typeof pickupDataPack[i] == "number"){
			if (debugUpdates){
				logg("Deleting pickup: " + pickupDataPack[i]);
			}
			if (Pickup.list[pickupDataPack[i]].id){
				delete Pickup.list[pickupDataPack[i]];
			}
		}
		else if (Pickup.list[pickupDataPack[i].id]){
			if (debugUpdates){
				logg("Update pickup:" + pickupDataPack[i].id + " x:" + pickupDataPack[i].x + " y:" + pickupDataPack[i].y + " type:" + pickupDataPack[i].type + " amount:" + pickupDataPack[i].amount + " width:" + pickupDataPack[i].width + " height:" + pickupDataPack[i].height);
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
			eval("Thug.list[thugDataPack[i].id]." + thugDataPack[i].property + " = thugDataPack[i].value");
		}
		else {
			var thug = Thug(thugDataPack[i].id);
			eval("Thug.list[thugDataPack[i].id]." + thugDataPack[i].property + " = thugDataPack[i].value");
		}
	}	
	
	for (var i = 0; i < notificationPack.length; i++) {
		if (notificationPack[i].text.includes("Stolen") && !mute){
			if (Player.list[notificationPack[i].playerId].team == myPlayer.team){
				sfxStealGood.play();
			}
			else {
				sfxStealBad.play();
			}
		}
		var notification = Notification(notificationPack[i].text,notificationPack[i].playerId);
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
				else if (vol < -.1)
					vol = 0;
				sfxBoost.volume(vol);
				sfxBoost.play();
			}
			
			
			
		} 				
		if (updateEffectPack[i].type == 7){ //chat
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
			logg("bagRed - x:" + miscPack.bagRed.x + " y:" + miscPack.bagRed.y + " captured:" + miscPack.bagRed.captured + " speed:" + miscPack.bagRed.speed);
		}		
	}
	if (miscPack.gameOver){
		gameOver = miscPack.gameOver;
		if (debugUpdates){
			logg("GameOver:" + miscPack.gameOver);
		}
	}
	if (miscPack.nextGameTimer){
		nextGameTimer = miscPack.nextGameTimer;
		if (nextGameTimer == 4){
			sfxNextGameTimer.play();
		}
	}
});

//Goes to only a single player
socket.on('updateInit',function(playerPack, thugPack, pickupPack, blockPack, miscPack){
	Player.list = [];
	for (var i = 0; i < playerPack.length; i++) {
		//Update myPlayer
		if (playerPack[i].id == myPlayer.id){
			myPlayer = playerPack[i];
		}
		if (Player.list[playerPack[i].id]){
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
	for (var i = 0; i < pickupPack.length; i++) { //!!! Why is this checking for pickuptype is string instead of number???
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
	gameOver = miscPack.gameOver;
	pregame = miscPack.pregame;
	if (miscPack.bagsHome && bagBlueHomeX == 0){
		bagBlueHomeX = miscPack.bagsHome.bagBlueHomeX;
		bagBlueHomeY = miscPack.bagsHome.bagBlueHomeY;
		bagRedHomeX = miscPack.bagsHome.bagRedHomeX;
		bagRedHomeY = miscPack.bagsHome.bagRedHomeY;
	}
	if (miscPack.shopEnabled){
		shopEnabled = miscPack.shopEnabled;
	}
	
	if (numPlayers != miscPack.numPlayers) {
		logg(miscPack.numPlayers + ' players here.');			
		numPlayers = miscPack.numPlayers;
	}		
});

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
		shop.uniqueText = "I SAID WE'RE FUCKING OUT OF STOCK!";
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
	
	ctx.save();
	
	//Calculate Camera //default center:450,400
	if(myPlayer.shootingDir == 1){targetCenterX = canvasWidth/2; targetCenterY = canvasHeight/2 + (camOffSet - 50);}
	if(myPlayer.shootingDir == 2){targetCenterX = canvasWidth/2 - (diagCamOffSet + 50); targetCenterY = canvasHeight/2 + diagCamOffSet;}
	if(myPlayer.shootingDir == 3){targetCenterX = canvasWidth/2 - camOffSet; targetCenterY = canvasHeight/2;}
	if(myPlayer.shootingDir == 4){targetCenterX = canvasWidth/2 - (diagCamOffSet + 50); targetCenterY = canvasHeight/2 - diagCamOffSet;}
	if(myPlayer.shootingDir == 5){targetCenterX = canvasWidth/2; targetCenterY = canvasHeight/2 - (camOffSet - 50);}
	if(myPlayer.shootingDir == 6){targetCenterX = canvasWidth/2 + (diagCamOffSet + 50); targetCenterY = canvasHeight/2 - diagCamOffSet;}
	if(myPlayer.shootingDir == 7){targetCenterX = canvasWidth/2 + camOffSet; targetCenterY = canvasHeight/2;}
	if(myPlayer.shootingDir == 8){targetCenterX = canvasWidth/2 + (diagCamOffSet + 50); targetCenterY = canvasHeight/2 + diagCamOffSet;}
	if(myPlayer.health <= 0){targetCenterX = canvasWidth/2; targetCenterY = canvasHeight/2} //If ded
	
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
		centerX -= ax1 * (dist1 / 40);
		centerY -= ay1 * (dist1 / 40);
	}	
	cameraX = myPlayer.x - centerX;
	cameraY = myPlayer.y - centerY;
	
	screenShake();

}

function updateCameraSimple(){
	ctx.save();
		centerX = canvasWidth/2;
		centerY = canvasHeight/2;
		cameraX = myPlayer.x - centerX;
		cameraY = myPlayer.y - centerY;
		screenShake();
}

function screenShake(){
	if (screenShakeCounter > 0) {
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
		screenShakeCounter--;
	}
}

//////////////// DRAW FUNCTIONS /////////////////////////////////////////////////////
function drawMap() {
	noShadow();
	ctx.clearRect(0,0,canvasWidth,canvasHeight); //Background ??? Do we need this? What color is it?
	var tile = Img.tile;
	var count = 0;
	for (var y = 0; y < mapHeight * zoom; y+=tile.height * zoom){
		for (var x = 0; x < mapWidth * zoom; x+=tile.width * zoom){
			var drawX = ((centerX - myPlayer.x * zoom)+x);
			var drawY = ((centerY - myPlayer.y * zoom)+y);
			//log ("drawXY " + drawX + "," + drawY); 
			count++;
			if (drawX > -Img.tile.width - drawDistance && drawX < canvasWidth + drawDistance && drawY > -Img.tile.height - drawDistance && drawY < canvasHeight + drawDistance){
				if (y <= 300 * zoom && x <= 300 * zoom){
					ctx.drawImage(Img.tileWhite, drawX, drawY, tile.width * zoom, tile.height * zoom);
				}
				else if (y >= (mapHeight - 600) * zoom && x >= (mapWidth - 600) * zoom){
					ctx.drawImage(Img.tileBlack, drawX, drawY, tile.width * zoom, tile.height * zoom);
				}
				else {
					ctx.drawImage(tile, drawX, drawY, tile.width * zoom, tile.height * zoom);
				}
			}
		}
	}
	
}

function drawBlackMarkets(){
	if (Player.list[myPlayer.id].team == "white"){
		if (centerX - myPlayer.x - 44 > -Img.bmDoorWhite.width - drawDistance && centerX - myPlayer.x - 44 < canvasWidth + drawDistance && centerY - myPlayer.y > -Img.bmDoorWhite.height - drawDistance && centerY - myPlayer.y < canvasHeight + drawDistance){
			ctx.drawImage(Img.bmDoorWhite, centerX - myPlayer.x - 44, centerY - myPlayer.y);
		}
	}
	else if (Player.list[myPlayer.id].team == "black"){
		if (centerX + mapWidth - myPlayer.x - Img.bmDoorBlack.width + 44 > -Img.bmDoorBlack.width - drawDistance && centerX + mapWidth - myPlayer.x - Img.bmDoorBlack.width + 44 < canvasWidth + drawDistance && centerY + mapHeight - myPlayer.y - Img.bmDoorBlack.height > -Img.bmDoorBlack.height - drawDistance && centerY + mapHeight - myPlayer.y - Img.bmDoorBlack.height < canvasHeight + drawDistance){
			ctx.drawImage(Img.bmDoorBlack, centerX + mapWidth - myPlayer.x - Img.bmDoorBlack.width + 44, centerY + mapHeight - myPlayer.y - Img.bmDoorBlack.height);
		}
	}
}

function drawBodies(){
	for (var i in Body.list) {
		var body = Body.list[i];
		body.age++;
		if (body.age > BODY_AGE){
			 delete Blood.list[body.id];
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
		
		
		if (centerX - Player.list[myPlayer.id].x + body.x > -75 - drawDistance && centerX - Player.list[myPlayer.id].x + body.x < 20 + canvasWidth + drawDistance && centerY - Player.list[myPlayer.id].y + body.y > -75 - drawDistance && centerY - Player.list[myPlayer.id].y + body.y < 20 + canvasHeight + drawDistance){		
			ctx.save();				
				ctx.translate(centerX+(body.x - myPlayer.x),centerY+(body.y - myPlayer.y)); //Center camera on controlled player
				ctx.rotate(rotate);
				ctx.globalAlpha = 0.8;			
				ctx.drawImage(Img.bloodPool, -body.poolHeight/2.8 + 5, -body.poolHeight/1.9, body.poolHeight/1.7, body.poolHeight);
				ctx.globalAlpha = 1;
				if (body.poolHeight < body.poolHeightMax - 1.5){
					var enlargePool = (body.poolHeightMax - body.poolHeight)/250;
					if (enlargePool > .35){enlargePool = .35;}
					body.poolHeight += enlargePool;
				}
				else {
					body.poolHeight = body.poolHeightMax;
				}
				ctx.drawImage(img, -img.width/2, -img.height/2);
			ctx.restore();	
		}		
	}
}

function drawMissingBags(){
	if (bagRed.x != bagRedHomeX && bagRed.y != bagRedHomeY){
		if (centerX - myPlayer.x + bagRedHomeX - Img.bagMissing.width/2 > -Img.bagMissing.width - drawDistance && centerX - myPlayer.x + bagRedHomeX - Img.bagMissing.width/2 < canvasWidth + drawDistance && centerY - myPlayer.y + bagRedHomeY - Img.bagMissing.height/2 > -Img.bagMissing.height - drawDistance && centerY - myPlayer.y + bagRedHomeY - Img.bagMissing.height/2 < canvasHeight + drawDistance){
			ctx.drawImage(Img.bagMissing, centerX - myPlayer.x + bagRedHomeX - Img.bagMissing.width/2, centerY - myPlayer.y + bagRedHomeY - Img.bagMissing.height/2);
		}
	}
	if (bagBlue.x != bagBlueHomeX && bagBlue.y != bagBlueHomeY){
		if (centerX - myPlayer.x + bagBlueHomeX - Img.bagMissing.width/2 > -Img.bagMissing.width - drawDistance && centerX - myPlayer.x + bagBlueHomeX - Img.bagMissing.width/2 < canvasWidth + drawDistance && centerY - myPlayer.y + bagBlueHomeY - Img.bagMissing.height/2 > -Img.bagMissing.height - drawDistance && centerY - myPlayer.y + bagBlueHomeY - Img.bagMissing.height/2 < canvasHeight + drawDistance){
			ctx.drawImage(Img.bagMissing, centerX - myPlayer.x + bagBlueHomeX - Img.bagMissing.width/2, centerY - myPlayer.y + bagBlueHomeY - Img.bagMissing.height/2);
		}
	}
}

function drawLegs(){
	normalShadow();
	for (var i in Player.list) {
		if (Player.list[i].health > 0){
			if (Player.list[i].x + 47 + drawDistance > cameraX && Player.list[i].x - 47 - drawDistance < cameraX + canvasWidth && Player.list[i].y + 47 + drawDistance > cameraY && Player.list[i].y - 47 - drawDistance < cameraY + canvasHeight){
				if (Player.list[i].walkingDir == 0){Player.list[i].legHeight = 0; continue;} //If not moving, don't draw legs

				var legs = Img.whitePlayerLegs;
				if (Player.list[i].legHeight < 0 && Player.list[i].team == "white"){legs = Img.whitePlayerLegs2;}			
				if (Player.list[i].legHeight >= 0 && Player.list[i].team == "black"){legs = Img.blackPlayerLegs;}
				if (Player.list[i].legHeight < 0 && Player.list[i].team == "black"){legs = Img.blackPlayerLegs2;}
				
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
					ctx.translate(centerX - myPlayer.x + Player.list[i].x, centerY - myPlayer.y + Player.list[i].y); //Center camera on controlled player
					normalShadow();
					ctx.rotate(getRotation(Player.list[i].walkingDir));
					
					//if walking dir different than shooting dir, calculate different rotation for legs than body
					var weaponYoffset = 0;
					if (Player.list[i].weapon == 3){weaponYoffset = 5;}
					if (Player.list[i].shootingDir != Player.list[i].walkingDir){		
						ctx.drawImage(legs,-width/2 + twistOffset, -Player.list[i].legHeight/2 + 5, width, Player.list[i].legHeight);
					}
					else { 
						//Only draw legs in this context (shooting direction rotation context) if walking and shooting dirs match (5 lower)
						ctx.drawImage(legs,-width/2 + twistOffset, -Player.list[i].legHeight/2 + weaponYoffset, width, Player.list[i].legHeight);
					}
				ctx.restore();
			}
		}		
	}
}

function drawBlocks(){
	for (var i in Block.list) {
		if (centerX - myPlayer.x + Block.list[i].x > -Block.list[i].width - drawDistance && centerX - myPlayer.x + Block.list[i].x < canvasWidth + drawDistance && centerY - myPlayer.y + Block.list[i].y > -Block.list[i].height - drawDistance && centerY - myPlayer.y + Block.list[i].y < canvasHeight + drawDistance){
			ctx.drawImage(Img.block, centerX - myPlayer.x + Block.list[i].x, centerY - myPlayer.y + Block.list[i].y, Block.list[i].width, Block.list[i].height);				
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
	
	ctx.save();
	for (var i in Pickup.list) {
		if (centerX - myPlayer.x + Pickup.list[i].x > -Img.pickupDP.width - drawDistance && centerX - myPlayer.x + Pickup.list[i].x < canvasWidth + drawDistance && centerY - myPlayer.y + Pickup.list[i].y > -Img.pickupDP.height - drawDistance && centerY - myPlayer.y + Pickup.list[i].y < canvasHeight + drawDistance){
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
			ctx.drawImage(pickupImg, centerX - myPlayer.x + Pickup.list[i].x, centerY - myPlayer.y + Pickup.list[i].y);
			
			if (Pickup.list[i].respawnTimer == 0){				
				if (pickupFlash < 0){
					ctx.globalAlpha = 0;
				}
				else {
					ctx.globalAlpha = pickupFlash.toFixed(2);
				}
				ctx.drawImage(pickupImg2, centerX - myPlayer.x + Pickup.list[i].x, centerY - myPlayer.y + Pickup.list[i].y);
			}
			else if (!gameOver){
				//Draw respawn timer
				ctx.globalAlpha = 1;
				ctx.textAlign = "center";
				ctx.font = '18px Electrolize';
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
				ctx.shadowBlur = 6;
				ctx.strokeText(Pickup.list[i].respawnTimer, centerX - myPlayer.x + Pickup.list[i].x + Pickup.list[i].width/2, centerY - myPlayer.y + Pickup.list[i].y + Pickup.list[i].height/2 + 7);
				ctx.fillText(Pickup.list[i].respawnTimer, centerX - myPlayer.x + Pickup.list[i].x + Pickup.list[i].width/2, centerY - myPlayer.y + Pickup.list[i].y + Pickup.list[i].height/2 + 7); //Draw respawn timer on hidden pickup
				ctx.fillStyle="black";
			}
		}
	}
	ctx.restore();				
}

function drawBags(){
	if (bagRed.captured == false){
		if (centerX - myPlayer.x + bagRed.x - Img.bagRed.width/2 > -Img.bagRed.width - drawDistance && centerX - myPlayer.x + bagRed.x - Img.bagRed.width/2 < canvasWidth + drawDistance && centerY - myPlayer.y + bagRed.y - Img.bagRed.height/2 > -Img.bagRed.height - drawDistance && centerY - myPlayer.y + bagRed.y - Img.bagRed.height/2 < canvasHeight + drawDistance){
			ctx.drawImage(Img.bagRed, centerX - myPlayer.x + bagRed.x - Img.bagRed.width/2, centerY - myPlayer.y + bagRed.y - Img.bagRed.height/2);
		}
	}
	if (bagBlue.captured == false){
		if (centerX - myPlayer.x + bagBlue.x - Img.bagBlue.width/2 > -Img.bagBlue.width - drawDistance && centerX - myPlayer.x + bagBlue.x - Img.bagBlue.width/2 < canvasWidth + drawDistance && centerY - myPlayer.y + bagBlue.y - Img.bagBlue.height/2 > -Img.bagBlue.height - drawDistance && centerY - myPlayer.y + bagBlue.y - Img.bagBlue.height/2 < canvasHeight + drawDistance){
			ctx.drawImage(Img.bagBlue, centerX - myPlayer.x + bagBlue.x - Img.bagBlue.width/2, centerY - myPlayer.y + bagBlue.y - Img.bagBlue.height/2);
		}
	}
}

function drawTorsos(){
	for (var i in Player.list) {		
		if (Player.list[i].health > 0){
			if (Player.list[i].x + 47 + drawDistance > cameraX && Player.list[i].x - 47 - drawDistance < cameraX + canvasWidth && Player.list[i].y + 47 + drawDistance > cameraY && Player.list[i].y - 47 - drawDistance < cameraY + canvasHeight){
				var img = Img.whitePlayerPistol;
				if (Player.list[i].weapon == 2){
					img = Img.whitePlayerDP;
				}
				else if (Player.list[i].weapon == 3){
					img = Img.whitePlayerMG;
				}
				if (Player.list[i].team == "black"){
					if (Player.list[i].weapon == 3){
						img = Img.blackPlayerMG;
					}
					else if (Player.list[i].weapon == 2){
						img = Img.blackPlayerDP;
					}
					else {
						img = Img.blackPlayerPistol;
					}
				}
				
				ctx.save();		
					ctx.translate(centerX - myPlayer.x + Player.list[i].x, centerY - myPlayer.y + Player.list[i].y); //Center camera on controlled player			
					ctx.rotate(getRotation(Player.list[i].shootingDir));
									
					//draw bag on players back
					if (Player.list[i].holdingBag == true && Player.list[i].team == "white"){
						ctx.save();
							ctx.translate(5,5);
							ctx.rotate(315*Math.PI/180);
							ctx.drawImage(Img.bagBlue, -Img.bagBlue.width/2, -Img.bagBlue.height/2); 
						ctx.restore();
					}
					else if (Player.list[i].holdingBag == true && Player.list[i].team == "black"){
						ctx.save();
							ctx.translate(5,5);
							ctx.rotate(315*Math.PI/180);
							ctx.drawImage(Img.bagRed, -Img.bagRed.width/2, -Img.bagRed.height/2); 
						ctx.restore();
					}			
					
					////RELOADING////
					if (Player.list[i].reloading > 0){
						Player.list[i].reloading--;
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
					}
					
					//Player damage flashing under
					if (Player.list[i].health < 100){
						healthFlashTimer--;
						if (healthFlashTimer <= 3){
							ctx.shadowColor = "red";
							ctx.shadowOffsetX = 0; 
							ctx.shadowOffsetY = 0;
							ctx.shadowBlur = 20;
						}
						if (Player.list[i].health < 30 && healthFlashTimer > 3 && healthFlashTimer <= 6){
							ctx.shadowColor = "white";
							ctx.shadowOffsetX = 0; 
							ctx.shadowOffsetY = 0;
							ctx.shadowBlur = 20;
						}
						if (healthFlashTimer <= 0 || healthFlashTimer > Player.list[i].health){
							//healthFlashTimer = Player.list[i].health * .75; 						
						}
					}
					
					ctx.drawImage(img,-img.width/2, -img.height/2+5); //draw player body draw body upper body				
					noShadow();

					//Player damage flashing over
					if (Player.list[i].health < 100){
						healthFlashTimer--;
						if (healthFlashTimer <= 3){
							ctx.drawImage(Img.redFlash,-img.width/2, -img.height/2+5);
						}
						if (Player.list[i].health < 30 && healthFlashTimer > 3 && healthFlashTimer <= 6){
							ctx.drawImage(Img.whiteFlash,-img.width/2, -img.height/2+5);
						}
						if (healthFlashTimer <= 0 || healthFlashTimer > Player.list[i].health){
							healthFlashTimer = Player.list[i].health; 						
						}
					}
						
					//Strap
					if (Player.list[i].holdingBag == true){
						if (Player.list[i].weapon == 1 || Player.list[i].weapon == 2){ctx.drawImage(Img.bagBlueStrap,-(img.width/2),-(img.height/2)+5);}
						else if (Player.list[i].weapon == 3){ctx.drawImage(Img.bagBlueStrap,-(img.width/2),-(img.height/2)+10);}
					}				

				ctx.restore();
			}
		}//End health > 0 check
	} //End player for loop
}

function drawThugs(){
	for (var i in Thug.list){
		if (Thug.list[i].x + 47 + drawDistance > cameraX && Thug.list[i].x - 47 - drawDistance < cameraX + canvasWidth && Thug.list[i].y + 47 + drawDistance > cameraY && Thug.list[i].y - 47 - drawDistance < cameraY + canvasHeight){
			ctx.save();	
				
				ctx.translate(centerX+(Thug.list[i].x - myPlayer.x),centerY+(Thug.list[i].y - myPlayer.y)); //Center camera on controlled player
				ctx.rotate(Thug.list[i].rotation);
				
				var img = Img.blackThugTorso;
				
				if (Thug.list[i].team == "black"){
					legs = Img.blackThugLegs;
					if (Thug.list[i].legHeight < 0){legs = Img.blackThugLegs2;}
					img = Img.blackThugTorso;
				}
				else if (Thug.list[i].team == "white"){
					legs = Img.whiteThugLegs;
					if (Thug.list[i].legHeight < 0){legs = Img.whiteThugLegs2;}
					img = Img.whiteThugTorso;
				}

				ctx.drawImage(legs, -img.width/2, -Thug.list[i].legHeight/2, img.width, Thug.list[i].legHeight);
				ctx.rotate(Thug.list[i].legHeight/400);
				ctx.drawImage(img, -img.width/2, -img.height/2);
				
			ctx.restore();				
		}
	}
}

function drawShots(){
	for (var i in Player.list) {
		if (Shot.list[Player.list[i].id]){
			var shot = Shot.list[Player.list[i].id];			
			if (shot.decay > 0){
				ctx.save();
					ctx.translate(centerX - myPlayer.x + Player.list[i].x, centerY - myPlayer.y + Player.list[i].y); //Center camera on controlled player
					ctx.rotate(getRotation(Player.list[i].shootingDir));
					noShadow();
					var xOffset = 0;
					var yOffset = 0;
					if (Player.list[i].weapon == 3){xOffset = 6; yOffset = -3;}
					if (Player.list[i].weapon == 2){xOffset = -3; yOffset = 0;}
					ctx.drawImage(Img.shot,-4 + xOffset,-shot.distance - 40 + yOffset, Img.shot.width, shot.distance);
					ctx.drawImage(Img.shotFlash, xOffset - shot.width/2 - 2, yOffset - 34 - shot.height, shot.width, shot.height);
					ctx.drawImage(Img.shotSpark,-22 + xOffset, -shot.distance - 60);					
					if (Player.list[i].weapon == 2){
						xOffset = 6; yOffset = -1;
						ctx.drawImage(Img.shot,-4 + xOffset,-shot.distance - 40 + yOffset, Img.shot.width, shot.distance);
						ctx.drawImage(Img.shotFlash, xOffset - shot.width/2 - 2, yOffset - 34 - shot.height, shot.width, shot.height);
						ctx.drawImage(Img.shotSpark,-22 + xOffset, -shot.distance - 60);					
					}
				ctx.restore();
			}
			shot.decay--;
			if (shot.decay <= 0){delete Shot.list[Player.list[i].id];}
		} 
	}
}

function drawBoosts(){
	for (var i in Player.list) {
		if (Player.list[i].x + 47 + drawDistance > cameraX && Player.list[i].x - 47 - drawDistance < cameraX + canvasWidth && Player.list[i].y + 47 + drawDistance > cameraY && Player.list[i].y - 47 - drawDistance < cameraY + canvasHeight){
			if (BoostBlast.list[Player.list[i].id]){
				ctx.save();
					var blast = BoostBlast.list[Player.list[i].id];
					var blastDir = Player.list[i].walkingDir - 4;
					if (blastDir < 1) 
							blastDir += 8;
					var imgblast = Img.boostBlast;
					
					noShadow();
					ctx.globalAlpha = blast.alpha;
					blast.alpha -= .2;
					
					var distanceOffset = blast.width;
					
					ctx.translate(centerX - myPlayer.x + Player.list[i].x, centerY - myPlayer.y + Player.list[i].y); //Center camera on controlled player
					ctx.rotate(getRotation(blastDir));
					ctx.drawImage(imgblast, -blast.width/2 - 15, -blast.height - 10, blast.width, blast.height);
					ctx.drawImage(imgblast, -blast.width/2 + 15, -blast.height - 10, blast.width, blast.height);

					blast.width = blast.width + 20 * 1;
					blast.height = blast.height + 20 * 1;
					if (blast.alpha <= 0){
						delete BoostBlast.list[blast.id];
					}		
				ctx.restore();
			}
		}
	}
}

function drawBlood(){
	noShadow();	
	for (var i in Blood.list) {
		if (Blood.list[i].x + 100 + drawDistance > cameraX && Blood.list[i].x - 100 - drawDistance < cameraX + canvasWidth && Blood.list[i].y + 100 + drawDistance > cameraY && Blood.list[i].y - 100 - drawDistance < cameraY + canvasHeight){

			var blood = Blood.list[i];
			var rotate = getRotation(blood.direction);
			
			var bloodRand = blood.bloodRand;
			var imgBlood = Img.blood1;
			if (bloodRand == 2){imgBlood = Img.blood2;}
			else if (bloodRand == 3){imgBlood = Img.blood3;}
			else if (bloodRand == 4){imgBlood = Img.blood4;}
			
			ctx.save();				
				ctx.translate(centerX+(blood.x - myPlayer.x),centerY+(blood.y - myPlayer.y)); //Center camera on controlled player
				ctx.rotate(rotate);
				var minusAlpha = (Number(Math.round(((blood.width - 100) / 150)+'e1')+'e-1'));
				if (minusAlpha > 1){minusAlpha = 1;}
				ctx.globalAlpha = 1 - minusAlpha;
				ctx.drawImage(imgBlood, -blood.width/2, -blood.height+25, blood.width, blood.height);
			ctx.restore();
			
			blood.width = blood.width + 21 * 1.2;
			blood.height = blood.height + 24.25 * 1.2;
			if (blood.width >= 350){
				delete Blood.list[blood.id];
			}		
		}
	}
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
			ctx.translate(centerX+(smash.x - myPlayer.x),centerY+(smash.y - myPlayer.y)); //Center camera on controlled player
			var minusAlpha = (Number(Math.round(((smash.width - 100) / 150)+'e1')+'e-1'));
			if (minusAlpha > 1){minusAlpha = 1;}
			ctx.globalAlpha = 1 - minusAlpha;
			ctx.drawImage(imgsmash, -smash.width/2, -smash.height/2, smash.width, smash.height);
		ctx.restore();
		
		smash.width = smash.width + 20 * 1.2;
		smash.height = smash.height + 20 * 1.2;
		if (smash.width >= 150){
			delete Smash.list[smash.id];
		}		
	}
}

function drawNotifications(){	
	for (var n in Notification.list){
		var notification = Notification.list[n];
		ctx.globalAlpha = 1 - ((notification.age / 50) - 0.7);
		if (ctx.globalAlpha <= 0){
			delete Notification.list[notification.id];
			ctx.globalAlpha = 1;
			continue;
		}
		notification.age++;
		if (Player.list[notification.playerId].x + 47 + drawDistance > cameraX && Player.list[notification.playerId].x - 47 - drawDistance < cameraX + canvasWidth && Player.list[notification.playerId].y + 47 + drawDistance > cameraY && Player.list[notification.playerId].y - 47 - drawDistance < cameraY + canvasHeight){
			var noteFontSize = 60 - notification.age * 2;
			if (noteFontSize < 20){noteFontSize = 20;}
			ctx.save();	
				ctx.translate(centerX+(Player.list[notification.playerId].x - myPlayer.x),centerY+(Player.list[notification.playerId].y - myPlayer.y)); //Center camera on controlled player
				noShadow();
				ctx.lineWidth=4;
				ctx.fillStyle="#19BE44";
				ctx.font = 'bold ' + noteFontSize + 'px Electrolize';
				ctx.strokeText(notification.text,0, -Img.whitePlayerPistol.height/2 - notification.age/1.5 + 25);
				ctx.fillText(notification.text,0, -Img.whitePlayerPistol.height/2 - notification.age/1.5 + 25);
			ctx.restore();
		}
	}
	ctx.globalAlpha = 1;
	////!!!Issues with fading (globalAlpha) of notifications if there are 2 notifications displaying at the same time (start at slightly different times)
}

function drawPlayerTags(){
	ctx.fillStyle = "#000000";
	ctx.textAlign="center";
	ctx.font = 'bold 12px Electrolize';
	for (var i in Player.list){
		if (Player.list[i].x + 47 + drawDistance > cameraX && Player.list[i].x - 47 - drawDistance < cameraX + canvasWidth && Player.list[i].y + 47 + drawDistance > cameraY && Player.list[i].y - 47 - drawDistance < cameraY + canvasHeight){
			ctx.save();			
				ctx.translate(centerX - myPlayer.x + Player.list[i].x, centerY - myPlayer.y + Player.list[i].y); //Center camera on controlled player
				if (Player.list[i].health > 0){
					ctx.shadowColor = "white";
					ctx.shadowOffsetX = 0; 
					ctx.shadowOffsetY = 0;
					ctx.shadowBlur = 4;
					ctx.fillText(Player.list[i].name,0, -Img.whitePlayerPistol.height/2); //Draw myPlayer name above head, draw username				
				}			
				if (Player.list[i].chat && Player.list[i].chatDecay > 0){
					if (Player.list[i].chat.length > 0){
						Player.list[i].chatDecay--;
						smallCenterShadow();
						ctx.font = '16px Electrolize';
						ctx.fillStyle="#FFFFFF";
						ctx.fillText(Player.list[i].chat,0, -Img.whitePlayerPistol.height/2 - 20); //Draw chats above head
					}
				}
			ctx.restore();
		}
	}
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

		ctx.drawImage(Img.black50, 50 + teamBlackMarketXOffset, 0, 495, canvasHeight);
		ctx.drawImage(Img.shopInventory, 124 + teamBlackMarketXOffset, 250 + inventoryYoffset);
		ctx.drawImage(Img.upArrow, 249 + moveArrow + teamBlackMarketXOffset, 175 + inventoryYoffset - shop.purchaseEffectTimer);
		ctx.drawImage(Img.downArrow, 207 + teamBlackMarketXOffset, 370 + inventoryYoffset);
		ctx.drawImage(Img.leftArrow, leftArrowX + teamBlackMarketXOffset, 275 + inventoryYoffset);
		ctx.drawImage(Img.rightArrow, rightArrowX + teamBlackMarketXOffset, 275 + inventoryYoffset);


		var alph = (leftArrowX - 66) / 10;
		if (alph < 0){
			alph = 0;
		}	
		ctx.globalAlpha = alph;
		if (shop.selection == 1){
			ctx.drawImage(Img.shopMG2, 123 + teamBlackMarketXOffset, 250 + inventoryYoffset);
			ownerText1 = "Fully automatic machine gun.";
			ownerText2 = "60 rounds for $" + shop.price1 + ".";
			if (shop.purchaseEffectTimer > 0){
				ctx.globalAlpha = .8;
				if (shop.uniqueText != "Heh heh heh heh... Thank you.")
					ctx.drawImage(Img.red,127 + teamBlackMarketXOffset, 254 + inventoryYoffset)
				else
					ctx.drawImage(Img.white,127 + teamBlackMarketXOffset, 254 + inventoryYoffset)
			}			
		}
		else if (shop.selection == 2){
			ctx.drawImage(Img.shopSG2, 192 + teamBlackMarketXOffset, 250 + inventoryYoffset);
			ownerText1 = "Currently sold out of Shotguns.";
			if (shop.purchaseEffectTimer > 0){
				ctx.globalAlpha = .8;
				if (shop.uniqueText != "Heh heh heh heh... Thank you.")
					ctx.drawImage(Img.red,196 + teamBlackMarketXOffset, 254 + inventoryYoffset)
				else
					ctx.drawImage(Img.white,196 + teamBlackMarketXOffset, 254 + inventoryYoffset)
			}
		}
		else if (shop.selection == 3){
			ctx.drawImage(Img.shopDP2, 261 + teamBlackMarketXOffset, 250 + inventoryYoffset);
			ownerText1 = "Two pistols instead of one. Double your firepower.";
			ownerText2 = "40 rounds for $" + shop.price3 + ".";
			if (shop.purchaseEffectTimer > 0){
				ctx.globalAlpha = .8;
				if (shop.uniqueText != "Heh heh heh heh... Thank you.")
					ctx.drawImage(Img.red,265 + teamBlackMarketXOffset, 254 + inventoryYoffset)
				else
					ctx.drawImage(Img.white,265 + teamBlackMarketXOffset, 254 + inventoryYoffset)
			}
		}
		else if (shop.selection == 4){
			ctx.drawImage(Img.shopBA2, 330 + teamBlackMarketXOffset, 250 + inventoryYoffset);
			ownerText1 = "Extra damage protection.";
			ownerText2 = "Temporarily increases HP by 100.";
			if (shop.purchaseEffectTimer > 0){
				ctx.globalAlpha = .8;
				if (shop.uniqueText != "Heh heh heh heh... Thank you.")
					ctx.drawImage(Img.red,334 + teamBlackMarketXOffset, 254 + inventoryYoffset)
				else
					ctx.drawImage(Img.white,334 + teamBlackMarketXOffset, 254 + inventoryYoffset)
			}
		}
		else if (shop.selection == 5){
			ctx.drawImage(Img.shopEB2, 399 + teamBlackMarketXOffset, 250 + inventoryYoffset);
			ownerText1 = "Extends your battery capacity."
			ownerText2 = "Increases energy by 100%.";
			if (shop.purchaseEffectTimer > 0){
				ctx.globalAlpha = .8;
				if (shop.uniqueText != "Heh heh heh heh... Thank you.")
					ctx.drawImage(Img.red,403 + teamBlackMarketXOffset, 254 + inventoryYoffset)
				else
					ctx.drawImage(Img.white,403 + teamBlackMarketXOffset, 254 + inventoryYoffset)
			}
		}
		ctx.globalAlpha = 1;
		
		if (shop.purchaseEffectTimer > 0){
			shop.purchaseEffectTimer--;
		}

		ctx.fillStyle="#19BE44";
		ctx.fillText("$"+shop.price1, 160 + teamBlackMarketXOffset, 349 + inventoryYoffset);
		ctx.fillStyle="#FF0000";				
		ctx.fillText("SOLD OUT", 229 + teamBlackMarketXOffset, 349 + inventoryYoffset);
		ctx.fillStyle="#19BE44";
		ctx.fillText("$"+shop.price3, 298 + teamBlackMarketXOffset, 349 + inventoryYoffset);
		ctx.fillText("$"+shop.price4, 367 + teamBlackMarketXOffset, 349 + inventoryYoffset);
		ctx.fillText("$"+shop.price5, 436 + teamBlackMarketXOffset, 349 + inventoryYoffset);
		
		ctx.font = '24px Electrolize';		
		ctx.fillText("$"+myPlayer.cash, 298 + teamBlackMarketXOffset, 690);		
		ctx.fillStyle="#FFFFFF";
		ctx.fillText("You have:", 298 + teamBlackMarketXOffset, 660);		

		
		ctx.drawImage(Img.spy, 263 + teamBlackMarketXOffset, 75);
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
	
	//Version and debug text label1 //debug lable1 
	smallCenterShadow();
	ctx.fillStyle="#FFFFFF";
	ctx.font = 'bold 14px Electrolize';
	ctx.textAlign="left";
	ctx.fillText(version, 5, 15);

	if (debugText == true){
		var pickupCount = 0;
		for (var p in Pickup.list){
			pickupCount++;
		}
		ctx.fillText("PlayerXY:" + Math.floor(Player.list[myPlayer.id].x) + "," + Math.floor(Player.list[myPlayer.id].y), 5, 35); //debug
		ctx.fillText("PlayerZoomXY:" + Math.floor(Player.list[myPlayer.id].x * zoom) + "," + Math.floor(Player.list[myPlayer.id].y * zoom), 5, 55); //debug
	}
	
	//Bloody border
	if (Player.list[myPlayer.id].health < 100){
		noShadow();
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
		ctx.drawImage(Img.bloodyBorder, -(Player.list[myPlayer.id].health * bloodyBorderScale)/2, -(Player.list[myPlayer.id].health * bloodyBorderScale)/2, canvasWidth + Player.list[myPlayer.id].health*bloodyBorderScale, canvasHeight + Player.list[myPlayer.id].health*bloodyBorderScale);
		ctx.globalAlpha = 1;
	}
	
	//Energy HUD
	ctx.shadowColor = "black";
	ctx.shadowOffsetX = 0; 
	ctx.shadowOffsetY = 0;
	ctx.shadowBlur = 4;	
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
		ctx.drawImage(Img.yellow, canvasWidth - (canvasWidth * (myPlayer.drawnEnergy / 200)), canvasHeight - 4, canvasWidth * (myPlayer.drawnEnergy / 200), 4);
	}
	else if (myPlayer.drawnEnergy <= 25 && myPlayer.drawnEnergy > 0){
		ctx.drawImage(Img.red, canvasWidth - (canvasWidth * (myPlayer.drawnEnergy / 200)), canvasHeight - 4, canvasWidth * (myPlayer.drawnEnergy / 200), 4);
	}
	else if (myPlayer.drawnEnergy > 0){
		ctx.drawImage(Img.yellow, canvasWidth - (canvasWidth * (myPlayer.drawnEnergy / 200)), canvasHeight - 4, canvasWidth * (myPlayer.drawnEnergy / 200), 4);
	}
	else {
		if (energyRedAlpha <= 0)
			energyRedAlpha = 0.7;
		ctx.globalAlpha = energyRedAlpha;
		ctx.drawImage(Img.energyRed, canvasWidth - Img.energyRed.width, canvasHeight - Img.energyRed.height);
		energyRedAlpha -= .1;
	}
	ctx.globalAlpha = 1;

	
	////////////AMMO HUD//////////////
	//img,clippedImgX,clippedImgY,clippedImgWidth,clippedImgHeight,x,y,width,height
	//Draw Bullet images
	var clipCount = "0";
	var ammoCount = "0";
	if (Player.list[myPlayer.id].weapon == 1){
		clipCount = Player.list[myPlayer.id].PClip;
		ammoWidth = 136 - ((15 - Player.list[myPlayer.id].PClip) * 9);
		ctx.drawImage(Img.ammo9mm, 600 - ammoWidth, 0, ammoWidth, 80, canvasWidth - ammoWidth - 120, canvasHeight - 86, ammoWidth, 80);
	}
	else if (Player.list[myPlayer.id].weapon == 2){
		clipCount = Player.list[myPlayer.id].DPClip;
		ammoCount = Player.list[myPlayer.id].DPAmmo;		
		ammoWidth = 180 - ((20 - Player.list[myPlayer.id].DPClip) * 9) + 1;
		ctx.drawImage(Img.ammoDP, 600 - ammoWidth, 0, ammoWidth, 80, canvasWidth - ammoWidth - 120, canvasHeight - 86, ammoWidth, 80);
	}
	else if (Player.list[myPlayer.id].weapon == 3){
		clipCount = Player.list[myPlayer.id].MGClip;
		ammoCount = Player.list[myPlayer.id].MGAmmo;		
		ammoWidth = 152 - ((30 - Player.list[myPlayer.id].MGClip) * 5);
		ctx.drawImage(Img.ammoMG, 600 - ammoWidth, 0, ammoWidth, 80, canvasWidth - ammoWidth - 120, canvasHeight - 86, ammoWidth, 80);
	}
			
	//Draw Ammmo Count
	ctx.font = '36px Electrolize';
	ctx.fillStyle="#FFFFFF";
	ctx.lineWidth=4;
	ctx.textAlign="right";
	ctx.fillText(clipCount + "/",canvasWidth - 50, canvasHeight - 9);
	if (Player.list[myPlayer.id].weapon == 1){
		ctx.drawImage(Img.infinity, canvasWidth - 50, canvasHeight - 26);		
	}
	else {
		ctx.font = '22px Electrolize';
		ctx.textAlign="left";
		ctx.fillText(ammoCount,canvasWidth - 50, canvasHeight - 9);
	}
	
	//Chat
	if (chatStale < 1500 && !shop.active){chatText.style.display = "inline-block";}
	else {chatText.style.display = "none";}
	if (chatInput.style.display == "none"){chatStale++;}
	
	//Top Scoreboard
	noShadow();
	ctx.textAlign="center";
	ctx.fillStyle="#000000";
	ctx.globalAlpha = 0.50;
	ctx.fillRect((canvasWidth/2 - 25) + 70,0,50,50);
	ctx.fillStyle="#FFFFFF";
	ctx.fillRect((canvasWidth/2 - 25) - 70,0,50,50);
	ctx.globalAlpha = 1.0;
	ctx.font = '28px Electrolize';
	ctx.lineWidth=5;
	
	ctx.strokeText(minutesLeft + ":" + secondsLeft,canvasWidth/2,30);
	ctx.fillText(minutesLeft + ":" + secondsLeft,canvasWidth/2,30);

	ctx.font = '36px Electrolize';
	ctx.lineWidth=6;
	if (whiteScoreHeight >= 36){whiteScoreHeight -= 8;}
	if (whiteScoreHeight < 36){whiteScoreHeight = 36;}
	ctx.font = whiteScoreHeight + 'px Electrolize';
	ctx.strokeText(whiteCaptures,canvasWidth/2 - 70,(whiteScoreHeight + (whiteScoreHeight/2 + 16))/2);
	ctx.fillText(whiteCaptures,canvasWidth/2 - 70,(whiteScoreHeight + (whiteScoreHeight/2 + 16))/2);
	
	if (blackScoreHeight >= 36){blackScoreHeight -= 8;}
	if (blackScoreHeight < 36){blackScoreHeight = 36;}
	ctx.font = blackScoreHeight + 'px Electrolize';		
	ctx.strokeText(blackCaptures,canvasWidth/2 + 70,(blackScoreHeight + (blackScoreHeight/2 + 16))/2);
	ctx.fillText(blackCaptures,canvasWidth/2 + 70,(blackScoreHeight + (blackScoreHeight/2 + 16))/2);

	
	// STAT OVERLAY scoreboard
	if (gameOver){
		showStatOverlay = true;		
	}
	if (showStatOverlay == true){			
		ctx.drawImage(Img.statOverlay, Math.round(canvasWidth/2 - Img.statOverlay.width/2), Math.round(canvasHeight/2 - Img.statOverlay.height/2 + -50));	
		ctx.lineWidth=4;
		if (gameOver){
			ctx.font = 'bold 17px Electrolize';
			ctx.textAlign="center";
			ctx.fillStyle="#19BE44";
			ctx.fillText("Total",439,170);
			ctx.fillText("Earned",439,190);
			ctx.fillText("Total",439,170 + 245);
			ctx.fillText("Earned",439,190 + 245);
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
		blackPlayers.sort(compare);
		whitePlayers.sort(compare);
		
		var whiteScoreY = 237;
		var blackScoreY = 482; //245 difference in these 2
		
		for (var a in blackPlayers){
			ctx.textAlign="left";			
			if (blackPlayers[a].id == myPlayer.id){
				ctx.drawImage(Img.statArrow, 123, blackScoreY - 13);	
				ctx.fillStyle="#FFFFFF";
			}
			else {
				ctx.fillStyle="#AAAAAA";
			}
			ctx.strokeText(blackPlayers[a].name,143,blackScoreY); ctx.fillText(blackPlayers[a].name,143,blackScoreY);
			ctx.textAlign="center";
			ctx.fillStyle="#19BE44";
			if (gameOver == false){
				ctx.strokeText("$"+blackPlayers[a].cash,439,blackScoreY); ctx.fillText("$"+blackPlayers[a].cash,439,blackScoreY);
			}
			else {
				ctx.strokeText("$"+blackPlayers[a].cashEarnedThisGame,439,blackScoreY); ctx.fillText("$"+blackPlayers[a].cashEarnedThisGame,439,blackScoreY);
			}
			if (blackPlayers[a].id == myPlayer.id){ctx.fillStyle="#FFFFFF";}
			else {ctx.fillStyle="#AAAAAA";}
			ctx.strokeText(blackPlayers[a].kills,536,blackScoreY); ctx.fillText(blackPlayers[a].kills,536,blackScoreY);
			ctx.strokeText(blackPlayers[a].deaths,628,blackScoreY); ctx.fillText(blackPlayers[a].deaths,628,blackScoreY);
			ctx.strokeText(blackPlayers[a].steals,723,blackScoreY); ctx.fillText(blackPlayers[a].steals,723,blackScoreY);
			ctx.strokeText(blackPlayers[a].returns,821,blackScoreY); ctx.fillText(blackPlayers[a].returns,821,blackScoreY);
			ctx.strokeText(blackPlayers[a].captures,913,blackScoreY); ctx.fillText(blackPlayers[a].captures,913,blackScoreY);			
			blackScoreY += 30;
		}
		
		for (var a in whitePlayers){
			ctx.textAlign="left";
			if (whitePlayers[a].id == myPlayer.id){
				ctx.drawImage(Img.statArrow, 123, whiteScoreY - 13);	
				ctx.fillStyle="#FFFFFF";
			}
			else {
				ctx.fillStyle="#AAAAAA";
			}
			ctx.strokeText(whitePlayers[a].name,143,whiteScoreY); ctx.fillText(whitePlayers[a].name,143,whiteScoreY);
			ctx.textAlign="center";
			ctx.fillStyle="#19BE44";
			if (gameOver == false){
				ctx.strokeText("$"+whitePlayers[a].cash,439,whiteScoreY); ctx.fillText("$"+whitePlayers[a].cash,439,whiteScoreY);
			}
			else {
				ctx.strokeText("$"+whitePlayers[a].cashEarnedThisGame,439,whiteScoreY); ctx.fillText("$"+whitePlayers[a].cashEarnedThisGame,439,whiteScoreY);
			}
			if (whitePlayers[a].id == myPlayer.id){ctx.fillStyle="#FFFFFF";}
			else {ctx.fillStyle="#AAAAAA";}
			ctx.strokeText(whitePlayers[a].kills,536,whiteScoreY); ctx.fillText(whitePlayers[a].kills,536,whiteScoreY);
			ctx.strokeText(whitePlayers[a].deaths,628,whiteScoreY); ctx.fillText(whitePlayers[a].deaths,628,whiteScoreY);
			ctx.strokeText(whitePlayers[a].steals,723,whiteScoreY); ctx.fillText(whitePlayers[a].steals,723,whiteScoreY);
			ctx.strokeText(whitePlayers[a].returns,821,whiteScoreY); ctx.fillText(whitePlayers[a].returns,821,whiteScoreY);
			ctx.strokeText(whitePlayers[a].captures,913,whiteScoreY); ctx.fillText(whitePlayers[a].captures,913,whiteScoreY);			
			whiteScoreY += 30;
		}	
		//controls
		ctx.save();
			smallCenterShadow();
			ctx.fillStyle="#FFFFFF";
			ctx.fillText("CONTROLS",canvasWidth/2,675);
			ctx.fillText("Shoot:Arrow Keys, Move:WASD, Dash:Space, Q:Swap Weapons, 1-3:Choose Weapon",canvasWidth/2,700);
		ctx.restore();
	}
	
	//END GAME/PREGAME
	if (pregame == true){
		heavyCenterShadow();
		ctx.textAlign="right";
		ctx.font = '118px Electrolize';
		ctx.lineWidth=16;
		ctx.fillStyle="#FFFFFF";
		ctx.strokeText("PREGAME",canvasWidth - 10,830);
		ctx.fillText("PREGAME",canvasWidth - 10,830);	
		normalShadow();
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
			ctx.strokeText("MATCH START!",canvasWidth/2,canvasHeight/2);
			ctx.fillText("MATCH START!",canvasWidth/2,canvasHeight/2);
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
				ctx.strokeText("Next game in: " + nextGameTimer, canvasWidth - 10,828);
				ctx.fillText("Next game in: " + nextGameTimer, canvasWidth - 10,828);	
			}

			ctx.font = '118px Electrolize';
			ctx.lineWidth=12;
			if (whiteCaptures > blackCaptures && gameOver == true){
				ctx.fillStyle="#FFFFFF";
				ctx.strokeText("WHITES WIN",canvasWidth - 10,778);
				ctx.fillText("WHITES WIN",canvasWidth - 10,778);	
			}
			else if (whiteCaptures < blackCaptures && gameOver == true){
				ctx.fillStyle="#000000";
				ctx.strokeStyle="#FFFFFF";
				ctx.strokeText("BLACKS WIN",canvasWidth - 10,778);
				noShadow();
				ctx.fillText("BLACKS WIN",canvasWidth - 10,778);	
				ctx.strokeStyle="#000000";
			}
			else {
				ctx.fillStyle="#FFFFFF";
				if (suddenDeathAlpha > 0){
					ctx.globalAlpha = suddenDeathAlpha;
				ctx.strokeText("SUDDEN DEATH",canvasWidth - 10,778);
				ctx.fillText("SUDDEN DEATH",canvasWidth - 10,778);
				}
				if (suddenDeathAlpha > 0){suddenDeathAlpha-=.01;} else {suddenDeathAlpha = 0;}
				ctx.globalAlpha = 1;	
			}			
		}
	}

	//mute
	if (mute){
		noShadow();
		ctx.drawImage(Img.mute, canvasWidth - 30, 0);			
	}
	normalShadow();
}

//Client timer1 teimer1
setInterval(function(){	
	//Don't draw anything if the user hasn't entered the game with a player id and name
	if (myPlayer.name == "" || !Player.list[myPlayer.id])
		return;

	updateCameraSimple();		
	
	drawMap();		
	drawBlackMarkets();
	drawBodies();
	drawMissingBags();
	drawLegs();
	drawBlocks();
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
	
},1000/60);// End timer1()
	
//--------------------------------END TIMER 1--------------------------------	
	
function compare(a,b) {
  if (a.cash < b.cash)
    return 1;
  if (a.cash > b.cash)
    return -1;
  return 0;
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
		else if (vol < -.1)
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
BoostBlast.list = {};


socket.on('shootUpdate', function(shotData){	
	var newShot = false; //To keep double shot sounds from playing when shooting diagonally (pressing 2 "shoot" keys at once)
	if (!Shot.list[shotData.id]){
		var shot = Shot(shotData.id);
		newShot = true;
	}
	if (shotData.discharge && !mute){		
		//Distance calc for volume
		var dx1 = myPlayer.x - Player.list[shotData.id].x;
		var dy1 = myPlayer.y - Player.list[shotData.id].y;
		var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
		var vol = Math.round((1 - (dist1 / 1000)) * 100)/100;
		if (vol < 0 && vol >= -.1)
			vol = 0.01;
		else if (vol < -.1)
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
	}

	Shot.list[shotData.id].distance = shotData.distance;
	Shot.list[shotData.id].spark = shotData.spark;
	
	if (Shot.list[shotData.id].distance == -1 && shotData.discharge == false){
		Shot.list[shotData.id].distance = 2150;
		Shot.list[shotData.id].decay--;
	}	
});

var Shot = function(id){
	
	var self = {
		id:id,
		distance:1150,
		decay:2,
		spark:false,
		width:Math.floor((Math.random() * 46) + 26),   //36
		height:Math.floor((Math.random() * 45) + 65),  //55
	}	
	Shot.list[self.id] = self;		
}
Shot.list = {};



// ---------------------------------- CREATE BODY -----------------------------
socket.on('createBody', function(target, shootingDir, weapon, bodyType){
	var body = Body(target.x, target.y, shootingDir, bodyType);	
		
	if (!mute){
		var dx1 = myPlayer.x - target.x;
		var dy1 = myPlayer.y - target.y;
		var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
		var vol = (Math.round((1 - (dist1 / 1000)) * 100)/100) + .3;
		if (vol > 1)
			vol = 1;
		else if (vol < 0 && vol >= -.1)
			vol = 0.01;
		else if (vol < -.1)
			vol = 0;
	
		sfxKill.volume(vol);
		sfxKill.play();	
	}
});

var Body = function(x, y, direction, bodyType){
	var self = {
		id:Math.random(),
		x:x,
		y:y,
		speed:Math.floor((Math.random() * 13) + 10),
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
	if(event.keyCode === 68 && chatInput.style.display == "none"){ //D
		myPlayer.pressingD = true;
		if (!shop.active){
			socket.emit('keyPress',{inputId:68,state:true});
		}
	}
	if(event.keyCode === 83 && chatInput.style.display == "none"){ //S
		myPlayer.pressingS = true;
		if (!shop.active){
			socket.emit('keyPress',{inputId:83,state:true});
		}
	}
	if(event.keyCode === 65 && chatInput.style.display == "none"){ //A
		myPlayer.pressingA = true;
		if (!shop.active){
			socket.emit('keyPress',{inputId:65,state:true});
		}
	}		
	if(event.keyCode === 38 && chatInput.style.display == "none"){ //Up
		event.preventDefault();
		myPlayer.pressingUp = true;
		if (!shop.active){
			socket.emit('keyPress',{inputId:38,state:true});
		}
		else {
			purchase();
		}
	}
	if(event.keyCode === 39 && chatInput.style.display == "none"){ //Right
		event.preventDefault();
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
	if(event.keyCode === 40 && chatInput.style.display == "none"){ //Down
		event.preventDefault();
		myPlayer.pressingDown = true;
		if (!shop.active){
			socket.emit('keyPress',{inputId:40,state:true});
		}
	}
	if(event.keyCode === 37 && chatInput.style.display == "none"){ //Left
		event.preventDefault();
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
	if(event.keyCode === 32 && chatInput.style.display == "none" && !shop.active){ //Space
		socket.emit('keyPress',{inputId:32,state:true});
		if ((myPlayer.pressingW || myPlayer.pressingD || myPlayer.pressingS || myPlayer.pressingA) && Player.list[myPlayer.id].boosting == 0 && !mute){
			if (!Player.list[myPlayer.id].holdingBag && Player.list[myPlayer.id].energy >= 1){
				//Boosting!
			}				
			else if (!Player.list[myPlayer.id].holdingBag && Player.list[myPlayer.id].energy <= 0)
				sfxBoostEmpty.play();
			else if (Player.list[myPlayer.id].holdingBag)
				sfxWhoosh.play();
		}

	}	
	
	if(event.keyCode === 81 && chatInput.style.display == "none" && !shop.active){ //Q
		socket.emit('keyPress',{inputId:81,state:true});
	}	
	if(event.keyCode === 82 && chatInput.style.display == "none" && !shop.active){ //R
		socket.emit('keyPress',{inputId:82,state:true});
	}
	if(event.keyCode === 17 && chatInput.style.display == "none" && !shop.active){ //Ctrl
		event.preventDefault();
		socket.emit('keyPress',{inputId:82,state:true});
	}
	if(event.keyCode === 16 && chatInput.style.display == "none"){ //Shift
		myPlayer.pressingShift = true;
			camOffSet = 475;
			diagCamOffSet = 325;
			camMaxSpeed = 300;
		socket.emit('keyPress',{inputId:16,state:true});
	}
	if(event.keyCode === 69 && chatInput.style.display == "none" && !shop.active){ //E
		socket.emit('keyPress',{inputId:69,state:true});
	}	

	if(event.keyCode === 49 && chatInput.style.display == "none"){ //1
		socket.emit('keyPress',{inputId:49,state:true});
	}	
	if(event.keyCode === 50 && chatInput.style.display == "none"){ //2
		socket.emit('keyPress',{inputId:50,state:true});
	}	
	if(event.keyCode === 51 && chatInput.style.display == "none"){ //3
		socket.emit('keyPress',{inputId:51,state:true});
	}	
	if(event.keyCode === 52 && chatInput.style.display == "none"){ //4
		socket.emit('keyPress',{inputId:52,state:true});
	}	
	
	if(event.keyCode === 13){ //Enter
		if (chatInput.style.display == "inline"){
			if (chatInput.value != "") {
				if(chatInput.value[0] === '/'){
					socket.emit('evalServer',chatInput.value.substring(1));
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
	if(event.keyCode === 27){ //Esc
		if (showStatOverlay == false){
			chatInput.value = '';
			chatInput.style.display = "none";
			showStatOverlay = true;
		}
		else if (showStatOverlay == true){
			showStatOverlay = false;
		}		
	}
	
	if(event.keyCode === 77 && chatInput.style.display == "none"){ //M
		if (Player.list[myPlayer.id]){
			if (mute){
				mute = false;
			}
			else{
				mute = true;		
			}
		}
	}
	
	if(event.keyCode === 85 && myPlayer.id && chatInput.style.display == "none"){ //"U" (TESTING BUTTON) DEBUG BUTTON	
		if (Player.list[myPlayer.id]){
			socket.emit('keyPress',{inputId:85,state:true});
		}		
	}
	
	
}

//Key Up
document.onkeyup = function(event){
	if(event.keyCode === 87){ //W
		myPlayer.pressingW = false;
		socket.emit('keyPress',{inputId:87,state:false});
	}
	if(event.keyCode === 68){ //D
		myPlayer.pressingD = false;
		socket.emit('keyPress',{inputId:68,state:false});
	}
	if(event.keyCode === 83){ //S
		myPlayer.pressingS = false;
		socket.emit('keyPress',{inputId:83,state:false});
	}
	if(event.keyCode === 65){ //A
		myPlayer.pressingA = false;
		socket.emit('keyPress',{inputId:65,state:false});
	}		
	if(event.keyCode === 38 && chatInput.style.display == "none"){ //Up
		myPlayer.pressingUp = false;
		if (!shop.active){
			socket.emit('keyPress',{inputId:38,state:false});
		}
	}
	if(event.keyCode === 39 && chatInput.style.display == "none"){ //Right
		myPlayer.pressingRight = false;
		if (!shop.active){
			socket.emit('keyPress',{inputId:39,state:false});
		}
	}
	if(event.keyCode === 40 && chatInput.style.display == "none"){ //Down
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
	if(event.keyCode === 37 && chatInput.style.display == "none"){ //Left
		myPlayer.pressingLeft = false;
		if (!shop.active){
			socket.emit('keyPress',{inputId:37,state:false});
		}
	}
	
	if(event.keyCode === 16){ //Shift
		myPlayer.pressingShift = false;
			camOffSet = 300;
			diagCamOffSet = 200;
			camMaxSpeed = 300;
		socket.emit('keyPress',{inputId:16,state:false});
	}
	
	if(event.keyCode === 84 && chatInput.style.display == "none" && myPlayer.name != ""){ //T
		chatInput.style.display = "inline";
		chatInput.focus();
		chatText.style.display = "inline-block";
		chatStale = 0;
	}	
	

}

//EVERY 1 SECOND
setInterval( 
	function(){
		clientTimeoutTicker--;
		if (clientTimeoutTicker < clientTimeoutSeconds - 5){
			logg("No server messages detected, " + clientTimeoutTicker + " until timeout");
		}
		if (clientTimeoutTicker < 1){
			logg("ERROR: Server Timeout. Reloading page...");
			disconnect();
			clientTimeoutTicker = clientTimeoutSeconds;
		}		
	},
	1000/1 //Ticks per second
);

function disconnect(){
	socket.disconnect();
	location.reload();
}

function log(msg) {
	var d = new Date();
	d.getHours(); // => 9
	d.getMinutes(); // =>  30
	d.getSeconds(); // => 51
	console.log(d.getHours() + ':' + d.getMinutes() + '.' + d.getSeconds() + '> ' + msg.toString());	
}

function logg(msg) {
	var d = new Date();
	d.getHours(); // => 9
	d.getMinutes(); // =>  30
	d.getSeconds(); // => 51
	console.log(d.getHours() + ':' + d.getMinutes() + '.' + d.getSeconds() + '> ' + msg.toString());	
}