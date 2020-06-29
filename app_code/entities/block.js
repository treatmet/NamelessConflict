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
	Block.list[self.id] = self;
}//End Block Function
Block.list = [];

module.exports.Block = Block;