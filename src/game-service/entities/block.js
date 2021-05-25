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

module.exports.getBlockList = getBlockList;
module.exports.getBlockById = getBlockById;
module.exports.createBlock = createBlock;
module.exports.clearBlockList = clearBlockList;
module.exports.isSafeCoords = isSafeCoords;