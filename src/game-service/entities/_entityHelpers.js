var sprayBloodOntoTarget = function(shootingDir, targetX, targetY, targetId) {
	var data = {};
	data.targetX = targetX;
	data.targetY = targetY;
	data.shootingDir = shootingDir;
	data.targetId = targetId;
	for(var i in SOCKET_LIST){
		SOCKET_LIST[i].emit('sprayBloodOntoTarget',data);
	}
}

var organicDiagLeniency = 13;
var checkIfInLineOfShot = function(shooter, target, shot){ //hitDetection hit detection
	var distFromDiag = 0;
	//&& target.team != shooter.team //Take off friendly fire
	let shotType; 
	if (shot.weapon == 1 || shot.weapon == 2 || shot.weapon == 3 || shot.weapon == 5){shotType = 1;} //Straight shot with depth
	else if (shot.weapon == 4){shotType = 2;} //SG

	var shotWidth = 0;

	var range = bulletRange;
	if (shot.weapon == 4) {range = SGRange;}
	if (shot.weapon == 5) {range = laserRange;}
	//if (shot.weapon == 2) {organicDiagLeniency = 11;}

	if (shotType == 1){
		if (target.team){
			if (target.id != shooter.id && target.health > 0){ //Organic targets
				var allowableMargin = 31;
				if (shooter.weapon == 5){allowableMargin = 60;}
				else if (shooter.weapon == 2){allowableMargin = 36;}

				if (shooter.shootingDir == 1){
					if (target.x > shooter.x + shot.x - allowableMargin &&
						target.x < shooter.x + shot.x + allowableMargin &&
						target.y < shooter.y + shot.y &&
						target.y > -range + shooter.y + shot.y){
						return {target:target,dist:(shooter.y - target.y),distFromDiag:distFromDiag};
					}
				}
				else if (shooter.shootingDir == 2){
					//distFromDiag = -shooter.x + target.x - shooter.y + target.y; //forwardslash diag (/). Negative means target's x is left of shooter's diag.
					distFromDiag = (target.x - (shooter.x + shot.x * 1.5)) + (target.y - shooter.y); //forwardslash diag (/). Negative means target's x is left of shooter's diag.
					if (Math.abs(distFromDiag) < (allowableMargin * 1.5) && target.y < shooter.y && target.y > shooter.y - range * 1.5){
						return {target:target,dist:(shooter.y - target.y) - organicDiagLeniency,distFromDiag:distFromDiag};
					}
				}
				else if (shooter.shootingDir == 3){
					if (target.y > (shooter.y + shot.x) - allowableMargin &&
						target.y < (shooter.y + shot.x)+ allowableMargin &&
						target.x > shooter.x &&
						target.x < shooter.x + range){
						return {target:target,dist:(target.x - shooter.x),distFromDiag:distFromDiag};
					}
				}
				else if (shooter.shootingDir == 4){
					//distFromDiag = -shooter.x + target.x + shooter.y - target.y; //backslash diag (\). Negative means target's x is left of shooter's diag.
					distFromDiag = (target.x - (shooter.x - shot.x * 1.5)) + (shooter.y - target.y); //backslash diag (\). Negative means target's x is left of shooter's diag.
					if (Math.abs(distFromDiag) < (allowableMargin * 1.5) && target.y > shooter.y && target.y < shooter.y + range * 1.5){
						return {target:target,dist:(target.x - shooter.x) - organicDiagLeniency,distFromDiag:distFromDiag};
					}
				}
				else if (shooter.shootingDir == 5){
					if (target.x > shooter.x - shot.x - allowableMargin &&
						target.x < shooter.x - shot.x + allowableMargin &&
						target.y > shooter.y &&
						target.y < shooter.y + range){
						return {target:target,dist:(target.y - shooter.y),distFromDiag:distFromDiag};
					}
				}
				else if (shooter.shootingDir == 6){
					//distFromDiag = -shooter.x + target.x - shooter.y + target.y;
					distFromDiag = (target.x - (shooter.x - shot.x * 1.5)) + (target.y - shooter.y); //forwardslash diag (/). Negative means target's x is left of shooter's diag.
					if (Math.abs(distFromDiag) < (allowableMargin * 1.5) && target.y > shooter.y && target.y < shooter.y + range * 1.5){
						return {target:target,dist:(target.y - shooter.y) - organicDiagLeniency,distFromDiag:distFromDiag};
					}
				}
				else if (shooter.shootingDir == 7){
					if (target.y > (shooter.y - shot.x) - allowableMargin &&
						target.y < (shooter.y - shot.x) + allowableMargin &&
						target.x < shooter.x &&
						target.x > shooter.x - range){
						return {target:target,dist:(shooter.x - target.x),distFromDiag:distFromDiag};
					}
				}
				else if (shooter.shootingDir == 8){
					//distFromDiag = -shooter.x + target.x + shooter.y - target.y; //backslash diag (\). Negative means target's x is left of shooter's diag.
					distFromDiag = (target.x - (shooter.x + shot.x * 1.5)) + (shooter.y - target.y); //backslash diag (\). Negative means target's x is left of shooter's diag.
					if (Math.abs(distFromDiag) < (allowableMargin * 1.5) && target.y < shooter.y && target.y > shooter.y - range * 1.5){
						return {target:target,dist:(shooter.x - target.x) - organicDiagLeniency,distFromDiag:distFromDiag};
					}
				}	
			} // End check if target.id != shooter.id
		}// End check if target is organic (or block)
		else {
		//Block shot hit detection
			var overlapTop = shooter.y - target.y;  
			var overlapBottom = (target.y + target.height) - shooter.y;
			var overlapLeft = shooter.x - target.x;
			var overlapRight = (target.x + target.width) - shooter.x;		
			
			if (shooter.shootingDir == 1){
				if (target.x + target.width > shooter.x + shot.x &&
					target.x < shooter.x + shot.x &&
					target.y < shooter.y){
					var dist = (shooter.y - (target.y + target.height)) + 5;
					if (dist < range)
						return {target:target,dist:dist,distFromDiag:distFromDiag};
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
					if (dist < range * 1.5){
						return {target:target,dist:dist + 5,distFromDiag:distFromDiag};
					}
				}
			}
			else if (shooter.shootingDir == 3){
				if (shooter.y + shot.x < target.y + target.height &&
					shooter.y + shot.x > target.y &&
					shooter.x < target.x + target.width){
					var dist = (target.x - shooter.x) + 5;
					if (dist < range)
						return {target:target,dist:dist,distFromDiag:distFromDiag};
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
					if (dist < range){
						return {target:target,dist:dist + 5,distFromDiag:distFromDiag};
					}
				}
			}
			else if (shooter.shootingDir == 5){
				if (target.x + target.width > shooter.x - shot.x &&
					target.x < shooter.x - shot.x &&
					target.y + target.height > shooter.y){
					var dist = (target.y - shooter.y) + 5;
					if (dist < range)
						return {target:target,dist:dist,distFromDiag:distFromDiag};
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
					if (dist < range){
						return {target:target,dist:dist + 5,distFromDiag:distFromDiag};
					}
				}
			}
			else if (shooter.shootingDir == 7){
				if (target.y + target.height > shooter.y - shot.x &&
					target.y < shooter.y - shot.x &&
					target.x < shooter.x){
					var dist = (shooter.x - (target.x + target.width)) + 5;
					if (dist < range)
						return {target:target,dist:dist,distFromDiag:distFromDiag};
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
					if (dist < range){
						return {target:target,dist:dist + 5,distFromDiag:distFromDiag};
					}
				}
			}
		} //End Block detection Else statement
	} //End if weapon == 1,2,3,5
	
	//Shotgun hit detection
	else if (shooter.weapon == 4){
		if (target.team && target.health && target.health > 0){
			if (getDistance(target, shooter) < SGRange && target.id != shooter.id){
				const distFromDiagForward = target.x - (shooter.x + (shooter.y - target.y)); // diag[/]. Negative means target's x is left of shooter's diag.
				const distFromDiagBack = target.x - shooter.x + (shooter.y - target.y); //  diag[\]. Negative means target's x is left of shooter's diag.
				
				if (shooter.shootingDir == 1){
					if (distFromDiagForward < 0 && distFromDiagBack > 0){
						return {target:target,dist:(shooter.y - target.y),distFromDiag:0};
					}
				}
				else if (shooter.shootingDir == 2){
					if (target.x > shooter.x && target.y < shooter.y){
						return {target:target,dist:(shooter.y - target.y),distFromDiag:0};
					}
				}
				else if (shooter.shootingDir == 3){
					if (distFromDiagForward > 0 && distFromDiagBack > 0){
						return {target:target,dist:(shooter.x - target.x),distFromDiag:0};
					}
				}
				else if (shooter.shootingDir == 4){
					if (target.x > shooter.x && target.y > shooter.y){
						return {target:target,dist:(shooter.x - target.x),distFromDiag:0};
					}
				}
				else if (shooter.shootingDir == 5){
					if (distFromDiagForward > 0 && distFromDiagBack < 0){
						return {target:target,dist:(shooter.y - target.y),distFromDiag:0};
					}
				}
				else if (shooter.shootingDir == 6){
					if (target.x < shooter.x && target.y > shooter.y){
						return {target:target,dist:(shooter.y - target.y),distFromDiag:0};
					}
				}
				else if (shooter.shootingDir == 7){
					if (distFromDiagForward < 0 && distFromDiagBack < 0){
						return {target:target,dist:(shooter.x - target.x),distFromDiag:0};
					}
				}
				else if (shooter.shootingDir == 8){
					if (target.x < shooter.x && target.y < shooter.y){
						return {target:target,dist:(shooter.x - target.x),distFromDiag:0};
					}
				}
			}//End check if in shotgun range
		}//Check if organic target
		else{
			var SGEstRange = SGRange + 40;
			//Blocks shotgun hit detection
			if (shooter.shootingDir == 1){
				if (target.x + target.width > shooter.x - SGEstRange/2 && target.x < shooter.x + SGEstRange/2 && target.y < shooter.y && target.y + target.height > shooter.y - SGEstRange){
					return {target:target,dist:(shooter.y - target.y),distFromDiag:0};
				}
			}
			else if (shooter.shootingDir == 2){
				if (target.x + target.width > shooter.x && target.x < shooter.x + SGEstRange && target.y < shooter.y && target.y + target.height > shooter.y - SGEstRange){
					return {target:target,dist:(shooter.y - target.y),distFromDiag:0};
				}
			}
			else if (shooter.shootingDir == 3){
				if (target.x + target.width > shooter.x && target.x < shooter.x + SGEstRange && target.y < shooter.y + SGEstRange/2 && target.y + target.height > shooter.y - SGEstRange/2){
					return {target:target,dist:(shooter.x - target.x),distFromDiag:0};
				}
			}
			else if (shooter.shootingDir == 4){
				if (target.x + target.width > shooter.x && target.x < shooter.x + SGEstRange && target.y < shooter.y + SGEstRange && target.y + target.height > shooter.y){
					return {target:target,dist:(shooter.x - target.x),distFromDiag:0};
				}
			}
			else if (shooter.shootingDir == 5){
				if (target.x + target.width > shooter.x - SGEstRange/2 && target.x < shooter.x + SGEstRange/2 && target.y < shooter.y + SGEstRange && target.y + target.height > shooter.y){
					return {target:target,dist:(shooter.y - target.y),distFromDiag:0};
				}
			}
			else if (shooter.shootingDir == 6){
				if (target.x + target.width > shooter.x - SGEstRange && target.x < shooter.x && target.y < shooter.y + SGEstRange && target.y + target.height > shooter.y){
					return {target:target,dist:(shooter.y - target.y),distFromDiag:0};
				}
			}
			else if (shooter.shootingDir == 7){
				if (target.x + target.width > shooter.x - SGEstRange && target.x < shooter.x && target.y < shooter.y + SGEstRange/2 && target.y + target.height > shooter.y - SGEstRange/2){
					return {target:target,dist:(shooter.x - target.x),distFromDiag:0};
				}
			}
			else if (shooter.shootingDir == 8){
				if (target.x + target.width > shooter.x - SGEstRange && target.x < shooter.x && target.y < shooter.y && target.y + target.height > shooter.y - SGEstRange){
					return {target:target,dist:(shooter.x - target.x),distFromDiag:0};
				}
			}
		}
	}
	
	return false;
}

