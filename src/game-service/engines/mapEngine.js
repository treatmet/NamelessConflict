var pickup = require('../entities/pickup.js');
var block = require('../entities/block.js');

var initializePickups = function(map){
	pickup.clearPickupList();
	
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
			pickup.createPickup(Math.random(), mapWidth/2 + i, mapHeight/2 - 90, 5, 75, 60); //Body Armor
			pickup.createPickup(Math.random(), mapWidth/2 + i, mapHeight/2 + 75, 3, 120, 60); //MG
			pickup.createPickup(Math.random(), mapWidth + i - 150, 150, 2, 40, 30); //DP
			pickup.createPickup(Math.random(), 150 + i, mapHeight - 150, 2, 40, 30); //DP
			pickup.createPickup(Math.random(), bagRed.homeX + i, bagRed.homeY - 120, 1, 50, 10); //MD
			pickup.createPickup(Math.random(), bagBlue.homeX + i, bagBlue.homeY + 120, 1, 50, 10); //MD			
		}
	}
	else if (map == "longest"){
		bagRed.homeX = 3*75;
		bagRed.homeY = 19*75;
		bagBlue.homeX = 36*75;
		bagBlue.homeY = 3*75;
		
		pickup.createPickup(Math.random(), 16, 11, 5, 75, 60); //Body Armor
		pickup.createPickup(Math.random(), 24, 12, 5, 75, 60); //Body Armor
		pickup.createPickup(Math.random(), 13, 2, 3, 90, 45); //MG
		pickup.createPickup(Math.random(), 27, 21, 3, 90, 45); //MG
		pickup.createPickup(Math.random(), 29, 4, 4, 24, 60); //SG
		pickup.createPickup(Math.random(), 11, 19, 4, 24, 60); //SG
		pickup.createPickup(Math.random(), 2, 12, 2, 40, 30); //DP
		 pickup.createPickup(Math.random(), 38, 11, 2, 40, 30); //DP
		pickup.createPickup(Math.random(), 2, 13, 6, 4, 90); //Laser
		pickup.createPickup(Math.random(), 38, 10, 6, 4, 90); //Laser
		pickup.createPickup(Math.random(), 2, 4, 1, 50, 10); //MD
		pickup.createPickup(Math.random(), 38, 19, 1, 50, 10); //MD		
	}
	else if (map == "thepit"){
		bagRed.homeX = 5*75;
		bagRed.homeY = 17*75;
		bagBlue.homeX = 36*75;
		bagBlue.homeY = 17*75;
		
		pickup.createPickup(Math.random(), 4, 7, 1, 50, 10); //MD
		pickup.createPickup(Math.random(), 38, 7, 1, 50, 10); //MD
		pickup.createPickup(Math.random(), 21, 22, 5, 75, 45); //Body Armor
		pickup.createPickup(Math.random(), 21, 3, 3, 90, 45); //MG
		pickup.createPickup(Math.random(), 21, 28, 3, 90, 45); //MG
		pickup.createPickup(Math.random(), 3, 29, 4, 24, 40); //SG
		pickup.createPickup(Math.random(), 39, 29, 4, 24, 40); //SG
		pickup.createPickup(Math.random(), 5, 20, 2, 40, 25); //DP
		pickup.createPickup(Math.random(), 37, 20, 2, 40, 25); //DP
	}
	else if (map == "crik"){
		bagRed.homeX = 7*75;
		bagRed.homeY = 13*75;
		bagBlue.homeX = 45*75;
		bagBlue.homeY = 13*75;

		pickup.createPickup(Math.random(), 26.5, 4.5, 1, 50, 10); //MD
		pickup.createPickup(Math.random(), 26.5, 22.5, 1, 50, 10); //MD
		pickup.createPickup(Math.random(), 1, 13.5, 5, 75, 45); //Body Armor
		pickup.createPickup(Math.random(), 52, 13.5, 5, 75, 45); //Body Armor
		pickup.createPickup(Math.random(), 24, 26, 3, 135, 45); //MG
		pickup.createPickup(Math.random(), 29, 1, 3, 135, 45); //MG
		pickup.createPickup(Math.random(), 17, 6, 2, 40, 25); //DP
		pickup.createPickup(Math.random(), 14, 22, 2, 40, 25); //DP		
		pickup.createPickup(Math.random(), 39, 5, 2, 40, 25); //DP
		pickup.createPickup(Math.random(), 36, 21, 2, 40, 25); //DP		
		pickup.createPickup(Math.random(), 26.5, 13.5, 4, 24, 40); //SG
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
		pickup.createPickup(Math.random(), (mapWidth/2 - 90)/75, mapHeight/2/75, 5, 75, 60); //Body Armor
		pickup.createPickup(Math.random(), (mapWidth/2 + 95)/75, mapHeight/2/75, 3, 60, 60); //MG
		pickup.createPickup(Math.random(), 1000/75, 110/75, 4, 36, 90); //SG
		pickup.createPickup(Math.random(), (mapWidth - 1000)/75, (mapHeight - 110)/75, 4, 36, 90); //SG
		pickup.createPickup(Math.random(), (mapWidth - 150)/75, 150/75, 2, 40, 30); //DP
		pickup.createPickup(Math.random(), 150/75, (mapHeight - 150)/75, 2, 40, 30); //DP
		pickup.createPickup(Math.random(), bagRed.homeX/75, (bagRed.homeY - 120)/75, 1, 50, 10); //MD
		pickup.createPickup(Math.random(), bagBlue.homeX/75, (bagBlue.homeY + 120)/75, 1, 50, 10); //MD
	}
	bagBlue.x = bagBlue.homeX;
	bagBlue.y = bagBlue.homeY;
	bagRed.x = bagRed.homeX;
	bagRed.y = bagRed.homeY;	
}

