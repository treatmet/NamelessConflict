var gameEngine = require(absAppDir + '/app_code/engines/gameEngine.js');
var Thug = require(absAppDir + '/app_code/entities/thug.js');
var Block = require(absAppDir + '/app_code/entities/block.js');
var Pickup = require(absAppDir + '/app_code/entities/pickup.js');
var entityHelpers = require(absAppDir + '/app_code/entities/_entityHelpers.js');
var dataAccessFunctions = require(absAppDir + '/app_code/data_access/dataAccessFunctions.js');

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
				for (var i in Thug.list){
					var isHitTarget = entityHelpers.checkIfInLineOfShot(self, Thug.list[i]);
					if (isHitTarget && isHitTarget != false){
						hitTargets.push(isHitTarget);
						organicHitTargets.push(isHitTarget);
					}	
				}					
				for (var i in Block.list){
					if (Block.list[i].type == "normal" || Block.list[i].type == "red" || Block.list[i].type == "blue"){
						var isHitTarget = entityHelpers.checkIfInLineOfShot(self, Block.list[i]);
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
		for (var i in Thug.list){
			if (Thug.list[i].id != self.id && Thug.list[i].health > 0 && self.x + self.width > Thug.list[i].x && self.x < Thug.list[i].x + Thug.list[i].width && self.y + self.height > Thug.list[i].y && self.y < Thug.list[i].y + Thug.list[i].height){								
				if (self.x == Thug.list[i].x && self.y == Thug.list[i].y){self.x -= 5; updateThugList.push({id:self.id,property:"x",value:self.x});} //Added to avoid math issues when entities are directly on top of each other (distance = 0)
				var dx1 = self.x - Thug.list[i].x;
				var dy1 = self.y - Thug.list[i].y;
				var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
				var ax1 = dx1/dist1;
				var ay1 = dy1/dist1;
				if (dist1 < 40){		

					if (self.boosting > 0){ //melee boost collision bash
						self.pushSpeed = 20;
						self.boosting = -1;
						updatePlayerList.push({id:self.id,property:"boosting",value:self.boosting});
						
						if (self.team != Thug.list[i].team){
							Thug.list[i].health -= boostDamage;
							updateThugList.push({id:Thug.list[i].id,property:"health",value:Thug.list[i].health})
							entityHelpers.sprayBloodOntoTarget(self.boostingDir, Thug.list[i].x, Thug.list[i].y, Thug.list[i].id);
							Thug.list[i].attacking = thugAttackDelay;
							if (Thug.list[i].health <= 0){
								Thug.list[i].kill(self);
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
		for (var i in Block.list){
			if (self.x > Block.list[i].x && self.x < Block.list[i].x + Block.list[i].width && self.y > Block.list[i].y && self.y < Block.list[i].y + Block.list[i].height){												
				if (Block.list[i].type == "normal" || Block.list[i].type == "red" || Block.list[i].type == "blue"){
					var overlapTop = Math.abs(Block.list[i].y - self.y);  
					var overlapBottom = Math.abs((Block.list[i].y + Block.list[i].height) - self.y);
					var overlapLeft = Math.abs(self.x - Block.list[i].x);
					var overlapRight = Math.abs((Block.list[i].x + Block.list[i].width) - self.x);			
					if (overlapTop <= overlapBottom && overlapTop <= overlapRight && overlapTop <= overlapLeft){	
						self.y = Block.list[i].y - 1;
						updatePlayerList.push({id:self.id,property:"y",value:self.y});
					}
					else if (overlapBottom <= overlapTop && overlapBottom <= overlapRight && overlapBottom <= overlapLeft){
						self.y = Block.list[i].y + Block.list[i].height + 1;
						updatePlayerList.push({id:self.id,property:"y",value:self.y});
					}
					else if (overlapLeft <= overlapTop && overlapLeft <= overlapRight && overlapLeft <= overlapBottom){
						self.x = Block.list[i].x - 1;
						updatePlayerList.push({id:self.id,property:"x",value:self.x});
					}
					else if (overlapRight <= overlapTop && overlapRight <= overlapLeft && overlapRight <= overlapBottom){
						self.x = Block.list[i].x + Block.list[i].width + 1;
						updatePlayerList.push({id:self.id,property:"x",value:self.x});
					}
				}
				else if (Block.list[i].type == "pushUp"){
					self.y -= pushStrength;
					if (self.y < Block.list[i].y){self.y = Block.list[i].y;}
					updatePlayerList.push({id:self.id,property:"y",value:self.y});
				}
				else if (Block.list[i].type == "pushRight"){
					self.x += pushStrength;
					if (self.x > Block.list[i].x + Block.list[i].width){self.x = Block.list[i].x + Block.list[i].width;}
					updatePlayerList.push({id:self.id,property:"x",value:self.x});
				}
				else if (Block.list[i].type == "pushDown"){
					self.y += pushStrength;
					if (self.y > Block.list[i].y + Block.list[i].height){self.y = Block.list[i].y + Block.list[i].height;}
					updatePlayerList.push({id:self.id,property:"y",value:self.y});
				}
				else if (Block.list[i].type == "pushLeft"){
					self.x -= pushStrength;
					if (self.x < Block.list[i].x){self.x = Block.list[i].x;}
					updatePlayerList.push({id:self.id,property:"x",value:self.x});
				}
				else if (Block.list[i].type == "warp1"){
					self.x = warp1X;
					updatePlayerList.push({id:self.id,property:"x",value:self.x});
					self.y = warp1Y;
					updatePlayerList.push({id:self.id,property:"y",value:self.y});
					SOCKET_LIST[self.id].emit('sfx', "sfxWarp");
				}
				else if (Block.list[i].type == "warp2"){
					self.x = warp2X;
					updatePlayerList.push({id:self.id,property:"x",value:self.x});
					self.y = warp2Y;
					updatePlayerList.push({id:self.id,property:"y",value:self.y});
					SOCKET_LIST[self.id].emit('sfx', "sfxWarp");
				}

			}// End check if player is overlapping block
		}//End Block.list loop		
		
		//Pickup updates
		for (var i in Pickup.list){
			if (self.health > 0 && self.x > Pickup.list[i].x - 30 && self.x < Pickup.list[i].x + Pickup.list[i].width + 30 && self.y > Pickup.list[i].y - 30 && self.y < Pickup.list[i].y + Pickup.list[i].height + 30 && Pickup.list[i].respawnTimer == 0){
				Pickup.pickupPickup(self.id, Pickup.list[i].id);
			}
		}			
		
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
			Pickup(dpId, self.x - 40, self.y - 35, 2, ammoAmount, -1);
			self.DPAmmo = 0;
			self.DPClip = 0;
			updatePlayerList.push({id:self.id,property:"DPAmmo",value:self.DPAmmo});		
			updatePlayerList.push({id:self.id,property:"DPClip",value:self.DPClip});		
		}
		if (self.MGAmmo > 0 || self.MGClip > 0){
			drops++;
			var ammoAmount = self.MGClip + self.MGAmmo;
			var mgId = Math.random();
			Pickup(mgId, self.x - 25 + (drops * 8), self.y - 10, 3, ammoAmount, -1);
			self.MGAmmo = 0;
			self.MGClip = 0;
			updatePlayerList.push({id:self.id,property:"MGAmmo",value:self.MGAmmo});		
			updatePlayerList.push({id:self.id,property:"MGClip",value:self.MGClip});		
		}
		if (self.SGAmmo > 0 || self.SGClip > 0){
			drops++;
			var ammoAmount = self.SGClip + self.SGAmmo;
			var sgId = Math.random();
			Pickup(sgId, self.x - 30, self.y - 20 + (drops * 10), 4, ammoAmount, -1);
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
		for (var b in Thug.list){
			var thug = {
				id:Thug.list[b].id,
				x:Thug.list[b].x,
				y:Thug.list[b].y,
				health:Thug.list[b].health,
				team:Thug.list[b].team,
				rotation:Thug.list[b].rotation,
			};
			thugPack.push(thug);
		}
		for (var b in Block.list){
			blockPack.push(Block.list[b]);
		}
		for (var p in Pickup.list){
			var pickup = {
				id:Pickup.list[p].id,
				x:Pickup.list[p].x,
				y:Pickup.list[p].y,
				type:Pickup.list[p].type,
				amount:Pickup.list[p].amount,
				respawnTimer:Pickup.list[p].respawnTimer,
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
		socket.emit('updateInit', playerPack, thugPack, pickupPack, blockPack, miscPack); //Goes to a single player //!!!! Questionable. This might overload stack
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

var playerDisconnect = function(id){
    if (Player.list[id])
        Player.onDisconnect(SOCKET_LIST[id]);
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



function sendChatToAll(text){
	for(var i in SOCKET_LIST){
		SOCKET_LIST[i].emit('addMessageToChat',text);
	}
}

module.exports.getPlayerList = getPlayerList;
module.exports.playerDisconnect = playerDisconnect; //onDisconnect
module.exports.getPlayerById = getPlayerById;
module.exports.joinGame = joinGame;
