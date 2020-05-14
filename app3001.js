//2017-2018 Treat Metcalf
//--------------------------------CONFIG-----------------------------------------------------
var port = 3001;
var mongoDbLocation = 'mongodb://RWsystem:RWPa55y3!@rw-database-shard-00-00-aywyv.mongodb.net:27017,rw-database-shard-00-01-aywyv.mongodb.net:27017,rw-database-shard-00-02-aywyv.mongodb.net:27017/RWAR?ssl=true&replicaSet=RW-Database-shard-0&authSource=admin&retryWrites=true';
//var mongoDbLocation = 'mongodb+srv://RWsystem:P0pular1!@rw-database-aywyv.mongodb.net/RWAR?retryWrites=true';
//var mongoDbLocation = '127.0.0.1/RWAR';

var minutesLeft = 9;
var secondsLeft = 99;

var gameMinutesLength = 5;
var gameSecondsLength = 0;

var bulletDmg = .75;
var startingCash = 150;

//Cash Values for Events
var killCash = 100;
var assassinationCash = 150;
var stealCash = 50;
var captureCash= 300;
var killEnemyBagHolder = 150;
var returnCash = 100;
var winCash = 1000;
var loseCash = 100;
var mvpCash = 300;

//-------------------------------------------------------------------------------------


log('Initializing...');

var mongojs = require('mongojs');
var db = mongojs(mongoDbLocation, ['RW_USER','RW_USER_PROG']);

log("testing db");
db.RW_USER.find({USERNAME:"testuser"}, function(err,res){
	if (res[0]){
		log("TESTING DB: found testuser");
	}
	else {
		log("TESTING DB: didnt found testuser");
	}
	//cb(USERS[data.username] === data.password);
});


//IF ANY ISSUES:
//Run start.mongo-client.bat, and run:
//db.serverStatus().connections
//If can't connect even via client, restart mongod service, and use ^C to kill connections
//*/

//----------------------SERVER GLOBAL VARIABLES---------------------------------
var express = require('express');
var app = express();

var favicon = require('serve-favicon');
var path = require('path');

var _favicon = favicon(path.join(__dirname, 'public', 'favicon.ico'))

var serv = require('http').Server(app)
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));


serv.listen(port);
var io = require('socket.io')(serv,{});
log('Express server started on port ' + port + '.');

var SOCKET_LIST = {};
var DEBUG = true;

var mapWidth = 2100;
var mapHeight = 1500;

var bagRedHomeX = 150;
var bagRedHomeY = 150;
var bagBlueHomeX = mapWidth - 150;
var bagBlueHomeY = mapHeight - 150;

var playerWhiteHomeX = 75;
var playerWhiteHomeY = 75;
var playerBlackHomeX = mapWidth - 75;
var playerBlackHomeY = mapHeight - 75;

var bagRed = {
	x:bagRedHomeX,
	y:bagRedHomeY,
	captured:false,
	speed:0,
	direction:0,
	playerThrowing:0,
};

var bagBlue = {
	x:bagBlueHomeX,
	y:bagBlueHomeY,
	captured:false,
	speed:0,
	direction:0,
	playerThrowing:0,
};

var whiteCaptures = 0;
var blackCaptures = 0;

var pregame = true;
var gameOver = false;

var updatePlayerList = [];
var updateThugList = [];
var udpateNotificationList = [];
var updatePickupList = [];
var updateMisc = {};

var shop = {
	active:false,
	selection:3,
	price1:150,
	price2:999999,
	price3:200,
	price4:300,
	price5:100,	
	uniqueTextTimer:0,
	uniqueText:"",
	purchaseEffectTimer:0,
};

var allowBagWeapons = false;

//----------------------END GLOBAL VARIABLES---------------------------------

io.sockets.on('connection', function(socket){
	log('Client has connected');	
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
	
	
	socket.on('disconnect', function(){
		delete SOCKET_LIST[socket.id];
		Player.onDisconnect(socket);
	});

	socket.on('sendMsgToServer', function(data){
		for(var i in SOCKET_LIST){
			//log(data[0] + ': ' + data[1]);
			SOCKET_LIST[i].emit('addToChat',data[0] + ': ' + data[1]);
		}
	});

	//Server commands
	socket.on('evalServer', function(data){
		if(!DEBUG){return;}
		if (data == "start"){
			restartGame();
		}
		else if (data == "stats" || data == "stat"){
			log(Player.list[socket.id].name + " requested stats");
			db.RW_USER.find({USERNAME:Player.list[socket.id].name}, function(err,res){
				if (res[0]){
					socket.emit('addToChat', 'Cash Earned:' + res[0].experience + ' Kills:' + res[0].kills + ' Deaths:' + res[0].deaths + ' Benedicts:' + res[0].benedicts + ' Captures:' + res[0].captures + ' Steals:' + res[0].steals + ' Returns:' + res[0].returns + ' Games Played:' + res[0].gamesPlayed + ' Wins:' + res[0].gamesWon + ' Losses:' + res[0].gamesLost + ' TPM Rating:' + res[0].rating);	
				}
				else {
					socket.emit('addToChat', 'ERROR looking you up in database.');
				}
				//cb(USERS[data.username] === data.password);
			});
		}
		else if (data == "team" || data == "change" || data == "switch"){
			if (Player.list[socket.id].team == "white"){
				Player.list[socket.id].team = "black";
				updatePlayerList.push({id:socket.id,property:"team",value:Player.list[socket.id].team});
				socket.emit('addToChat', 'CHANGING TO THE BLACK TEAM.');
			}
			else if (Player.list[socket.id].team == "black"){
				Player.list[socket.id].team = "white";
				updatePlayerList.push({id:socket.id,property:"team",value:Player.list[socket.id].team});
				socket.emit('addToChat', 'CHANGING TO THE WHITE TEAM.');
			}
			Player.list[socket.id].respawn();
		}
		else if (data == "score"){
			if (Player.list[socket.id].team == "white"){
				capture("white");
			}
			else if (Player.list[socket.id].team == "black"){
				capture("black");
			}
		}
		else if (data == "end"){
			restartGame();
			minutesLeft = 0;
			secondsLeft = 0;
		}
		else if (data == "win"){
			whiteCaptures = 0;
			blackCaptures = 0;
			sendCapturesToClients();
			if (pregame == true){
				restartGame();
			}
			if (Player.list[socket.id].team == "white"){
				capture("white");
			}
			else if (Player.list[socket.id].team == "black"){
				capture("black");
			}
			minutesLeft = 0;
			secondsLeft = 0;
		}
		else {
			try {
				var res = eval(data);
			}
			catch(e) {
				res = "invalid command";
			}
			finally {
				socket.emit('evalAnswer', res);
			}
		}
		
	});
	
	
	socket.on('signIn', function(data){
			isUsernameExist(data, function(res){
				if (res){
					isValidPassword(data, function(res){
						if (res){
							Player.onConnect(socket, data["username"]);	
							socket.emit('signInResponse',{success:true,id:socket.id, mapWidth:mapWidth, mapHeight:mapHeight, whiteCaptures:whiteCaptures, blackCaptures:blackCaptures});
							
						}
						else {
							socket.emit('signInResponse',{success:false,message:"Invalid Password"});
						}
					});
				}
				else {
					socket.emit('signInResponse',{success:false,message:"Username does not exist"});
				}
			});			
	});

	socket.on('signUp', function(data){
			isUsernameExist(data, function(res){
				if (res){
					socket.emit('signInResponse',{success:false,message:"Username already exists"});
				}
				else {
					addUser(data, function(){
						socket.emit('signInResponse',{success:true,id:socket.id, mapWidth:mapWidth, mapHeight:mapHeight});
					});
				}
			});
	});		
}); //END socket.on(connection)


//------------------------LOGIN-----------------------
var isValidPassword = function(data,cb){
	db.RW_USER.find({USERNAME:data.username,password:data.password}, function(err,res){
		if (res[0]){
			cb(true);
		}
		else {
			cb(false);
		}
		//cb(USERS[data.username] === data.password);
	});
}

var isUsernameExist = function(data,cb){
	db.RW_USER.find({USERNAME:data.username}, function(err,res){
		if (res[0]){
			cb(true);
		}
		else {
			cb(false);
		}
		//cb(USERS[data.username] === data.password);
	});
}

////////////////////// ADD USER ///////////////////////
var addUser = function(data,cb){
	db.RW_USER.insert({username:data.username,password:data.password, experience:0, cash:0, level:0, kills:0, benedicts:0, deaths:0, captures:0, steals:0, returns:0, gamesPlayed:0, gamesWon:0, gamesLost:0, rating:0},
		function(err){cb();});
}


