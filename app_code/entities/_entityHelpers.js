var gameEngine = require(absAppDir + '/app_code/engines/gameEngine.js');
var Thug = require(absAppDir + '/app_code/entities/thug.js');

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

var checkIfInLineOfShot = function(shooter, target){
	var distFromDiag = 0;
	//&& target.team != shooter.team //Take off friendly fire
	
	if (shooter.weapon == 1 || shooter.weapon == 2 || shooter.weapon == 3){
		if (target.team){
			if (target.id != shooter.id && target.health > 0){
				if (shooter.shootingDir == 1){
					if (target.x > shooter.x - 31 && target.x < shooter.x + 31 && target.y < shooter.y){
						return {target:target,dist:(shooter.y - target.y),distFromDiag:distFromDiag};
					}
				}
				else if (shooter.shootingDir == 2){
					distFromDiag = -shooter.x + target.x - shooter.y + target.y; //forwardslash diag. Negative means target's x is left of shooter's diag.
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
					distFromDiag = -shooter.x + target.x + shooter.y - target.y; //backslash diag. Negative means target's x is left of shooter's diag.
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
					distFromDiag = -shooter.x + target.x - shooter.y + target.y;
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
					distFromDiag = -shooter.x + target.x + shooter.y - target.y;
					if (Math.abs(distFromDiag) < 44 && target.y < shooter.y){
						return {target:target,dist:(shooter.x - target.x),distFromDiag:distFromDiag};
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
				if (target.x + target.width > shooter.x && target.x < shooter.x && target.y < shooter.y){
					return {target:target,dist:(shooter.y - (target.y + target.height)) + 5,distFromDiag:distFromDiag};
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
					return {target:target,dist:dist + 15,distFromDiag:distFromDiag};
				}
			}
			else if (shooter.shootingDir == 3){
				if (target.y + target.height > shooter.y && target.y < shooter.y && target.x + target.width > shooter.x){
					return {target:target,dist:(target.x - shooter.x) + 5,distFromDiag:distFromDiag};
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
					return {target:target,dist:dist + 15,distFromDiag:distFromDiag};
				}
			}
			else if (shooter.shootingDir == 5){
				if (target.x + target.width > shooter.x && target.x < shooter.x && target.y + target.height > shooter.y){
					return {target:target,dist:(target.y - shooter.y) + 5,distFromDiag:distFromDiag};
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
					return {target:target,dist:dist + 15,distFromDiag:distFromDiag};
				}
			}
			else if (shooter.shootingDir == 7){
				if (target.y + target.height > shooter.y && target.y < shooter.y && target.x < shooter.x){
					return {target:target,dist:(shooter.x - (target.x + target.width)) + 5,distFromDiag:distFromDiag};
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
					return {target:target,dist:dist + 15,distFromDiag:distFromDiag};
				}
			}
		} //End Block detection Else statement
	} //End if weapon == 1,2,3
	
	//Shotgun hit detection
	else if (shooter.weapon == 4){
		if (target.team && target.health){
			if (getDistance(target, shooter) < SGRange && target.id != shooter.id && target.health > 0){
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
	var closest = bulletRange;
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

//hit //gethit //get hit
var hit = function(target, shootingDir, distance, shooterId){	
		//log("hit function " + target.id);
		
		if (Player.list[shooterId].weapon != 4){
			var shotData = {};
			shotData.id = shooterId;
			shotData.spark = false;
			shotData.shootingDir = shootingDir;
			if (!target.team){shotData.spark = true;}
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
		
		if (target.team && target.health){			
			if (target.team != Player.list[shooterId].team){
				target.lastEnemyToHit = shooterId; //For betrayal/Suicide detection
			}
			
			var damageInflicted = 0;
			
			//Player stagger and cloak interruption stuff
			if (Player.list[target.id]){
				target.stagger = staggerTime;		
				target.healDelay += healDelayTime;
				if (target.healDelay > healDelayTime){target.healDelay = healDelayTime;} //Ceiling on healDelay
				if (target.team != Player.list[shooterId].team){
					playerEvent(shooterId, "hit");
				}
				if (target.cloakEngaged){
					target.cloakEngaged = false;
					damageInflicted += cloakBonusDamage;
					updatePlayerList.push({id:target.id,property:"cloakEngaged",value:target.cloakEngaged});
				}
			}
		
			//CALCULATE DAMAGE damage calculation
			var targetDistance = getDistance(target, Player.list[shooterId]);
			
			//Facing attacker (lowest damage)
			if (Player.list[shooterId].weapon == 1){ damageInflicted += pistolDamage; } //Single Pistol
			else if (Player.list[shooterId].weapon == 2){ damageInflicted += pistolDamage * 2; } //Double damage for double pistols
			else if (Player.list[shooterId].weapon == 3){ damageInflicted += mgDamage; } //Damage for MG
			else if (Player.list[shooterId].weapon == 4){ damageInflicted += -(targetDistance - SGRange)/(SGRange/SGCloseRangeDamageScale) * SGDamage; } //Damage for SG
			
			if (Player.list[target.id] && target.team != Player.list[shooterId].team){
				if (target.shootingDir != (shootingDir + 4) && target.shootingDir != (shootingDir - 4) && target.shootingDir != (shootingDir + 5) && target.shootingDir != (shootingDir - 5) && target.shootingDir != (shootingDir + 3) && target.shootingDir != (shootingDir - 3)){
					//Target is NOT facing shooter (within 3 angles)
					if (Player.list[shooterId].weapon == 1){ damageInflicted += pistolSideDamage; } //Single Pistol
					else if (Player.list[shooterId].weapon == 2){ damageInflicted += pistolSideDamage * 2; } //Double damage for double pistols
					else if (Player.list[shooterId].weapon == 3){ damageInflicted += mgSideDamage; } //Damage for MG
					else if (Player.list[shooterId].weapon == 4){ damageInflicted += -(targetDistance - SGRange)/(SGRange/SGCloseRangeDamageScale) * SGSideDamage; } //Damage for SG
				}
				if (target.shootingDir == shootingDir){
					//Back Damage
					if (Player.list[shooterId].weapon == 1){ damageInflicted += pistolBackDamage; } //Single Pistol
					else if (Player.list[shooterId].weapon == 2){ damageInflicted += pistolBackDamage * 2; } //Double damage for double pistols
					else if (Player.list[shooterId].weapon == 3){ damageInflicted += mgBackDamage; } //Damage for MG
					else if (Player.list[shooterId].weapon == 4){ damageInflicted += -(targetDistance - SGRange)/(SGRange/SGCloseRangeDamageScale) * SGBackDamage; } //Damage for SG
				}
			}			
			else if (target.team == Player.list[shooterId].team){
				damageInflicted *= friendlyFireDamageScale;
			}
			
			damageInflicted = damageInflicted * damageScale; //Scale damage
			target.health -= Math.floor(damageInflicted);




			if (Player.list[target.id]){updatePlayerList.push({id:target.id,property:"health",value:target.health});}
			else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"health",value:target.health});}
						
			//Damage push
			target.pushSpeed += damageInflicted/8 * damagePushScale;
			target.pushDir = Player.list[shooterId].shootingDir;			
			if (Player.list[target.id]){updatePlayerList.push({id:target.id,property:"pushSpeed",value:target.pushSpeed});}
			else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"pushSpeed",value:target.pushSpeed});}
			if (Player.list[target.id]){updatePlayerList.push({id:target.id,property:"pushDir",value:target.pushDir});}
			else if (Thug.list[target.id]){updateThugList.push({id:target.id,property:"pushDir",value:target.pushDir});}
		
			if (target.health <= 0){
				kill(target, shootingDir, shooterId);
			}
			
		}
} //END hit function

var kill = function(target, shootingDir, shooterId){
		
	if (shooterId != 0){
		if (target.team != Player.list[shooterId].team || (target.lastEnemyToHit && target.lastEnemyToHit != 0)){
			if ((target.lastEnemyToHit && target.lastEnemyToHit != 0 && typeof Player.list[target.lastEnemyToHit] != 'undefined') && target.team == Player.list[shooterId].team){
				shooterId = target.lastEnemyToHit; //Give kill credit to last enemy that hit the player (if killed by own team or self)
			}
			if (Player.list[target.id]){
				if (gametype == "slayer" && gameOver == false){
					gameEngine.killScore(Player.list[shooterId].team);
				}
				playerEvent(shooterId, "kill");
				
				Player.list[shooterId].spree++;
				Player.list[shooterId].multikill++;
				Player.list[shooterId].multikillTimer = 4 * 60;
				if (Player.list[shooterId].multikill >= 2){
					playerEvent(shooterId, "multikill");
				}
				if (Player.list[shooterId].spree == 5 || Player.list[shooterId].spree == 10 || Player.list[shooterId].spree == 15 || Player.list[shooterId].spree == 20){
					playerEvent(shooterId, "spree");
				}
			}
			else if (Thug.list[target.id]){
				playerEvent(shooterId, "killThug");
			}
		}
		else { //Killed by own team or self AND no last enemy to hit
			playerEvent(shooterId, "benedict");
		}
	}
	if (Player.list[target.id]){
		playerEvent(target.id, "death");
	}
	
	
	//Create Body
	if (target.pushSpeed > pushMaxSpeed){ target.pushSpeed = pushMaxSpeed; }
	
	if (target.team == "white"){
		updateEffectList.push({type:5, targetX:target.x, targetY:target.y, pushSpeed:target.pushSpeed, shootingDir:shootingDir, bodyType:"whiteRed"});
	}
	else if (target.team == "black"){
		updateEffectList.push({type:5, targetX:target.x, targetY:target.y, pushSpeed:target.pushSpeed, shootingDir:shootingDir, bodyType:"blackBlue"});
	}
	
	//Drop Ammo/Pickups drop pickups
	if (Player.list[target.id]){
		var drops = 0;
		if (target.DPAmmo > 0 || target.DPClip > 0){
			drops++;
			var ammoAmount = target.DPClip + target.DPAmmo;
			var dpId = Math.random();
			Pickup(dpId, target.x - 40, target.y - 35, 2, ammoAmount, -1);
			updatePickupList.push(Pickup.list[dpId]);
			target.DPAmmo = 0;
			target.DPClip = 0;
			updatePlayerList.push({id:target.id,property:"DPAmmo",value:target.DPAmmo});		
			updatePlayerList.push({id:target.id,property:"DPClip",value:target.DPClip});		
		}
		if (target.MGAmmo > 0 || target.MGClip > 0){
			drops++;
			var ammoAmount = target.MGClip + target.MGAmmo;
			var mgId = Math.random();
			Pickup(mgId, target.x - 25 + (drops * 8), target.y - 10, 3, ammoAmount, -1);
			updatePickupList.push(Pickup.list[mgId]);
			target.MGAmmo = 0;
			target.MGClip = 0;
			updatePlayerList.push({id:target.id,property:"MGAmmo",value:target.MGAmmo});		
			updatePlayerList.push({id:target.id,property:"MGClip",value:target.MGClip});		
		}
		if (target.SGAmmo > 0 || target.SGClip > 0){
			drops++;
			var ammoAmount = target.SGClip + target.SGAmmo;
			var sgId = Math.random();
			Pickup(sgId, target.x - 30, target.y - 20 + (drops * 10), 4, ammoAmount, -1);
			updatePickupList.push(Pickup.list[sgId]);
			target.SGAmmo = 0;
			target.SGClip = 0;
			updatePlayerList.push({id:target.id,property:"SGAmmo",value:target.SGAmmo});		
			updatePlayerList.push({id:target.id,property:"SGClip",value:target.SGClip});		
		}
	}
}

module.exports.sprayBloodOntoTarget = sprayBloodOntoTarget;
module.exports.checkIfInLineOfShot = checkIfInLineOfShot;
module.exports.getHitTarget = getHitTarget;
module.exports.hit = hit;
module.exports.kill = kill;


