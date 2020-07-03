var Pickup = require(absAppDir + '/app_code/entities/pickup.js');
var Block = require(absAppDir + '/app_code/entities/block.js');

var initializePickups = function(map){
	Pickup.list = [];
	
	bagRed.captured=false;
	bagRed.speed=0;
	bagRed.direction=0;
	bagRed.playerThrowing=0;
	bagBlue.captured=false;
	bagBlue.speed=0;
	bagBlue.direction=0;
	bagBlue.playerThrowing=0;
	
	if (map == "empty"){
	}
	else if (map == "loadTest"){
		for (var i = 0; i <= 60; i+=10){
			Pickup(Math.random(), mapWidth/2 + i, mapHeight/2 - 90, 5, 75, 60); //Body Armor
			Pickup(Math.random(), mapWidth/2 + i, mapHeight/2 + 75, 3, 120, 60); //MG
			Pickup(Math.random(), mapWidth + i - 150, 150, 2, 40, 30); //DP
			Pickup(Math.random(), 150 + i, mapHeight - 150, 2, 40, 30); //DP
			Pickup(Math.random(), bagRed.homeX + i, bagRed.homeY - 120, 1, 50, 10); //MD
			Pickup(Math.random(), bagBlue.homeX + i, bagBlue.homeY + 120, 1, 50, 10); //MD			
		}
	}
	else if (map == "longest"){
		bagRed.homeX = 3*75;
		bagRed.homeY = 19*75;
		bagBlue.homeX = 36*75;
		bagBlue.homeY = 3*75;

		
		Pickup(Math.random(), 16, 11, 5, 75, 60); //Body Armor
		Pickup(Math.random(), 24, 12, 5, 75, 60); //Body Armor
		Pickup(Math.random(), 13, 2, 3, 90, 45); //MG
		Pickup(Math.random(), 27, 21, 3, 90, 45); //MG
		Pickup(Math.random(), 29, 4, 4, 24, 60); //SG
		Pickup(Math.random(), 11, 19, 4, 24, 60); //SG
		Pickup(Math.random(), 2, 12, 2, 40, 30); //DP
		Pickup(Math.random(), 38, 11, 2, 40, 30); //DP
		Pickup(Math.random(), 2, 4, 1, 50, 10); //MD
		Pickup(Math.random(), 38, 19, 1, 50, 10); //MD		
	}
	else if (map == "thepit"){
		bagRed.homeX = 5*75;
		bagRed.homeY = 17*75;
		bagBlue.homeX = 36*75;
		bagBlue.homeY = 17*75;
		
		Pickup(Math.random(), 4, 7, 1, 50, 10); //MD
		Pickup(Math.random(), 38, 7, 1, 50, 10); //MD
		Pickup(Math.random(), 21, 22, 5, 75, 45); //Body Armor
		Pickup(Math.random(), 21, 3, 3, 90, 45); //MG
		Pickup(Math.random(), 21, 28, 3, 90, 45); //MG
		Pickup(Math.random(), 3, 29, 4, 24, 40); //SG
		Pickup(Math.random(), 39, 29, 4, 24, 40); //SG
		Pickup(Math.random(), 5, 20, 2, 40, 25); //DP
		Pickup(Math.random(), 37, 20, 2, 40, 25); //DP
	}
	else if (map == "crik"){
		bagRed.homeX = 7*75;
		bagRed.homeY = 13*75;
		bagBlue.homeX = 45*75;
		bagBlue.homeY = 13*75;

		Pickup(Math.random(), 26.5, 4.5, 1, 50, 10); //MD
		Pickup(Math.random(), 26.5, 22.5, 1, 50, 10); //MD
		Pickup(Math.random(), 1, 13.5, 5, 75, 45); //Body Armor
		Pickup(Math.random(), 52, 13.5, 5, 75, 45); //Body Armor
		Pickup(Math.random(), 24, 26, 3, 135, 45); //MG
		Pickup(Math.random(), 29, 1, 3, 135, 45); //MG
		Pickup(Math.random(), 17, 6, 2, 40, 25); //DP
		Pickup(Math.random(), 14, 22, 2, 40, 25); //DP		
		Pickup(Math.random(), 39, 5, 2, 40, 25); //DP
		Pickup(Math.random(), 36, 21, 2, 40, 25); //DP		
		Pickup(Math.random(), 26.5, 13.5, 4, 24, 40); //SG
	}	
	else if (map == "close"){
		bagRed.homeX = 5*75;
		bagRed.homeY = 17*75;
		bagBlue.homeX = 36*75;
		bagBlue.homeY = 17*75;		
	}
	else{ //Default: map2
		bagRed.homeX = 200;
		bagRed.homeY = 200;
		bagBlue.homeX = mapWidth - 200;
		bagBlue.homeY = mapHeight - 200;

		//id, x, y, type, amount, respawnTime
		Pickup(Math.random(), (mapWidth/2 - 90)/75, mapHeight/2/75, 5, 75, 60); //Body Armor
		Pickup(Math.random(), (mapWidth/2 + 95)/75, mapHeight/2/75, 3, 60, 60); //MG
		Pickup(Math.random(), 1000/75, 110/75, 4, 36, 90); //SG
		Pickup(Math.random(), (mapWidth - 1000)/75, (mapHeight - 110)/75, 4, 36, 90); //SG
		Pickup(Math.random(), (mapWidth - 150)/75, 150/75, 2, 40, 30); //DP
		Pickup(Math.random(), 150/75, (mapHeight - 150)/75, 2, 40, 30); //DP
		Pickup(Math.random(), bagRed.homeX/75, (bagRed.homeY - 120)/75, 1, 50, 10); //MD
		Pickup(Math.random(), bagBlue.homeX/75, (bagBlue.homeY + 120)/75, 1, 50, 10); //MD
	}
	bagBlue.x = bagBlue.homeX;
	bagBlue.y = bagBlue.homeY;
	bagRed.x = bagRed.homeX;
	bagRed.y = bagRed.homeY;	
}