function restartGame(){
	
	for(var i in SOCKET_LIST){
		SOCKET_LIST[i].emit('gameStart');
	}	
	
	gameOver = false;
	minutesLeft = gameMinutesLength;
	secondsLeft = gameSecondsLength;
	whiteCaptures = 0;
	blackCaptures = 0;
	sendCapturesToClients();
	
	pregame = false;
	
	Pickup.list = [];
	var BAnew = Pickup(Math.random(), mapWidth/2 - 20, mapHeight/2 - 100, 5, 1);
	var DPnew = Pickup(Math.random(), mapWidth/2 - 33, mapHeight/2 + 55, 3, 60);
	
	bagRed = {
		x:bagRedHomeX,
		y:bagRedHomeY,
		captured:false,
		speed:0,
		direction:0,
		playerThrowing:0,
	};

	bagBlue = {
		x:bagBlueHomeX,
		y:bagBlueHomeY,
		captured:false,
		speed:0,
		direction:0,
		playerThrowing:0,
	};
	
	for(var i in Player.list){	
		Player.list[i].health = 100;
		Player.list[i].energy = 1;
		Player.list[i].boosting = 0;
		Player.list[i].boostingDir = 0;
		Player.list[i].rechargeDelay = 0;
		Player.list[i].healDelay = 0;
		Player.list[i].pressingUp = false;
		Player.list[i].pressingRight = false;
		Player.list[i].pressingDown = false;
		Player.list[i].pressingLeft = false;
		Player.list[i].pressingW = false;
		Player.list[i].pressingD = false;
		Player.list[i].pressingS = false;		
		Player.list[i].pressingA = false;
		Player.list[i].pressingShift = false;
		Player.list[i].maxSpd = 7;
		Player.list[i].speed = 0;
		Player.list[i].walkingDir = 1;
		Player.list[i].shootingDir = 1;
		Player.list[i].legHeight = 47;
		Player.list[i].legSwingForward = true;
		Player.list[i].firing = 0; //0-3; 0 = not firing
		Player.list[i].aiming = 0;
		Player.list[i].liveShot = false; ////!! This variable may not need to exist; it never gets set to false when missing a target
		Player.list[i].respawnTimer = 0;
		Player.list[i].holdingBag = false;
		Player.list[i].weapon = 1;
		Player.list[i].PClip = 15;
		Player.list[i].DPClip = 0;
		Player.list[i].MGClip = 0;
		Player.list[i].SGClip = 0;		
		Player.list[i].DPAmmo = 0;
		Player.list[i].MGAmmo = 0;
		Player.list[i].SGAmmo = 0;		
		Player.list[i].fireRate = 0;
		Player.list[i].reloading = 0;
		Player.list[i].hasBattery = 1;
		Player.list[i].pushSpeed = 0;
		Player.list[i].pushDir = 1;
		Player.list[i].cash = startingCash;
		Player.list[i].kills = 0;
		Player.list[i].deaths = 0;
		Player.list[i].steals = 0;
		Player.list[i].returns = 0;
		Player.list[i].captures = 0;
		
		Player.list[i].respawn();

		updatePlayerList.push({id:Player.list[i].id,property:"x",value:Player.list[i].x});
		updatePlayerList.push({id:Player.list[i].id,property:"y",value:Player.list[i].y});
		updatePlayerList.push({id:Player.list[i].id,property:"health",value:Player.list[i].health});
		updatePlayerList.push({id:Player.list[i].id,property:"energy",value:Player.list[i].energy});
		updatePlayerList.push({id:Player.list[i].id,property:"boosting",value:Player.list[i].boosting});
		updatePlayerList.push({id:Player.list[i].id,property:"walkingDir",value:Player.list[i].walkingDir});
		updatePlayerList.push({id:Player.list[i].id,property:"shootingDir",value:Player.list[i].shootingDir});
		updatePlayerList.push({id:Player.list[i].id,property:"legHeight",value:Player.list[i].legHeight});
		updatePlayerList.push({id:Player.list[i].id,property:"legSwingForward",value:Player.list[i].legSwingForward});
		updatePlayerList.push({id:Player.list[i].id,property:"holdingBag",value:Player.list[i].holdingBag});
		updatePlayerList.push({id:Player.list[i].id,property:"team",value:Player.list[i].team});
		updatePlayerList.push({id:Player.list[i].id,property:"weapon",value:Player.list[i].weapon});
		updatePlayerList.push({id:Player.list[i].id,property:"PClip",value:Player.list[i].PClip});
		updatePlayerList.push({id:Player.list[i].id,property:"DPClip",value:Player.list[i].DPClip});
		updatePlayerList.push({id:Player.list[i].id,property:"MGClip",value:Player.list[i].MGClip});
		updatePlayerList.push({id:Player.list[i].id,property:"SGClip",value:Player.list[i].SGClip});
		updatePlayerList.push({id:Player.list[i].id,property:"DPAmmo",value:Player.list[i].DPAmmo});
		updatePlayerList.push({id:Player.list[i].id,property:"MGAmmo",value:Player.list[i].MGAmmo});
		updatePlayerList.push({id:Player.list[i].id,property:"SGAmmo",value:Player.list[i].SGAmmo});		
		updatePlayerList.push({id:Player.list[i].id,property:"cash",value:Player.list[i].cash});
		updatePlayerList.push({id:Player.list[i].id,property:"kills",value:Player.list[i].kills});
		updatePlayerList.push({id:Player.list[i].id,property:"deaths",value:Player.list[i].deaths});
		updatePlayerList.push({id:Player.list[i].id,property:"steals",value:Player.list[i].steals});
		updatePlayerList.push({id:Player.list[i].id,property:"returns",value:Player.list[i].returns});
		updatePlayerList.push({id:Player.list[i].id,property:"captures",value:Player.list[i].captures});		
	}

	

	
}

//-----------------------PLAYER----------------------