var getHitTarget = function(hitTargets){
	var hitTarget = null;
	var closest = 100000;
	var distFromDiag = 0;
	for (var j in hitTargets){
		if (hitTargets[j].dist < closest){
			hitTarget = hitTargets[j].target;
			closest = hitTargets[j].dist;
			distFromDiag = hitTargets[j].distFromDiag;
			hitTarget.dist = hitTargets[j].dist;
			hitTarget.distFromDiag = hitTargets[j].distFromDiag;
		}
	}
	return hitTarget;		
}

var getDirDif = function(shootingDirA, shootingDirB){
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

var calculateDrag = function(entity, drag){
	if (typeof entity == 'undefined' || typeof entity.speedX == 'undefined' || typeof entity.speedY == 'undefined')	{
		return;
	}

	var fullVelocity = Math.sqrt( Math.pow(entity.speedX,2) + Math.pow(entity.speedY,2) );
	if (fullVelocity <= 0.5){
		entity.speedX = 0;
		entity.speedY = 0;
		return;
	}

	var speedXRatio = entity.speedX / fullVelocity;
	var speedYRatio = entity.speedY / fullVelocity;
	entity.speedX -= speedXRatio * drag;  
	entity.speedY -= speedYRatio * drag;  

}
//Body = an entity with width + height where origin is in the middle
//Rect = an entity with width + height where origin is upper left
//Point = an entity with no width/height

var checkBodyCollisionWithGroupOfBodies = function(self, list){
//Check collision with players
	for (var i in list){
		entity = list[i];
		if (typeof entity === 'undefined'){continue;}
		if (entity.id == self.id ){continue;}
		if (typeof entity.team != "undefined" && entity.team == 0){continue;}
		if (typeof entity.health != "undefined" && entity.health <= 0){continue;}
		var posUpdated = false;

		if (self.x + self.width/2 > entity.x - entity.width/2 &&
		self.x - self.width/2 < entity.x + entity.width/2 &&
		self.y + self.height/2 > entity.y - entity.width/2 &&
		self.y - self.height/2 < entity.y + entity.height/2){								
			if (self.x == entity.x && self.y == entity.y){self.x -= 5; posUpdated = true; continue;} //Added to avoid math issues when entities are directly on top of each other (distance = 0)
			var dx1 = self.x - entity.x;
			var dy1 = self.y - entity.y;
			var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
			var ax1 = dx1/dist1;
			var ay1 = dy1/dist1;
			if (dist1 < meleeRange){				
				if (typeof self.boosting != 'undefined' && self.boosting > 0){  //melee boost collision bash smash

					if(self.throwingObject == 0){ 
						self.updatePropAndSend("throwingObject", 20);
						self.updatePropAndSend("shootingDir", self.walkingDir);
					}
					entity.getSlammed(self.id, self.walkingDir);

					if (entity.health > 0){
						self.speedX += dx1/2;
						self.speedY += dy1/2;
					}
					else {
						self.speedX -= dx1/5;
						self.speedY -= dy1/5;
					}

				}
				else {					
					self.x += ax1 / (dist1 / 70); //Higher number is greater push
					self.y += ay1 / (dist1 / 70);
				}
				posUpdated = true;
			}
		}

	}
	if (posUpdated){return true;}
	else {return false;}
}


var checkPointCollisionWithGroupAndMove = function(self, list, margin){
	checkPointCollisionWithGroup(self, list, margin, true);
}

var checkPointCollisionWithGroup = function(self, list, margin, move = false){
	for (var i in list){
		entity = list[i];

		if (typeof entity === 'undefined'){continue;}
		if (entity.id == self.id ){continue;}
		if (typeof entity.health != "undefined" && (entity.health <= 0 || entity.team === 0)){continue;}
		var encounteredEntityId = false;

		if (self.x == entity.x && self.y == entity.y){self.x -= 5; encounteredEntityId = entity.id; console.log("ON TOP!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"); continue;} //Added to avoid math issues when entities are directly on top of each other (distance = 0)
		var dx1 = self.x - entity.x;
		var dy1 = self.y - entity.y;
		var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
		if (dist1 < 5){dist1 = 5;}
		var ax1 = dx1/dist1;
		var ay1 = dy1/dist1;
		if (dist1 <= margin){
			if (move){
				movePostCollision(self, entity, ax1, ay1, dist1);
			}
			encounteredEntityId = entity.id;
		}

	}
	return encounteredEntityId;
}

var movePostCollision = function(self, entity, ax1, ay1, dist1){
	// self.speedX += ax1 / (dist1 / 70); //Higher number is greater push
	// self.speedY += ay1 / (dist1 / 70);
	self.updatePropAndSend("speedX", ax1 / (dist1 / 70));
	self.updatePropAndSend("speedY", ay1 / (dist1 / 70));
	self.updatePropAndSend("x", self.x, false);
	self.updatePropAndSend("y", self.y, false);
	if (typeof self.boosting != 'undefined' && self.boosting > 0 && typeof entity.getSlammed == 'function' ){  //melee boost collision bash smash
		self.updatePropAndSend("throwingObject", 20);
		entity.getSlammed(self.id, self.walkingDir);
	}					

}

// var slamEntity = function(slammer, slamee, direction = 1, pushSpeed = 20, bagSlam = false){ //slam smash
// 	if (getPlayerById(slameeId))
// 	var slamee = getPlayerById(playerId);
// 	if (!player){
// 		return; 
// 	}

// 	self.pushSpeed = pushSpeed;
// 	self.pushDir = direction;
// 	var sameTeam = player.team == self.team ? true : false;
// 	if (gametype == "ffa"){sameTeam = false;}
// 	if (!sameTeam && !bagSlam){
// 		self.health -= boostDamage;
// 	}
// 	//player.pushSpeed = pushSpeed;
// 	player.boosting = 0;
// 	updatePlayerList.push({id:player.id,property:"boosting",value:player.boosting});
// 	updateEffectList.push({type:4,playerId:player.id});
	

// 	//Assassinations
// 	if (!sameTeam && bagSlam == false && entityHelpers.getDirDif(player.walkingDir, self.shootingDir) <= 1){
// 		self.health = 0;			
// 	}

// 	updatePlayerList.push({id:self.id,property:"health",value:self.health})
// 	self.healDelay = healDelayTime;
// 	entityHelpers.sprayBloodOntoTarget(direction, self.x, self.y, self.id);
// 	if (self.health <= 0){
// 		self.kill(player);
// 	}		
// }



// for (var i in thugList){
// 	if (thugList[i].id != self.id && thugList[i].health > 0 && self.x + self.width > thugList[i].x && self.x < thugList[i].x + thugList[i].width && self.y + self.height > thugList[i].y && self.y < thugList[i].y + thugList[i].height){								
// 		if (self.x == thugList[i].x && self.y == thugList[i].y){self.x -= 5; updateThugList.push({id:self.id,property:"x",value:self.x});} //Added to avoid math issues when entities are directly on top of each other (distance = 0)
// 		var dx1 = self.x - thugList[i].x;
// 		var dy1 = self.y - thugList[i].y;
// 		var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
// 		var ax1 = dx1/dist1;
// 		var ay1 = dy1/dist1;
// 		if (dist1 < 40){		

// 			if (self.boosting > 0){
// 				self.pushSpeed = 20;
// 				self.boosting = 0;
// 				updatePlayerList.push({id:self.id,property:"boosting",value:self.boosting});
// 				updateEffectList.push({type:4,playerId:self.id});
				
// 				if (self.team != thugList[i].team){
// 					thugList[i].health -= boostDamage;
// 					updateThugList.push({id:thugList[i].id,property:"health",value:thugList[i].health})
// 					entityHelpers.sprayBloodOntoTarget(self.walkingDir, thugList[i].x, thugList[i].y, thugList[i].id);
// 					thugList[i].attacking = thugAttackDelay;
// 					if (thugList[i].health <= 0){
// 						thugList[i].kill(self);
// 					}
// 				}
// 			}
		
// 			self.x += ax1 / (dist1 / 70); //Higher number is greater push
// 			self.y += ay1 / (dist1 / 70);
// 		}				
// 	}
// }





module.exports.sprayBloodOntoTarget = sprayBloodOntoTarget;
module.exports.checkIfInLineOfShot = checkIfInLineOfShot;
module.exports.getHitTarget = getHitTarget;
module.exports.getDirDif = getDirDif;
module.exports.calculateDrag = calculateDrag;
module.exports.checkPointCollisionWithGroup = checkPointCollisionWithGroup;
module.exports.checkPointCollisionWithGroupAndMove = checkPointCollisionWithGroupAndMove;
module.exports.checkBodyCollisionWithGroupOfBodies = checkBodyCollisionWithGroupOfBodies;
