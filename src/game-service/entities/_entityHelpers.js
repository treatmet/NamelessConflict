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

var checkIfInLineOfShot = function(shooter, target, shot){
	var distFromDiag = 0;
	//&& target.team != shooter.team //Take off friendly fire
	let shotType; 
	if (shot.weapon == 1 || shot.weapon == 2 || shot.weapon == 3 || shot.weapon == 5){shotType = 1;} //Straight shot with depth
	else if (shot.weapon == 4){shotType = 2;} //SG

	if (target.health){
	}

	var range = bulletRange;
	if (shot.weapon == 4) {range = SGRange;}
	if (shot.weapon == 5) {range = laserRange;}

	if (shotType == 1){
		if (target.team){
			if (target.id != shooter.id && target.health > 0){ //Organic targets
				var allowableMargin = 31;
				if (shooter.weapon == 5){allowableMargin = 60;}

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
						return {target:target,dist:(shooter.y - target.y),distFromDiag:distFromDiag};
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
						return {target:target,dist:(target.x - shooter.x),distFromDiag:distFromDiag};
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
						return {target:target,dist:(target.y - shooter.y),distFromDiag:distFromDiag};
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

module.exports.sprayBloodOntoTarget = sprayBloodOntoTarget;
module.exports.checkIfInLineOfShot = checkIfInLineOfShot;
module.exports.getHitTarget = getHitTarget;