var Player = function(id, name){
	var self = {
		name:name,
		x:250,
		y:250,
		height:94,
		width:94,
		id:id,
		health:100,
		energy:1,
		boosting:0,
		boostingDir:0,
		rechargeDelay:0,
		healDelay:0,
		pressingUp:false,
		pressingRight:false,
		pressingDown:false,
		pressingLeft:false,
		pressingW:false,
		pressingD:false,
		pressingS:false,		
		pressingA:false,
		pressingShift:false,
		maxSpd:7,
		speed:0,
		walkingDir:1,
		shootingDir:1,
		team:"white",
		legHeight:47,
		legSwingForward:true,
		firing:0, //0-3; 0 = not firing
		aiming:0,
		liveShot:false, ////!! This variable may not need to exist, it never gets set to false when missing a target
		respawnTimer:0,
		holdingBag:false,
		weapon:1,
		PClip:15,
		DPClip:0,
		MGClip:0,
		SGClip:0,		
		DPAmmo:0,
		MGAmmo:0,
		SGAmmo:0,		
		fireRate:0,
		reloading:0,
		hasBattery:1,
		pushSpeed:0,
		pushDir:1,

		cash:startingCash,
		kills:0,
		deaths:0,
		steals:0,
		returns:0,
		captures:0,			
	}
	var moreWhitePlayers = 0; //Number of white players more than black players -- if more black players, this will be negative
	for (var i in Player.list){
		if (Player.list[i].team == "white"){moreWhitePlayers++;}
		if (Player.list[i].team == "black"){moreWhitePlayers--;}
	}
	if (moreWhitePlayers <= 0){
		self.team = "white";
	}
	else {
		self.team = "black";
	}
	
	//Initialize Player
	updatePlayerList.push({id:self.id,property:"name",value:self.name});
	updatePlayerList.push({id:self.id,property:"x",value:self.x});
	updatePlayerList.push({id:self.id,property:"y",value:self.y});
	updatePlayerList.push({id:self.id,property:"health",value:self.health});
	updatePlayerList.push({id:self.id,property:"energy",value:self.energy});
	updatePlayerList.push({id:self.id,property:"boosting",value:self.boosting});
	updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
	updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
	updatePlayerList.push({id:self.id,property:"legHeight",value:self.legHeight});
	updatePlayerList.push({id:self.id,property:"legSwingForward",value:self.legSwingForward});
	updatePlayerList.push({id:self.id,property:"holdingBag",value:self.holdingBag});
	updatePlayerList.push({id:self.id,property:"team",value:self.team});
	updatePlayerList.push({id:self.id,property:"weapon",value:self.weapon});
	updatePlayerList.push({id:self.id,property:"PClip",value:self.PClip});
	updatePlayerList.push({id:self.id,property:"DPClip",value:self.DPClip});
	updatePlayerList.push({id:self.id,property:"MGClip",value:self.MGClip});
	updatePlayerList.push({id:self.id,property:"SGClip",value:self.SGClip});
	updatePlayerList.push({id:self.id,property:"DPAmmo",value:self.DPAmmo});
	updatePlayerList.push({id:self.id,property:"MGAmmo",value:self.MGAmmo});
	updatePlayerList.push({id:self.id,property:"SGAmmo",value:self.SGAmmo});
		
	updatePlayerList.push({id:self.id,property:"cash",value:self.cash});
	updatePlayerList.push({id:self.id,property:"kills",value:self.kills});
	updatePlayerList.push({id:self.id,property:"deaths",value:self.deaths});
	updatePlayerList.push({id:self.id,property:"steals",value:self.steals});
	updatePlayerList.push({id:self.id,property:"returns",value:self.returns});
	updatePlayerList.push({id:self.id,property:"captures",value:self.captures});
	

	var socket = SOCKET_LIST[id];

	//Player movement (Timer1 for player - Happens every frame)
	self.move = function(){	
		
		
		/*
		//Invincibility in Shop
		if (self.team == "white" && self.x == 0 && self.y < 200 && self.health < 100){
			self.health = 100;
			updatePlayerList.push({id:self.id,property:"health",value:self.health});
		}
		else if (self.team == "black" && self.x == mapWidth && self.y > mapHeight - 200 && self.health < 100){
			self.health = 100;
			updatePlayerList.push({id:self.id,property:"health",value:self.health});
		}		
		*/
		
		/////////////////////////// DEATH /////////////////////
		var respawnTimeLimit = 180;
		//Drop bag
		if (self.health <= 0 && self.holdingBag == true){
			if (self.team == "white"){
				bagBlue.captured = false;
				updateMisc.bagBlue = {x:bagBlue.x,y:bagBlue.y,captured:bagBlue.captured};
			}
			else if (self.team == "black"){
				bagRed.captured = false;
				updateMisc.bagRed = {x:bagRed.x,y:bagRed.y,captured:bagRed.captured};
			}
			self.holdingBag = false;
			updatePlayerList.push({id:self.id,property:"holdingBag",value:self.holdingBag});
		}
		if (self.health <= 0 && self.respawnTimer < respawnTimeLimit){self.respawnTimer++;}
		if (self.respawnTimer >= respawnTimeLimit && self.health <= 0){self.respawn();}
		if (self.health <= 0){return false;}
			
		
		var movementScale = .02;
		var speedMin = 7;
		

		
		////////////SHOOTING///////////////////
		//Auto shooting for holding down button
		if (self.firing <= 0 && !self.pressingShift && self.fireRate <= 0 && (self.pressingUp || self.pressingDown || self.pressingLeft || self.pressingRight)){
			Discharge(self);
		}
		if (self.fireRate > 0){self.fireRate--;}
		
		//If currently holding an arrow key, be aiming in that direction 
		if (self.aiming < 45 && self.pressingUp === true && self.pressingRight === false && self.pressingDown === false && self.pressingLeft === false){				
			self.shootingDir = 1;
			updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
		}
		if (self.aiming < 45 && self.pressingUp === true && self.pressingRight === true && self.pressingDown === false && self.pressingLeft === false){				
			self.shootingDir = 2;
			updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
		}
		if (self.aiming < 45 && self.pressingUp === false && self.pressingRight === true && self.pressingDown === false && self.pressingLeft === false){				
			self.shootingDir = 3;
			updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
		}
		if (self.aiming < 45 && self.pressingUp === false && self.pressingRight === true && self.pressingDown === true && self.pressingLeft === false){				
			self.shootingDir = 4;
			updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
		}
		if (self.aiming < 45 && self.pressingUp === false && self.pressingRight === false && self.pressingDown === true && self.pressingLeft === false){				
			self.shootingDir = 5;
			updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
		}
		if (self.aiming < 45 && self.pressingUp === false && self.pressingRight === false && self.pressingDown === true && self.pressingLeft === true){				
			self.shootingDir = 6;
			updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
		}
		if (self.aiming < 45 && self.pressingUp === false && self.pressingRight === false && self.pressingDown === false && self.pressingLeft === true){				
			self.shootingDir = 7;
			updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
		}
		if (self.aiming < 45 && self.pressingUp === true && self.pressingRight === false && self.pressingDown === false && self.pressingLeft === true){				
			self.shootingDir = 8;
			updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
		}
		
		//Firing and aiming decay (every frame)
		if (self.aiming > 0){
			self.aiming--;
		}
		if (self.firing > 0){
			self.firing--;
			//.shotLive is NOT A REAL PROPERTY!! This line of code does nothing! 
			if (self.firing == 0){self.shotLive = false;} //? Consider moving this to after the hit detection to allow one extra frame of hit detection 
			
			//Hit detection
			if (self.liveShot){
				var hitTargets = [];
				for (var i in Player.list){
					var isHitTarget = checkIfHit(self, Player.list[i]);
					if (isHitTarget && isHitTarget != false){
						hitTargets.push(isHitTarget);
					}	
				}
				for (var i in Thug.list){
					var isHitTarget = checkIfHit(self, Thug.list[i]);
					if (isHitTarget && isHitTarget != false){
						hitTargets.push(isHitTarget);
					}	
				}					
				for (var i in Block.list){
					var isHitTarget = checkIfHit(self, Block.list[i]);
					if (isHitTarget && isHitTarget != false){
						hitTargets.push(isHitTarget);
					}	
				}				

				//Out of all targets in line of shot, which is closest?
				var hitTarget;
				var closest = 100000;
				var distFromDiag = 0;
				for (var j in hitTargets){
					if (hitTargets[j].dist < closest){
						hitTarget = hitTargets[j].target;
						closest = hitTargets[j].dist;
						distFromDiag = hitTargets[j].distFromDiag;
					}
				}
				if (closest != 100000){
					//We officially have a hit on a specific target
					self.liveShot = false;
					hit(hitTarget, self.shootingDir, closest, self.id);					
					 
					if (hitTarget.health){
						//Calculate blood effect if target is organic
						var bloodX = hitTarget.x;
						var bloodY = hitTarget.y;
						if (self.shootingDir == 1){bloodX = self.x;}
						if (self.shootingDir == 2){bloodX = hitTarget.x - distFromDiag/2; bloodY = hitTarget.y - distFromDiag/2;}
						if (self.shootingDir == 3){bloodY = self.y;}
						if (self.shootingDir == 4){bloodX = hitTarget.x - distFromDiag/2; bloodY = hitTarget.y + distFromDiag/2;}
						if (self.shootingDir == 5){bloodX = self.x;}
						if (self.shootingDir == 6){bloodX = hitTarget.x - distFromDiag/2; bloodY = hitTarget.y - distFromDiag/2;}
						if (self.shootingDir == 7){bloodY = self.y;}
						if (self.shootingDir == 8){bloodX = hitTarget.x - distFromDiag/2; bloodY = hitTarget.y + distFromDiag/2;}
						sprayBloodOntoTarget(self.shootingDir, bloodX, bloodY);
					}
				}
				else {
					var shotData = {};
					shotData.id = self.id;
					shotData.spark = false;
					shotData.distance = -1;
					shotData.discharge = false;					
					for(var i in SOCKET_LIST){
						SOCKET_LIST[i].emit('shootUpdate',shotData);
					}					
				}
			}
		}
		/////////////////////// HEALING ////////////////////
		if (self.healDelay <= 0 && self.health < 100 && self.health > 0){
			self.health++;
			updatePlayerList.push({id:self.id,property:"health",value:self.health});
			self.healDelay += 10; //!!! Healing Rate
		}
		if (self.healDelay > 0){self.healDelay--;}
		
		/////////////////////// ENERGY /////////////////////
		if (self.rechargeDelay <= 0 && self.energy < (100 * self.hasBattery)){
			self.energy++;
			if (self.hasBattery > 1 && self.energy == 100)
				self.energy++; //Free extra energy at 100 if more than one battery to avoid stopping the charge sfx at 100 (normally 100 is "charge complete")
			updatePlayerList.push({id:self.id,property:"energy",value:self.energy});
		}
		if (self.rechargeDelay > 0){self.rechargeDelay--;}
		
		if (self.boosting > 0){
			self.boosting--;
			updatePlayerList.push({id:self.id,property:"boosting",value:self.boosting});
		}
		
		
		//Walking
		if (self.boosting <= 0){
			if(self.pressingW && !self.pressingS && !self.pressingD && !self.pressingA){
				if (self.speed < self.maxSpd){self.speed = self.speed + movementScale; if(self.speed < speedMin){self.speed = speedMin;}}
				self.y -= self.speed;
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
				self.walkingDir = 1;
				updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
			}
			else if(self.pressingD && !self.pressingS && !self.pressingW && !self.pressingA){
				if (self.speed < self.maxSpd){self.speed = self.speed + movementScale; if(self.speed < speedMin){self.speed = speedMin;}}
				self.x += self.speed;
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.walkingDir = 3;
				updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
			}
			else if(self.pressingS && !self.pressingA && !self.pressingW && !self.pressingD){
				if (self.speed < self.maxSpd){self.speed = self.speed + movementScale; if(self.speed < speedMin){self.speed = speedMin;}}
				self.y += self.speed;
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
				self.walkingDir = 5;
				updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
			}
			else if(self.pressingA && !self.pressingS && !self.pressingW && !self.pressingD){
				if (self.speed < self.maxSpd){self.speed = self.speed + movementScale; if(self.speed < speedMin){self.speed = speedMin;}}
				self.x -= self.speed;
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.walkingDir = 7;
				updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
			}
			else if(self.pressingW && self.pressingD){
				if (self.speed < self.maxSpd){self.speed = self.speed + movementScale; if(self.speed < speedMin){self.speed = speedMin;}}
				self.x += (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y -= (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
				self.walkingDir = 2;
				updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
			}
			else if(self.pressingD && self.pressingS){
				if (self.speed < self.maxSpd){self.speed = self.speed + movementScale; if(self.speed < speedMin){self.speed = speedMin;}}
				self.x += (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y += (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
				self.walkingDir = 4;
				updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
			}
			else if(self.pressingA && self.pressingS){
				if (self.speed < self.maxSpd){self.speed = self.speed + movementScale; if(self.speed < speedMin){self.speed = speedMin;}}
				self.x -= (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y += (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
				self.walkingDir = 6;
				updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
			}
			else if(self.pressingW && self.pressingA){
				if (self.speed < self.maxSpd){self.speed = self.speed + movementScale; if(self.speed < speedMin){self.speed = speedMin;}}
				self.x -= (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y -= (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
				self.walkingDir = 8;
				updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
			}
		}
		//boosting		
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
		
		if (self.walkingDir != 0 && self.aiming == 0 && !self.pressingUp && !self.pressingDown && !self.pressingLeft && !self.pressingRight && self.reloading <= 0){
			self.shootingDir = self.walkingDir;
			updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
		} //default to shootingdir = walkingdir unless otherwise specified!
		
		//No movement input
		if(!self.pressingW && !self.pressingD && !self.pressingS && !self.pressingA && self.boosting == 0){
			//self.speed = self.speed - 1;
			if (self.walkingDir != 0){
				updatePlayerList.push({id:self.id,property:"walkingDir",value:0});
				updatePlayerList.push({id:self.id,property:"legHeight",value:0});
			}
			self.walkingDir = 0;
			self.legHeight = 0;
		}
		//Edge detection
		if (self.speed < 0){self.speed = 0;}
		if (self.x > mapWidth){self.x = mapWidth; updatePlayerList.push({id:self.id,property:"x",value:self.x});}
		if (self.y > mapHeight){self.y = mapHeight; updatePlayerList.push({id:self.id,property:"y",value:self.y});}
		if (self.x < 0){self.x = 0; updatePlayerList.push({id:self.id,property:"x",value:self.x});}
		if (self.y < 0){self.y = 0; updatePlayerList.push({id:self.id,property:"y",value:self.y});}

		//End Walking

		//swing legs
		if (self.walkingDir != 0){
			if (self.legSwingForward == true){
				self.legHeight += self.speed * 1.4;
				updatePlayerList.push({id:self.id,property:"legHeight",value:self.legHeight});
				if (self.legHeight > 94){
					self.legSwingForward = false;
					updatePlayerList.push({id:self.id,property:"legSwingForward",value:self.legSwingForward});
				}
			}
			if (self.legSwingForward == false){
				self.legHeight -= self.speed * 1.4;
				updatePlayerList.push({id:self.id,property:"legHeight",value:self.legHeight});
				if (self.legHeight < -94){
					self.legSwingForward = true;
				updatePlayerList.push({id:self.id,property:"legSwingForward",value:self.legSwingForward});
				}
			}
			if (self.boosting > 7){
				self.legHeight = 94; 
			updatePlayerList.push({id:self.id,property:"legHeight",value:self.legHeight});
			}
		}
		
		////////////////////// BEING PUSHED ///////////////////////////////////////////
		if (self.pushSpeed > 0){
			if(self.pushDir == 1){
				self.y -= self.pushSpeed;
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
			}
			else if(self.pushDir == 3){
				self.x += self.pushSpeed;
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
			}
			else if(self.pushDir == 5){
				self.y += self.pushSpeed;
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
			}
			else if(self.pushDir == 7){
				self.x -= self.pushSpeed;
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
			}
			else if(self.pushDir == 2){
				self.x += (self.pushSpeed) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y -= (self.pushSpeed) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
			}
			else if(self.pushDir == 4){
				self.x += (self.pushSpeed) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y += (self.pushSpeed) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
			}
			else if(self.pushDir == 6){
				self.x -= (self.pushSpeed) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y += (self.pushSpeed) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
			}
			else if(self.pushDir == 8){
				self.x -= (self.pushSpeed) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y -= (self.pushSpeed) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
			}			
			
			self.pushSpeed--;
		}
		
		///////////////////// COLLISION WITH OBSTACLES/PLAYERS /////////////////////////
		
		//Check collision with players
		for (var i in Player.list){
			if (Player.list[i].id != self.id  && Player.list[i].health > 0 && self.x + self.width > Player.list[i].x && self.x < Player.list[i].x + Player.list[i].width && self.y + self.height > Player.list[i].y && self.y < Player.list[i].y + Player.list[i].height){								
				if (self.x == Player.list[i].x && self.y == Player.list[i].y){self.x -= 50;} //Added to avoid math issues when entities are directly on top of each other (distance = 0)
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
						updatePlayerList.push({id:self.id,property:"boosting",value:self.boosting})
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
						Player.list[i].healDelay = 300;
						sprayBloodOntoTarget(self.boostingDir, Player.list[i].x, Player.list[i].y);
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
				if (self.x == Thug.list[i].x && self.y == Thug.list[i].y){self.x -= 50;} //Added to avoid math issues when entities are directly on top of each other (distance = 0)
				var dx1 = self.x - Thug.list[i].x;
				var dy1 = self.y - Thug.list[i].y;
				var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
				var ax1 = dx1/dist1;
				var ay1 = dy1/dist1;
				if (dist1 < 40){				
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
				var overlapTop = Math.abs(Block.list[i].y - self.y);  
				var overlapBottom = Math.abs((Block.list[i].y + Block.list[i].height) - self.y);
				var overlapLeft = Math.abs(self.x - Block.list[i].x);
				var overlapRight = Math.abs((Block.list[i].x + Block.list[i].width) - self.x);			
				if (overlapTop <= overlapBottom && overlapTop <= overlapRight && overlapTop <= overlapLeft){
					self.y = Block.list[i].y;
					updatePlayerList.push({id:self.id,property:"y",value:self.y});
				}
				else if (overlapBottom <= overlapTop && overlapBottom <= overlapRight && overlapBottom <= overlapLeft){
					self.y = Block.list[i].y + Block.list[i].height;
					updatePlayerList.push({id:self.id,property:"y",value:self.y});
				}
				else if (overlapLeft <= overlapTop && overlapLeft <= overlapRight && overlapLeft <= overlapBottom){
					self.x = Block.list[i].x;
					updatePlayerList.push({id:self.id,property:"x",value:self.x});
				}
				else if (overlapRight <= overlapTop && overlapRight <= overlapLeft && overlapRight <= overlapBottom){
					self.x = Block.list[i].x + Block.list[i].width;
					updatePlayerList.push({id:self.id,property:"x",value:self.x});
				}
			}// End check if player is overlapping block
		}//End Block.list loop		
		
		for (var i in Pickup.list){
			if (self.health > 0 && self.x > Pickup.list[i].x - 30 && self.x < Pickup.list[i].x + Pickup.list[i].width + 30 && self.y > Pickup.list[i].y - 30 && self.y < Pickup.list[i].y + Pickup.list[i].height + 30){
				pickupPickup(self.id, Pickup.list[i].id);
			}
		}			
		//Check Player collision with bag - STEAL
		if (self.team == "white" && bagBlue.captured == false && self.health > 0 && bagBlue.playerThrowing != self.id){
			if (self.x > bagBlue.x - 67 && self.x < bagBlue.x + 67 && self.y > bagBlue.y - 50 && self.y < bagBlue.y + 50){												
				bagBlue.captured = true;
				bagBlue.speed = 0;
				updateMisc.bagBlue = {x:bagBlue.x,y:bagBlue.y,captured:bagBlue.captured};
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
				if (bagBlue.x == bagBlueHomeX && bagBlue.y == bagBlueHomeY){
					playerEvent(self.id, "steal");
				}
			}
		}
		else if (self.team == "black" && bagRed.captured == false && self.health > 0 && bagRed.playerThrowing != self.id){
			if (self.x > bagRed.x - 67 && self.x < bagRed.x + 67 && self.y > bagRed.y - 50 && self.y < bagRed.y + 50){												
				bagRed.captured = true;
				bagRed.speed = 0;
				updateMisc.bagRed = {x:bagRed.x,y:bagRed.y,captured:bagRed.captured};
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
				if (bagRed.x == bagRedHomeX && bagRed.y == bagRedHomeY){
					playerEvent(self.id, "steal");					
				}
			}
		}

		//Check Player collision with bag - RETURN
		if (self.team == "white" && bagRed.captured == false && self.health > 0 && (bagRed.x != bagRedHomeX || bagRed.y != bagRedHomeY)){
			if (self.x > bagRed.x - 67 && self.x < bagRed.x + 67 && self.y > bagRed.y - 50 && self.y < bagRed.y + 50){			
				playerEvent(self.id, "return");
				bagRed.x = bagRedHomeX;
				bagRed.y = bagRedHomeY;
				bagRed.speed = 0;
				updateMisc.bagRed = {x:bagRed.x,y:bagRed.y,captured:bagRed.captured};		
			}
		}
		if (self.team == "black" && bagBlue.captured == false && self.health > 0 && (bagBlue.x != bagBlueHomeX || bagBlue.y != bagBlueHomeY)){
			if (self.x > bagBlue.x - 67 && self.x < bagBlue.x + 67 && self.y > bagBlue.y - 50 && self.y < bagBlue.y + 50){												
				playerEvent(self.id, "return");
				bagBlue.x = bagBlueHomeX;
				bagBlue.y = bagBlueHomeY;
				bagBlue.speed = 0;
				updateMisc.bagBlue = {x:bagBlue.x,y:bagBlue.y,captured:bagBlue.captured};
			}
		}

		//Check Player collision with bag - CAPTURE
		if (gameOver == false){
			if (self.team == "white" && self.holdingBag == true && bagRed.captured == false && self.health > 0 && (bagRed.x == bagRedHomeX && bagRed.y == bagRedHomeY)){
				if (self.x > bagRedHomeX - 67 && self.x < bagRedHomeX + 67 && self.y > bagRedHomeY - 50 && self.y < bagRedHomeY + 50){												
					//Bag Score
					playerEvent(self.id, "capture");
					capture("white");
				}
			}
			if (self.team == "black" && self.holdingBag == true && bagBlue.captured == false && self.health > 0 && (bagBlue.x == bagBlueHomeX && bagBlue.y == bagBlueHomeY)){
				if (self.x > bagBlueHomeX - 67 && self.x < bagBlueHomeX + 67 && self.y > bagBlueHomeY - 50 && self.y < bagBlueHomeY + 50){												
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
				updateMisc.bagRed = {x:bagRed.x,y:bagRed.y,captured:bagRed.captured};
			}
			else if (self.team == "white"){
				bagBlue.x = self.x;
				bagBlue.y = self.y;				
				updateMisc.bagBlue = {x:bagBlue.x,y:bagBlue.y,captured:bagBlue.captured};
			}
		}
		
		////// RELOADING ////////
		if (self.reloading > 0){
			self.reloading--;
			if (self.reloading <= 0) {
				if (self.weapon == 1){
					self.PClip = 15;
					updatePlayerList.push({id:self.id,property:"PClip",value:self.PClip});
				}
				else if (self.weapon == 3){
					var clipNeeds = 30 - self.MGClip;
					if (self.MGAmmo >= clipNeeds){
						self.MGClip = 30;
						self.MGAmmo -= clipNeeds;
					}
					else {
						self.MGClip += self.MGAmmo;
						self.MGAmmo = 0;
					}
					updatePlayerList.push({id:self.id,property:"MGClip",value:self.MGClip});
					updatePlayerList.push({id:self.id,property:"MGAmmo",value:self.MGAmmo});
				}
				else if (self.weapon == 2){
					var clipNeeds = 20 - self.DPClip;
					if (self.DPAmmo >= clipNeeds){
						self.DPClip = 20;
						self.DPAmmo -= clipNeeds;
					}
					else {
						self.DPClip += self.DPAmmo;
						self.DPAmmo = 0;
					}
					updatePlayerList.push({id:self.id,property:"DPClip",value:self.DPClip});
					updatePlayerList.push({id:self.id,property:"DPAmmo",value:self.DPAmmo});
				}
			}
		}
		
		
	}//End move()


	self.respawn = function(){
		self.health = 100;
		updatePlayerList.push({id:self.id,property:"health",value:self.health});

		self.rechargeDelay = 0;
		self.healDelay = 0;
		self.hasBattery = 1;
		self.respawnTimer = 0;
		self.boosting = 0;
		updatePlayerList.push({id:self.id,property:"boosting",value:self.boosting});
		self.pressingW = false;
		self.pressingA = false;
		self.pressingS = false;
		self.pressingD = false;
		self.pressingUp = false;
		self.pressingRight = false;
		self.pressingDown = false;
		self.pressingLeft = false;
		self.pressingShift = false;
		updatePlayerList.push({id:self.id,property:"pressingShift",value:self.pressingShift});
		self.pushSpeed = 0;
		self.weapon = 1;
		updatePlayerList.push({id:self.id,property:"weapon",value:self.weapon});
		self.PClip = 15;
		updatePlayerList.push({id:self.id,property:"PClip",value:self.PClip});

				
		if (self.team == "black"){
			var minX = mapWidth - 450;
			var maxX = mapWidth - 40;
			var minY = mapHeight - 450;
			var maxY = mapHeight - 40;
			
			self.x = Math.floor(Math.random() * (maxX - minX) + minX);
			updatePlayerList.push({id:self.id,property:"x",value:self.x});
			self.y = Math.floor(Math.random() * (maxY - minY) + minY);
			updatePlayerList.push({id:self.id,property:"y",value:self.y});
		}
		else if (self.team == "white"){
			self.x = Math.floor((Math.random() * 450) + 40);
			updatePlayerList.push({id:self.id,property:"x",value:self.x});
			self.y = Math.floor((Math.random() * 450) + 40);
			updatePlayerList.push({id:self.id,property:"y",value:self.y});
		}
		
		//Send Full Game Status
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
				boosting:Player.list[a].boosting,
				walkingDir:Player.list[a].walkingDir,				
				shootingDir:Player.list[a].shootingDir,				
				legHeight:Player.list[a].legHeight,				
				legSwingForward:Player.list[a].legSwingForward,				
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
				kills:Player.list[a].kills,
				deaths:Player.list[a].deaths,
				steals:Player.list[a].steals,
				returns:Player.list[a].returns,
				captures:Player.list[a].captures,			
			};
			playerPack.push(player);
		}
		for (var b in Thug.list){
			var thug = {
				id:Thug.list[b].id,
				x:Thug.list[b].x,
				y:Thug.list[b].y,
				health:Thug.list[b].health,
				legHeight:Thug.list[b].legHeight,
				legSwingForward:Thug.list[b].legSwingForward,
				team:Thug.list[b].team,
				rotation:Thug.list[b].rotation,
			};
			thugPack.push(thug);
		}
		for (var c in Block.list){
			var block = {
				id:Block.list[c].id,
				x:Block.list[c].x,
				y:Block.list[c].y,
				width:Block.list[c].width,
				height:Block.list[c].height,
			};			
			blockPack.push(block);
		}
		for (var p in Pickup.list){
			var pickup = {
				id:Pickup.list[p].id,
				x:Pickup.list[p].x,
				y:Pickup.list[p].y,
				type:Pickup.list[p].type,
				amount:Pickup.list[p].amount,
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

		socket.emit('updateInit',playerPack, thugPack, pickupPack, blockPack, miscPack);
	}
	
	Player.list[id] = self;
	log("Player " + self.name + " has entered the game.");
	socket.emit('sendPlayerNameToClient',self.name);
	self.respawn();
	return self;
} //End Player function

Player.list = {};

Player.onConnect = function(socket, name){
	var player = Player(socket.id, name);
	
	socket.on('keyPress', function(data){
		if (player.health > 0){
			var discharge = false;
			if(data.inputId === 87){player.pressingW = data.state;}
			else if(data.inputId === 68){player.pressingD = data.state;}
			else if(data.inputId === 83){player.pressingS = data.state;}
			else if(data.inputId === 65){player.pressingA = data.state;}
			
			else if(data.inputId === 38){
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
			else if(data.inputId === 39){
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
			else if(data.inputId === 40){
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
			else if(data.inputId === 37){
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
					player.boosting = 17;
					updatePlayerList.push({id:player.id,property:"boosting",value:player.boosting});
					player.rechargeDelay = 150;
					player.energy -= 25;
					if (player.energy <= 0){
						player.rechargeDelay = 300;
						player.energy = 0;
					}
					if (player.hasBattery > 1 && player.energy == 100)
						player.energy--; //To avoid having bar appear white when more than one battery
					updatePlayerList.push({id:player.id,property:"energy",value:player.energy});
					player.boostingDir = player.walkingDir;
				}
				else if (player.holdingBag == true && player.walkingDir != 0){
					player.holdingBag = false;
					if (player.energy > 0){
						player.rechargeDelay = 150;
						player.energy = 1;
						updatePlayerList.push({id:player.id,property:"energy",value:player.energy});
					}
					updatePlayerList.push({id:player.id,property:"holdingBag",value:player.holdingBag});					
					if (player.team == "white"){
						bagBlue.captured = false;
						updateMisc.bagBlue = {x:bagBlue.x,y:bagBlue.y,captured:bagBlue.captured};
						bagBlue.playerThrowing = player.id;
						bagBlue.speed = 25;
						bagBlue.direction = player.walkingDir;
					}
					else if (player.team == "black"){
						bagRed.captured = false;
						updateMisc.bagRed = {x:bagRed.x,y:bagRed.y,captured:bagRed.captured};
						bagRed.playerThrowing = player.id;
						bagRed.speed = 25;
						bagRed.direction = player.walkingDir;
					}
				}
			}
			else if (data.inputId == 81){ //Q
				if (player.reloading > 0){
					player.reloading = 0;
					updatePlayerList.push({id:player.id,property:"reloading",value:player.reloading});				
				}
				if (player.weapon == 1){
					if (player.MGAmmo > 0 || player.MGClip > 0){
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
			else if (data.inputId == 85){ //U
				//player.health -= 50;
				//updatePlayerList.push({id:player.id,property:"health",value:player.health});
				if (!player.holdingBag){
					if (player.team == "white"){
						player.team = "black";
						updatePlayerList.push({id:player.id,property:"team",value:player.team});						
					}
					else if (player.team == "black"){
						player.team = "white";
						updatePlayerList.push({id:player.id,property:"team",value:player.team});						
					}
				}
			}


			if (discharge){
				player.aiming = 60; //!!! Need to finalize
				Discharge(player);				
			}
				
		}//End health > 0 check for allowing input
		
		
	}); //End Socket on Keypress
	
	socket.on('purchase', function (data){
		if (data.selection == 1 && Player.list[data.playerId].cash >= shop.price1){
			Player.list[data.playerId].cash -= shop.price1
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
		else if (data.selection == 3 && Player.list[data.playerId].cash >= shop.price3){
			Player.list[data.playerId].cash -= shop.price3
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
			Player.list[data.playerId].cash -= shop.price4
			updatePlayerList.push({id:data.playerId,property:"cash",value:Player.list[data.playerId].cash});								
			Player.list[data.playerId].health += 100;
			if (Player.list[data.playerId].health > 200){
				Player.list[data.playerId].health = 200;
			}
			updatePlayerList.push({id:data.playerId,property:"health",value:Player.list[data.playerId].health});								
		}		
		else if (data.selection == 5 && Player.list[data.playerId].cash >= shop.price5){
			Player.list[data.playerId].cash -= shop.price5
			updatePlayerList.push({id:data.playerId,property:"cash",value:Player.list[data.playerId].cash});								
			Player.list[data.playerId].hasBattery += 1;
		}		
		
	});
	//create new thug upon gamestart
	
}//End Player.onConnect

function pickupPickup(playerId, pickupId){
	if (Pickup.list[pickupId].type == 2){
		if (Player.list[playerId].holdingBag == false && Player.list[playerId].weapon == 1){
			Player.list[playerId].weapon = 2;
			updatePlayerList.push({id:playerId,property:"weapon",value:Player.list[playerId].weapon});	
		}
		else {
			SOCKET_LIST[playerId].emit('sfx', "sfxDPEquip");
		}
		if (Player.list[playerId].DPClip <= 0 && Player.list[playerId].DPAmmo <= 0){
			if (Pickup.list[pickupId].amount <= 20){
				Player.list[playerId].DPClip += Pickup.list[pickupId].amount;				
			}
			else {
				Player.list[playerId].DPClip += 20;
				Player.list[playerId].DPAmmo += Pickup.list[pickupId].amount - 20;
			}
			updatePlayerList.push({id:playerId,property:"DPClip",value:Player.list[playerId].DPClip});								
			updatePlayerList.push({id:playerId,property:"DPAmmo",value:Player.list[playerId].DPAmmo});								
		}
		else {
			Player.list[playerId].DPAmmo += Pickup.list[pickupId].amount;
			updatePlayerList.push({id:playerId,property:"DPAmmo",value:Player.list[playerId].DPAmmo});								
		}				
	}
	else if (Pickup.list[pickupId].type == 3){
		if (Player.list[playerId].holdingBag == false && Player.list[playerId].weapon == 1){
			Player.list[playerId].weapon = 3;
			updatePlayerList.push({id:playerId,property:"weapon",value:Player.list[playerId].weapon});	
		}
		else {
			SOCKET_LIST[playerId].emit('sfx', "sfxMGEquip");
		}
		if (Player.list[playerId].MGClip <= 0 && Player.list[playerId].MGAmmo <= 0){
			if (Pickup.list[pickupId].amount <= 30){
				Player.list[playerId].MGClip += Pickup.list[pickupId].amount;				
			}
			else {
				Player.list[playerId].MGClip += 30;
				Player.list[playerId].MGAmmo += Pickup.list[pickupId].amount - 30;
			}
			updatePlayerList.push({id:playerId,property:"MGClip",value:Player.list[playerId].MGClip});								
			updatePlayerList.push({id:playerId,property:"MGAmmo",value:Player.list[playerId].MGAmmo});								
		}
		else {
			Player.list[playerId].MGAmmo += Pickup.list[pickupId].amount;
			updatePlayerList.push({id:playerId,property:"MGAmmo",value:Player.list[playerId].MGAmmo});								
		}				
	}
	else if (Pickup.list[pickupId].type == 5){
		Player.list[playerId].health += 100;
		if (Player.list[playerId].health > 200){
			Player.list[playerId].health = 200;
		}
		updatePlayerList.push({id:playerId,property:"health",value:Player.list[playerId].health});											
		SOCKET_LIST[playerId].emit('sfx', "sfxBagGrab");
	}
	
	
	delete Pickup.list[pickupId];
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
	if (Player.list[playerId].weapon == 1 && Player.list[playerId].PClip >= 15){return;}
	else if ((Player.list[playerId].weapon == 3 && Player.list[playerId].MGClip >= 30) || (Player.list[playerId].weapon == 3 && Player.list[playerId].MGAmmo <= 0)){return;}
	else if ((Player.list[playerId].weapon == 2 && Player.list[playerId].DPClip >= 20) || (Player.list[playerId].weapon == 2 && Player.list[playerId].DPAmmo <= 0)){return;}
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
	}	
}

function Discharge(player){
	if (player.reloading > 0){return;}
	else if (player.weapon == 1 && player.PClip <= 0){
		reload(player.id);
		player.fireRate = 25;
		return;
	}
	else if (player.weapon == 3 && player.MGClip <= 0){
		reload(player.id);
		player.fireRate = 5;
		return;
	}
	else if (player.weapon == 2 && player.DPClip <= 0){
		reload(player.id);
		player.fireRate = 25;
		return;
	}
	

	if(player.weapon == 1 && player.firing <= 0){
		player.PClip--;
		updatePlayerList.push({id:player.id,property:"PClip",value:player.PClip});
		player.fireRate = 25;
	}
	else if(player.weapon == 2 && player.firing <= 0){
		player.DPClip--;
		updatePlayerList.push({id:player.id,property:"DPClip",value:player.DPClip});
		player.fireRate = 25;
	}
	else if(player.weapon == 3 && player.firing <= 0){
		player.MGClip--;
		updatePlayerList.push({id:player.id,property:"MGClip",value:player.MGClip});
		player.fireRate = 5;
	}
	discharge = false;
	player.firing = 3; 
	player.liveShot = true;
	
	var shotData = {};
	shotData.id = player.id;
	shotData.distance = -1;
	shotData.spark = false;			
	shotData.discharge = true;
	for(var i in SOCKET_LIST){
		SOCKET_LIST[i].emit('shootUpdate',shotData);
	}
}

Player.onDisconnect = function(socket){
	if (Player.list[socket.id]){
		log(Player.list[socket.id].name + " disconnected.");
		if (Player.list[socket.id].holdingBag == true){
			if (Player.list[socket.id].team == "white"){
				bagBlue.captured = false;
				updateMisc.bagBlue = {x:bagBlue.x,y:bagBlue.y,captured:bagBlue.captured};
			}
			else if (Player.list[socket.id].team == "black"){
				bagRed.captured = false;
				updateMisc.bagRed = {x:bagRed.x,y:bagRed.y,captured:bagRed.captured};
			}
		}
	}
	delete Player.list[socket.id];
	for(var i in SOCKET_LIST){
		SOCKET_LIST[i].emit('removePlayer', socket.id);
	}	
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
				legHeight:player.legHeight,
				legSwingForward:player.legSwingForward,
				firing:player.firing,
				aiming:player.aiming,
				holdingBag:player.holdingBag,
			});
		}
		return pack;
}

function capture(team) {
	if (team == "white"){
		whiteCaptures++;
		bagBlue.captured = false;
		bagBlue.x = bagBlueHomeX;
		bagBlue.y = bagBlueHomeY;
		updateMisc.bagBlue = {x:bagBlue.x,y:bagBlue.y,captured:bagBlue.captured};
	}
	else if (team == "black"){
		blackCaptures++;
		bagRed.captured = false;
		bagRed.x = bagRedHomeX;
		bagRed.y = bagRedHomeY;
		updateMisc.bagRed = {x:bagRed.x,y:bagRed.y,captured:bagRed.captured};
	}
	for (var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];	
		socket.emit('capture', team, whiteCaptures, blackCaptures);
	}
}

function sendCapturesToClients(){
	for (var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];	
		socket.emit('capture', 'reset', whiteCaptures, blackCaptures);
	}
}


function sprayBloodOntoTarget(shootingDir, targetX, targetY) {
	var data = {};
	data.targetX = targetX;
	data.targetY = targetY;
	data.shootingDir = shootingDir;
	for(var i in SOCKET_LIST){
		SOCKET_LIST[i].emit('sprayBloodOntoTarget',data);
	}
}

function checkIfHit(shooter, target){
	var distFromDiag = 0;
	//&& target.team != shooter.team //Take off friendly fire
	
	if (target.team){
		if (target.id != shooter.id && target.health > 0){
			if (shooter.shootingDir == 1){
				if (target.x > shooter.x - 31 && target.x < shooter.x + 31 && target.y < shooter.y){
					return {target:target,dist:(shooter.y - target.y),distFromDiag:distFromDiag};
				}
			}
			else if (shooter.shootingDir == 2){
				distFromDiag = target.x - (shooter.x + (shooter.y - target.y));
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
				distFromDiag = target.x - shooter.x + (shooter.y - target.y);
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
				distFromDiag = target.x - (shooter.x + (shooter.y - target.y));
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
				distFromDiag = target.x - shooter.x + (shooter.y - target.y);
				if (Math.abs(distFromDiag) < 44 && target.y < shooter.y){
					return {target:target,dist:(shooter.x - target.x),distFromDiag:distFromDiag};
				}
			}	
		} // End check if target.id != shooter.id
	}// End check if target is organic (or block/wall)
	else {
	//Block shot hit detection
		var overlapTop = shooter.y - target.y;  
		var overlapBottom = (target.y + target.height) - shooter.y;
		var overlapLeft = shooter.x - target.x;
		var overlapRight = (target.x + target.width) - shooter.x;			
		if (shooter.shootingDir == 1){
			if (target.x + target.width > shooter.x && target.x < shooter.x && target.y < shooter.y){
				return {target:target,dist:(shooter.y - (target.y + target.height)),distFromDiag:distFromDiag};
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
				return {target:target,dist:dist,distFromDiag:distFromDiag};
			}
		}
		else if (shooter.shootingDir == 3){
			if (target.y + target.height > shooter.y && target.y < shooter.y && target.x + target.width > shooter.x){
				return {target:target,dist:(target.x - shooter.x),distFromDiag:distFromDiag};
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
				return {target:target,dist:dist,distFromDiag:distFromDiag};
			}
		}
		else if (shooter.shootingDir == 5){
			if (target.x + target.width > shooter.x && target.x < shooter.x && target.y + target.height > shooter.y){
				return {target:target,dist:(target.y - shooter.y),distFromDiag:distFromDiag};
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
				return {target:target,dist:dist,distFromDiag:distFromDiag};
			}
		}
		else if (shooter.shootingDir == 7){
			if (target.y + target.height > shooter.y && target.y < shooter.y && target.x < shooter.x){
				return {target:target,dist:(shooter.x - (target.x + target.width)),distFromDiag:distFromDiag};
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
				return {target:target,dist:dist,distFromDiag:distFromDiag};
			}
		}		
	} //End Block detection Else statement
	
	return false;
}


function hit(target, shootingDir, distance, shooterId){
		var shotData = {};
		shotData.id = shooterId;
		shotData.spark = false;
		shotData.discharge = false;

		if (target.team != Player.list[shooterId].team){
			Player.list[shooterId].cash += 10;
			updatePlayerList.push({id:shooterId,property:"cash",value:Player.list[shooterId].cash});
		}


		if (!target.team){shotData.spark = true;}
		if (shootingDir % 2 == 0){
			shotData.distance = distance * 1.42 - 42;
		}
		else {
			shotData.distance = distance - 42;
		}
		if (shotData.distance < 0){shotData.distance = 0;}
		
		for(var i in SOCKET_LIST){
			SOCKET_LIST[i].emit('shootUpdate',shotData);
		}
		
		if (target.health){
			target.health -= Math.floor(10 * bulletDmg); 
			if (Player.list[shooterId].weapon == 2){target.health -= Math.floor(10 * bulletDmg);}
			else if (Player.list[shooterId].weapon == 3){target.health -= Math.floor(2 * bulletDmg);}
			target.healDelay += 300;
			if (target.healDelay > 300){target.healDelay = 300;} //??? This line will limit how much delay the healing can delay. With it commented, damage will stack, causing consecutive quick damage to heavily delay healing.
			if (target.shootingDir){
					if (target.shootingDir != (shootingDir + 4) && target.shootingDir != (shootingDir - 4) && target.shootingDir != (shootingDir + 5) && target.shootingDir != (shootingDir - 5) && target.shootingDir != (shootingDir + 3) && target.shootingDir != (shootingDir - 3) && target.team != Player.list[shooterId].team){
						target.health -= Math.floor(20 * bulletDmg);
						if (Player.list[shooterId].weapon == 2){target.health -= Math.floor(20 * bulletDmg);}
						else if (Player.list[shooterId].weapon == 3){target.health -= Math.floor(5 * bulletDmg);}
					}
					if (target.shootingDir == shootingDir && target.team != Player.list[shooterId].team){
						target.health -= Math.floor(10 * bulletDmg);		
						if (Player.list[shooterId].weapon == 2){target.health -= Math.floor(10 * bulletDmg);}
						else if (Player.list[shooterId].weapon == 3){target.health -= Math.floor(2 * bulletDmg);}
					}
			}
			if (Player.list[target.id]){updatePlayerList.push({id:target.id,property:"health",value:target.health});}
			else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"health",value:target.health});}

			
			if (shootingDir == 1){
				target.y -= 10;			
				if (Player.list[target.id]){updatePlayerList.push({id:target.id,property:"y",value:target.y});}
				else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"y",value:target.y});}
			}
			if (shootingDir == 2){
				target.x += 7;
				if (Player.list[target.id]){updatePlayerList.push({id:target.id,property:"x",value:target.x});}
				else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"x",value:target.x});}
				target.y -= 7;			
				if (Player.list[target.id]){updatePlayerList.push({id:target.id,property:"y",value:target.y});}
				else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"y",value:target.y});}
			}
			if (shootingDir == 3){
				target.x += 10;
				if (Player.list[target.id]){updatePlayerList.push({id:target.id,property:"x",value:target.x});}
				else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"x",value:target.x});}
			}
			if (shootingDir == 4){
				target.x += 7;
				if (Player.list[target.id]){updatePlayerList.push({id:target.id,property:"x",value:target.x});}
				else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"x",value:target.x});}
				target.y += 7;			
				if (Player.list[target.id]){updatePlayerList.push({id:target.id,property:"y",value:target.y});}
				else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"y",value:target.y});}
			}
			if (shootingDir == 5){
				target.y += 10;			
				if (Player.list[target.id]){updatePlayerList.push({id:target.id,property:"y",value:target.y});}
				else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"y",value:target.y});}
			}
			if (shootingDir == 6){
				target.x -= 7;
				if (Player.list[target.id]){updatePlayerList.push({id:target.id,property:"x",value:target.x});}
				else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"x",value:target.x});}
				target.y += 7;			
				if (Player.list[target.id]){updatePlayerList.push({id:target.id,property:"y",value:target.y});}
				else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"y",value:target.y});}
			}
			if (shootingDir == 7){
				target.x -= 10;
				if (Player.list[target.id]){updatePlayerList.push({id:target.id,property:"x",value:target.x});}
				else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"x",value:target.x});}
			}
			if (shootingDir == 8){
				target.x -= 7;
				if (Player.list[target.id]){updatePlayerList.push({id:target.id,property:"x",value:target.x});}
				else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"x",value:target.x});}
				target.y -= 7;			
				if (Player.list[target.id]){updatePlayerList.push({id:target.id,property:"y",value:target.y});}
				else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"y",value:target.y});}
			}
			if (target.health <= 0){
				kill(target, shootingDir, shooterId);
			}
			
		}
} //END hit function

