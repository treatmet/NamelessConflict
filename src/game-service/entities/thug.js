var gameEngine = require('../engines/gameEngine.js');
var block = require('./block.js');
var entityHelpers = require('./_entityHelpers.js');
var player = require('./player.js');

var Thug = function(team, x, y){
	var myThugSpeed = 3;

	if (gametype == "horde" || (pregame && pregameIsHorde)){
		myThugSpeed = thugSpeed - 1 + Math.round(hordeKills/30)/10;
		if (myThugSpeed > 5) {myThugSpeed = 5;}
		var speedVariance = 2 - randomInt(1,3);
		if (speedVariance > 0 && hordeKills < 50){speedVariance = 0;}
		if (myThugSpeed < 1.5) {myThugSpeed = 1.5;}
		myThugSpeed += speedVariance; 
	} 
	var self = {
		id: Math.random(),
		team:team,
		x:x,
		y:y,
		width:94,
		height:94,
		health: (gametype == "horde" || (pregame && pregameIsHorde)) ? hordeThugHealth : thugHealth,
		legHeight:47,
		legSwingForward:true,
		rotation:0,
		targetId:0,
		reevaluateTargetTimer:0,
		respawnTimer:600,
		closestTargetDist:999999,
		attacking:0,
		pushDir:0,
		pushSpeed:0,
		speed:myThugSpeed,
		respawn: (gametype == "horde" || (pregame && pregameIsHorde)) ? false : true
	};
	Thug.list[self.id] = self;
	
	//Send to client
	updateThugList.push({id:self.id,property:"team",value:self.team});
	updateThugList.push({id:self.id,property:"x",value:self.x});
	updateThugList.push({id:self.id,property:"y",value:self.y});
	updateThugList.push({id:self.id,property:"legHeight",value:self.legHeight});
	updateThugList.push({id:self.id,property:"legSwingForward",value:self.legSwingForward});
	updateThugList.push({id:self.id,property:"rotation",value:self.rotation});
	
	self.engine = function(){
		self.checkForDeathAndRespawn();
		if (self.health > 0){
			self.evaluateTarget();
			self.checkForEntityCollision();
			gameEngine.processEntityPush(self);
					
			if (self.attacking > 0){self.attacking--;}
			
			if (self.targetId != 0 && self.attacking == 0){		
				self.moveThug();
				self.checkForThugStab();
				self.swingLegs();
			}
			else if (self.attacking == 0){
				self.standThereAwkwardly();
			}
			self.checkForBlockCollision();			
		}
	}//End self.engine
	
	self.checkForEntityCollision = function(){
		var playerList = player.getPlayerList();
		//Check collision with players
		for (var i in playerList){
			if (playerList[i].id != self.id  && playerList[i].health > 0 && self.x + self.width > playerList[i].x && self.x < playerList[i].x + playerList[i].width && self.y + self.height > playerList[i].y && self.y < playerList[i].y + playerList[i].height){								
				if (self.x == playerList[i].x && self.y == playerList[i].y){self.x -= 5; updateThugList.push({id:self.id,property:"x",value:self.x});} //Added to avoid math issues when entities are directly on top of each other (distance = 0)
				var dx1 = self.x - playerList[i].x;
				var dy1 = self.y - playerList[i].y;
				var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
				var ax1 = dx1/dist1;
				var ay1 = dy1/dist1;
				if (dist1 < 40){				
					self.x += ax1 / (dist1 / 70); //Higher number is greater push
					updateThugList.push({id:self.id,property:"x",value:self.x})
					self.y += ay1 / (dist1 / 70);
					updateThugList.push({id:self.id,property:"y",value:self.y});
				}
			}
		}
	
		//Check collision with thugs
		for (var i in Thug.list){
			if (Thug.list[i].id != self.id && Thug.list[i].health > 0 && self.x + self.width > Thug.list[i].x && self.x < Thug.list[i].x + Thug.list[i].width && self.y + self.height > Thug.list[i].y && self.y < Thug.list[i].y + Thug.list[i].height){								
				if (self.x == Thug.list[i].x && self.y == Thug.list[i].y){self.x -= 5; updateThugList.push({id:self.id,property:"x",value:self.x});} //Added to avoid math issues when entities are directly on top of each other (distance = 0)
				var dx1 = self.x - Thug.list[i].x;
				var dy1 = self.y - Thug.list[i].y;
				var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
				var ax1 = dx1/dist1;
				var ay1 = dy1/dist1;
				if (dist1 < 40){				
					self.x += ax1 / (dist1 / 70); //Higher number is greater push
					updateThugList.push({id:self.id,property:"x",value:self.x})
					self.y += ay1 / (dist1 / 70);
					updateThugList.push({id:self.id,property:"y",value:self.y});
				}				
			}
		}
	}
		
	self.moveThug = function(){
		var target = gameEngine.getEntityById(self.targetId);
		if (target == 0){
			return;
		}
		var dist1 = getDistance(self, target);
		var ax1 = (self.x - target.x)/dist1;
		var ay1 = (self.y - target.y)/dist1;
		if (dist1 > 5){
			if (self.team != target.team){
				self.x -= ax1 * self.speed;
				self.y -= ay1 * self.speed;
			}
			else if (self.team == target.team && dist1 > 75){
				self.x -= ax1 * self.speed;
				self.y -= ay1 * self.speed;
			}
			updateThugList.push({id:self.id,property:"x",value:self.x});
			updateThugList.push({id:self.id,property:"y",value:self.y});
		}

		//self.rotation = Math.atan2((self.y - target.y),(self.x - target.x)) + 4.71239;
		updateThugList.push({id:self.id,property:"target",value:{x:target.x, y:target.y}});
	}
	
	self.evaluateTarget = function(){
		if (self.reevaluateTargetTimer > 0){
			self.reevaluateTargetTimer--;
		}
		if (self.reevaluateTargetTimer <= 0){			
			self.targetId = 0;
			self.closestTargetDist = 999999;

			var playerList = player.getPlayerList();
			for (var i in playerList){
				if (playerList[i].cloak < 0.2){
					checkIfClosestToThug(self, playerList[i]);
				}
			}
			for (var i in Thug.list){
				checkIfClosestToThug(self, Thug.list[i]);
			}			
			self.reevaluateTargetTimer = 30;
		}
	}//End self.evaluateTarget	
	
	self.checkForThugStab = function(){
		var target = gameEngine.getEntityById(self.targetId);
		if (self.closestTargetDist < 60 && target.health > 0 && target.team != self.team){
			self.attacking = thugAttackDelay;
			updateThugList.push({id:self.id,property:"attacking",value:thugAttackDelay});
			target.health -= thugDamage * damageScale; //scale damage

			var targetPlayer = player.getPlayerById(target.id);
			if (targetPlayer){
				updatePlayerList.push({id:target.id,property:"health",value:target.health});
				if (target.health <= 0){
					target.kill(self);
				}
				target.healDelay += healDelayTime;
				if (target.healDelay > healDelayTime){target.healDelay = healDelayTime;} //Ceiling on healDelay
			}
			else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"health",value:target.health});}
				
			var bloodDir = 7;
			if (target.x < self.x){
				bloodDir = 3;
			}

			entityHelpers.sprayBloodOntoTarget(bloodDir, target.x, target.y, target.id);				
			// self.legHeight = -94;
			// updateThugList.push({id:self.id,property:"attacking",value:thugAttackDelay});				
		}					
	}
	
	self.checkForBlockCollision = function(){
		var blockList = block.getBlockList();
		if (self.x < 0){self.x = 5;}
		if (self.x > mapWidth){self.x = mapWidth - 5;}
		if (self.y < 0){self.y = 5;}
		if (self.y > mapHeight){self.y = mapHeight - 5;}
		for (var i in blockList){
			if (self.x > blockList[i].x && self.x < blockList[i].x + blockList[i].width && self.y > blockList[i].y && self.y < blockList[i].y + blockList[i].height){												
				if (blockList[i].type == "normal" || blockList[i].type == "red" || blockList[i].type == "blue"){	
					//absolutevalue		
					var overlapTop = Math.abs(blockList[i].y - self.y);  
					var overlapBottom = Math.abs((blockList[i].y + blockList[i].height) - self.y);
					var overlapLeft = Math.abs(self.x - blockList[i].x);
					var overlapRight = Math.abs((blockList[i].x + blockList[i].width) - self.x);
					
					if (overlapTop <= overlapBottom && overlapTop <= overlapRight && overlapTop <= overlapLeft){
						self.y = blockList[i].y;
						updateThugList.push({id:self.id,property:"y",value:self.y});				
					}
					else if (overlapBottom <= overlapTop && overlapBottom <= overlapRight && overlapBottom <= overlapLeft){
						self.y = blockList[i].y + blockList[i].height;
						updateThugList.push({id:self.id,property:"y",value:self.y});				
					}
					else if (overlapLeft <= overlapTop && overlapLeft <= overlapRight && overlapLeft <= overlapBottom){
						self.x = blockList[i].x;
						updateThugList.push({id:self.id,property:"x",value:self.x});				
					}
					else if (overlapRight <= overlapTop && overlapRight <= overlapLeft && overlapRight <= overlapBottom){
						self.x = blockList[i].x + blockList[i].width;
						updateThugList.push({id:self.id,property:"x",value:self.x});				
					}
				}
				else if (blockList[i].type == "pushUp"){
					self.y -= pushStrength;
					if (self.y < blockList[i].y){self.y = blockList[i].y;}
					updateThugList.push({id:self.id,property:"y",value:self.y});
				}
				else if (blockList[i].type == "pushRight"){
					self.x += pushStrength;
					if (self.x > blockList[i].x + blockList[i].width){self.x = blockList[i].x + blockList[i].width;}
					updateThugList.push({id:self.id,property:"x",value:self.x});
				}
				else if (blockList[i].type == "pushDown"){
					self.y += pushStrength;
					if (self.y > blockList[i].y + blockList[i].height){self.y = blockList[i].y + blockList[i].height;}
					updateThugList.push({id:self.id,property:"y",value:self.y});
				}
				else if (blockList[i].type == "pushLeft"){
					self.x -= pushStrength;
					if (self.x < blockList[i].x){self.x = blockList[i].x;}
					updateThugList.push({id:self.id,property:"x",value:self.x});
				}
			}//End is entity overlapping block
		}
	}

	self.swingLegs = function(){
	}//End self.swinglegs
	
	self.standThereAwkwardly = function(){
	}
	
	self.checkForDeathAndRespawn = function(){
		if (self.health <= 0 && self.respawn){		
			if (self.respawnTimer <= 0){
				respawnThug(self);
			}
			else {
				self.respawnTimer--;
			}
		}
	}

    
	self.hit = function(shootingDir, distance, shooter, targetDistance, shotX, weapon = false){
		if (!weapon){weapon = shooter.weapon;}
		if (weapon != 4 && weapon != 6){
			var shotData = {};
			shotData.id = Math.random();
			shotData.playerId = shooter.id;
			shotData.weapon = weapon;		
			shotData.x = shotX;
			shotData.spark = false;
			shotData.shootingDir = shootingDir;
			if (!self.team){shotData.spark = true;}
			if (shootingDir % 2 == 0){
				shotData.distance = distance * 1.42 - 42;
			}
			else {
				shotData.distance = distance - 42;
			}
			if (shotData.distance < 0){shotData.distance = 1;}	
			for(var i in SOCKET_LIST){
				SOCKET_LIST[i].emit('shootUpdate',shotData);
			}
		}
		
		if (self.team != shooter.team){
			self.lastEnemyToHit = shooter.id; //For betrayal/Suicide detection
		}
		
		var damageInflicted = 0;
		
		//Facing attacker (lowest damage)
		if (weapon == 1){ damageInflicted += pistolDamage; } //Single Pistol
		else if (weapon == 2){ damageInflicted += DPDamage; } //damage for double pistols
		else if (weapon == 3){ damageInflicted += mgDamage; } //Damage for MG
		else if (weapon == 4){ damageInflicted += -(targetDistance - SGRange)/(SGRange/SGCloseRangeDamageScale) * SGDamage; } //Damage for SG
		else if (weapon == 5){ damageInflicted = 175; } //Damage for Lazer
		else if (weapon == 6){
			//console.log("-(" + targetDistance + " - " + grenadeExplosionSize + ")/(" + grenadeExplosionSize + "/3) * " + grenadeDamage +")");
			damageInflicted += -(targetDistance - grenadeExplosionSize)/(grenadeExplosionSize/3) * grenadeDamage;
			//console.log("result:" + damageInflicted);
		} //Damage for Grenade
		
		damageInflicted = damageInflicted * damageScale; //Scale damage
		self.health -= Math.floor(damageInflicted);

		updateThugList.push({id:self.id,property:"health",value:self.health});
					
		//Damage push
		self.pushSpeed += damageInflicted/8 * damagePushScale;
		self.pushDir = player.getPlayerById(shooter.id).shootingDir;			
		
		// updateThugList.push({id:self.id,property:"pushSpeed",value:self.pushSpeed});		
		// updateThugList.push({id:self.id,property:"pushDir",value:self.pushDir});
	
		if (self.health <= 0){
			self.kill(shooter);
		}			
	}

	//THUG DIES
	self.kill = function(shooter){
		if (shooter.id != 0){
			if (self.team != shooter.team || (self.lastEnemyToHit && self.lastEnemyToHit != 0)){
				if (gametype == "horde" || (pregame && pregameIsHorde)){
					if (personalHordeMode){
						if (!shooter.hordeKills){shooter.hordeKills = 0;}
						shooter.hordeKills++;
						updatePlayerList.push({id:shooter.id,property:"hordeKills",value:shooter.hordeKills});
					}
					else {
						hordeKills++;
						updateMisc.hordeKills = hordeKills;
					}
				}
				//shooter.triggerPlayerEvent("killThug");
			}
			else { //Killed by own team or self AND no last enemy to hit
				//shooter.triggerPlayerEvent("benedict");
			}
		}
		
		//Create Body createBody
		if (self.pushSpeed > pushMaxSpeed){ self.pushSpeed = pushMaxSpeed; }
		updateEffectList.push({type:5, killerPlayerId:shooter.id, pushSpeed:self.pushSpeed, shootingDir:shooter.shootingDir, playerId:self.id});

		if (gametype == "horde" || (pregame && pregameIsHorde)){
			delete Thug.list[self.id];
		}
	}

}//End Thug		
Thug.list = [];

