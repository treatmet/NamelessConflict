var gameEngine = require('../engines/gameEngine.js');
var block = require('./block.js');
var entityHelpers = require('./_entityHelpers.js');
var dataAccessFunctions = require('../../shared/data_access/dataAccessFunctions.js');
var player = require('../entities/player.js');


var Grenade = function(throwingPlayerId, holdingPlayerId = false, x=0, y=0, speedX=0, speedY=0){
	var self = {
		id:Math.random(),
		throwingPlayerId:throwingPlayerId,
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
			self.explode();
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
		explode(self.x, self.y, self.throwingPlayerId);
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
} //End Grenade function
Grenade.list = {};

var rayCount = 45;
function explode(x, y, playerResponsibleId){
	var rays = []
	var globalangle = Math.PI;
	var gapangle = Math.PI;
	var currentangle = 0;
	var blocks = block.getBlockList();
	var players = player.getTeamPlayerList();
	var playersHit = [];


	//Create rays with momentum to travel at each interval angle (current angle)
	currentangle = gapangle/2
	for(let k = 0; k<=rayCount; k++){
		currentangle+=(gapangle/(rayCount/2))
		let ray = new Circle(x, y, 1, "white",((grenadeExplosionSize * (Math.cos(globalangle+currentangle))))/grenadeExplosionSize*2, ((grenadeExplosionSize * (Math.sin(globalangle+currentangle))))/grenadeExplosionSize*2 )
		rays.push(ray);
	}

	for(let f = 0; f<grenadeExplosionSize/2; f++){ //For each step of the rays as they go outward
		for(let t = 0; t<rays.length; t++){ //For each ray
			if(rays[t].collided == false){

				//Ray takes step from center
				rays[t].move();

				//Check if ray is hitting player at this step
				for(var p in players){
					var hitPlayer = players[p];
					if(isPointIntersectingBody(rays[t], hitPlayer) && !playersHit.find(id => id == hitPlayer.id)){
						var blockDist = Math.round((getDistance({x:x, y:y}, hitPlayer) / 75) * 10) /10;
						console.log("BLASTED!!! " + blockDist + " from block");
						playersHit.push(hitPlayer.id);
						hitPlayer.hit(1, 0, player.getPlayerById(playerResponsibleId), getDistance({x:x, y:y}, hitPlayer), 0, 6);
						entityHelpers.sprayBloodOntoTarget(1, hitPlayer.x, hitPlayer.y, hitPlayer.id);

					}
				}



				//Check if ray is hitting block at this step
				for(var b in blocks){
					var blocky = blocks[b];
					if(isPointIntersectingRect(rays[t], blocky)){
						rays[t].collided = true;
						break;
					}
				}

			}
		}
	}

}


class Circle{
	constructor(x, y, radius, color, xmom = 0, ymom = 0){

		this.height = 0
		this.width = 0
		this.x = x
		this.y = y
		this.radius = radius
		this.xmom = xmom
		this.ymom = ymom
		this.lifespan = grenadeExplosionSize-1;
		this.collided = false;
	}       

	move(){
		this.x += this.xmom
		this.y += this.ymom
		this.lifespan--;

	}
}


function intersects(circle, left) {
	var areaX = left.x - circle.x;
	var areaY = left.y - circle.y;
	return areaX * areaX + areaY * areaY <= circle.radius * circle.radius*1.1;
}


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

var create = function(throwingPlayerId, holdingPlayerId = false, x=0, y=0, speedX=0, speedY=0){
	Grenade(throwingPlayerId, holdingPlayerId, x, y, speedX, speedY);
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