//eventTrigger
function playerEvent(playerId, event){
	if (event == "kill"){
		Player.list[playerId].kills++;
		Player.list[playerId].cash+=killCash;
		updatePlayerList.push({id:playerId,property:"kills",value:Player.list[playerId].kills});
		updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
		udpateNotificationList.push({text:"+$" + killCash + " - Enemy Killed",playerId:playerId});
		db.RW_USER.update({USERNAME: Player.list[playerId].name}, {$inc: {cash: killCash, experience: killCash, kills: 1}}, {multi: true}, function () {});	
	}
	else if (event == "death"){
		Player.list[playerId].deaths++;
		if (Player.list[playerId]){
			updatePlayerList.push({id:playerId,property:"deaths",value:Player.list[playerId].deaths});
		}
		db.RW_USER.update({USERNAME: Player.list[playerId].name}, {$inc: {deaths: 1}}, {multi: true}, function () {});		
	}
	else if (event == "benedict"){
		udpateNotificationList.push({text:"Benedict!",playerId:playerId});
		db.RW_USER.update({USERNAME: Player.list[playerId].name}, {$inc: {benedicts: 1}}, {multi: true}, function () {});		
	}
	else if (event == "steal"){
		Player.list[playerId].steals++;
		Player.list[playerId].cash += stealCash;
		updatePlayerList.push({id:playerId,property:"steals",value:Player.list[playerId].steals});
		updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
		udpateNotificationList.push({text:"+$" + stealCash + " - Bag Stolen",playerId:playerId});
		db.RW_USER.update({USERNAME: Player.list[playerId].name}, {$inc: {cash: stealCash, experience: stealCash, steals: 1}}, {multi: true}, function () {});		
	}
	else if (event == "return"){
		Player.list[playerId].returns++;
		Player.list[playerId].cash+=returnCash;
		updatePlayerList.push({id:playerId,property:"returns",value:Player.list[playerId].returns});
		updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
		udpateNotificationList.push({text:"+$" + returnCash + " - Bag Returned",playerId:playerId});
		db.RW_USER.update({USERNAME: Player.list[playerId].name}, {$inc: {cash: returnCash, experience: returnCash, returns: 1}}, {multi: true}, function () {});		
	}
	else if (event == "capture"){
		Player.list[playerId].holdingBag = false;
		updatePlayerList.push({id:playerId,property:"holdingBag",value:false});
		Player.list[playerId].captures++;
		Player.list[playerId].cash+=captureCash;
		updatePlayerList.push({id:playerId,property:"captures",value:Player.list[playerId].captures});
		updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
		udpateNotificationList.push({text:"+$" + captureCash + " - BAG CAPTURED!!!",playerId:playerId});
		db.RW_USER.update({USERNAME: Player.list[playerId].name}, {$inc: {cash: captureCash, experience: captureCash, captures: 1}}, {multi: true}, function () {});		
	}
	else if (event == "win"){
		udpateNotificationList.push({text:"VICTORY!!!",playerId:playerId});
		db.RW_USER.update({USERNAME: Player.list[playerId].name}, {$inc: {cash: winCash, experience: winCash, gamesWon: 1, gamesPlayed: 1}}, {multi: true}, function () {});				
	}
	else if (event == "lose"){
		udpateNotificationList.push({text:"VICTORY!!!",playerId:playerId});
		db.RW_USER.update({USERNAME: Player.list[playerId].name}, {$inc: {cash: loseCash, experience: loseCash, gamesLost: 1, gamesPlayed: 1}}, {multi: true}, function () {});				
	}
}