var initializeBlocks = function(map){
	Block.list = [];
	
	if (map == "empty"){
	}
	else if (map == "loadTest"){
		for (var i = 0; i <= 60; i+=10){
			Block(450 + i, 200, 400, 75, "normal");
			Block(200 + i, 450, 75, 400, "normal");
			Block(mapWidth + i - 400 - 450, mapHeight - 75 - 200, 400, 75, "normal");
			Block(mapWidth + i - 75 - 200, mapHeight - 400 - 450, 75, 400, "normal");
			Block(mapWidth/2 + i - 250, mapHeight/2 - 37, 500, 75, "normal");
			Block(-20 + i, 235, 70, 50, "normal");
			Block(mapWidth + i - 50, mapHeight - 285, 70, 50, "normal");	
			Block(-50 + i, mapHeight, mapWidth + 100, 50, "normal"); //Bottom
			Block(-50 + i, -50, 50, mapHeight + 100, "normal"); //Left
			Block(mapWidth + i, -50, 50, mapHeight + 100, "normal"); //Right
			Block(-50 + i, -50, mapWidth + 100, 50, "normal");	//Top
		}
	}
	else if (map == "longest"){
		mapWidth = 39*75;
		mapHeight = 22*75;
		
		//Spawn areas
		spawnXminBlack = mapWidth - 700;
		spawnXmaxBlack = mapWidth - 10;
		spawnYminBlack = 10;
		spawnYmaxBlack = mapHeight;
		
		spawnXminWhite = 10;
		spawnXmaxWhite = 700;
		spawnYminWhite = 0;
		spawnYmaxWhite = mapHeight - 10;
		
		//push blocks
		Block(9.7, 5, 5.6, 1, "pushDown");
		Block(26.7, 5, 3.6, 1, "pushDown");
		Block(8.7, 16, 3.6, 1, "pushUp");
		Block(23.7, 16, 5.6, 1, "pushUp");	

		Block(3, 0, 7, 3, "normal");
		Block(-0.5, -0.5, 10.5, 2.5, "normal");			
		Block(3, 5, 7, 1, "normal");
		Block(15, 0, 7, 6, "normal");
		Block(15, -0.5, 16, 2.5, "normal");
		Block(24, 5, 3, 1, "normal");
		Block(30, -0.5, 1, 6.5, "normal");
		Block(34, 2, 1, 2.9, "blue");
		Block(34, 4, 3, 1, "blue");
		Block(3, 10, 9, 2, "red");
		Block(14, 11, 8, 1, "red"); //mid bars
		Block(17, 10, 8, 1, "blue"); //mid bars
		Block(27, 10, 9, 2, "blue");
		Block(4, 17.1, 1, 2.9, "red");
		Block(2, 17, 3, 1, "red");
		Block(8, 16, 1, 6.5, "normal");
		Block(12, 16, 3, 1, "normal");
		Block(17, 16, 7, 6, "normal");
		Block(8, 20, 16, 2.5, "normal");
		Block(29, 16, 7, 1, "normal");
		Block(29, 19, 7, 3, "normal");
		Block(29, 20, 10.5, 2.5, "normal");	

		Block(-1/2, mapHeight/75, (mapWidth + 75)/75, 1/2, "normal"); //Bottom
		Block(-1/2, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Left
		Block(mapWidth/75, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Right
		Block(-1/2, -1/2, (mapWidth + 75)/75, 1/2, "normal");	//Top
		
		/*
		Block(-100/75, (mapHeight - 10)/75, (mapWidth + 400)/75, 200/75); //Bottom
		Block((-200 + 10)/75, -200/75, 200/75, (mapHeight + 400)/75); //Left
		Block((mapWidth - 10)/75, -200/75, 200/75, (mapHeight + 400)/75); //Right
		Block(-200/75, (-200 + 10)/75, (mapWidth + 400)/75, 200/75);	//Top		
		*/
	}
	else if (map == "thepit"){
		mapWidth = 41*75;
		mapHeight = 30*75;
		
		//Spawn areas
		spawnXminBlack = mapWidth - 700;
		spawnXmaxBlack = mapWidth - 10;
		spawnYminBlack = 8*75;
		spawnYmaxBlack = 29*75;
		spawnXminWhite = 10;
		spawnXmaxWhite = 700;
		spawnYminWhite = 8*75;
		spawnYmaxWhite = 29*75;
		
		Block(4, 3, 2, 2, "normal");	
		Block(4, 7, 2, 2, "normal");	
		Block(-0.5, 7, 2.5, 2, "normal");	
		Block(6, 15, 1, 7, "red");	
		Block(3, 15, 4, 1, "red");	
		Block(2, 21, 5, 1, "red");	
		Block(2, 24, 1, 4, "red");	
		Block(2, 27, 4, 1, "red");	
		Block(13, 18, 1, 4, "red");	
		Block(10, 27, 4, 1, "normal");	
		Block(10, 3, 4.9, 1, "normal");	
		Block(10, 5, 4.9, 1, "normal");	
		Block(14, -0.5, 1, 4.5, "normal");	
		Block(14.1, 8, 4.9, 1, "normal");	
		Block(14, 5, 1, 4, "normal");	
		Block(22, 8, 4.9, 1, "normal");	
		Block(26.1, 3, 4.9, 1, "normal");	
		Block(26, -0.5, 1, 4.5, "normal");	
		Block(26.1, 5, 4.9, 1, "normal");	
		Block(26, 5, 1, 4, "normal");	
		Block(35, 3, 2, 2, "normal");	
		Block(35, 7, 2, 2, "normal");	
		Block(39, 7, 2.5, 2, "normal");	
		Block(27, 18, 1, 4, "blue");	
		Block(34, 15, 1, 7, "blue");	
		Block(34, 15, 4, 1, "blue");	
		Block(34, 21, 5, 1, "blue");	
		Block(38, 24, 1, 4, "blue");	
		Block(35, 27, 4, 1, "blue");	
		Block(27, 27, 4, 1, "normal");	
		Block(17, 28, 7, 2.5, "normal");	
		Block(17, 21, 2, 2, "normal");	
		Block(22, 21, 2, 2, "normal");	
		Block(17, 22, 7, 5, "normal");	
		Block(20, 12, 1, 6, "normal");	
		Block(17, 17, 7, 2, "normal");	

		Block(-1/2, mapHeight/75, (mapWidth + 75)/75, 1/2, "normal"); //Bottom
		Block(-1/2, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Left
		Block(mapWidth/75, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Right
		Block(-1/2, -1/2, (mapWidth + 75)/75, 1/2, "normal");	//Top
	}
	else if (map == "crik"){
		mapWidth = 52*75;
		mapHeight = 26*75;
		
		//Spawn areas
		spawnXminWhite = 10;
		spawnXmaxWhite = mapWidth/2;
		spawnYminWhite = 10;
		spawnYmaxWhite = mapHeight - 10;

		spawnXminBlack = mapWidth/2;
		spawnXmaxBlack = mapWidth - 10;
		spawnYminBlack = 10;
		spawnYmaxBlack = mapHeight - 10;
		
			
		//Blocks
		Block(40, 14, 2, 5.8, "normal");	
		Block(10, 6, 2, 6, "normal");	
		Block(4, 11, 2, 1, "red");	
		Block(4, 14, 2, 1, "red");	
		Block(46, 11, 2, 1, "blue");	
		Block(46, 14, 2, 1, "blue");	
		Block(19, -0.5, 2, 2.5, "normal");	
		Block(22, 1, 2, 1, "normal");	
		Block(24, 1, 5.1, 1, "pushDown");
		Block(29, -0.5, 23, 2.5, "normal");	
		Block(17, 4, 1, 3, "red");	
		Block(44, 3, 2, 2, "normal");	
		Block(5,6, 8, 1, "red");	
		Block(15, 6, 3, 1, "red");	
		Block(34, 6, 13, 1, "blue");	
		Block(17, 7, 1, 2.1, "pushRight");	
		Block(24, 8, 1, 10, "pushLeft");	
		Block(27, 8, 1, 10, "pushRight");	
		Block(34, 7, 1, 2.1, "pushLeft");	
		Block(46, 6, 1, 14, "blue");	
		Block(14, 9, 1, 8, "normal");	
		Block(17, 9, 1, 3, "red");	
		Block(20, 8, 2, 3, "normal");	
		Block(34, 9, 1, 3, "blue");	
		Block(37, 9, 1, 8, "normal");	
		Block(40, 9, 2, 3, "normal");	
		Block(5, 6, 1, 14, "red");	
		Block(10, 14, 2, 3, "normal");	
		Block(17, 14, 1, 3, "red");	
		Block(30, 15, 2, 3, "normal");	
		Block(34, 14, 1, 3, "blue");	
		Block(5, 19, 13, 1, "red");	
		Block(17, 17, 1, 2, "pushRight");	
		Block(34, 17, 1, 2.1, "pushLeft");	
		Block(6, 21, 2, 2, "normal");	
		Block(34, 19, 3, 1, "blue");	
		Block(39, 19, 8, 1, "blue");	
		Block(34, 19, 1, 3, "blue");	
		Block(0, 24, 23, 2.4, "normal");	
		Block(23, 24, 5.1, 1, "pushUp");	
		Block(28, 24, 2, 1, "normal");	
		Block(31, 24, 2, 2.5, "normal");	
		
		Block(4, 12, 1, 2, "warp1");	
		Block(47, 12, 1, 2, "warp2");	
		warp1X = 48.1 * 75;
		warp1Y = 13 * 75;
		warp2X = 3.9 * 75;
		warp2Y = 13 * 75;


		Block(-1/2, mapHeight/75, (mapWidth + 75)/75, 1/2, "normal"); //Bottom
		Block(-1/2, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Left
		Block(mapWidth/75, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Right
		Block(-1/2, -1/2, (mapWidth + 75)/75, 1/2, "normal");	//Top
	}		
	else if (map == "close"){
		mapWidth = 8*75;
		mapHeight = 8*75;
		
		//Spawn areas
		spawnXminBlack = mapWidth - 400;
		spawnXmaxBlack = mapWidth - 10;
		spawnYminBlack = mapHeight - 400;
		spawnYmaxBlack = mapHeight - 10;
		spawnXminWhite = 10;
		spawnXmaxWhite = 400;
		spawnYminWhite = 10;
		spawnYmaxWhite = 400;
		
		Block(3, 6, 2, 2, "normal");	
		Block(3, 6, 2, 2, "normal");	
		Block(3, 6, 2, 2, "normal");	
		Block(3, 6, 2, 2, "normal");	
		Block(3, 6, 2, 2, "normal");	

		Block(-1/2, mapHeight/75, (mapWidth + 75)/75, 1/2, "normal"); //Bottom
		Block(-1/2, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Left
		Block(mapWidth/75, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Right
		Block(-1/2, -1/2, (mapWidth + 75)/75, 1/2, "normal");	//Top
	}
	else{ //default	
		mapWidth = 2100;
		mapHeight = 1500;
		
		//Spawn areas
		spawnXminBlack = mapWidth - 700;
		spawnXmaxBlack = mapWidth - 10;
		spawnYminBlack = mapHeight - 700;
		spawnYmaxBlack = mapHeight - 10;
		spawnXminWhite = 10;
		spawnXmaxWhite = 700;
		spawnYminWhite = 10;
		spawnYmaxWhite = 700;

		Block(550/75, 200/75, 600/75, 75/75, "normal");
		Block(-50/75, 275/75, 350/75, 900/75, "normal");
		Block((mapWidth - 400 - 750)/75, (mapHeight - 75 - 200)/75, 600/75, 75/75, "normal");
		Block((mapWidth - 300)/75, (mapHeight - 900 - 450 + 175)/75, 350/75, 900/75, "normal");
		Block((mapWidth/2 - 37)/75, (mapHeight/2 - 250)/75, 75/75, 500/75, "normal"); //Middle beam
		Block(-20/75, 235/75, 70/75, 50/75, "normal"); //BM nub white
		Block((mapWidth - 50)/75, (mapHeight - 285)/75, 70/75, 50/75, "normal"); //BM nub black

		Block(-50/75, mapHeight/75, (mapWidth + 100)/75, 50/75, "normal"); //Bottom
		Block(-50/75, -50/75, 50/75, (mapHeight + 100)/75, "normal"); //Left
		Block(mapWidth/75, -50/75, 50/75, (mapHeight + 100)/75, "normal"); //Right
		Block(-50/75, -50/75, (mapWidth + 100)/75, 50/75, "normal");	//Top
	}
	
}

module.exports.initializePickups = initializePickups;
module.exports.initializeBlocks = initializeBlocks;