var initializeBlocks = function(map){
	block.clearBlockList();
	
	if (map == "empty"){
	}
	else if (map == "loadTest"){
		for (var i = 0; i <= 60; i+=10){
			block.createBlock(450 + i, 200, 400, 75, "normal");
			block.createBlock(200 + i, 450, 75, 400, "normal");
			block.createBlock(mapWidth + i - 400 - 450, mapHeight - 75 - 200, 400, 75, "normal");
			block.createBlock(mapWidth + i - 75 - 200, mapHeight - 400 - 450, 75, 400, "normal");
			block.createBlock(mapWidth/2 + i - 250, mapHeight/2 - 37, 500, 75, "normal");
			block.createBlock(-20 + i, 235, 70, 50, "normal");
			block.createBlock(mapWidth + i - 50, mapHeight - 285, 70, 50, "normal");	
			block.createBlock(-50 + i, mapHeight, mapWidth + 100, 50, "normal"); //Bottom
			block.createBlock(-50 + i, -50, 50, mapHeight + 100, "normal"); //Left
			block.createBlock(mapWidth + i, -50, 50, mapHeight + 100, "normal"); //Right
			block.createBlock(-50 + i, -50, mapWidth + 100, 50, "normal");	//Top
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
		block.createBlock(9.7, 5, 5.6, 1, "pushDown");
		block.createBlock(26.7, 5, 3.6, 1, "pushDown");
		block.createBlock(8.7, 16, 3.6, 1, "pushUp");
		block.createBlock(23.7, 16, 5.6, 1, "pushUp");	

		block.createBlock(3, 0, 7, 3, "normal");
		block.createBlock(-0.5, -0.5, 10.5, 2.5, "normal");			
		block.createBlock(3, 5, 7, 1, "normal");
		block.createBlock(15, 0, 7, 6, "normal");
		block.createBlock(15, -0.5, 16, 2.5, "normal");
		block.createBlock(24, 5, 3, 1, "normal");
		block.createBlock(30, -0.5, 1, 6.5, "normal");
		block.createBlock(34, 2, 1, 2.9, "blue");
		block.createBlock(34, 4, 3, 1, "blue");
		block.createBlock(3, 10, 9, 2, "red");
		block.createBlock(17, 10.1, 5, 1.8, "normal"); //mid passthrough blocker
		block.createBlock(14, 11, 8, 1, "red"); //mid bars
		block.createBlock(17, 10, 8, 1, "blue"); //mid bars
		block.createBlock(27, 10, 9, 2, "blue");
		block.createBlock(4, 17.1, 1, 2.9, "red");
		block.createBlock(2, 17, 3, 1, "red");
		block.createBlock(8, 16, 1, 6.5, "normal");
		block.createBlock(12, 16, 3, 1, "normal");
		block.createBlock(17, 16, 7, 6, "normal");
		block.createBlock(8, 20, 16, 2.5, "normal");
		block.createBlock(29, 16, 7, 1, "normal");
		block.createBlock(29, 19, 7, 3, "normal");
		block.createBlock(29, 20, 10.5, 2.5, "normal");	

		block.createBlock(-1/2, mapHeight/75, (mapWidth + 75)/75, 1/2, "normal"); //Bottom
		block.createBlock(-1/2, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Left
		block.createBlock(mapWidth/75, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Right
		block.createBlock(-1/2, -1/2, (mapWidth + 75)/75, 1/2, "normal");	//Top
		
		/*
		block.createBlock(-100/75, (mapHeight - 10)/75, (mapWidth + 400)/75, 200/75); //Bottom
		block.createBlock((-200 + 10)/75, -200/75, 200/75, (mapHeight + 400)/75); //Left
		block.createBlock((mapWidth - 10)/75, -200/75, 200/75, (mapHeight + 400)/75); //Right
		block.createBlock(-200/75, (-200 + 10)/75, (mapWidth + 400)/75, 200/75);	//Top		
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
		
		block.createBlock(4, 3, 2, 2, "normal");	
		block.createBlock(4, 7, 2, 2, "normal");	
		block.createBlock(-0.5, 7, 2.5, 2, "normal");	
		block.createBlock(6, 15, 1, 7, "red");	
		block.createBlock(3, 15, 4, 1, "red");	
		block.createBlock(2, 21, 5, 1, "red");	
		block.createBlock(2, 24, 1, 4, "red");	
		block.createBlock(2, 27, 4, 1, "red");	
		block.createBlock(13, 18, 1, 4, "red");	
		block.createBlock(10, 27, 4, 1, "normal");	
		block.createBlock(10, 3, 4.9, 1, "normal");	
		block.createBlock(10, 5, 4.9, 1, "normal");	
		block.createBlock(14, -0.5, 1, 4.5, "normal");	
		block.createBlock(14.1, 8, 4.9, 1, "normal");	
		block.createBlock(14, 5, 1, 4, "normal");	
		block.createBlock(22, 8, 4.9, 1, "normal");	
		block.createBlock(26.1, 3, 4.9, 1, "normal");	
		block.createBlock(26, -0.5, 1, 4.5, "normal");	
		block.createBlock(26.1, 5, 4.9, 1, "normal");	
		block.createBlock(26, 5, 1, 4, "normal");	
		block.createBlock(35, 3, 2, 2, "normal");	
		block.createBlock(35, 7, 2, 2, "normal");	
		block.createBlock(39, 7, 2.5, 2, "normal");	
		block.createBlock(27, 18, 1, 4, "blue");	
		block.createBlock(34, 15, 1, 7, "blue");	
		block.createBlock(34, 15, 4, 1, "blue");	
		block.createBlock(34, 21, 5, 1, "blue");	
		block.createBlock(38, 24, 1, 4, "blue");	
		block.createBlock(35, 27, 4, 1, "blue");	
		block.createBlock(27, 27, 4, 1, "normal");	
		block.createBlock(17, 28, 7, 2.5, "normal");	
		block.createBlock(17, 21, 2, 2, "normal");	
		block.createBlock(22, 21, 2, 2, "normal");	
		block.createBlock(17, 22, 7, 5, "normal");	
		block.createBlock(20, 12, 1, 6, "normal");	
		block.createBlock(17, 17, 7, 2, "normal");	

		block.createBlock(-1/2, mapHeight/75, (mapWidth + 75)/75, 1/2, "normal"); //Bottom
		block.createBlock(-1/2, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Left
		block.createBlock(mapWidth/75, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Right
		block.createBlock(-1/2, -1/2, (mapWidth + 75)/75, 1/2, "normal");	//Top
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
		
			
		//block.createBlocks
		block.createBlock(40, 14, 2, 5.8, "normal");	
		block.createBlock(10, 6, 2, 6, "normal");	
		block.createBlock(4, 11, 2, 1, "red");	
		block.createBlock(4, 14, 2, 1, "red");	
		block.createBlock(46, 11, 2, 1, "blue");	
		block.createBlock(46, 14, 2, 1, "blue");	
		block.createBlock(19, -0.5, 2, 2.5, "normal");	
		block.createBlock(22, 1, 2, 1, "normal");	
		block.createBlock(24, 1, 5.1, 1, "pushDown");
		block.createBlock(29, -0.5, 23.4, 2.5, "normal");	
		block.createBlock(17, 4, 1, 3, "red");	
		block.createBlock(44, 3, 2, 2, "normal");	
		block.createBlock(5,6, 8, 1, "red");	
		block.createBlock(15, 6, 3, 1, "red");	
		block.createBlock(34, 6, 13, 1, "blue");	
		block.createBlock(17, 7, 1, 2.1, "pushRight");	
		block.createBlock(24, 8, 1, 10, "pushLeft");	
		block.createBlock(27, 8, 1, 10, "pushRight");	
		block.createBlock(34, 7, 1, 2.1, "pushLeft");	
		block.createBlock(46, 6, 1, 14, "blue");	
		block.createBlock(14, 9, 1, 8, "normal");	
		block.createBlock(17, 9, 1, 3, "red");	
		block.createBlock(20, 8, 2, 3, "normal");	
		block.createBlock(34, 9, 1, 3, "blue");	
		block.createBlock(37, 9, 1, 8, "normal");	
		block.createBlock(40, 9, 2, 3, "normal");	
		block.createBlock(5, 6, 1, 14, "red");	
		block.createBlock(10, 14, 2, 3, "normal");	
		block.createBlock(17, 14, 1, 3, "red");	
		block.createBlock(30, 15, 2, 3, "normal");	
		block.createBlock(34, 14, 1, 3, "blue");	
		block.createBlock(5, 19, 13, 1, "red");	
		block.createBlock(17, 17, 1, 2, "pushRight");	
		block.createBlock(34, 17, 1, 2.1, "pushLeft");	
		block.createBlock(6, 21, 2, 2, "normal");	
		block.createBlock(34, 19, 3, 1, "blue");	
		block.createBlock(39, 19, 8, 1, "blue");	
		block.createBlock(34, 19, 1, 3, "blue");	
		block.createBlock(-0.4, 24, 23.4, 2.4, "normal");	
		block.createBlock(23, 24, 5.1, 1, "pushUp");	
		block.createBlock(28, 24, 2, 1, "normal");	
		block.createBlock(31, 24, 2, 2.5, "normal");	
		
		block.createBlock(4, 12, 1, 2, "warp1");	
		block.createBlock(47, 12, 1, 2, "warp2");	
		warp1X = 48.1 * 75;
		warp1Y = 13 * 75;
		warp2X = 3.9 * 75;
		warp2Y = 13 * 75;


		block.createBlock(-1/2, mapHeight/75, (mapWidth + 75)/75, 1/2, "normal"); //Bottom
		block.createBlock(-1/2, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Left
		block.createBlock(mapWidth/75, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Right
		block.createBlock(-1/2, -1/2, (mapWidth + 75)/75, 1/2, "normal");	//Top
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
		
		block.createBlock(3, 6, 2, 2, "normal");	
		block.createBlock(3, 6, 2, 2, "normal");	
		block.createBlock(3, 6, 2, 2, "normal");	
		block.createBlock(3, 6, 2, 2, "normal");	
		block.createBlock(3, 6, 2, 2, "normal");	

		block.createBlock(-1/2, mapHeight/75, (mapWidth + 75)/75, 1/2, "normal"); //Bottom
		block.createBlock(-1/2, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Left
		block.createBlock(mapWidth/75, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Right
		block.createBlock(-1/2, -1/2, (mapWidth + 75)/75, 1/2, "normal");	//Top
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

		block.createBlock(550/75, 200/75, 600/75, 75/75, "normal");
		block.createBlock(-50/75, 275/75, 350/75, 900/75, "normal");
		block.createBlock((mapWidth - 400 - 750)/75, (mapHeight - 75 - 200)/75, 600/75, 75/75, "normal");
		block.createBlock((mapWidth - 300)/75, (mapHeight - 900 - 450 + 175)/75, 350/75, 900/75, "normal");
		block.createBlock((mapWidth/2 - 37)/75, (mapHeight/2 - 250)/75, 75/75, 500/75, "normal"); //Middle beam
		block.createBlock(-20/75, 235/75, 70/75, 50/75, "normal"); //BM nub white
		block.createBlock((mapWidth - 50)/75, (mapHeight - 285)/75, 70/75, 50/75, "normal"); //BM nub black

		block.createBlock(-50/75, mapHeight/75, (mapWidth + 100)/75, 50/75, "normal"); //Bottom
		block.createBlock(-50/75, -50/75, 50/75, (mapHeight + 100)/75, "normal"); //Left
		block.createBlock(mapWidth/75, -50/75, 50/75, (mapHeight + 100)/75, "normal"); //Right
		block.createBlock(-50/75, -50/75, (mapWidth + 100)/75, 50/75, "normal");	//Top
	}
	
}

module.exports.initializePickups = initializePickups;
module.exports.initializeBlocks = initializeBlocks;