function calculateEndgameStats(){
	for (var p in Player.list){
		log(Player.list[p].id + " " + Player.list[p].team + " whiteCap:" + whiteCaptures + " blackCap:" + blackCaptures);
		if ((Player.list[p].team == "white" && whiteCaptures > blackCaptures) || (Player.list[p].team == "black" && whiteCaptures < blackCaptures)){
			playerEvent(Player.list[p].id, "win");
		}
		else {
			playerEvent(Player.list[p].id, "lose");
		}
	}

}

function kill(target, shootingDir, shooterId){
	playerEvent(target.id, "death");

	if (target.team != Player.list[shooterId].team){
		playerEvent(shooterId, "kill");
	}
	else {
		playerEvent(shooterId, "benedict");
	}
	//Create Body
	for (var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];	
		if (target.team == "white"){
			socket.emit('createBody',target, shootingDir,"pistol", "whiteRed");
		}
		else if (target.team == "black"){
			socket.emit('createBody',target, shootingDir,"pistol", "blackBlue");
		}
	}
	
	//Drop Ammo/Pickups
	var drops = 0;
	if (target.DPAmmo > 0 || target.DPClip > 0){
		drops++;
		var ammoAmount = target.DPClip + target.DPAmmo;
		var ammoID = Math.random();
		var DPammo1 = Pickup(ammoID, target.x - 25, target.y - 25, 2, ammoAmount);
		console.log(Pickup.list[ammoID]);
		updatePickupList.push(Pickup.list[ammoID]);
		target.DPAmmo = 0;
		target.DPClip = 0;
		updatePlayerList.push({id:target.id,property:"DPAmmo",value:target.DPAmmo});		
		updatePlayerList.push({id:target.id,property:"DPClip",value:target.DPClip});		
	}
	if (target.MGAmmo > 0 || target.MGClip > 0){
		drops++;
		var ammoAmount = target.MGClip + target.MGAmmo;
		var ammoID = Math.random();
		var MGammo1 = Pickup(ammoID, target.x - 25 + (drops * 30), target.y, 3, ammoAmount);
		updatePickupList.push(Pickup.list[ammoID]);
		target.MGAmmo = 0;
		target.MGClip = 0;
		updatePlayerList.push({id:target.id,property:"MGAmmo",value:target.MGAmmo});		
		updatePlayerList.push({id:target.id,property:"MGClip",value:target.MGClip});		
	}
	if (target.SGAmmo > 0 || target.SGClip > 0){
		drops++;
		var ammoAmount = target.SGClip + target.SGAmmo;
		var ammoID = Math.random();
		var SGammo1 = Pickup(ammoID, target.x - 30, target.y + (drops * 20), 3, ammoAmount);
		updatePickupList.push(Pickup.list[ammoID]);
		target.SGAmmo = 0;
		target.SGClip = 0;
		updatePlayerList.push({id:target.id,property:"SGAmmo",value:target.SGAmmo});		
		updatePlayerList.push({id:target.id,property:"SGClip",value:target.SGClip});		
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
		health:40,
		legHeight:47,
		legSwingForward:true,
		rotation:0,
		targetId:0,
		reevaluateTargetTimer:0,
	};
	updateThugList.push({id:self.id,property:"team",value:self.team});
	updateThugList.push({id:self.id,property:"x",value:self.x});
	updateThugList.push({id:self.id,property:"y",value:self.y});
	updateThugList.push({id:self.id,property:"legHeight",value:self.legHeight});
	updateThugList.push({id:self.id,property:"legSwingForward",value:self.legSwingForward});
	updateThugList.push({id:self.id,property:"rotation",value:self.rotation});
	
		
	//Thug movement calculation  
	var dx1 = 0;
	var dy1 = 0;
	var dist1 = 0;
	var ax1 = 0;
	var ay1 = 0;
	
	self.move = function(){
		//if (!Player.list[target.id]){delete Thug.list[self.id];}
		//Thug Respawn
		if (self.health <= 0){
			if (self.team == "white"){
				self.x = 200;
				self.y = 200;
			}
			else if (self.team == "black"){
				self.x = mapWidth - 200;
				self.y = mapHeight - 200;
			}
			self.health = 40;
			updateThugList.push({id:self.id,property:"x",value:self.x});
			updateThugList.push({id:self.id,property:"y",value:self.y});
			updateThugList.push({id:self.id,property:"health",value:self.health});
			//delete Thug.list[self.id];
		}

		//movement

			//swing legs
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

			var target = 0;
			var closestTargetDist = 999999;

			if (self.reevaluateTargetTimer > 0){
				self.reevaluateTargetTimer--;
			}
			if (self.reevaluateTargetTimer <= 0){
				for (var i in Player.list){
					if (Player.list[i].id != self.id && Player.list[i].team != self.team){
						dx1 = self.x - Player.list[i].x;
						dy1 = self.y - Player.list[i].y;
						dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
						if (dist1 < closestTargetDist && dist1 < 200){
							closestTargetDist = dist1;
							self.targetId = Player.list[i].id;
							target = Player.list[self.targetId];
						}
					}
				}
				for (var i in Thug.list){
					if (Thug.list[i].id != self.id && Thug.list[i].team != self.team){
						dx1 = self.x - Thug.list[i].x;
						dy1 = self.y - Thug.list[i].y;
						dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
						if (dist1 < closestTargetDist && dist1 < 200){
							closestTargetDist = dist1;
							self.targetId = Thug.list[i].id;
							target = Thug.list[self.targetId];
						}
					}
				}
				

				self.reevaluateTargetTimer = 30;
			}
			

			if (Player.list[self.targetId])
				target = Player.list[self.targetId];
			else if (Thug.list[self.targetId])
				target = Thug.list[self.targetId];
			
		if (self.targetId != 0){
			dx1 = self.x - target.x;
			dy1 = self.y - target.y;
			dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
			ax1 = dx1/dist1;
			ay1 = dy1/dist1;
			if (dist1 > 5){
				if (self.team != target.team){
					self.x -= ax1 * 3;
					self.y -= ay1 * 3;
				}
				else if (self.team == target.team && dist1 > 75){
					self.x -= ax1 * 3;
					self.y -= ay1 * 3;
				}
				updateThugList.push({id:self.id,property:"x",value:self.x});
				updateThugList.push({id:self.id,property:"y",value:self.y});
			}
		
			//rotation
			self.rotation = Math.atan2(dy1,dx1) + 4.71239;
			updateThugList.push({id:self.id,property:"rotation",value:self.rotation});
			
			
			//Check Thug collision with blocks
			for (var i in Block.list){
				if (self.x > Block.list[i].x && self.x < Block.list[i].x + Block.list[i].width && self.y > Block.list[i].y && self.y < Block.list[i].y + Block.list[i].height){												
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
				}// End check if thug is overlapping block
			}//End Block.list loop
		} //End If there's a target
		
		
	}
	Thug.list[id] = self;
}//End Thug Function
Thug.list = {};


