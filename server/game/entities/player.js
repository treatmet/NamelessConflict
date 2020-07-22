var gameEngine = require(absAppDir + '/server/game/engines/gameEngine.js');
var thug = require(absAppDir + '/server/game/entities/thug.js');
var block = require(absAppDir + '/server/game/entities/block.js');
var pickup = require(absAppDir + '/server/game/entities/pickup.js');
var entityHelpers = require(absAppDir + '/server/game/entities/_entityHelpers.js');
var dataAccessFunctions = require(absAppDir + '/server/shared/data_access/dataAccessFunctions.js');

var Player = function(id, cognitoSub, name, team, partyId){
	var self = {
		id:id,
		cognitoSub:cognitoSub,
		team:team,
		name:name,
		partyId:partyId,
		height:94,
		width:94,
		pressingUp:false,
		pressingRight:false,
		pressingDown:false,
		pressingLeft:false,
		pressingW:false,
		pressingD:false,
		pressingS:false,		
		pressingA:false,
		pressingShift:false,
		shootingDir:1,

		cash:startingCash,
		cashEarnedThisGame:0,
		kills:0,
		deaths:0,
		steals:0,
		returns:0,
		captures:0,	
		rating:0,
		experience:0
	}
		
	//Initialize Player
	updatePlayerList.push({id:self.id,property:"team",value:self.team});
	updatePlayerList.push({id:self.id,property:"cash",value:self.cash});
	updatePlayerList.push({id:self.id,property:"cashEarnedThisGame",value:self.cashEarnedThisGame});
	updatePlayerList.push({id:self.id,property:"kills",value:self.kills});
	updatePlayerList.push({id:self.id,property:"deaths",value:self.deaths});
	updatePlayerList.push({id:self.id,property:"steals",value:self.steals});
	updatePlayerList.push({id:self.id,property:"returns",value:self.returns});
	updatePlayerList.push({id:self.id,property:"captures",value:self.captures});
	updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
	
	var socket = SOCKET_LIST[id];
	
//Player Update (Timer1 for player - Happens every frame)
	self.engine = function(){	
	
		//Invincibility in Shop
		if (invincibleInShop){
			if (self.team == "white" && self.x == 0 && self.y < 200 && self.health < 100){
				self.health = 100;
				updatePlayerList.push({id:self.id,property:"health",value:self.health});
			}
			else if (self.team == "black" && self.x == mapWidth && self.y > mapHeight - 200 && self.health < 100){
				self.health = 100;
				updatePlayerList.push({id:self.id,property:"health",value:self.health});
			}		
		}		
	/////////////////////////// DEATH /////////////////////		
		//Drop bag
		if (self.health <= 0 && self.holdingBag == true){
			if (self.team == "white"){
				bagBlue.captured = false;
				updateMisc.bagBlue = bagBlue;
			}
			else if (self.team == "black"){
				bagRed.captured = false;
				updateMisc.bagRed = bagRed;
			}
			self.holdingBag = false;
			updatePlayerList.push({id:self.id,property:"holdingBag",value:self.holdingBag});
		}
		if (self.health <= 0 && self.respawnTimer < respawnTimeLimit){self.respawnTimer++;}
		if (self.respawnTimer >= respawnTimeLimit && self.health <= 0){self.respawn();}
		if (self.health <= 0){return false;}

		
	////////////SHOOTING///////////////////
		//Auto shooting for holding down button
		if (self.firing <= 0 && !self.pressingShift && self.fireRate <= 0 && (self.pressingUp || self.pressingDown || self.pressingLeft || self.pressingRight)){
			Discharge(self);
		}
		if (self.fireRate > 0){
			self.fireRate--;
			if (self.bufferReload && self.fireRate <= 0){
				self.bufferReload = false;
				reload(self.id);				
			}
		}
		
		//If currently holding an arrow key, be aiming in that direction 
		if (self.aiming < 45 && self.pressingUp === true && self.pressingRight === false && self.pressingDown === false && self.pressingLeft === false){				
			if (self.shootingDir != 1){
				self.shootingDir = 1;
				updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
			}
		}
		if (self.aiming < 45 && self.pressingUp === true && self.pressingRight === true && self.pressingDown === false && self.pressingLeft === false){				
			if (self.shootingDir != 2){
				self.shootingDir = 2;
				updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
			}
		}
		if (self.aiming < 45 && self.pressingUp === false && self.pressingRight === true && self.pressingDown === false && self.pressingLeft === false){				
			if (self.shootingDir != 3){
				self.shootingDir = 3;
				updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
			}
		}
		if (self.aiming < 45 && self.pressingUp === false && self.pressingRight === true && self.pressingDown === true && self.pressingLeft === false){				
			if (self.shootingDir != 4){
				self.shootingDir = 4;
				updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
			}
		}
		if (self.aiming < 45 && self.pressingUp === false && self.pressingRight === false && self.pressingDown === true && self.pressingLeft === false){				
			if (self.shootingDir != 5){
				self.shootingDir = 5;
				updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
			}
		}
		if (self.aiming < 45 && self.pressingUp === false && self.pressingRight === false && self.pressingDown === true && self.pressingLeft === true){				
			if (self.shootingDir != 6){
				self.shootingDir = 6;
				updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
			}
		}
		if (self.aiming < 45 && self.pressingUp === false && self.pressingRight === false && self.pressingDown === false && self.pressingLeft === true){				
			if (self.shootingDir != 7){
				self.shootingDir = 7;
				updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
			}
		}
		if (self.aiming < 45 && self.pressingUp === true && self.pressingRight === false && self.pressingDown === false && self.pressingLeft === true){				
			if (self.shootingDir != 8){
				self.shootingDir = 8;
				updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
			}
		}
		
		//Firing and aiming decay (every frame)
		if (self.aiming > 0){
			self.aiming--;
		}
		if (self.triggerTapLimitTimer > 0){self.triggerTapLimitTimer--;}

		if (self.firing > 0){
			self.firing--;
			
			//Hit detection
			if (self.liveShot){
				var hitTargets = [];
				var blockHitTargets = [];
				var organicHitTargets = [];
				for (var i in Player.list){
					var isHitTarget = entityHelpers.checkIfInLineOfShot(self, Player.list[i]);
					if (isHitTarget && isHitTarget != false){
						hitTargets.push(isHitTarget);
						organicHitTargets.push(isHitTarget);
					}	
				}
				var thugList = thug.getThugList();
				for (var i in thugList){
					var isHitTarget = entityHelpers.checkIfInLineOfShot(self, thugList[i]);
					if (isHitTarget && isHitTarget != false){
						hitTargets.push(isHitTarget);
						organicHitTargets.push(isHitTarget);
					}	
				}					
				var blockList = block.getBlockList();
				for (var i in blockList){
					if (blockList[i].type == "normal" || blockList[i].type == "red" || blockList[i].type == "blue"){
						var isHitTarget = entityHelpers.checkIfInLineOfShot(self, blockList[i]);
						if (isHitTarget && isHitTarget != false){
							hitTargets.push(isHitTarget);
							blockHitTargets.push(isHitTarget);
						}	
					}
				}				

				if (self.weapon == 4){
					var SGhitTargets = [];
					
					for (var t in organicHitTargets){
						var isBehindCover = false;
						for (var b in blockHitTargets){ 
							if (checkIfBlocking(blockHitTargets[b].target, self, organicHitTargets[t].target)){ //And see if it is blocking the shooter's path
								isBehindCover = true;
							}										
						}
						if (!isBehindCover){
							organicHitTargets[t].target.hit(self.shootingDir, organicHitTargets[t].dist, self, getDistance(self,organicHitTargets[t].target));
							//Calculate blood effect if target is organic
							var bloodX = organicHitTargets[t].target.x;
							var bloodY = organicHitTargets[t].target.y;
							entityHelpers.sprayBloodOntoTarget(self.shootingDir, bloodX, bloodY, organicHitTargets[t].target.id);
						}
					}
					var shotData = {};
					shotData.id = self.id;
					shotData.spark = false;
					shotData.distance = 10000;
					shotData.shootingDir = self.shootingDir;
					self.liveShot = false;
					for(var i in SOCKET_LIST){
						SOCKET_LIST[i].emit('shootUpdate',shotData);
					}	
				}
				else {
					//Out of all targets in line of shot, which is closest?				
					var hitTarget = entityHelpers.getHitTarget(hitTargets);				
					if (hitTarget != null){
						//We officially have a hit on a specific target
						self.liveShot = false;
						hitTarget.hit(self.shootingDir, hitTarget.dist, self, getDistance(self,hitTarget));				
						 
						if (hitTarget.team && hitTarget.health){
							//Calculate blood effect if target is organic
							var bloodX = hitTarget.x;
							var bloodY = hitTarget.y;
							if (self.shootingDir == 1){if (self.weapon != 4) bloodX = self.x;}
							if (self.shootingDir == 2){bloodX = hitTarget.x - hitTarget.distFromDiag/2; bloodY = hitTarget.y - hitTarget.distFromDiag/2;}
							if (self.shootingDir == 3){if (self.weapon != 4) bloodY = self.y;}
							if (self.shootingDir == 4){bloodX = hitTarget.x - hitTarget.distFromDiag/2; bloodY = hitTarget.y + hitTarget.distFromDiag/2;}
							if (self.shootingDir == 5){if (self.weapon != 4) bloodX = self.x;}
							if (self.shootingDir == 6){bloodX = hitTarget.x - hitTarget.distFromDiag/2; bloodY = hitTarget.y - hitTarget.distFromDiag/2;}
							if (self.shootingDir == 7){if (self.weapon != 4) bloodY = self.y;}
							if (self.shootingDir == 8){bloodX = hitTarget.x - hitTarget.distFromDiag/2; bloodY = hitTarget.y + hitTarget.distFromDiag/2;}
							entityHelpers.sprayBloodOntoTarget(self.shootingDir, bloodX, bloodY, hitTarget.id);
						}
					}
					else {
						var shotData = {};
						shotData.id = self.id;
						shotData.spark = false;
						shotData.distance = bulletRange;
						self.liveShot = false;
						for(var i in SOCKET_LIST){
							SOCKET_LIST[i].emit('shootUpdate',shotData);
						}					
					}
				}
			}
		}
		/////////////////////// MULTIKILL ////////////////////
		if (self.multikillTimer > 0){
			self.multikillTimer--;
		}
		if (self.multikill > 0 && self.multikillTimer <= 0){
			self.multikill = 0;
		}

		/////////////////////// HEALING ////////////////////
		if (self.healDelay <= 0 && self.health < 100 && self.health > 0){
			self.health++;
			updatePlayerList.push({id:self.id,property:"health",value:self.health});
			self.healDelay += healRate;
		}
		if (self.health >= 100){
			self.lastEnemyToHit = 0;
		}
		if (self.healDelay > 0){self.healDelay--;}

	/////////////////////// ENERGY /////////////////////
		if (self.rechargeDelay <= 0 && self.energy < (100 * self.hasBattery)){
			self.energy++;
			if ((self.hasBattery > 1 && self.energy == 100) || (self.hasBattery > 2 && self.energy == 200) || (self.hasBattery > 3 && self.energy == 300) || (self.hasBattery > 4 && self.energy == 400))
				self.energy++; //Free extra energy at 100 if more than one battery to avoid stopping the charge sfx at 100 (normally 100 is "charge complete")
			if (self.hasBattery == 1 && self.energy > 100){
				self.energy = 100;
			}
			if (self.hasBattery == 2 && self.energy > 200){
				self.energy = 200;
			}
			updatePlayerList.push({id:self.id,property:"energy",value:self.energy});
		}
		if (self.rechargeDelay > 0){self.rechargeDelay--;}
		
		//boost decay
		if (self.boosting > 0){
			self.boosting = self.boosting - boostDecay;
			updatePlayerList.push({id:self.id,property:"boosting",value:self.boosting});
		}
		
	///////////////////////CLOAKING/////////////////////
	if (self.cloakEngaged && self.energy > 0){
		self.energy -= cloakDrainSpeed;
		if (self.energy < 0)
			self.energy = 0;
		updatePlayerList.push({id:self.id,property:"energy",value:self.energy});
		self.rechargeDelay = rechargeDelayTime;
	}
	if (self.cloakEngaged && self.energy > 0 && self.cloak < 1){
		self.cloak += cloakInitializeSpeed;
		if (self.cloak > 1)
			self.cloak = 1;
		self.cloak = Math.round(self.cloak * 100) / 100;
		updatePlayerList.push({id:self.id,property:"cloak",value:self.cloak});
	}
	else if ((!self.cloakEngaged || self.energy <= 0) && self.cloak > 0){
		self.cloak -= cloakDeinitializeSpeed;
		if (self.energy == 0){
			self.rechargeDelay = rechargeDelayTime * 2;
			self.cloakEngaged = false;
			updatePlayerList.push({id:self.id,property:"cloakEngaged",value:self.cloakEngaged});
		}		
		if (self.cloak < 0)
			self.cloak = 0;
		self.cloak = Math.round(self.cloak * 100) / 100;
		updatePlayerList.push({id:self.id,property:"cloak",value:self.cloak});
	}
		
	/////MOVEMENT //////////
		if (self.boosting <= 0){
			if(self.pressingW && !self.pressingS && !self.pressingD && !self.pressingA){
				self.speed = globalSpeed;
				if (self.stagger > 0){self.speed = self.speed * staggerScale;}
				if (self.cloakEngaged){self.speed = self.speed * cloakDrag;}
				else if (self.holdingBag){self.speed = self.speed * bagDrag;}
				self.y -= self.speed;
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
				if (self.walkingDir != 1){
					self.walkingDir = 1;
					updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
				}
			}
			else if(self.pressingD && !self.pressingS && !self.pressingW && !self.pressingA){
				self.speed = globalSpeed;
				if (self.stagger > 0){self.speed = self.speed * staggerScale}
				if (self.cloakEngaged){self.speed = self.speed * cloakDrag;}
				else if (self.holdingBag){self.speed = self.speed * bagDrag;}
				self.x += self.speed;
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				if (self.walkingDir != 3){
					self.walkingDir = 3;
					updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
				}
			}
			else if(self.pressingS && !self.pressingA && !self.pressingW && !self.pressingD){
				self.speed = globalSpeed;
				if (self.stagger > 0){self.speed = self.speed * staggerScale}
				if (self.cloakEngaged){self.speed = self.speed * cloakDrag;}
				else if (self.holdingBag){self.speed = self.speed * bagDrag;}
				self.y += self.speed;
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
				if (self.walkingDir != 5){
					self.walkingDir = 5;
					updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
				}
			}
			else if(self.pressingA && !self.pressingS && !self.pressingW && !self.pressingD){
				self.speed = globalSpeed;
				if (self.stagger > 0){self.speed = self.speed * staggerScale}
				if (self.cloakEngaged){self.speed = self.speed * cloakDrag;}
				else if (self.holdingBag){self.speed = self.speed * bagDrag;}
				self.x -= self.speed;
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				if (self.walkingDir != 7){
					self.walkingDir = 7;
					updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
				}
			}
			else if(self.pressingW && self.pressingD){
				self.speed = globalSpeed;
				if (self.stagger > 0){self.speed = self.speed * staggerScale}
				if (self.cloakEngaged){self.speed = self.speed * cloakDrag;}
				else if (self.holdingBag){self.speed = self.speed * bagDrag;}
				self.x += (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y -= (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
				if (self.walkingDir != 2){
					self.walkingDir = 2;
					updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
				}
			}
			else if(self.pressingD && self.pressingS){
				self.speed = globalSpeed;
				if (self.stagger > 0){self.speed = self.speed * staggerScale}
				if (self.cloakEngaged){self.speed = self.speed * cloakDrag;}
				else if (self.holdingBag){self.speed = self.speed * bagDrag;}
				self.x += (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y += (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
				if (self.walkingDir != 4){
					self.walkingDir = 4;
					updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
				}
			}
			else if(self.pressingA && self.pressingS){
				self.speed = globalSpeed;
				if (self.stagger > 0){self.speed = self.speed * staggerScale}
				if (self.cloakEngaged){self.speed = self.speed * cloakDrag;}
				else if (self.holdingBag){self.speed = self.speed * bagDrag;}
				self.x -= (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y += (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
				if (self.walkingDir != 6){
					self.walkingDir = 6;
					updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
				}
			}
			else if(self.pressingW && self.pressingA){
				self.speed = globalSpeed;
				if (self.stagger > 0){self.speed = self.speed * staggerScale}
				if (self.cloakEngaged){self.speed = self.speed * cloakDrag;}
				else if (self.holdingBag){self.speed = self.speed * bagDrag;}
				self.x -= (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"x",value:self.x});
				self.y -= (self.speed) * (2/3);
				updatePlayerList.push({id:self.id,property:"y",value:self.y});
				if (self.walkingDir != 8){
					self.walkingDir = 8;
					updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
				}
			}
			else if (!self.pressingW && !self.pressingA && !self.pressingS && !self.pressingD){
				if (self.walkingDir != 0){
					self.walkingDir = 0;
					updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
				}
			}
		}
		//Calculate boosting amount on player		
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
		
		if (!self.pressingShift && self.walkingDir != 0 && self.aiming == 0 && !self.pressingUp && !self.pressingDown && !self.pressingLeft && !self.pressingRight && self.reloading <= 0){
			if (self.shootingDir != self.walkingDir){
				self.shootingDir = self.walkingDir;
				updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
			}
		} //default to shootingdir = walkingdir unless otherwise specified!

		if (self.speed < 0){self.speed = 0;}

		//Keep player from walls Edge detection. Walls.
		if (self.x > mapWidth - 5){self.x = mapWidth - 5; updatePlayerList.push({id:self.id,property:"x",value:self.x});} //right
		if (self.y > mapHeight - 5){self.y = mapHeight - 5; updatePlayerList.push({id:self.id,property:"y",value:self.y});} // bottom
		if (self.x < 5){self.x = 5; updatePlayerList.push({id:self.id,property:"x",value:self.x});} //left
		if (self.y < 5){self.y = 5; updatePlayerList.push({id:self.id,property:"y",value:self.y});} //top
		
		if (self.stagger > 0){self.stagger--;}
		//End MOVEMENT
	
		////////////////////// BEING PUSHED ///////////////////////////////////////////
		gameEngine.processEntityPush(self);

		///////////////////// COLLISION WITH OBSTACLES/PLAYERS /////////////////////////
		
		//Check collision with players
		for (var i in Player.list){
			if (Player.list[i].id != self.id  && Player.list[i].health > 0 && self.x + self.width > Player.list[i].x && self.x < Player.list[i].x + Player.list[i].width && self.y + self.height > Player.list[i].y && self.y < Player.list[i].y + Player.list[i].height){								
				if (self.x == Player.list[i].x && self.y == Player.list[i].y){self.x -= 5; updatePlayerList.push({id:self.id,property:"x",value:self.x});} //Added to avoid math issues when entities are directly on top of each other (distance = 0)
				var dx1 = self.x - Player.list[i].x;
				var dy1 = self.y - Player.list[i].y;
				var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
				var ax1 = dx1/dist1;
				var ay1 = dy1/dist1;
				if (dist1 < 40){				
					if (self.boosting > 0){  //melee boost collision bash
						Player.list[i].pushSpeed = 20;
						Player.list[i].pushDir = self.boostingDir;
						if (self.team != Player.list[i].team){
							Player.list[i].health -= boostDamage;
						}
						self.pushSpeed = 20;
						self.boosting = -1;
						updatePlayerList.push({id:self.id,property:"boosting",value:self.boosting});
						
						//Assassinations
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
						Player.list[i].healDelay = healDelayTime;
						entityHelpers.sprayBloodOntoTarget(self.boostingDir, Player.list[i].x, Player.list[i].y, Player.list[i].id);
						if (Player.list[i].health <= 0){
							Player.list[i].kill(self);
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
		var thugList = thug.getThugList();
		for (var i in thugList){
			if (thugList[i].id != self.id && thugList[i].health > 0 && self.x + self.width > thugList[i].x && self.x < thugList[i].x + thugList[i].width && self.y + self.height > thugList[i].y && self.y < thugList[i].y + thugList[i].height){								
				if (self.x == thugList[i].x && self.y == thugList[i].y){self.x -= 5; updateThugList.push({id:self.id,property:"x",value:self.x});} //Added to avoid math issues when entities are directly on top of each other (distance = 0)
				var dx1 = self.x - thugList[i].x;
				var dy1 = self.y - thugList[i].y;
				var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
				var ax1 = dx1/dist1;
				var ay1 = dy1/dist1;
				if (dist1 < 40){		

					if (self.boosting > 0){ //melee boost collision bash
						self.pushSpeed = 20;
						self.boosting = -1;
						updatePlayerList.push({id:self.id,property:"boosting",value:self.boosting});
						
						if (self.team != thugList[i].team){
							thugList[i].health -= boostDamage;
							updateThugList.push({id:thugList[i].id,property:"health",value:thugList[i].health})
							entityHelpers.sprayBloodOntoTarget(self.boostingDir, thugList[i].x, thugList[i].y, thugList[i].id);
							thugList[i].attacking = thugAttackDelay;
							if (thugList[i].health <= 0){
								thugList[i].kill(self);
							}
						}
					}
				
					self.x += ax1 / (dist1 / 70); //Higher number is greater push
					updatePlayerList.push({id:self.id,property:"x",value:self.x})
					self.y += ay1 / (dist1 / 70);
					updatePlayerList.push({id:self.id,property:"y",value:self.y});
				}				
			}
		}
		
		//Check Player collision with blocks
		var blockList = block.getBlockList();
		for (var i in blockList){
			if (self.x > blockList[i].x && self.x < blockList[i].x + blockList[i].width && self.y > blockList[i].y && self.y < blockList[i].y + blockList[i].height){												
				if (blockList[i].type == "normal" || blockList[i].type == "red" || blockList[i].type == "blue"){
					var overlapTop = Math.abs(blockList[i].y - self.y);  
					var overlapBottom = Math.abs((blockList[i].y + blockList[i].height) - self.y);
					var overlapLeft = Math.abs(self.x - blockList[i].x);
					var overlapRight = Math.abs((blockList[i].x + blockList[i].width) - self.x);			
					if (overlapTop <= overlapBottom && overlapTop <= overlapRight && overlapTop <= overlapLeft){	
						self.y = blockList[i].y - 1;
						updatePlayerList.push({id:self.id,property:"y",value:self.y});
					}
					else if (overlapBottom <= overlapTop && overlapBottom <= overlapRight && overlapBottom <= overlapLeft){
						self.y = blockList[i].y + blockList[i].height + 1;
						updatePlayerList.push({id:self.id,property:"y",value:self.y});
					}
					else if (overlapLeft <= overlapTop && overlapLeft <= overlapRight && overlapLeft <= overlapBottom){
						self.x = blockList[i].x - 1;
						updatePlayerList.push({id:self.id,property:"x",value:self.x});
					}
					else if (overlapRight <= overlapTop && overlapRight <= overlapLeft && overlapRight <= overlapBottom){
						self.x = blockList[i].x + blockList[i].width + 1;
						updatePlayerList.push({id:self.id,property:"x",value:self.x});
					}
				}
				else if (blockList[i].type == "pushUp"){
					self.y -= pushStrength;
					if (self.y < blockList[i].y){self.y = blockList[i].y;}
					updatePlayerList.push({id:self.id,property:"y",value:self.y});
				}
				else if (blockList[i].type == "pushRight"){
					self.x += pushStrength;
					if (self.x > blockList[i].x + blockList[i].width){self.x = blockList[i].x + blockList[i].width;}
					updatePlayerList.push({id:self.id,property:"x",value:self.x});
				}
				else if (blockList[i].type == "pushDown"){
					self.y += pushStrength;
					if (self.y > blockList[i].y + blockList[i].height){self.y = blockList[i].y + blockList[i].height;}
					updatePlayerList.push({id:self.id,property:"y",value:self.y});
				}
				else if (blockList[i].type == "pushLeft"){
					self.x -= pushStrength;
					if (self.x < blockList[i].x){self.x = blockList[i].x;}
					updatePlayerList.push({id:self.id,property:"x",value:self.x});
				}
				else if (blockList[i].type == "warp1"){
					self.x = warp1X;
					updatePlayerList.push({id:self.id,property:"x",value:self.x});
					self.y = warp1Y;
					updatePlayerList.push({id:self.id,property:"y",value:self.y});
					SOCKET_LIST[self.id].emit('sfx', "sfxWarp");
				}
				else if (blockList[i].type == "warp2"){
					self.x = warp2X;
					updatePlayerList.push({id:self.id,property:"x",value:self.x});
					self.y = warp2Y;
					updatePlayerList.push({id:self.id,property:"y",value:self.y});
					SOCKET_LIST[self.id].emit('sfx', "sfxWarp");
				}

			}// End check if player is overlapping block
		}//End blockList loop		
		
		//Pickup updates
		pickup.checkForPickup(self);
		
		//Check Player collision with bag - STEAL
		if (gametype == "ctf"){
			if (self.team == "white" && bagBlue.captured == false && self.health > 0 && bagBlue.playerThrowing != self.id){
				if (self.x > bagBlue.x - 67 && self.x < bagBlue.x + 67 && self.y > bagBlue.y - 50 && self.y < bagBlue.y + 50){												
					bagBlue.captured = true;
					bagBlue.speed = 0;
					updateMisc.bagBlue = bagBlue;
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
					if (bagBlue.x == bagBlue.homeX && bagBlue.y == bagBlue.homeY){
						playerEvent(self.id, "steal");
					}
				}
			}
			else if (self.team == "black" && bagRed.captured == false && self.health > 0 && bagRed.playerThrowing != self.id){
				if (self.x > bagRed.x - 67 && self.x < bagRed.x + 67 && self.y > bagRed.y - 50 && self.y < bagRed.y + 50){												
					bagRed.captured = true;
					bagRed.speed = 0;
					updateMisc.bagRed = bagRed;
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
					if (bagRed.x == bagRed.homeX && bagRed.y == bagRed.homeY){
						playerEvent(self.id, "steal");					
					}
				}
			}

			//Check Player collision with bag - RETURN
			if (self.team == "white" && bagRed.captured == false && self.health > 0 && (bagRed.x != bagRed.homeX || bagRed.y != bagRed.homeY)){
				if (self.x > bagRed.x - 67 && self.x < bagRed.x + 67 && self.y > bagRed.y - 50 && self.y < bagRed.y + 50){			
					playerEvent(self.id, "return");
					bagRed.x = bagRed.homeX;
					bagRed.y = bagRed.homeY;
					bagRed.speed = 0;
					updateMisc.bagRed = bagRed;		
				}
			}
			if (self.team == "black" && bagBlue.captured == false && self.health > 0 && (bagBlue.x != bagBlue.homeX || bagBlue.y != bagBlue.homeY)){
				if (self.x > bagBlue.x - 67 && self.x < bagBlue.x + 67 && self.y > bagBlue.y - 50 && self.y < bagBlue.y + 50){												
					playerEvent(self.id, "return");
					bagBlue.x = bagBlue.homeX;
					bagBlue.y = bagBlue.homeY;
					bagBlue.speed = 0;
					updateMisc.bagBlue = bagBlue;
				}
			}

			//Check Player collision with bag - CAPTURE
			if (gameOver == false){
				if (self.team == "white" && self.holdingBag == true && bagRed.captured == false && self.health > 0 && (bagRed.x == bagRed.homeX && bagRed.y == bagRed.homeY)){
					if (self.x > bagRed.homeX - 67 && self.x < bagRed.homeX + 67 && self.y > bagRed.homeY - 50 && self.y < bagRed.homeY + 50){												
						//Bag Score
						playerEvent(self.id, "capture");
						gameEngine.capture("white");
					}
				}
				if (self.team == "black" && self.holdingBag == true && bagBlue.captured == false && self.health > 0 && (bagBlue.x == bagBlue.homeX && bagBlue.y == bagBlue.homeY)){
					if (self.x > bagBlue.homeX - 67 && self.x < bagBlue.homeX + 67 && self.y > bagBlue.homeY - 50 && self.y < bagBlue.homeY + 50){												
						//Bag Score
						playerEvent(self.id, "capture");
						gameEngine.capture("black");
					}
				}
			}
			
			//Move bag with player
			if (self.holdingBag == true && self.health > 0){
				if (self.team == "black"){
					bagRed.x = self.x;
					bagRed.y = self.y;				
					updateMisc.bagRed = bagRed;
				}
				else if (self.team == "white"){
					bagBlue.x = self.x;
					bagBlue.y = self.y;				
					updateMisc.bagBlue = bagBlue;
				}
			}
		}//End check if gametype is ctf
		
		////// RELOADING ///////////////////////////////////////////////////////////////////////////
		if (self.reloading > 0){
			self.reloading--;
			if (self.reloading <= 0) {
				if (self.weapon == 1){
					self.PClip = 15;
					updatePlayerList.push({id:self.id,property:"PClip",value:self.PClip});
				}
				else if (self.weapon == 2){
					var clipNeeds = DPClipSize - self.DPClip;
					if (self.DPAmmo >= clipNeeds){
						self.DPClip = DPClipSize;
						self.DPAmmo -= clipNeeds;
					}
					else {
						self.DPClip += self.DPAmmo;
						self.DPAmmo = 0;
					}
					updatePlayerList.push({id:self.id,property:"DPClip",value:self.DPClip});
					updatePlayerList.push({id:self.id,property:"DPAmmo",value:self.DPAmmo});
				}
				else if (self.weapon == 3){
					var clipNeeds = MGClipSize - self.MGClip;
					if (self.MGAmmo >= clipNeeds){
						self.MGClip = MGClipSize;
						self.MGAmmo -= clipNeeds;
					}
					else {
						self.MGClip += self.MGAmmo;
						self.MGAmmo = 0;
					}
					updatePlayerList.push({id:self.id,property:"MGClip",value:self.MGClip});
					updatePlayerList.push({id:self.id,property:"MGAmmo",value:self.MGAmmo});
				}
				else if (self.weapon == 4){
					var clipNeeds = SGClipSize - self.SGClip;
					if (self.SGAmmo >= 1 && clipNeeds >= 1){
						self.SGClip++;
						self.SGAmmo--;						
					}
					if (clipNeeds >= 2 && self.SGAmmo > 0){
						self.reloading = 30;
						updatePlayerList.push({id:self.id,property:"reloading",value:self.reloading});
					}
					updatePlayerList.push({id:self.id,property:"SGClip",value:self.SGClip});
					updatePlayerList.push({id:self.id,property:"SGAmmo",value:self.SGAmmo});
				}
			}
		}		
		////////////AFK/MISC///////////////////
		if (typeof self.afk === 'undefined'){
		 self.afk = AfkFramesAllowed;
		}
		else if (self.afk >= 0 && self.team != "none"){
			self.afk--;
		}
		else { //Boot em
			socket.emit('reloadHomePage');
			socket.disconnect();
		}
		
	}//End engine()

	self.hit = function(shootingDir, distance, shooter, targetDistance){
		if (shooter.weapon != 4){
			var shotData = {};
			shotData.id = shooter.id;
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
		
		//Player stagger and cloak interruption stuff
		self.stagger = staggerTime;		
		self.healDelay += healDelayTime;
		if (self.healDelay > healDelayTime){self.healDelay = healDelayTime;} //Ceiling on healDelay
		if (self.team != shooter.team){
			playerEvent(shooter.id, "hit");
		}
		if (self.cloakEngaged){
			self.cloakEngaged = false;
			damageInflicted += cloakBonusDamage;
			updatePlayerList.push({id:self.id,property:"cloakEngaged",value:self.cloakEngaged});
		}
		
		//Facing attacker (lowest damage)
		if (shooter.weapon == 1){ damageInflicted += pistolDamage; } //Single Pistol
		else if (shooter.weapon == 2){ damageInflicted += pistolDamage * 2; } //Double damage for double pistols
		else if (shooter.weapon == 3){ damageInflicted += mgDamage; } //Damage for MG
		else if (shooter.weapon == 4){ damageInflicted += -(targetDistance - SGRange)/(SGRange/SGCloseRangeDamageScale) * SGDamage; } //Damage for SG
		
		if (self.team != shooter.team){
			if (self.shootingDir != (shootingDir + 4) && self.shootingDir != (shootingDir - 4) && self.shootingDir != (shootingDir + 5) && self.shootingDir != (shootingDir - 5) && self.shootingDir != (shootingDir + 3) && self.shootingDir != (shootingDir - 3)){
				//self is NOT facing shooter (within 3 angles)
				if (shooter.weapon == 1){ damageInflicted += pistolSideDamage; } //Single Pistol
				else if (shooter.weapon == 2){ damageInflicted += pistolSideDamage * 2; } //Double damage for double pistols
				else if (shooter.weapon == 3){ damageInflicted += mgSideDamage; } //Damage for MG
				else if (shooter.weapon == 4){ damageInflicted += -(targetDistance - SGRange)/(SGRange/SGCloseRangeDamageScale) * SGSideDamage; } //Damage for SG
			}
			if (self.shootingDir == shootingDir){
				//Back Damage
				if (shooter.weapon == 1){ damageInflicted += pistolBackDamage; } //Single Pistol
				else if (shooter.weapon == 2){ damageInflicted += pistolBackDamage * 2; } //Double damage for double pistols
				else if (shooter.weapon == 3){ damageInflicted += mgBackDamage; } //Damage for MG
				else if (shooter.weapon == 4){ damageInflicted += -(targetDistance - SGRange)/(SGRange/SGCloseRangeDamageScale) * SGBackDamage; } //Damage for SG
			}
		}			
		else if (self.team == shooter.team){
			damageInflicted *= friendlyFireDamageScale;
		}
		
		damageInflicted = damageInflicted * damageScale; //Scale damage
		self.health -= Math.floor(damageInflicted);

		updatePlayerList.push({id:self.id,property:"health",value:self.health});
					
		//Damage push
		self.pushSpeed += damageInflicted/8 * damagePushScale;
		self.pushDir = Player.list[shooter.id].shootingDir;			
		updatePlayerList.push({id:self.id,property:"pushSpeed",value:self.pushSpeed});
		updatePlayerList.push({id:self.id,property:"pushDir",value:self.pushDir});

		if (self.health <= 0){
			self.kill(shooter);
		}			
	}

	self.kill = function(shooter){
		var shooterId = shooter.id;
		if (shooterId != 0){
			if (self.team != shooter.team || (self.lastEnemyToHit && self.lastEnemyToHit != 0)){
				if ((self.lastEnemyToHit && self.lastEnemyToHit != 0) && self.team == shooter.team){
					shooterId = self.lastEnemyToHit; //Give kill credit to last enemy that hit the player (if killed by own team or self)
				}
				if (gametype == "slayer" && gameOver == false){
					gameEngine.killScore(shooter.team);
				}
				playerEvent(shooterId, "kill");
				
				shooter.spree++;
				shooter.multikill++;
				shooter.multikillTimer = 4 * 60;
				if (shooter.multikill >= 2){
					playerEvent(shooterId, "multikill");
				}
				if (shooter.spree == 5 || shooter.spree == 10 || shooter.spree == 15 || shooter.spree == 20){
					playerEvent(shooterId, "spree");
				}
				//playerEvent(shooterId, "killThug");
			}
			else { //Killed by own team or self AND no last enemy to hit
				playerEvent(shooterId, "benedict");
			}
		}
		playerEvent(self.id, "death");
		
		
		//Create Body
		if (self.pushSpeed > pushMaxSpeed){ self.pushSpeed = pushMaxSpeed; }
		
		if (self.team == "white"){
			updateEffectList.push({type:5, targetX:self.x, targetY:self.y, pushSpeed:self.pushSpeed, shootingDir:shooter.shootingDir, bodyType:"whiteRed"});
		}
		else if (self.team == "black"){
			updateEffectList.push({type:5, targetX:self.x, targetY:self.y, pushSpeed:self.pushSpeed, shootingDir:shooter.shootingDir, bodyType:"blackBlue"});
		}
		
		//Drop Ammo/Pickups drop pickups
		var drops = 0;
		if (self.DPAmmo > 0 || self.DPClip > 0){
			drops++;
			var ammoAmount = self.DPClip + self.DPAmmo;
			var dpId = Math.random();
			pickup.createPickup(dpId, self.x - 40, self.y - 35, 2, ammoAmount, -1);
			self.DPAmmo = 0;
			self.DPClip = 0;
			updatePlayerList.push({id:self.id,property:"DPAmmo",value:self.DPAmmo});		
			updatePlayerList.push({id:self.id,property:"DPClip",value:self.DPClip});		
		}
		if (self.MGAmmo > 0 || self.MGClip > 0){
			drops++;
			var ammoAmount = self.MGClip + self.MGAmmo;
			var mgId = Math.random();
			pickup.createPickup(mgId, self.x - 25 + (drops * 8), self.y - 10, 3, ammoAmount, -1);
			self.MGAmmo = 0;
			self.MGClip = 0;
			updatePlayerList.push({id:self.id,property:"MGAmmo",value:self.MGAmmo});		
			updatePlayerList.push({id:self.id,property:"MGClip",value:self.MGClip});		
		}
		if (self.SGAmmo > 0 || self.SGClip > 0){
			drops++;
			var ammoAmount = self.SGClip + self.SGAmmo;
			var sgId = Math.random();
			pickup.createPickup(sgId, self.x - 30, self.y - 20 + (drops * 10), 4, ammoAmount, -1);
			self.SGAmmo = 0;
			self.SGClip = 0;
			updatePlayerList.push({id:self.id,property:"SGAmmo",value:self.SGAmmo});		
			updatePlayerList.push({id:self.id,property:"SGClip",value:self.SGClip});		
		}
	}

	self.triggerPlayerEvent = function(event){
		playerEvent(self.id, event);
	}

	self.respawn = function(){
		updatePlayerList.push({id:self.id,property:"name",value:self.name});
		self.health = 100;
		updatePlayerList.push({id:self.id,property:"health",value:self.health});
		self.energy = 100;
		updatePlayerList.push({id:self.id,property:"energy",value:self.energy});
		self.cloak = 0;
		updatePlayerList.push({id:self.id,property:"cloak",value:self.cloak});		
		self.cloakEngaged = false;
		updatePlayerList.push({id:self.id,property:"cloakEngaged",value:self.cloakEngaged});		
		self.boosting = 0;
		updatePlayerList.push({id:self.id,property:"boosting",value:self.boosting});
		self.boostingDir = 0;
		self.rechargeDelay = 0;
		self.healDelay = 0;


		
		self.speed = 0;
		self.stagger = 0;
		self.hasBattery = 1;
		self.respawnTimer = 0;
		self.pushSpeed = 0;		
		self.spree = 0;
		self.multikill = 0;
		self.multikillTimer = 0;
		self.lastEnemyToHit = 0;
		
		self.firing = 0; //0-3; 0 = not firing
		self.aiming = 0;
		self.liveShot = false; ////!! This variable may not need to exist, it never gets set to false when missing a target
		self.respawnTimer = 0;
		self.holdingBag = false;
		updatePlayerList.push({id:self.id,property:"holdingBag",value:self.holdingBag});
		self.weapon = 1;
		updatePlayerList.push({id:self.id,property:"weapon",value:self.weapon});
		self.PClip = 15;
		updatePlayerList.push({id:self.id,property:"PClip",value:self.PClip});
		self.DPClip = 0;
		updatePlayerList.push({id:self.id,property:"DPClip",value:self.DPClip});
		self.MGClip = 0;
		updatePlayerList.push({id:self.id,property:"MGClip",value:self.MGClip});
		self.SGClip = 0;
		updatePlayerList.push({id:self.id,property:"SGClip",value:self.SGClip});
		self.DPAmmo = 0;
		updatePlayerList.push({id:self.id,property:"DPAmmo",value:self.DPAmmo});
		self.MGAmmo = 0;
		updatePlayerList.push({id:self.id,property:"MGAmmo",value:self.MGAmmo});
		self.SGAmmo = 0;		
		updatePlayerList.push({id:self.id,property:"SGAmmo",value:self.SGAmmo});
		self.fireRate = 0;
		self.triggerTapLimitTimer = 0;
		self.reloading = 0;
		
		self.pressingUp = false;
		self.pressingRight = false;
		self.pressingDown = false;
		self.pressingLeft = false;
		self.pressingW = false;
		self.pressingD = false;
		self.pressingS = false;		
		self.pressingA = false;
		self.pressingShift = false;					
							
		gameEngine.spawnSafely(self);
		updatePlayerList.push({id:self.id,property:"y",value:self.y});
		updatePlayerList.push({id:self.id,property:"x",value:self.x});
		
						
		//Send Full Game Status To Individual Player
		//gameEngine.sendFullGameStatus(self.id);
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
				cloak:Player.list[a].cloak,
				cloakEngaged:Player.list[a].cloakEngaged,
				boosting:Player.list[a].boosting,
				walkingDir:Player.list[a].walkingDir,				
				shootingDir:Player.list[a].shootingDir,				
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
				cashEarnedThisGame:Player.list[a].cashEarnedThisGame,
				kills:Player.list[a].kills,
				deaths:Player.list[a].deaths,
				steals:Player.list[a].steals,
				returns:Player.list[a].returns,
				captures:Player.list[a].captures,	
				chat:"",
				chatDecay:0,
			};
			playerPack.push(player);
		}
		var thugList = thug.getThugList();
		for (var b in thugList){
			var thugy = {
				id:thugList[b].id,
				x:thugList[b].x,
				y:thugList[b].y,
				health:thugList[b].health,
				team:thugList[b].team,
				rotation:thugList[b].rotation,
			};
			thugPack.push(thugy);
		}

		blockPack = block.getBlockList();
		pickupPack = pickup.getPickupList();

		
		var size = Object.size(Player.list);			
		miscPack.bagRed = bagRed;
		miscPack.bagBlue = bagBlue;
		miscPack.numPlayers = size;
		miscPack.shop = shop;
		miscPack.gameOver = gameOver;
		miscPack.pregame = pregame;		
		miscPack.shopEnabled = shopEnabled;
		
		miscPack.variant = {};
		miscPack.variant.map = map;
		miscPack.variant.gametype = gametype;
		miscPack.variant.scoreToWin = scoreToWin;
		miscPack.mapWidth = mapWidth;
		miscPack.mapHeight = mapHeight;
		miscPack.pcMode = pcMode;
		miscPack.ip = myIP;
		miscPack.port = port;
		
		if (gameMinutesLength > 0 || gameSecondsLength > 0){
			miscPack.variant.timeLimit = true;
		}
		else {
			miscPack.variant.timeLimit = false;
		}
		console.log("SENDING FULL GAME STATUS");
		console.log("BLOCKS");
		console.log(blockPack);
		
		socket.emit('updateInit', playerPack, thugPack, pickupPack, blockPack, miscPack); //Goes to a single player
	}
	
	Player.list[id] = self;

	logg("Player " + self.name + " has entered the game.");
	var teamName = self.team;
	if (pcMode == 2){
		if (self.team == "white"){
			teamName = "red";
		}
		else if (self.team == "black"){
			teamName = "blue";
		}
	}
	if (teamName != "none")
		sendChatToAll(self.name + " has joined the " + teamName + " team!");
		
	socket.emit('sendPlayerNameToClient',self.name);
	
	self.respawn();
	
	return self;
} //End Player function

Player.list = [];

function gunCycle(player, forwards){
	if (player.reloading > 0){
		player.reloading = 0;
		updatePlayerList.push({id:player.id,property:"reloading",value:player.reloading});				
	}
	
	if (forwards){
		if (player.weapon == 1){
			if (player.DPAmmo > 0 || player.DPClip > 0) {
				if (player.holdingBag == true && !allowBagWeapons) {
					updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sfx
				}
				else {
					player.weapon = 2;
					updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});						
				}
			}
			else if (player.MGAmmo > 0 || player.MGClip > 0){
				if (player.holdingBag == true && !allowBagWeapons) {
					updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sfx
				}
				else {
					player.weapon = 3;
					updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
				}
			}
			else if (player.SGAmmo > 0 || player.SGClip > 0){
				if (player.holdingBag == true && !allowBagWeapons) {
					updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sg equip sfx
				}
				else {
					player.weapon = 4;
					updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
				}
			}	
			else {
				player.weapon = 1;
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
			}		
		}
		else if (player.weapon == 2){
			if (player.MGAmmo > 0 || player.MGClip > 0){
				if (player.holdingBag == true && !allowBagWeapons) {
					updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sfx
				}
				else {
					player.weapon = 3;
					updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
				}
			}
			else if (player.SGAmmo > 0 || player.SGClip > 0){
				if (player.holdingBag == true && !allowBagWeapons) {
					updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sg equip sfx
				}
				else {
					player.weapon = 4;
					updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
				}
			}
			else {
				player.weapon = 1;
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
			}		
		}	
		else if (player.weapon == 3){
			if (player.SGAmmo > 0 || player.SGClip > 0){
				if (player.holdingBag == true && !allowBagWeapons) {
					updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sg equip sfx
				}
				else {
					player.weapon = 4;
					updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
				}
			}
			else {
				player.weapon = 1;
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
			}		
		}		
		else if (player.weapon == 4){
			player.weapon = 1;
			updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
		}		
		else {
			player.weapon = 1;
			updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
		}
	}//forwards
	else {
		if (player.weapon == 1){
			if (player.SGAmmo > 0 || player.SGClip > 0){
				if (player.holdingBag == true && !allowBagWeapons) {
					updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sg equip sfx
				}
				else {
					player.weapon = 4;
					updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
				}
			}
			else if (player.MGAmmo > 0 || player.MGClip > 0){
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
			else {
				player.weapon = 1;
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
			}		
		}
		else if (player.weapon == 4){
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
			else {
				player.weapon = 1;
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
			}		
		}	
		else if (player.weapon == 3){
			if (player.DPAmmo > 0 || player.DPClip > 0) {
				if (player.holdingBag == true && !allowBagWeapons) {
					updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sfx
				}
				else {
					player.weapon = 2;
					updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});						
				}
			}
			else {
				player.weapon = 1;
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
			}		
		}		
		else if (player.weapon == 2){
			player.weapon = 1;
			updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
		}		
		else {
			player.weapon = 1;
			updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
		}
	}
}

function gunSwap(player){
	if (player.reloading > 0){
		player.reloading = 0;
		updatePlayerList.push({id:player.id,property:"reloading",value:player.reloading});				
	}
	if (player.weapon == 1){
		if (player.SGAmmo > 0 || player.SGClip > 0){
			if (player.holdingBag == true && !allowBagWeapons) {
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sg equip sfx
			}
			else {
				player.weapon = 4;
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
			}
		}
		else if (player.MGAmmo > 0 || player.MGClip > 0){
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

Player.onConnect = function(socket, cognitoSub, name, team, partyId){
	var player = Player(socket.id, cognitoSub, name, team, partyId);
	gameEngine.ensureCorrectThugCount();

	socket.on('keyPress', function(data){
		Player.list[socket.id].afk = AfkFramesAllowed;
		if (player.health > 0 && player.team != "none"){
			var discharge = false;
			if(data.inputId === 87){player.pressingW = data.state;} //W
			else if(data.inputId === 68){player.pressingD = data.state;}
			else if(data.inputId === 83){player.pressingS = data.state;}
			else if(data.inputId === 65){player.pressingA = data.state;}
			
			else if(data.inputId === 38){ //Up
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
			else if(data.inputId === 39){ //Right
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
			else if(data.inputId === 40){ //Down
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
			else if(data.inputId === 37){ //Left
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
					if (player.cloakEngaged){
						player.cloakEngaged = false;						
						updatePlayerList.push({id:player.id,property:"cloakEngaged",value:player.cloakEngaged});	
					}
					player.boosting = boostAmount;
					updatePlayerList.push({id:player.id,property:"boosting",value:player.boosting});
					player.rechargeDelay = rechargeDelayTime;
					player.energy -= 25;
					if (player.energy <= 0){
						player.rechargeDelay = rechargeDelayTime * 2;
						player.energy = 0;
					}
					if (player.hasBattery > 1 && player.energy == 100)
					player.energy--; //To avoid having bar appear white when more than one battery
					updatePlayerList.push({id:player.id,property:"energy",value:player.energy});
					player.boostingDir = player.walkingDir;
					updateEffectList.push({type:3,playerId:player.id});
				}
				else if (player.holdingBag == true && player.walkingDir != 0){
					player.holdingBag = false;
					gunSwap(player);
					if (player.energy > 0){
						player.rechargeDelay = rechargeDelayTime;
						player.energy = 1;
						updatePlayerList.push({id:player.id,property:"energy",value:player.energy});
					}
					if (player.cloakEngaged){
						player.cloakEngaged = false;						
						updatePlayerList.push({id:player.id,property:"cloakEngaged",value:player.cloakEngaged});
					}
					updatePlayerList.push({id:player.id,property:"holdingBag",value:player.holdingBag});	
					if (player.team == "white"){
						bagBlue.captured = false;
						updateMisc.bagBlue = bagBlue;
						bagBlue.playerThrowing = player.id;
						bagBlue.speed = 25;
						bagBlue.direction = player.walkingDir;
					}
					else if (player.team == "black"){
						bagRed.captured = false;
						updateMisc.bagRed = bagRed;
						bagRed.playerThrowing = player.id;
						bagRed.speed = 25;
						bagRed.direction = player.walkingDir;
					}
				}
				else if ((!player.pressingW && !player.pressingD && !player.pressingS && !player.pressingA) && player.energy > 0){
					if (!player.cloakEngaged){
						player.cloakEngaged = true;
						SOCKET_LIST[player.id].emit('sfx', "sfxCloak");
					}
					else if (player.cloakEngaged){
						player.cloakEngaged = false;
					}
					updatePlayerList.push({id:player.id,property:"cloakEngaged",value:player.cloakEngaged});	
				}
				else {
					//no energy
				}
			}
			else if (data.inputId == 81){ //Q
				gunCycle(player, false);
			}
			else if (data.inputId == 69){ //E
				gunCycle(player, true);
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
			else if (data.inputId == 52){ //4
				
				if ((player.SGAmmo > 0 || player.SGClip > 0) && player.weapon != 4) {
					if (player.reloading > 0){
						player.reloading = 0;
						updatePlayerList.push({id:player.id,property:"reloading",value:player.reloading});				
					}
					if (player.holdingBag == true && !allowBagWeapons) {
						updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play pistol sfx
					}
					else {
						player.weapon = 4;
						updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});						
					}
				}
			}
			//TESTING KEY
			else if (data.inputId == 85){ //U (TESTING BUTTON) 
			
			/* hurt player
				player.health -= 10;
				player.healDelay = 300;
				updatePlayerList.push({id:player.id,property:"health",value:player.health});\
			*/				
			}

			if (discharge){
				player.aiming = 60;
				Discharge(player);				
			}
				
		}//End health > 0 check for allowing input		
	}); //End Socket on Keypress
	
	
	//ping
	socket.on('pingServer', function(socketId){
		socket.emit('pingResponse', socketId);
	});
	
	socket.on('purchase', function(data){
		if (data.selection == 1 && Player.list[data.playerId].cash >= shop.price1){
			Player.list[data.playerId].cash -= shop.price1;
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
		else if (data.selection == 2 && Player.list[data.playerId].cash >= shop.price2){
			Player.list[data.playerId].cash -= shop.price2;
			updatePlayerList.push({id:data.playerId,property:"cash",value:Player.list[data.playerId].cash});								
			Player.list[data.playerId].weapon = 4;
			updatePlayerList.push({id:data.playerId,property:"weapon",value:Player.list[data.playerId].weapon});								
			if (Player.list[data.playerId].SGClip <= 0 && Player.list[data.playerId].SGAmmo <= 0){
				Player.list[data.playerId].SGClip += 12;
				Player.list[data.playerId].SGAmmo += 24;
				updatePlayerList.push({id:data.playerId,property:"SGClip",value:Player.list[data.playerId].SGClip});								
				updatePlayerList.push({id:data.playerId,property:"SGAmmo",value:Player.list[data.playerId].SGAmmo});								
			}
			else {
				Player.list[data.playerId].SGAmmo += 36;
				updatePlayerList.push({id:data.playerId,property:"SGAmmo",value:Player.list[data.playerId].SGAmmo});								
			}
		}		
		else if (data.selection == 3 && Player.list[data.playerId].cash >= shop.price3){
			Player.list[data.playerId].cash -= shop.price3;
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
			Player.list[data.playerId].cash -= shop.price4;
			updatePlayerList.push({id:data.playerId,property:"cash",value:Player.list[data.playerId].cash});								
			Player.list[data.playerId].health += 75;
			if (Player.list[data.playerId].health > 175){
				Player.list[data.playerId].health = 175;
			}
			updatePlayerList.push({id:data.playerId,property:"health",value:Player.list[data.playerId].health});								
		}		
		else if (data.selection == 5 && Player.list[data.playerId].cash >= shop.price5 && Player.list[data.playerId].hasBattery < 5){
			Player.list[data.playerId].cash -= shop.price5;
			updatePlayerList.push({id:data.playerId,property:"cash",value:Player.list[data.playerId].cash});								
			Player.list[data.playerId].hasBattery += 1;
		}				
	});

	socket.on('voteEndgame', function(socketId, voteType, vote){
		console.log("GOT VOTE: " + socketId + " " + voteType + " " + vote);
		if (voteType == "gametype"){
			for (var i = 0; i < voteGametypeIds.length; i++){
				if (voteGametypeIds[i] == socketId){ //Player has already voted
					return;
				}				
			}			
			if (vote == "ctf"){
				ctfVotes++;
				voteGametypeIds.push(socketId);
			}
			else if (vote == "slayer"){
				slayerVotes++;
				voteGametypeIds.push(socketId);
			}
		}
		else if (voteType == "map"){
			for (var i = 0; i < voteMapIds.length; i++){
				if (voteMapIds[i] == socketId){ //Player has already voted
					return;
				}				
			}			
			if (vote == "thepit"){
				thePitVotes++;
				voteMapIds.push(socketId);
			}
			else if (vote == "longest"){
				longestVotes++;
				voteMapIds.push(socketId);
			}
			else if (vote == "crik"){
				crikVotes++;
				voteMapIds.push(socketId);
			}
		}	
	});

	socket.on('chat', function(data){
		if (getPlayerById(data[0])){
			for(var i in SOCKET_LIST){
				SOCKET_LIST[i].emit('addToChat',getPlayerById(data[0]).name + ': ' + data[1].substring(0,50), getPlayerById(data[0]).id);
				updateEffectList.push({type:7, playerId:data[0], text:data[1].substring(0,50)});
			}
		}
	});

	//Server commands
	socket.on('evalServer', function(data){
		//socket = socketBak;
		if (!getPlayerById(socket.id)){return;}

		if(!allowServerCommands){
			if (data == "stopcmd" || data == "servercmd" || data == "servercommands"){
				allowServerCommands = true;
			}			
			return;
		}
		
		
		logg("SERVER COMMAND:" + data);
		log(data.substring(4));
		if (data == "stopcmd" || data == "servercmd" || data == "servercommands"){
			allowServerCommands = false;
		}
		else if (data == "startt" || data == "restartt"){
			gameEngine.restartGame();
		}
		else if (data == "team1" || data == "teamsize1"){
			maxPlayers = 2;
		}
		else if (data == "team2" || data == "teamsize2"){
			maxPlayers = 4;
		}
		else if (data == "team3" || data == "teamsize3"){
			maxPlayers = 6;
		}
		else if (data == "team4" || data == "teamsize4"){
			maxPlayers = 8;
		}
		else if (data == "team5" || data == "teamsize5"){
			maxPlayers = 10;
		}
		else if (data == "team6" || data == "teamsize6"){
			maxPlayers = 12;
		}
		else if (data == "team7" || data == "teamsize7"){
			maxPlayers = 14;
		}
		else if (data == "team8" || data == "teamsize8"){
			maxPlayers = 16;
		}
		else if (data == "respawn3" || data == "spawn3"){
			respawnTimeLimit = 3 * 60;
		}
		else if (data == "respawn5" || data == "spawn5"){
			respawnTimeLimit = 5 * 60;
		}
		else if (data == "respawn7" || data == "spawn7"){
			respawnTimeLimit = 7 * 60;
		}
		else if (data == "respawn9" || data == "spawn9"){
			respawnTimeLimit = 9 * 60;
		}
		else if (data.substring(0,4) == "kick"){
			var playerList = getPlayerList();
			for (var p in playerList){
				if (playerList[p].name == data.substring(4)){
					var id = playerList[p].id;
					var name = playerList[p].name;
					playerDisconnect(id);
					delete SOCKET_LIST[id];
					socket.emit('addToChat', 'Kicked ' + name + ' from game.');
					break;
				}
			}
		}
		else if (data == "speed6" || data == "run6"){
			globalSpeed = 6;
			maxSpeed = 6;
			speedMin = 6;
		}
		else if (data == "speed7" || data == "run7"){
			globalSpeed = 7;
			maxSpeed = 7;
			speedMin = 7;
		}
		else if (data == "speed8" || data == "run8"){
			globalSpeed = 8;
			maxSpeed = 8;
			speedMin = 8;
		}
		else if (data == "speed9" || data == "run9"){
			globalSpeed = 9;
			maxSpeed = 9;
			speedMin = 9;
		}
		else if (data == "speed10" || data == "run10"){
			globalSpeed = 10;
			maxSpeed = 10;
			speedMin = 10;
		}
		else if (data == "pc" || data == "pcmode"){
			if (pcMode == 2){
				pcMode = 1;
			}
			else {
				pcMode = 2;
			}		
			updateMisc.pcMode = pcMode;
		}
		else if (data == "dam1" || data == "damage1"){
			damageScale = 1;
		}
		else if (data == "dam.9" || data == "damage.9"){
			damageScale = 0.9;
		}
		else if (data == "dam.8" || data == "damage.8"){
			damageScale = 0.8;
		}
		else if (data == "dam.7" || data == "damage.7"){
			damageScale = 0.7;
		}
		else if (data == "dam.6" || data == "damage.6"){
			damageScale = 0.6;
		}
		else if (data == "dam.5" || data == "damage.5"){
			damageScale = 0.5;
		}
		//gametypes
		else if (data == "slayert" || data == "deathmatcht"){
			gametype = "slayer";
			gameEngine.restartGame();
		}
		else if (data == "slayer1"){
			gametype = "slayer";
			gameMinutesLength = 0;
			gameSecondsLength = 0;
			scoreToWin = 25;			
			gameEngine.restartGame();
		}
		else if (data == "slayer2"){
			gametype = "slayer";
			gameMinutesLength = 9;
			gameSecondsLength = 59;
			scoreToWin = 50;			
			gameEngine.restartGame();
		}
		else if (data == "ctf1"){
			gametype = "ctf";
			gameMinutesLength = 5;
			gameSecondsLength = 0;
			scoreToWin = 0;			
			gameEngine.restartGame();
		}
		else if (data == "ctf2"){
			gametype = "ctf";
			gameMinutesLength = 10;
			gameSecondsLength = 0;
			scoreToWin = 3;			
			gameEngine.restartGame();
		}
		else if (data == "ctft"){
			gametype = "ctf";
			gameEngine.restartGame();
		}
		else if (data == "timet" || data == "timelimit" || data == "notime"){
			if (gameMinutesLength == 0 && gameSecondsLength == 0){
				gameMinutesLength = 5;
				gameSecondsLength = 0;
			}
			else {
				gameMinutesLength = 0;
				gameSecondsLength = 0;
			}
			gameEngine.restartGame();
		}
		else if (data == "time1"){
			gameMinutesLength = 1;
			gameSecondsLength = 0;
			gameEngine.restartGame();
		}
		else if (data == "time3"){
			gameMinutesLength = 3;
			gameSecondsLength = 0;
			gameEngine.restartGame();
		}
		else if (data == "time5" || data ==  "5min"){
			gameMinutesLength = 5;
			gameSecondsLength = 0;
			gameEngine.restartGame();
		}
		else if (data == "time7"){
			gameMinutesLength = 7;
			gameSecondsLength = 0;
			gameEngine.restartGame();
		}
		else if (data == "time10"){
			gameMinutesLength = 10;
			gameSecondsLength = 0;
			gameEngine.restartGame();
		}
		else if (data == "score0" || data == "to0" || data == "noscore"){
			scoreToWin = 0;
			gameEngine.restartGame();
		}
		else if (data == "score1" || data == "to1"){
			scoreToWin = 1;
			gameEngine.restartGame();
		}
		else if (data == "score3" || data == "to3"){
			scoreToWin = 3;
			gameEngine.restartGame();
		}
		else if (data == "score5" || data == "to5"){
			scoreToWin = 5;
			gameEngine.restartGame();
		}
		else if (data == "score7" || data == "to7"){
			scoreToWin = 7;
			gameEngine.restartGame();
		}
		else if (data == "score10" || data == "to10"){
			scoreToWin = 10;
			gameEngine.restartGame();
		}
		else if (data == "score15" || data == "to15"){
			scoreToWin = 15;
			gameEngine.restartGame();
		}
		else if (data == "score20" || data == "to20"){
			scoreToWin = 20;
			gameEngine.restartGame();
		}
		else if (data == "score25" || data == "to25"){
			scoreToWin = 25;
			gameEngine.restartGame();
		}
		else if (data == "score30" || data == "to30"){
			scoreToWin = 30;
			gameEngine.restartGame();
		}
		else if (data == "score50" || data == "to50"){
			scoreToWin = 50;
			gameEngine.restartGame();
		}
		else if (data == "score75" || data == "to75"){
			scoreToWin = 75;
			gameEngine.restartGame();
		}
		else if (data == "score100" || data == "to100"){
			scoreToWin = 100;
			gameEngine.restartGame();
		}
		
		//maps
		else if (data == "longest"){
			map = "longest";
			gameEngine.restartGame();
		}
		else if (data == "thepit" || data == "pit" || data == "the pit"){
			map = "thepit";
			gameEngine.restartGame();
		}
		else if (data == "crik" || data == "creek"){
			map = "crik";
			gameEngine.restartGame();
		}
		else if (data == "map2"){
			map = "map2";
			gameEngine.restartGame();
		}
		else if (data == "stats" || data == "stat"){
			dataAccess.dbFindAwait("RW_USER", {cognitoSub:getPlayerById(socket.id).cognitoSub}, async function(err, res){
				if (res && res[0]){
					socket.emit('addToChat', 'Cash Earned:' + res[0].experience + ' Kills:' + res[0].kills + ' Deaths:' + res[0].deaths + ' Benedicts:' + res[0].benedicts + ' Captures:' + res[0].captures + ' Steals:' + res[0].steals + ' Returns:' + res[0].returns + ' Games Played:' + res[0].gamesPlayed + ' Wins:' + res[0].gamesWon + ' Losses:' + res[0].gamesLost + ' TPM Rating:' + res[0].rating);	
				}
				else {
					socket.emit('addToChat', 'ERROR looking you up in database.');
				}
			});
		}
		else if (data == "thugs"){		
			if (spawnOpposingThug){
				logg("Server command: Thugs Disabled");
				socket.emit('addToChat', "Server command: Thugs Disabled");
				spawnOpposingThug = false;
			}
			else {
				logg("Server command: Thugs Enabled");
				socket.emit('addToChat', "Server command: Thugs Enabled");
				spawnOpposingThug = true;
			}
			gameEngine.ensureCorrectThugCount();
		}
		else if (data == "shop"){		
			if (shopEnabled){
				logg("Server command: Shop Disabled");
				socket.emit('addToChat', "Server command: Shop Disabled");
				shopEnabled = false;
			}
			else {
				logg("Server command: Shop Enabled");
				socket.emit('addToChat', "Server command: Shop Enabled");
				shopEnabled = true;
			}
		}
		else if (data == "sThugWhite"){		
			logg("Server command: Spawn Thug (White)");
			var coords = gameEngine.getSafeCoordinates("white");
			thug.createThug(Math.random(), "white", coords.x, coords.y);
			socket.emit('addToChat', 'White thug spawned.');	
		}
		else if (data == "sThugBlack"){
			logg("Server command: Spawn Thug (Black)");
			var coords = gameEngine.getSafeCoordinates("black");
			thug.createThug(Math.random(), "black", coords.x, coords.y);
			socket.emit('addToChat', 'Black thug spawned.');	
		}
		else if (data == "5sec"){
			minutesLeft = 0;
			secondsLeft = 5;
		}
		else if (data == "1min"){
			minutesLeft = 1;
			secondsLeft = 0;
		}
		else if (data == "30sec"){
			minutesLeft = 0;
			secondsLeft = 30;
		}
		else if (data == "1min1sec"){
			minutesLeft = 1;
			secondsLeft = 1;
		}
		else if (data == "1min3sec"){
			minutesLeft = 1;
			secondsLeft = 3;
		}				
		else if (data == "team" || data == "teams" || data == "change" || data == "switch" || data == "changeTeams" || data == "changeTeam"){
			gameEngine.changeTeams(socket.id);
		}
		else if (data == "capturet" || data == "scoret"){
			if (getPlayerById(socket.id).team == "white"){
				gameEngine.capture("white");
			}
			else if (getPlayerById(socket.id).team == "black"){
				gameEngine.capture("black");
			}
		}
		else if (data == "kill" || data == "die"){
			getPlayerById(socket.id).health = 0
			updatePlayerList.push({id:getPlayerById(socket.id).id,property:"health",value:getPlayerById(socket.id).health})
			getPlayerById(socket.id).kill({id:0, shootingDir:1});
		}
		else if (data == "end"){
			minutesLeft = 0;
			secondsLeft = 0;
		}
		else if (data == "pause"){
			if (pause == true)
				pause = false;
			else if (pause == false)
				pause = true;
		}
		else if (data == "wint"){
			whiteScore = 0;
			blackScore = 0;
			gameOver = false;

			for (var i in SOCKET_LIST){
				var sock = SOCKET_LIST[i];	
				gameEngine.sendCapturesToClient(sock);
			}
			gameEngine.restartGame();

			if (getPlayerById(socket.id) && getPlayerById(socket.id).team == "white"){
				if (gametype == "ctf"){
					gameEngine.capture("white");
				}
				else if (gametype == "slayer"){
					whiteScore += 100;
				}
			}
			else if (getPlayerById(socket.id) && getPlayerById(socket.id).team == "black"){
				if (gametype == "ctf"){
					gameEngine.capture("black");
				}
				else if (gametype == "slayer"){
					blackScore += 100;
				}
			}
			minutesLeft = 0;
			secondsLeft = 0;
			
		}
		else if (data == "loset"){
			whiteScore = 0;
			blackScore = 0;
			gameOver = false;

			for (var i in SOCKET_LIST){
				var sock = SOCKET_LIST[i];	
				gameEngine.sendCapturesToClient(sock);
			}
			gameEngine.restartGame();

			if (getPlayerById(socket.id) && getPlayerById(socket.id).team == "white"){
				if (gametype == "ctf")
					gameEngine.capture("black");
			}
			else if (getPlayerById(socket.id) && getPlayerById(socket.id).team == "black"){
				if (gametype == "ctf")
					gameEngine.capture("white");
			}
			minutesLeft = 0;
			secondsLeft = 0;
		}
		else if (data == "crasht"){
			crash();
		}
		else if (data == "godt" || data == "haxt"){
			getPlayerById(socket.id).SGClip = 99;
			getPlayerById(socket.id).MGClip = 999;
			getPlayerById(socket.id).DPClip = 99;
			getPlayerById(socket.id).health = 99;
			getPlayerById(socket.id).hasBattery = 2;
			updatePlayerList.push({id:socket.id,property:"hasBattery",value:getPlayerById(socket.id).hasBattery});
			updatePlayerList.push({id:socket.id,property:"health",value:getPlayerById(socket.id).health});
			updatePlayerList.push({id:socket.id,property:"weapon",value:getPlayerById(socket.id).weapon});
			updatePlayerList.push({id:socket.id,property:"DPClip",value:getPlayerById(socket.id).DPClip});
			updatePlayerList.push({id:socket.id,property:"MGClip",value:getPlayerById(socket.id).MGClip});
			updatePlayerList.push({id:socket.id,property:"SGClip",value:getPlayerById(socket.id).SGClip});
			socket.emit('addToChat', 'INITIATE HAX');
		}

		else {
			try {
				var res = eval(data);
			}
			catch(e) {
				socket.emit('addToChat', 'Invalid Command.');
				res = "invalid command";
			}
			finally {
				socket.emit('evalAnswer', res);
			}
		}
		
	});	

	
}//End Player.onConnect

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
	else if ((Player.list[playerId].weapon == 4 && Player.list[playerId].SGClip <= 0 && Player.list[playerId].SGAmmo <= 0)){
			Player.list[playerId].weapon = 1;
			updatePlayerList.push({id:playerId,property:"weapon",value:Player.list[playerId].weapon});		
			return;
	}
	if (Player.list[playerId].weapon == 1 && Player.list[playerId].PClip >= 15){return;}
	else if ((Player.list[playerId].weapon == 3 && Player.list[playerId].MGClip >= MGClipSize) || (Player.list[playerId].weapon == 3 && Player.list[playerId].MGAmmo <= 0)){return;}
	else if ((Player.list[playerId].weapon == 2 && Player.list[playerId].DPClip >= DPClipSize) || (Player.list[playerId].weapon == 2 && Player.list[playerId].DPAmmo <= 0)){return;}
	else if ((Player.list[playerId].weapon == 4 && Player.list[playerId].SGClip >= SGClipSize) || (Player.list[playerId].weapon == 4 && Player.list[playerId].SGAmmo <= 0)){return;}
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
		else if (Player.list[playerId].weapon == 4){
			if (Player.list[playerId].fireRate > 0){
				Player.list[playerId].bufferReload = true;
			}
			else {
				Player.list[playerId].reloading = 30;
				updatePlayerList.push({id:playerId,property:"reloading",value:Player.list[playerId].reloading});
			}
		}					
	}	
}

function Discharge(player){
	if (player.reloading > 0 && player.weapon != 4){return;}	
	else if (player.weapon == 1 && player.PClip <= 0){
		reload(player.id);
		player.fireRate = pistolFireRate;
		return;
	}
	else if (player.weapon == 2 && player.DPClip <= 0){
		reload(player.id);
		player.fireRate = DPFireRate;
		return;
	}
	else if (player.weapon == 3 && player.MGClip <= 0){
		reload(player.id);
		player.fireRate = MGFireRate;
		return;
	}
	else if (player.weapon == 4 && player.SGClip <= 0){
		reload(player.id);
		player.fireRate = SGFireRate;
		return;
	}
	if (player.triggerTapLimitTimer > 0 && player.firing <= 0){ //Don't let SG fire if TapLimiter is active AND not actively firing 
		return;
	}	
	
	if (player.weapon == 4){ //update sgpushspeed wheather or not already firing
		var pushDirection = player.shootingDir - 4; if (pushDirection <= 0){ pushDirection += 8; }		
		player.pushDir = pushDirection;
		player.pushSpeed = SGPushSpeed;
	}
	
	//ACTUAL DISCHARGES
	if (player.cloakEngaged){
		player.cloakEngaged = false;
		updatePlayerList.push({id:player.id,property:"cloakEngaged",value:player.cloakEngaged});
	}
	if(player.weapon == 1 && player.firing <= 0){
		player.PClip--;
		updatePlayerList.push({id:player.id,property:"PClip",value:player.PClip});
		player.fireRate = pistolFireRate;
		if (pistolFireRateLimiter){
			player.triggerTapLimitTimer = pistolFireRate;
		}
	}
	else if(player.weapon == 2 && player.firing <= 0){
		player.DPClip--;
		updatePlayerList.push({id:player.id,property:"DPClip",value:player.DPClip});
		player.fireRate = DPFireRate;
		if (pistolFireRateLimiter){
			player.triggerTapLimitTimer = DPFireRate;
		}
	}
	else if(player.weapon == 3 && player.firing <= 0){
		player.MGClip--;
		updatePlayerList.push({id:player.id,property:"MGClip",value:player.MGClip});
		player.fireRate = MGFireRate;
	}
	else if(player.weapon == 4 && player.firing <= 0){
		player.SGClip--;
		player.reloading = 0;
		updatePlayerList.push({id:player.id,property:"SGClip",value:player.SGClip});
		
		player.fireRate = SGFireRate;
		player.triggerTapLimitTimer = SGFireRate;
	}
	
	player.firing = 3; 
	player.liveShot = true;
}

Player.onDisconnect = function(socket){
	if (Player.list[socket.id]){
		logg(Player.list[socket.id].name + " disconnected.");
		if (Player.list[socket.id].holdingBag == true){
			if (Player.list[socket.id].team == "white"){
				bagBlue.captured = false;
				updateMisc.bagBlue = bagBlue;
			}
			else if (Player.list[socket.id].team == "black"){
				bagRed.captured = false;
				updateMisc.bagRed = bagRed;
			}
		}
		sendChatToAll(Player.list[socket.id].name + " has disconnected.");
	}
	delete Player.list[socket.id];
	for(var i in SOCKET_LIST){
		SOCKET_LIST[i].emit('removePlayer', socket.id);
	}	
	gameEngine.ensureCorrectThugCount();
	gameEngine.assignSpectatorsToTeam(false);
	dataAccessFunctions.dbGameServerUpdate();
}

function getPlayerFromCognitoSub(searchingCognitoSub){
	for (var p in Player.list){
		if (Player.list[p].cognitoSub == searchingCognitoSub){
			return Player.list[p].id;
		}
	}
	return null;
}

//eventTrigger Database push update db
function playerEvent(playerId, event){
	if (!gameOver && Player.list[playerId]){
		if (event == "hit"){
			Player.list[playerId].cash += hitCash;
			Player.list[playerId].cashEarnedThisGame += hitCash;
			updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
			updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
		}
		else if (event == "kill"){
			Player.list[playerId].kills++;			
			Player.list[playerId].cash+=killCash;
			Player.list[playerId].cashEarnedThisGame+=killCash;
			updatePlayerList.push({id:playerId,property:"kills",value:Player.list[playerId].kills});
			updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
			updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
			updateNotificationList.push({text:"+$" + killCash + " - Enemy Killed",playerId:playerId});
		}
		else if (event == "multikill"){
			if (Player.list[playerId].multikill == 2){
				Player.list[playerId].cash+=doubleKillCash;
				Player.list[playerId].cashEarnedThisGame+=doubleKillCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"**DOUBLE KILL!!**",playerId:playerId});				
			}
			else if (Player.list[playerId].multikill == 3){
				Player.list[playerId].cash+=tripleKillCash;
				Player.list[playerId].cashEarnedThisGame+=tripleKillCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"**TRIPLE KILL!!!**",playerId:playerId});				
			}
			else if (Player.list[playerId].multikill >= 4){
				Player.list[playerId].cash+=quadKillCash;
				Player.list[playerId].cashEarnedThisGame+=quadKillCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"**OVERKILL!!!!**",playerId:playerId});				
			}
		}
		else if (event == "spree"){
			if (Player.list[playerId].spree == 5){
				Player.list[playerId].cash+=spreeCash;
				Player.list[playerId].cashEarnedThisGame+=spreeCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"**KILLING SPREE!!**",playerId:playerId});				
			}		
			else if (Player.list[playerId].spree == 10){
				Player.list[playerId].cash+=frenzyCash;
				Player.list[playerId].cashEarnedThisGame+=frenzyCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"**GENOCIDE!!**",playerId:playerId});				
			}		
			else if (Player.list[playerId].spree == 15){
				Player.list[playerId].cash+=rampageCash;
				Player.list[playerId].cashEarnedThisGame+=rampageCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"**EXTERMINATION!!**",playerId:playerId});				
			}		
			else if (Player.list[playerId].spree == 20){
				Player.list[playerId].cash+=unbelievableCash;
				Player.list[playerId].cashEarnedThisGame+=unbelievableCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"**NEXT HITLER!!**",playerId:playerId});				
			}		
		}
		else if (event == "killThug"){
			Player.list[playerId].cash+=thugCash;
			Player.list[playerId].cashEarnedThisGame+=thugCash;
			updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
			updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
			updateNotificationList.push({text:"+$" + thugCash + " - Thug Killed",playerId:playerId});
		}
		else if (event == "death"){
			Player.list[playerId].deaths++;
			if (Player.list[playerId]){
				updatePlayerList.push({id:playerId,property:"deaths",value:Player.list[playerId].deaths});
			}
		}
		else if (event == "benedict"){
			updateNotificationList.push({text:"Benedict!",playerId:playerId});
			dataAccessFunctions.dbUserUpdate("inc", Player.list[playerId].cognitoSub, {benedicts: 1});
		}
		else if (event == "steal"){
			Player.list[playerId].steals++;
			Player.list[playerId].cash += stealCash;
			Player.list[playerId].cashEarnedThisGame += stealCash;
			updatePlayerList.push({id:playerId,property:"steals",value:Player.list[playerId].steals});
			updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
			updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
			updateNotificationList.push({text:"+$" + stealCash + " - Bag Stolen",playerId:playerId});
		}
		else if (event == "return"){
			Player.list[playerId].returns++;
			Player.list[playerId].cash+=returnCash;
			Player.list[playerId].cashEarnedThisGame+=returnCash;
			updatePlayerList.push({id:playerId,property:"returns",value:Player.list[playerId].returns});
			updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
			updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
			updateNotificationList.push({text:"+$" + returnCash + " - Bag Returned",playerId:playerId});
		}
		else if (event == "capture"){
			Player.list[playerId].holdingBag = false;
			updatePlayerList.push({id:playerId,property:"holdingBag",value:false});
			Player.list[playerId].captures++;
			Player.list[playerId].cash+=captureCash;
			Player.list[playerId].cashEarnedThisGame+=captureCash;
			updatePlayerList.push({id:playerId,property:"captures",value:Player.list[playerId].captures});
			updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
			updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
			if (!gameOver){
				updateNotificationList.push({text:"+$" + captureCash + " - BAG CAPTURED!!",playerId:playerId});
			}
		}
	}
}

