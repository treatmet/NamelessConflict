var Block = function(x, y, width, height, type, warpX = -1, warpY = -1){	
	x *= 75;
	y *= 75;
	width *= 75;
	height *= 75;

	var self = {
		id:Math.random(),
		x:x,
		y:y,
		width:width,
		height:height,
		type:type,
	}		

	if (warpX && warpY){
		self.warpX = warpX;
		self.warpY = warpY;
	}

	self.hit = function(shootingDir, distance, shooter, targetDistance, shotX){
		if (shooter.weapon != 4){
			var shotData = {};
			shotData.id = Math.random();
			shotData.playerId = shooter.id
			shotData.weapon = shooter.weapon;
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
	}






	Block.list[self.id] = self;
}//End Block Function
Block.list = [];

var getBlockList = function(){
	var blockList = [];
	for (var b in Block.list){
		blockList.push(Block.list[b]);
	}
    return blockList;
}

var getBlockById = function(id){
    return Block.list[id];
}

var createBlock = function(x, y, width, height, type, warpX = -1, warpY = -1){
	Block(x, y, width, height, type, warpX, warpY);
}


var clearBlockList = function(){
	Block.list = [];
}

var isSafeCoords = function(potentialX, potentialY){
	for (var i in Block.list){
		if (potentialX >= Block.list[i].x && potentialX <= Block.list[i].x + Block.list[i].width && potentialY >= Block.list[i].y && potentialY <= Block.list[i].y + Block.list[i].height){																		
			return false;
		}					
	}
	return true;
}

var checkCollision = function(obj, isBouncable = false){
	if (!obj){return false;}
	var blockList = Block.list;
	var extendTopOfBlock = 0;
	var extendRightOfBlock = 0;
	var extendBottomOfBlock = 0;
	var extendLeftOfBlock = 0;

	if (obj.weapon == 5) {
		switch(obj.shootingDir) {
			case 1:
				extendLeftOfBlock = laserOffsetX;
				break;
			case 3:
				extendTopOfBlock = laserOffsetX;
				break;
			case 5:
				extendRightOfBlock = laserOffsetX;
				break;
			case 7:
				extendBottomOfBlock = laserOffsetX;
				break;
			default:
				break;
		}
	}

	if (obj.homeX){
		extendTopOfBlock = 10;
		extendRightOfBlock = 10;
		extendBottomOfBlock = 10;
		extendLeftOfBlock = 10;
	}

	var posUpdated = false;

	if (obj.y < 0){
		obj.y = 0 + 30;
		if (isBouncable){obj.speedY = -Math.abs(obj.speedY)/2;}
		posUpdated = true
	}
	else if (obj.y > mapHeight){
		obj.y = mapHeight - 30;
		if (isBouncable){obj.speedY = -Math.abs(obj.speedY)/2;}
		posUpdated = true
	}
	else if (obj.x < 0){
		obj.x = 0 + 30;
		if (isBouncable){obj.speedX = Math.abs(obj.speedX)/2;}
		posUpdated = true
	}
	else if (obj.x > mapWidth){
		obj.x = mapWidth - 30;
		if (isBouncable){obj.speedX = -Math.abs(obj.speedX)/2;}
		posUpdated = true
	}

	for (var i in blockList){
		if (obj.x > blockList[i].x - extendLeftOfBlock && obj.x < blockList[i].x + blockList[i].width + extendRightOfBlock && obj.y > blockList[i].y - extendTopOfBlock && obj.y < blockList[i].y + blockList[i].height + extendBottomOfBlock){												
			
			if (blockList[i].type == "normal" || blockList[i].type == "red" || blockList[i].type == "blue"){
				var overlapTop = Math.abs(blockList[i].y - obj.y);  
				var overlapBottom = Math.abs((blockList[i].y + blockList[i].height) - obj.y);
				var overlapLeft = Math.abs(obj.x - blockList[i].x);
				var overlapRight = Math.abs((blockList[i].x + blockList[i].width) - obj.x);			
				if (overlapTop <= overlapBottom && overlapTop <= overlapRight && overlapTop <= overlapLeft){	
					obj.y = blockList[i].y - (1 + extendTopOfBlock);
					if (typeof obj.speedX != 'undefined'){
						if (obj.speedY > 0){
							if (isBouncable){obj.speedY = -Math.abs(obj.speedY)/2;}
							else {obj.speedY = 0;}
						}
					}
					posUpdated = true;
				}
				else if (overlapBottom <= overlapTop && overlapBottom <= overlapRight && overlapBottom <= overlapLeft){
					obj.y = blockList[i].y + blockList[i].height + (1 + extendBottomOfBlock);
					if (typeof obj.speedX != 'undefined'){
						if (obj.speedY < 0){
							if (isBouncable){obj.speedY = Math.abs(obj.speedY)/2;}
							else {obj.speedY = 0;}
						}
					}
					posUpdated = true;
				}
				else if (overlapLeft <= overlapTop && overlapLeft <= overlapRight && overlapLeft <= overlapBottom){
					obj.x = blockList[i].x - (1 + extendLeftOfBlock);
					if (typeof obj.speedX != 'undefined'){
						if (obj.speedX > 0){
							if (isBouncable){obj.speedX = -Math.abs(obj.speedX)/2;}
							else {obj.speedX = 0;}
						}
					}
					posUpdated = true;
				}
				else if (overlapRight <= overlapTop && overlapRight <= overlapLeft && overlapRight <= overlapBottom){
					obj.x = blockList[i].x + blockList[i].width + (1 + extendRightOfBlock);
					if (typeof obj.speedX != 'undefined'){
						if (obj.speedX < 0){
							if (isBouncable){obj.speedX = Math.abs(obj.speedX)/2;}
							else {obj.speedX = 0;}
						}
					}
					posUpdated = true;
				}
			}
			else if (blockList[i].type == "pushUp"){
				if (typeof obj.speedX == 'undefined'){
					obj.y -= pushStrength;
				}
				else {
					obj.speedY -= blockPushSpeed;
					if (obj.speedY < -speedCap*0.75){obj.speedY = -speedCap*0.75;}
				}
				posUpdated = true;
			}
			else if (blockList[i].type == "pushRight"){
				if (typeof obj.speedX == 'undefined'){
					obj.x += pushStrength;
				}
				else {
					obj.speedX += blockPushSpeed;
					if (obj.speedX > speedCap*0.75){obj.speedX = speedCap*0.75;}

				}
				posUpdated = true;
			}
			else if (blockList[i].type == "pushDown"){
				if (typeof obj.speedX == 'undefined'){
					obj.y += pushStrength;
				}
				else {
					obj.speedY += blockPushSpeed;
					if (obj.speedY > speedCap*0.75){obj.speedY = speedCap*0.75;}
				}
				posUpdated = true;
			}
			else if (blockList[i].type == "pushLeft"){
				if (typeof obj.speedX == 'undefined'){
					obj.x -= pushStrength;
				}
				else {
					obj.speedX -= blockPushSpeed;
					if (obj.speedX < -speedCap*0.75){obj.speedX = -speedCap*0.75;}
				}
				posUpdated = true;
			}
			else if (blockList[i].type == "warp"){
				obj.x = blockList[i].warpX;
				posUpdated = true;
				obj.y = blockList[i].warpY;
				posUpdated = true;
				if (SOCKET_LIST[obj.id])
					SOCKET_LIST[obj.id].emit('sfx', "sfxWarp");
			}
		}// End check if player is overlapping block
	}//End blockList loop	

	if (posUpdated){
		return true;
	}
}

var blockPushSpeed = 4;

module.exports.getBlockList = getBlockList;
module.exports.getBlockById = getBlockById;
module.exports.createBlock = createBlock;
module.exports.clearBlockList = clearBlockList;
module.exports.isSafeCoords = isSafeCoords;
module.exports.checkCollision = checkCollision;