var Block = function(id, x, y, width, height){
	var self = {
		id:id,
		x:x,
		y:y,
		width:width,
		height:height,
		//rotation?
	}		
	Block.list[id] = self;
}//End Block Function
Block.list = {};

var Pickup = function(id, x, y, type, amount){
	var self = {
		id:id,
		x:x,
		y:y,
		type:type,
		amount:amount,
		width:0,
		height:0,
	}		
	if (self.type == 2){
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

	Pickup.list[id] = self;
}//End Pickup Function
Pickup.list = {};




//////////INITIALIZE MAP///////////////////// Create Blocks new block
var block1 = Block(Math.random(), 450, 200, 400, 75);
var block2 = Block(Math.random(), 200, 450, 75, 400);
var block3 = Block(Math.random(), mapWidth - 400 - 450, mapHeight - 75 - 200, 400, 75);
var block4 = Block(Math.random(), mapWidth - 75 - 200, mapHeight - 400 - 450, 75, 400);
var block5 = Block(Math.random(), mapWidth/2 - 250, mapHeight/2 - 37, 500, 75);
var BMWhiteBlock = Block(Math.random(), -20, 235, 70, 50);
var BMBlackBlock = Block(Math.random(), mapWidth - 50, mapHeight - 285, 70, 50);

///////////////////////////CREATE THUGS/////////////////

var thug = Thug(Math.random(), "white", 50, 50);	

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
		updateMisc.bagRed = {x:bagRed.x,y:bagRed.y,captured:bagRed.captured};
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
		updateMisc.bagBlue = {x:bagBlue.x,y:bagBlue.y,captured:bagBlue.captured};
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
				var overlapTop = Math.abs(Block.list[i].y - bagBlue.y);  
				var overlapBottom = Math.abs((Block.list[i].y + Block.list[i].height) - bagBlue.y);
				var overlapLeft = Math.abs(bagBlue.x - Block.list[i].x);
				var overlapRight = Math.abs((Block.list[i].x + Block.list[i].width) - bagBlue.x);			
				if (overlapTop <= overlapBottom && overlapTop <= overlapRight && overlapTop <= overlapLeft){
					bagBlue.y = Block.list[i].y;
					updateMisc.bagBlue = {x:bagBlue.x,y:bagBlue.y,captured:bagBlue.captured};
				}
				else if (overlapBottom <= overlapTop && overlapBottom <= overlapRight && overlapBottom <= overlapLeft){
					bagBlue.y = Block.list[i].y + Block.list[i].height;
					updateMisc.bagBlue = {x:bagBlue.x,y:bagBlue.y,captured:bagBlue.captured};
				}
				else if (overlapLeft <= overlapTop && overlapLeft <= overlapRight && overlapLeft <= overlapBottom){
					bagBlue.x = Block.list[i].x;
					updateMisc.bagBlue = {x:bagBlue.x,y:bagBlue.y,captured:bagBlue.captured};
				}
				else if (overlapRight <= overlapTop && overlapRight <= overlapLeft && overlapRight <= overlapBottom){
					bagBlue.x = Block.list[i].x + Block.list[i].width;
					updateMisc.bagBlue = {x:bagBlue.x,y:bagBlue.y,captured:bagBlue.captured};
				}
			}// End check if bag is overlapping block
		}//End Block.list loop		
	}
	if (bagRed.speed > 0){
		for (var i in Block.list){
			if (bagRed.x > Block.list[i].x && bagRed.x < Block.list[i].x + Block.list[i].width && bagRed.y > Block.list[i].y && bagRed.y < Block.list[i].y + Block.list[i].height){												
				var overlapTop = Math.abs(Block.list[i].y - bagRed.y);  
				var overlapBottom = Math.abs((Block.list[i].y + Block.list[i].height) - bagRed.y);
				var overlapLeft = Math.abs(bagRed.x - Block.list[i].x);
				var overlapRight = Math.abs((Block.list[i].x + Block.list[i].width) - bagRed.x);			
				if (overlapTop <= overlapBottom && overlapTop <= overlapRight && overlapTop <= overlapLeft){
					bagRed.y = Block.list[i].y;
					updateMisc.bagRed = {x:bagRed.x,y:bagRed.y,captured:bagRed.captured};
				}
				else if (overlapBottom <= overlapTop && overlapBottom <= overlapRight && overlapBottom <= overlapLeft){
					bagRed.y = Block.list[i].y + Block.list[i].height;
					updateMisc.bagRed = {x:bagRed.x,y:bagRed.y,captured:bagRed.captured};
				}
				else if (overlapLeft <= overlapTop && overlapLeft <= overlapRight && overlapLeft <= overlapBottom){
					bagRed.x = Block.list[i].x;
					updateMisc.bagRed = {x:bagRed.x,y:bagRed.y,captured:bagRed.captured};
				}
				else if (overlapRight <= overlapTop && overlapRight <= overlapLeft && overlapRight <= overlapBottom){
					bagRed.x = Block.list[i].x + Block.list[i].width;
					updateMisc.bagRed = {x:bagRed.x,y:bagRed.y,captured:bagRed.captured};
				}
			}// End check if bag is overlapping block
		}//End Block.list loop		
	}
	
	if (bagRed.x > mapWidth){bagRed.x = mapWidth; updateMisc.bagRed = {x:bagRed.x,y:bagRed.y,captured:bagRed.captured};}
	if (bagRed.y > mapHeight){bagRed.y = mapHeight; updateMisc.bagRed = {x:bagRed.x,y:bagRed.y,captured:bagRed.captured};}
	if (bagRed.x < 0){bagRed.x = 0; updateMisc.bagRed = {x:bagRed.x,y:bagRed.y,captured:bagRed.captured};}
	if (bagRed.y < 0){bagRed.y = 0; updateMisc.bagRed = {x:bagRed.x,y:bagRed.y,captured:bagRed.captured};}

	if (bagBlue.x > mapWidth){bagBlue.x = mapWidth; updateMisc.bagBlue = {x:bagBlue.x,y:bagBlue.y,captured:bagBlue.captured};}
	if (bagBlue.y > mapHeight){bagBlue.y = mapHeight; updateMisc.bagBlue = {x:bagBlue.x,y:bagBlue.y,captured:bagBlue.captured};}
	if (bagBlue.x < 0){bagBlue.x = 0; updateMisc.bagBlue = {x:bagBlue.x,y:bagBlue.y,captured:bagBlue.captured};}
	if (bagBlue.y < 0){bagBlue.y = 0; updateMisc.bagBlue = {x:bagBlue.x,y:bagBlue.y,captured:bagBlue.captured};}
	

}