function checkIfClosestToThug(thug, target){
	if (gametype == "horde" || (pregame && pregameIsHorde)){thugSightDistance = 2000;}
	else {thugSightDistance = 600;}
	
	if (target.id != thug.id && target.team != thug.team){
		var dist1 = getDistance(thug, target);
		if (dist1 < thug.closestTargetDist && dist1 < thugSightDistance && target.health > 0){
			thug.closestTargetDist = dist1;
			if (thug.targetId != target.id){
				thug.targetId = target.id;
			}
		}
	}
}



function respawnThug(thug){
	if (gametype == "horde" || (pregame && pregameIsHorde)){
		thug.attacking = 0;
		thug.targetId = 0;
		thug.pushSpeed = 0;
		thug.lastEnemyToHit = 0;
		gameEngine.spawnSafely(thug);
		thug.health = thugHealth;
		updateThugList.push({id:thug.id,property:"x",value:thug.x});
		updateThugList.push({id:thug.id,property:"y",value:thug.y});
		updateThugList.push({id:thug.id,property:"health",value:thug.health});
		thug.respawnTimer = 600;
	}
	else {
		delete Thug.list[thug.id];
	}
}

var getThugList = function(){
	var thugList = [];
	for (var t in Thug.list){
		thugList.push(Thug.list[t]);
	}
    return thugList;
}