var joinGame = function(cognitoSub, username, team, partyId){
	var socket = SOCKET_LIST[getSocketIdFromCognitoSub(cognitoSub)];
	socket.team = team;
	socket.partyId = partyId;
	var players = gameEngine.getNumPlayersInGame();
	if (players >= maxPlayers){ //Another redundant maxplayers check couldn't hurt, right?
		socket.emit('signInResponse',{success:false,message:"SERVER FULL. Try again later, or try a different server."});								
	}
	else {
		log("!!!!Player signing into game server - socketID: " + socket.id + " cognitoSub: " + cognitoSub + " username: " + username + " team: " + team + " partyId: " + partyId);
		Player.onConnect(socket, cognitoSub, username, team, partyId);
		dataAccessFunctions.dbGameServerUpdate();
		socket.emit('signInResponse',{success:true,id:socket.id, mapWidth:mapWidth, mapHeight:mapHeight, whiteScore:whiteScore, blackScore:blackScore});
	}	
}

var getPlayerList = function(){
	return Player.list;
}

var getPlayerById = function(id){
    return Player.list[id];
}

var playerDisconnect = function(id){
    if (Player.list[id])
        Player.onDisconnect(SOCKET_LIST[id]);
}

function sendChatToAll(text){
	for(var i in SOCKET_LIST){
		SOCKET_LIST[i].emit('addMessageToChat',text);
	}
}
function runPlayerEngines(){
	for (var i in Player.list){
		if (Player.list[i].team != "none")
		Player.list[i].engine();
	}		
	
}

var isSafeCoords = function(potentialX, potentialY, team){
	for (var i in Player.list){
		if (Player.list[i].team != team && Player.list[i].health > 0 && potentialX >= Player.list[i].x - threatSpawnRange && potentialX <= Player.list[i].x + threatSpawnRange && potentialY >= Player.list[i].y - threatSpawnRange && potentialY <= Player.list[i].y + threatSpawnRange){																		
			return false;
		}
	}
	return true;
}

module.exports.getPlayerList = getPlayerList;
module.exports.playerDisconnect = playerDisconnect; //onDisconnect
module.exports.getPlayerById = getPlayerById;
module.exports.joinGame = joinGame;
module.exports.runPlayerEngines = runPlayerEngines;
module.exports.isSafeCoords = isSafeCoords;