//TIMER1 - EVERY FRAME
//------------------------------------------------------------------------------
setInterval(
	function(){
		//GAME IS OVER, GAME END, ENDGAME
		if (secondsLeft <= 0 && minutesLeft <= 0 && whiteCaptures != blackCaptures){
			if (gameOver == false){
			updateMisc.gameOver = true;
				calculateEndgameStats();
			}
			gameOver = true;			
		}
		Player.update();
		
		for (var i in Thug.list){
			var thug = Thug.list[i];
			thug.move();
		}		
		
		var secondsLeftPlusZero = "" + secondsLeft;	
		if (secondsLeft < 10){
			secondsLeftPlusZero = "0" + secondsLeft;
		}

		moveBags();
		
		//Send packs to all players
		for (var i in SOCKET_LIST){
			var socket = SOCKET_LIST[i];			
			socket.emit('update', updatePlayerList, updateThugList, updatePickupList, udpateNotificationList, updateMisc);
		}
		updatePlayerList = [];
		updateThugList = [];
		updatePickupList = [];
		udpateNotificationList = [];
		updateMisc = {};		
	},
	1000/60 //FPS
);
//------------------------------------------------------------------------------



//EVERY 1 SECOND
setInterval( 
	function(){
	
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
		
		//var pack = [];
		for (var i in SOCKET_LIST){
			var socket = SOCKET_LIST[i];
			socket.emit('sendClock',secondsLeftPlusZero, minutesLeft);
		}
		
	},
	1000/1 //FPS
);

