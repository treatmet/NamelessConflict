var gameEngine = require('../engines/gameEngine.js');
var block = require('./block.js');
var thug = require('./thug.js');
var entityHelpers = require('./_entityHelpers.js');
var dataAccessFunctions = require('../../shared/data_access/dataAccessFunctions.js');
var player = require('../entities/player.js');


var Grenade = function(throwingPlayerId, holdingPlayerId = false, x=0, y=0, speedX=0, speedY=0){
	var self = {
		id:Math.random(),
		throwingPlayerId:throwingPlayerId,
		speedX:speedX,
		speedY:speedY,
		radius:15,
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
			//log(self.id + " EXPLODE");
			delete Grenade.list[self.id];
			explode(self.x, self.y, self.throwingPlayerId);
		}
		else {
			self.move();
		}

	}//End engine()


	self.move = function(){
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
				self.y += self.speedY;
			}
			if (self.speedX != 0){
				self.x += self.speedX;
			}	
			entityHelpers.checkPointCollisionWithGroupAndMove(self, Grenade.list, self.radius);
			block.checkCollision(self, true);
			entityHelpers.calculateDrag(self, grenadeDrag);

		}

		//log("Nade " + self.id + " x:" + Math.round(self.x * 10)/10 + " y:" + Math.round(self.y * 10)/10);
	}

	// self.calculateDrag = function(){
	// 	if (self.speedX > 0){
	// 		self.speedX -= grenadeDrag;
	// 		if (self.speedX < 0){self.speedX = 0;}
	// 	}
	// 	if (self.speedX < 0){
	// 		self.speedX += grenadeDrag;
	// 		if (self.speedX > 0){self.speedX = 0;}
	// 	}
	// 	if (self.speedY > 0){
	// 		self.speedY -= grenadeDrag;
	// 		if (self.speedY < 0){self.speedY = 0;}
	// 	}
	// 	if (self.speedY < 0){
	// 		self.speedY += grenadeDrag;
	// 		if (self.speedY > 0){self.speedY = 0;}
	// 	}
	// }



	self.updatePropAndSend = function(propName, value, full = false){
		if (!full && self[propName] != value){
			self[propName] = value;			
		}
		updateGrenadeList.push({id:self.id,property:propName,value:value});	
	}

	Grenade.list[self.id] = self;	
	//console.log(Grenade.list);

	self.updatePropAndSend("entity", self, true);



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
	var thugs = thug.getThugList();
	var playersHit = [];
	var thugsHit = [];
	var grenadesHit = [];


	//Create rays with momentum to travel at each interval angle (current angle)
	currentangle = gapangle/2
	for(let k = 0; k<=rayCount; k++){
		currentangle+=(gapangle/(rayCount/2))
		let ray = new Circle(x, y, 1, "white",((grenadeExplosionSize * (Math.cos(globalangle+currentangle))))/grenadeExplosionSize*2, ((grenadeExplosionSize * (Math.sin(globalangle+currentangle))))/grenadeExplosionSize*2 )
		rays.push(ray);
	}

	updateEffectList.push({type:8,x:x, y:y});

	for(let f = 0; f<grenadeExplosionSize/2; f++){ //For each step of the rays as they go outward
		for(let t = 0; t<rays.length; t++){ //For each ray
			if(rays[t].collided == false){

				//Ray takes step from center
				rays[t].move();

				//Check if ray is hitting player at this step
				for(var p in players){
					var hitPlayer = players[p];
					if(isPointIntersectingBody(rays[t], hitPlayer) && !playersHit.find(id => id == hitPlayer.id)){
						var rawDist = getDistance({x:x, y:y}, {x:hitPlayer.x, y:hitPlayer.y});
						if (rawDist < 1){rawDist = 1;}//Divide by zero
						playersHit.push(hitPlayer.id);
						hitPlayer.hit({xMovRatio:(hitPlayer.x - x)/rawDist, yMovRatio:(hitPlayer.y - y)/rawDist}, 0, player.getPlayerById(playerResponsibleId), rawDist, 0, 6);
						if (hitPlayer.health > 0)
							entityHelpers.sprayBloodOntoTarget(1, hitPlayer.x, hitPlayer.y, hitPlayer.id);

					}
				}

				//Check if ray is hitting thugs at this step
				for(var p in thugs){
					var hitThug = thugs[p];
					if(isPointIntersectingBody(rays[t], hitThug) && !thugsHit.find(id => id == hitThug.id)){
						var rawDist = getDistance({x:x, y:y}, {x:hitThug.x, y:hitThug.y});
						if (rawDist < 1){rawDist = 1;}//Divide by zero
						thugsHit.push(hitThug.id);
						hitThug.hit(1, 0, player.getPlayerById(playerResponsibleId), rawDist, 0, 6);
						if (hitThug.health > 0)
							entityHelpers.sprayBloodOntoTarget(1, hitThug.x, hitThug.y, hitThug.id);

					}
				}


				//Check if ray is hitting grenade at this step
				for(var g in Grenade.list){
					var hitGrenade = Grenade.list[g]; //might hit self, should be okay
					if (hitGrenade.holdingPlayerId){continue;}
					if(isPointIntersectingBody(rays[t], hitGrenade, 20) && !grenadesHit.find(id => id == hitGrenade.id)){
						var rawDist = getDistance({x:x, y:y}, {x:hitGrenade.x, y:hitGrenade.y});
						if (rawDist < 1){rawDist = 1;}//Divide by zero
						grenadesHit.push(hitGrenade.id);
						var xmov = hitGrenade.x - x;
						console.log("Xmov Ratio = " + xmov + " id:" + hitGrenade.id);
						launchObject(hitGrenade, {xMovRatio:(hitGrenade.x - x)/rawDist, yMovRatio:(hitGrenade.y - y)/rawDist}, rawDist, 1.5);
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

function launchObject(object, directionData, distance, powerRatio = 1){
	if (distance < 100){distance = 100;}
	var power = -(distance - grenadeExplosionSize)/(grenadeExplosionSize/3) * grenadeDamage;
	var finalMov = (directionData.xMovRatio * grenadePower) * power;
	console.log("distance:" + distance + " grenadeExplosionSize:" + grenadeExplosionSize);
	console.log("Final speed inf:" + finalMov);
	object.speedX += (directionData.xMovRatio * grenadePower) * power * powerRatio;
	object.speedY += (directionData.yMovRatio * grenadePower) * power * powerRatio;
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

var clearGrenades = function(){
	Grenade.list = {};
}


module.exports.getSpeedAdjust = getSpeedAdjust;
module.exports.getList = getList;
module.exports.getById = getById; //onDisconnect
module.exports.runEngines = runEngines;
module.exports.getListLength = getListLength;
module.exports.create = create;
module.exports.getPlayerNade = getPlayerNade;
module.exports.clearGrenades = clearGrenades;