var getThugById = function(id){
    return Thug.list[id];
}

var createThug = function(team, x, y){
	if (getThugListLength() < maxThugs)
		Thug(team, x, y);
}

var getThugListLength = function(){
	var length = 0;
	for (var t in Thug.list){
		length++;
	}
	return length;
}

var clearThugList = function(){
	Thug.list = [];
	for(var i in SOCKET_LIST){
		SOCKET_LIST[i].emit('removeThug', "all");
	}			
}

var isSafeCoords = function(potentialX, potentialY, team){
	for (var i in Thug.list){
		if (Thug.list[i].team != team && Thug.list[i].health > 0 && potentialX >= Thug.list[i].x - threatSpawnRange && potentialX <= Thug.list[i].x + threatSpawnRange && potentialY >= Thug.list[i].y - threatSpawnRange && potentialY <= Thug.list[i].y + threatSpawnRange){																		
			return false;
		}
	}
	return true;
}

var runThugEngines = function(){
	for (var i in Thug.list){
		Thug.list[i].engine();
	}	
}

module.exports.getThugList = getThugList;
module.exports.getThugById = getThugById;
module.exports.createThug = createThug;
module.exports.clearThugList = clearThugList;
module.exports.isSafeCoords = isSafeCoords;
module.exports.runThugEngines = runThugEngines;
module.exports.getThugListLength = getThugListLength;