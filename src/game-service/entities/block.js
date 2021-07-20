var Block = function(x, y, width, height, type){	
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

var createBlock = function(x, y, width, height, type){
	Block(x, y, width, height, type);
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

module.exports.checkCollision = function(obj){
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
	var posUpdated = false;
	for (var i in blockList){
		if (obj.x > blockList[i].x - extendLeftOfBlock && obj.x < blockList[i].x + blockList[i].width + extendRightOfBlock && obj.y > blockList[i].y - extendTopOfBlock && obj.y < blockList[i].y + blockList[i].height + extendBottomOfBlock){												
			
			if (blockList[i].type == "normal" || blockList[i].type == "red" || blockList[i].type == "blue"){
				var overlapTop = Math.abs(blockList[i].y - obj.y);  
				var overlapBottom = Math.abs((blockList[i].y + blockList[i].height) - obj.y);
				var overlapLeft = Math.abs(obj.x - blockList[i].x);
				var overlapRight = Math.abs((blockList[i].x + blockList[i].width) - obj.x);			
				if (overlapTop <= overlapBottom && overlapTop <= overlapRight && overlapTop <= overlapLeft){	
					obj.y = blockList[i].y - (1 + extendTopOfBlock);
					if (obj.y < 0)
						obj.y = 0;
					posUpdated = true;
				}
				else if (overlapBottom <= overlapTop && overlapBottom <= overlapRight && overlapBottom <= overlapLeft){
					obj.y = blockList[i].y + blockList[i].height + (1 + extendBottomOfBlock);
					if (obj.y > mapHeight)
						obj.y = mapHeight;
					posUpdated = true;
				}
				else if (overlapLeft <= overlapTop && overlapLeft <= overlapRight && overlapLeft <= overlapBottom){
					obj.x = blockList[i].x - (1 + extendLeftOfBlock);
					if (obj.x < 0)
						obj.x = 0;
					posUpdated = true;
				}
				else if (overlapRight <= overlapTop && overlapRight <= overlapLeft && overlapRight <= overlapBottom){
					obj.x = blockList[i].x + blockList[i].width + (1 + extendRightOfBlock);
					if (obj.x > mapWidth)
						obj.x = mapWidth;
					posUpdated = true;
				}
			}
			else if (blockList[i].type == "pushUp"){
				obj.y -= pushStrength;
				if (obj.y < blockList[i].y){obj.y = blockList[i].y;}
				posUpdated = true;
			}
			else if (blockList[i].type == "pushRight"){
				obj.x += pushStrength;
				if (obj.x > blockList[i].x + blockList[i].width){obj.x = blockList[i].x + blockList[i].width;}
				posUpdated = true;
			}
			else if (blockList[i].type == "pushDown"){
				obj.y += pushStrength;
				if (obj.y > blockList[i].y + blockList[i].height){obj.y = blockList[i].y + blockList[i].height;}
				posUpdated = true;
			}
			else if (blockList[i].type == "pushLeft"){
				obj.x -= pushStrength;
				if (obj.x < blockList[i].x){obj.x = blockList[i].x;}
				posUpdated = true;
			}
			else if (blockList[i].type == "warp1"){
				obj.x = warp1X;
				posUpdated = true;
				obj.y = warp1Y;
				posUpdated = true;
				SOCKET_LIST[obj.id].emit('sfx', "sfxWarp");
			}
			else if (blockList[i].type == "warp2"){
				obj.x = warp2X;
				posUpdated = true;
				obj.y = warp2Y;
				posUpdated = true;
				SOCKET_LIST[obj.id].emit('sfx', "sfxWarp");
			}


		}// End check if player is overlapping block
	}//End blockList loop	

	if (posUpdated){
		return true;
	}

}

module.exports.getBlockList = getBlockList;
module.exports.getBlockById = getBlockById;
module.exports.createBlock = createBlock;
module.exports.clearBlockList = clearBlockList;
module.exports.isSafeCoords = isSafeCoords;