//------------------------------------------------------------------------------
//Handy functions
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
function log(msg) {
	var d = new Date();
	d.getHours(); // => 9
	d.getMinutes(); // =>  30
	d.getSeconds(); // => 51
	console.log(d.getHours() + ':' + d.getMinutes() + '.' + d.getSeconds() + '> ' + msg);	
}

/*
TODO
-------------------------------------------------------------------------------------
--After the game, (while still allowing players to move), show a prompt to press (Esc) to see personal progress
-Money HUD? Yes, bottom left.
-Teamspeak [T]
-Fix Sign Up to enter into game (Should create user AND enter game without requiring a refresh)

-Shop/Weapons
	-Shotgun
-Animations
	-Death1 (Choking and writhing on ground while holding throat)
	-Death2 (Facedown and slowly crawling)
	-When body flies against a surface (wall/block) then new image of body slumped against wall, and change angle of body to be perpendicular to wall
	-Shells flying out of guns (Performance concerns???)
-Draw chat messages above player's heads
-Cloaking ??
-Lock stats after gameover (kills, deaths, etc)
-Delete all connections upon gamestart (big performance draw on windows left open)
-Camera shake when melee?

----FEEDBACK/TESTING----
-Finalize Weapon Damage
-Finalize MAP Height/Width, and layout


----Performance/Refactoring----
-Only draw() images that are inside camera view
-Make legSwing a client-side calculation - no sending over socket
-Performance test on drawing methods
	-Smaller vs larger tiles for background	
	-Research other performance tweaks
	-increase server-side fps
	-Run benchmark tests using many rendered players, and entities. (AI bots)
-Center canvas vertically
-Multiple Canvases - a higher layer for scoreboards that doesn't get redrawn every frame
-Only send player-specific UI data to just that player, rather than sending to all sockets (other players don't need every player's ammo count sent to them)

-Update myPlayer.x and y based on what is input by client, server then overwrite's client's data IF it successfully transmits the emit package.
--End result is that in the event of lost connection with the server, client can still move around the map  

-requestAnimationFrame for 60fps Canvas


NETWORK
-------------------------------------------------------------------------------------
-Party system (join up with up to 4 friends)



WEBSITE/USER EXPERIENCE
-------------------------------------------------------------------------------------
-Navigation on Top or Left Side? -Leaning left side

NAVIGATION MENU
-Home
-Login
--Username
--Password
--Sign in
--Sign up

Homepage - treatmetcalf.racewar.com



COSMETICS
-------------------------------------------------------------------------------------
Shirt color
pants color
hats
Gun paint colors
Gun models
Muzzle flash color/shape
Bullet streak color/shape
Dash streaks
Capture SFX/visual effects
Custom assassination enemy death animations











*/