var gameEngine = require('../engines/gameEngine.js');
var block = require('./block.js');
var entityHelpers = require('./_entityHelpers.js');
var dataAccessFunctions = require('../../shared/data_access/dataAccessFunctions.js');
var player = require('../entities/player.js');


var Grenade = function(team = 0, holdingPlayerId = false, x=0, y=0, speedX=0, speedY=0){
	var self = {
		id:Math.random(),
		team:team,
		speedX:speedX,
		speedY:speedY,
		x:x,
		y:y,
		timer:grenadeTimer,
		holdingPlayerId:holdingPlayerId
	}

	self.engine = function(){	
		if (self.timer > 0){
			self.timer--;
		}
		if (self.timer <= 0){
			console.log("DELEING NADE");
			delete Grenade.list[self.id];
			console.log(getGrenadeListLength() + " nades now remain");
		}
		else {
			self.move();
		}

	}//End engine()


	self.move = function(){
		var posUpdated = false;

		if (self.holdingPlayerId){
			self.speedX = 0;
			self.speedY = 0;
			if (player.getPlayerById(self.holdingPlayerId)){
				self.x = player.getPlayerById(self.holdingPlayerId).x;
				self.y = player.getPlayerById(self.holdingPlayerId).y;
			}
		}
		else {
			if (self.speedY != 0){
				posUpdated = true;
				self.y += self.speedY;
			}
			if (self.speedX != 0){
				posUpdated = true;
				self.x += self.speedX;
			}	
			if (block.checkCollision(self, true)){
				posUpdated = true;
			}
			self.calculateDrag();
		}
	}

	self.calculateDrag = function(){
		if (self.speedX > 0){
			self.speedX -= grenadeDrag;
			if (self.speedX < 0){self.speedX = 0;}
		}
		if (self.speedX < 0){
			self.speedX += grenadeDrag;
			if (self.speedX > 0){self.speedX = 0;}
		}
		if (self.speedY > 0){
			self.speedY -= grenadeDrag;
			if (self.speedY < 0){self.speedY = 0;}
		}
		if (self.speedY < 0){
			self.speedY += grenadeDrag;
			if (self.speedY > 0){self.speedY = 0;}
		}
	}

	self.explode = function(){

	}


	self.updatePropAndSend = function(propName, value, full = false){
		if (!full && self[propName] != value){
			self[propName] = value;			
		}
		updateGrenadeList.push({id:self.id,property:propName,value:value});	
	}

	self.updatePropAndSend("entity", self, true);


	Grenade.list[self.id] = self;	
	return self;
} //End Player function
Grenade.list = {};


function getSpeedAdjust(currentSpeed, targetSpeed, increment){
	if (currentSpeed == targetSpeed){return currentSpeed;} //No adjust

	if (currentSpeed > targetSpeed){
		currentSpeed -= increment;
		if (currentSpeed < targetSpeed){
			currentSpeed = targetSpeed;
		}
	}
	else if (currentSpeed < targetSpeed){
		currentSpeed += increment;
		if (currentSpeed > targetSpeed){
			currentSpeed = targetSpeed;
		}
	}
	return currentSpeed;
}


var getList = function(){ //This is the one function that returns all players/sockets, including spectators
	return Grenade.list;
}

var getById = function(id){
    return Grenade.list[id];
}

var getPlayerNade = function(id){
	for (var g in Grenade.list){
		if (Grenade.list[g].holdingPlayerId == id){
			return Grenade.list[g];
		}
	}
	return false;
}

function runEngines(){
	for (var i in Grenade.list){
		Grenade.list[i].engine();
	}		
}

var getListLength = function(){ //getPlayerListCount //getPlayerCount
	var length = 0;
	for (var i in Grenade.list){
		length++;
	}		
	return length;	
}

var create = function(team = 0, holdingPlayerId = false, x=0, y=0, speedX=0, speedY=0){
	Grenade(team, holdingPlayerId, x, y, speedX, speedY);
}


function getGrenadeListLength(){
	var count = 0;
	for (var g in Grenade.list){
		count++;
	}
	return count;
}


module.exports.getSpeedAdjust = getSpeedAdjust;
module.exports.getList = getList;
module.exports.getById = getById; //onDisconnect
module.exports.runEngines = runEngines;
module.exports.getListLength = getListLength;
module.exports.create = create;
module.exports.getPlayerNade = getPlayerNade;
