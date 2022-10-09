var pickup = require('../entities/pickup.js');
var block = require('../entities/block.js');

//buildMap generateMap
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
	else if (gametype == "horde" || (pregame && pregameIsHorde)){

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
		bagRed.homeX = 3*75; //Exact coordinates
		bagRed.homeY = 19*75;
		bagBlue.homeX = 36*75;
		bagBlue.homeY = 3*75;
		if (gametype != "elim"){
			pickup.createPickup(Math.random(), 16, 11, 5, 75, 60); //Body Armor //put in coordinates for bottom right corner of pickup
			pickup.createPickup(Math.random(), 24, 12, 5, 75, 60); //Body Armor
			pickup.createPickup(Math.random(), 13, 2, 3, MGClipSize*2, 45); //MG
			pickup.createPickup(Math.random(), 27, 21, 3, MGClipSize*2, 45); //MG
			pickup.createPickup(Math.random(), 29, 4, 4, SGClipSize*2, 60); //SG
			pickup.createPickup(Math.random(), 11, 19, 4, SGClipSize*2, 60); //SG
			pickup.createPickup(Math.random(), 2, 12, 6, laserClipSize, 90); //Laser
			pickup.createPickup(Math.random(), 38, 11, 6, laserClipSize, 90); //Laser
			pickup.createPickup(Math.random(), 4, 17, 2, DPClipSize*3, 30); //DP
			pickup.createPickup(Math.random(), 36, 6, 2, DPClipSize*3, 30); //DP
		}

		pickup.createPickup(Math.random(), 2, 4, 1, 50, 10); //MD
		pickup.createPickup(Math.random(), 38, 19, 1, 50, 10); //MD		
	}
	else if (map == "thepit"){
		bagRed.homeX = 5*75;
		bagRed.homeY = 17*75;
		bagBlue.homeX = 36*75;
		bagBlue.homeY = 17*75;
		if (gametype != "elim"){
			pickup.createPickup(Math.random(), 21, 22, 5, 75, 45); //Body Armor
			pickup.createPickup(Math.random(), 21, 2, 6, laserClipSize, 90); //Laser
			pickup.createPickup(Math.random(), 21, 28, 3, MGClipSize*2, 45); //MG
			pickup.createPickup(Math.random(), 3, 29, 4, SGClipSize*2, 40); //SG
			pickup.createPickup(Math.random(), 39, 29, 4, SGClipSize*2, 40); //SG
			pickup.createPickup(Math.random(), 5, 20, 2, DPClipSize*3, 25); //DP
			pickup.createPickup(Math.random(), 37, 20, 2, DPClipSize*3, 25); //DP
		}
		pickup.createPickup(Math.random(), 4, 7, 1, 50, 10); //MD
		pickup.createPickup(Math.random(), 38, 7, 1, 50, 10); //MD

	}
	else if (map == "crik"){
		bagRed.homeX = 7*75;
		bagRed.homeY = 13*75;
		bagBlue.homeX = 45*75;
		bagBlue.homeY = 13*75;
		if (gametype != "elim"){
			pickup.createPickup(Math.random(), 1, 13.5, 5, 75, 45); //Body Armor
			pickup.createPickup(Math.random(), 52, 13.5, 5, 75, 45); //Body Armor
			pickup.createPickup(Math.random(), 24, 26, 3, MGClipSize*2, 45); //MG
			pickup.createPickup(Math.random(), 29, 1, 3, MGClipSize*2, 45); //MG
			pickup.createPickup(Math.random(), 17, 6, 2, DPClipSize*2, 25); //DP
			pickup.createPickup(Math.random(), 14, 22, 2, DPClipSize*2, 25); //DP		
			pickup.createPickup(Math.random(), 39, 5, 2, DPClipSize*2, 25); //DP
			pickup.createPickup(Math.random(), 36, 21, 2, DPClipSize*2, 25); //DP		
			pickup.createPickup(Math.random(), 26.5, 13.5, 4, SGClipSize*2, 40); //SG
		}
		pickup.createPickup(Math.random(), 26.5, 4.5, 1, 50, 10); //MD
		pickup.createPickup(Math.random(), 26.5, 22.5, 1, 50, 10); //MD

	}	
	else if (map == "narrows"){
		bagRed.homeX = 4.5*75;
		bagRed.homeY = 5.5*75;
		bagBlue.homeX = 38.5*75;
		bagBlue.homeY = 57.5*75;
		if (gametype != "elim"){
			//red north
			pickup.createPickup(Math.random(), 33, 18, 5, 75, 45); //Body Armor
			pickup.createPickup(Math.random(), 41.5, 19, 3, MGClipSize*2, 45); //MG
			pickup.createPickup(Math.random(), 18, 8, 3, MGClipSize*2, 45); //MG
			pickup.createPickup(Math.random(), 27, 8, 2, DPClipSize*2, 25); //DP
			pickup.createPickup(Math.random(), 33, 9, 2, DPClipSize*2, 25); //DP		
			pickup.createPickup(Math.random(), 12, 9, 4, SGClipSize*2, 40); //SG

			pickup.createPickup(Math.random(), 22, 32, 6, 10, 60); //Laser

			//blue south
			pickup.createPickup(Math.random(), 11, 46, 5, 75, 45); //Body Armor
			pickup.createPickup(Math.random(), 26, 56, 3, MGClipSize*2, 45); //MG
			pickup.createPickup(Math.random(), 2.5, 45, 3, MGClipSize*2, 45); //MG
			pickup.createPickup(Math.random(), 11, 55, 2, DPClipSize*2, 25); //DP
			pickup.createPickup(Math.random(), 17, 56, 2, DPClipSize*2, 25); //DP		
			pickup.createPickup(Math.random(), 32, 55, 4, SGClipSize*2, 40); //SG

		}
		pickup.createPickup(Math.random(), 19, 3, 1, 50, 10); //MD
		pickup.createPickup(Math.random(), 22, 30, 1, 50, 10); //MD
		pickup.createPickup(Math.random(), 22, 34, 1, 50, 10); //MD
		pickup.createPickup(Math.random(), 25, 61, 1, 50, 10); //MD

	}	
	else if (map == "longNarrows"){
		bagRed.homeX = 3.5*75;
		bagRed.homeY = 5.5*75;
		bagBlue.homeX = 50.5*75;
		bagBlue.homeY = 81.5*75;
		if (gametype != "elim"){
			//red north
			pickup.createPickup(Math.random(), 38, 25, 5, 75, 45); //Body Armor
			pickup.createPickup(Math.random(), 49, 22, 3, MGClipSize*2, 45); //MG
			pickup.createPickup(Math.random(), 18, 13, 3, MGClipSize*2, 45); //MG
			pickup.createPickup(Math.random(), 35, 13, 2, DPClipSize*2, 25); //DP
			pickup.createPickup(Math.random(), 35, 16, 2, DPClipSize*2, 25); //DP		
			pickup.createPickup(Math.random(), 12, 10, 4, SGClipSize*2, 40); //SG

			pickup.createPickup(Math.random(), 27, 44, 6, 10, 60); //Laser

			//blue south
			pickup.createPickup(Math.random(), 16, 63, 5, 75, 45); //Body Armor
			pickup.createPickup(Math.random(), 5, 66, 3, MGClipSize*2, 45); //MG
			pickup.createPickup(Math.random(), 36, 75, 3, MGClipSize*2, 45); //MG
			pickup.createPickup(Math.random(), 19, 72, 2, DPClipSize*2, 25); //DP
			pickup.createPickup(Math.random(), 19, 75, 2, DPClipSize*2, 25); //DP		
			pickup.createPickup(Math.random(), 42, 78, 4, SGClipSize*2, 40); //SG

		}
		pickup.createPickup(Math.random(), 33, 85, 1, 50, 10); //MD
		pickup.createPickup(Math.random(), 27, 42, 1, 50, 10); //MD
		pickup.createPickup(Math.random(), 27, 46, 1, 50, 10); //MD
		pickup.createPickup(Math.random(), 21, 3, 1, 50, 10); //MD

	}	
	else if (map == "whirlpool"){
		bagRed.homeX = 10*75;
		bagRed.homeY = 18*75;
		bagBlue.homeX = 48*75;
		bagBlue.homeY = 18*75;
		if (gametype != "elim"){


			//red left
			pickup.createPickup(Math.random(), 10, 12, 2, DPClipSize*2, 25); //DP
			pickup.createPickup(Math.random(), 12, 26, 2, DPClipSize*2, 25); //DP		
			pickup.createPickup(Math.random(), 25, 7, 2, DPClipSize*2, 25); //DP
			pickup.createPickup(Math.random(), 17, 30, 2, DPClipSize*2, 25); //DP		
			pickup.createPickup(Math.random(), 20, 10, 3, MGClipSize*2, 45); //MG
			pickup.createPickup(Math.random(), 18, 21, 4, SGClipSize*2, 40); //SG
			pickup.createPickup(Math.random(), 24, 25, 6, 10, 60); //Laser

			pickup.createPickup(Math.random(), 29.5, 18.5, 5, 75, 60); //Body Armor

			//blue right
			pickup.createPickup(Math.random(), 47, 11, 2, DPClipSize*2, 25); //DP
			pickup.createPickup(Math.random(), 42, 7, 2, DPClipSize*2, 25); //DP		
			pickup.createPickup(Math.random(), 49, 25, 2, DPClipSize*2, 25); //DP
			pickup.createPickup(Math.random(), 34, 30, 2, DPClipSize*2, 25); //DP		
			pickup.createPickup(Math.random(), 39, 27, 3, MGClipSize*2, 45); //MG
			pickup.createPickup(Math.random(), 41, 16, 4, SGClipSize*2, 40); //SG
			pickup.createPickup(Math.random(), 35, 12, 6, 10, 60); //Laser
		}
		pickup.createPickup(Math.random(), 6, 5, 1, 50, 10); //MD
		pickup.createPickup(Math.random(), 6, 32, 1, 50, 10); //MD
		pickup.createPickup(Math.random(), 53, 5, 1, 50, 10); //MD
		pickup.createPickup(Math.random(), 53, 32, 1, 50, 10); //MD

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

///////////////////// INITIALIZE BLOCKS //////////////////////////////////////////////
var initializeBlocks = function(map){
	log("RESETTING MAP");

	block.clearBlockList();
	
	if (map == "empty"){
	}
	else if (gametype == "horde" || (pregame && pregameIsHorde)){
		mapWidth = 30*75;
		mapHeight = 30*75;
		
		for (var x = 0; x < 15; x++){
			var rngX = randomInt(0, Math.round((mapWidth/75)-1));
			var rngY = randomInt(0, Math.round((mapHeight/75)-1));
			block.createBlock(rngX,rngY, 1, 1, "normal"); //Bottom Left
		}

		//Spawn areas
		spawnXminBlack = mapWidth/2 - 500;
		spawnXmaxBlack = mapWidth/2 + 500;
		spawnYminBlack = mapHeight/2 - 500;
		spawnYmaxBlack = mapHeight/2 + 500;
		spawnXminWhite = mapWidth/2 - 500;
		spawnXmaxWhite = mapWidth/2 + 500;
		spawnYminWhite = mapHeight/2 - 500;
		spawnYmaxWhite = mapHeight/2 + 500;		

		var hordeHoleWidth = 4;
		var hordeHoleXDistFromEdge = 10;
		block.createBlock(-1/2, mapHeight/75, (mapWidth/75) - hordeHoleXDistFromEdge + 1/2, 1/2, "normal"); //Bottom Left
		block.createBlock(-1/2, -1/2, 1/2, (mapHeight/75) - hordeHoleXDistFromEdge + 1/2, "normal"); //Left Top
		block.createBlock(mapWidth/75, -1/2, 1/2, hordeHoleXDistFromEdge-2 + 1/2, "normal"); //Right Top
		block.createBlock(-1/2, -1/2, hordeHoleXDistFromEdge-2 + 1/2, 1/2, "normal");	//Top Left
		block.createBlock((mapWidth/75) - hordeHoleXDistFromEdge + hordeHoleWidth, mapHeight/75, hordeHoleXDistFromEdge - hordeHoleWidth, 1/2, "normal"); //Bottom Right
		block.createBlock(-1/2, (mapHeight/75) - hordeHoleXDistFromEdge + hordeHoleWidth, 1/2, hordeHoleXDistFromEdge - hordeHoleWidth, "normal"); //Left Bottom
		block.createBlock(mapWidth/75, hordeHoleXDistFromEdge-2 + hordeHoleWidth, 1/2, (mapHeight/75) - (hordeHoleXDistFromEdge-2 + hordeHoleWidth) + 1/2, "normal"); //Right Bottom
		block.createBlock(hordeHoleXDistFromEdge-2 + hordeHoleWidth, -1/2, (mapWidth/75) - (hordeHoleXDistFromEdge-2 + hordeHoleWidth) + 1/2, 1/2, "normal");	//Top Right
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

		block.createBlock(-1/2, mapHeight/75, (mapWidth + 75)/75, 1/2, "normal"); //Bottom
		block.createBlock(-1/2, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Left
		block.createBlock(mapWidth/75, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Right
		block.createBlock(-1/2, -1/2, (mapWidth + 75)/75, 1/2, "normal");	//Top


		block.createBlock(3, -0.5, 7, 3.5, "normal");
		block.createBlock(-0.5, -1, 10.5, 3, "normal");			
		block.createBlock(3, 5, 7, 1, "normal");
		block.createBlock(15, 0, 7, 6, "normal");
		block.createBlock(15, -1, 16, 3, "normal");
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
		block.createBlock(8, 20, 16, 3, "normal");
		block.createBlock(29, 16, 7, 1, "normal");
		block.createBlock(29, 19, 7, 3, "normal");
		block.createBlock(29, 20, 10.5, 3, "normal");	

		
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
		block.createBlock(17, 6.9, 1, 2.2, "pushRight");	
		block.createBlock(34, 6.9, 1, 2.2, "pushLeft");	
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

		block.createBlock(24, 8, 1, 10, "pushLeft");	
		block.createBlock(27, 8, 1, 10, "pushRight");	//middle bridge

		block.createBlock(17, 16.9, 1, 2.2, "pushRight");	
		block.createBlock(34, 16.9, 1, 2.2, "pushLeft");	
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
		block.createBlock(6, 21, 2, 2, "normal");	
		block.createBlock(34, 19, 3, 1, "blue");	
		block.createBlock(39, 19, 8, 1, "blue");	
		block.createBlock(34, 19, 1, 3, "blue");	
		block.createBlock(-0.4, 24, 23.4, 2.4, "normal");	
		block.createBlock(23, 24, 5.1, 1, "pushUp");	
		block.createBlock(28, 24, 2, 1, "normal");	
		block.createBlock(31, 24, 2, 2.5, "normal");	
		
		block.createBlock(4, 12, 1, 2, "warp", 48.1 * 75, 13 * 75);	
		block.createBlock(47, 12, 1, 2, "warp", 3.9 * 75, 13 * 75);	


		block.createBlock(-1/2, mapHeight/75, (mapWidth + 75)/75, 1/2, "normal"); //Bottom
		block.createBlock(-1/2, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Left
		block.createBlock(mapWidth/75, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Right
		block.createBlock(-1/2, -1/2, (mapWidth + 75)/75, 1/2, "normal");	//Top
	}	
	else if (map == "narrows"){
		mapWidth = 43*75;
		mapHeight = 63*75;
		
		//Spawn areas
		spawnXminWhite = 3*75;
		spawnXmaxWhite = 42*75;
		spawnYminWhite = 10;
		spawnYmaxWhite = 16*75;

		spawnXminBlack = 1*75;
		spawnXmaxBlack = 40*75;
		spawnYminBlack = 44*75;
		spawnYmaxBlack = 62*75;

		//pushblocks
		block.createBlock(13.9, 15, 1.1, 6, "pushDown");
		block.createBlock(28, 15, 1.1, 6, "pushDown");
		block.createBlock(13.9, 42, 1.1, 6, "pushUp");
		block.createBlock(28, 42, 1.1, 6, "pushUp");

			
		//red north
		block.createBlock(2.1, 7, 3, 3, "normal");	//plug
		block.createBlock(2, 0, 18, 1, "normal");	
		block.createBlock(2, 0, 15, 4, "normal");	
		block.createBlock(23, 0, 10, 1, "normal");	
		block.createBlock(25, 0, 18, 4, "normal");	
		block.createBlock(34, 0, 9, 7, "normal");	
		block.createBlock(42, 0, 1, 20, "normal");	
		block.createBlock(0, 0, 3, 14, "normal");

		block.createBlock(12, 5.1, 2, 3.9, "red");	
		block.createBlock(12, 5, 6, 2, "red");	

		block.createBlock(30, 5.1, 2, 3.9, "red");	
		block.createBlock(26, 5, 6, 2, "red");	

		//red warps
		block.createBlock(19.9, -0.1, 3.2, 1.2, "warp", 21.5*75, 26*75);	
		block.createBlock(11.9, 15.9, 1.2, 3.2, "warp", 31.1*75, 17.5*75);	
		block.createBlock(29.9, 15.9, 1.2, 3.2, "warp", 11.1*75, 17.5*75);	

		//right device
		block.createBlock(36.9, 15, 2.2, 29, "pushDown");
		block.createBlock(29, 15, 5, 1, "normal");	
		block.createBlock(29, 15, 1, 33, "normal");	
		block.createBlock(36, 13, 1, 31, "normal");	
		block.createBlock(39, 13, 1, 43, "normal");
		block.createBlock(39, 19, 4, 3, "normal");
		block.createBlock(29, 19, 8, 25, "normal");
		block.createBlock(29, 43, 8, 1, "normal");
		block.createBlock(29, 47, 5, 1, "normal");
		block.createBlock(37, 46, 3, 10, "normal");

		//left device
		block.createBlock(3.9, 19, 2.2, 29, "pushUp");
		block.createBlock(3, 7, 3, 10, "normal");	
		block.createBlock(9, 15, 5, 1, "normal");	
		block.createBlock(6, 19, 8, 25, "normal");	
		block.createBlock(13, 15, 1, 33, "normal");
		block.createBlock(0, 41, 4, 3, "normal");
		block.createBlock(6, 43, 8, 1, "normal");
		block.createBlock(9, 47, 5, 1, "normal");
		block.createBlock(3, 7, 1, 43, "normal");
		block.createBlock(6, 19, 1, 31, "normal");

		//center map

		block.createBlock(19, 22, 5, 1, "normal");	
		block.createBlock(20, 26, 1, 5, "red");	
		block.createBlock(22, 26, 1, 5, "red");	
		block.createBlock(20, 30, 3, 1, "red");	
		block.createBlock(20, 32, 3, 1, "blue");	
		block.createBlock(20, 32, 1, 5, "blue");	
		block.createBlock(22, 32, 1, 5, "blue");	
		block.createBlock(19, 40, 5, 1, "normal");	

		//Blue south
		block.createBlock(38, 53, 2.9, 3, "normal");	//plug
		block.createBlock(0, 43, 1, 20, "normal");	
		block.createBlock(0, 56, 9, 7, "normal");	
		block.createBlock(0, 59, 18, 4, "normal");	
		block.createBlock(0, 62, 20, 1, "normal");	
		block.createBlock(23, 62, 18, 1, "normal");	
		block.createBlock(40, 49, 3, 14, "normal");	
		block.createBlock(25, 59, 16, 4, "normal");	

		block.createBlock(11, 54, 2, 3.9, "blue");	
		block.createBlock(11, 56, 6, 2, "blue");	
		block.createBlock(29, 54, 2, 3.9, "blue");	
		block.createBlock(25, 56, 6, 2, "blue");	

		//blue warps
		block.createBlock(29.9, 43.9, 1.2, 3.2, "warp", 11.1*75, 45.5*75);	
		block.createBlock(11.9, 43.9, 1.2, 3.2, "warp", 31.1*75, 45.5*75);	
		block.createBlock(19.9, 61.9, 3.2, 1.2, "warp", 21.5*75, 37*75);

		// block.createBlock(-1/2, mapHeight/75, (mapWidth + 75)/75, 1/2, "normal"); //Bottom
		// block.createBlock(-1/2, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Left
		// block.createBlock(mapWidth/75, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Right
		// block.createBlock(-1/2, -1/2, (mapWidth + 75)/75, 1/2, "normal");	//Top
	}	
	else if (map == "longNarrows"){
		mapWidth = 53*75;
		mapHeight = 87*75;
		
		//Spawn areas
		spawnXminWhite = 1*75;
		spawnXmaxWhite = 50*75;
		spawnYminWhite = 1*75;
		spawnYmaxWhite = 20*75;

		spawnXminBlack = 3*75;
		spawnXmaxBlack = 46*75;
		spawnYminBlack = 67*75;
		spawnYmaxBlack = mapHeight - 75;

		//pushblocks
		block.createBlock(18.9, 20, 1.1, 6, "pushDown");
		block.createBlock(33, 20, 1.1, 6, "pushDown");
		block.createBlock(18.9, 61, 1.1, 6, "pushUp");
		block.createBlock(33, 61, 1.1, 6, "pushUp");

			
		//red north
		block.createBlock(0, 0, 23, 1, "normal");	
		block.createBlock(0, 0, 1, 14, "normal");	
		block.createBlock(0, 0, 19, 4, "normal");	
		block.createBlock(26, 0, 25, 1, "normal");	
		block.createBlock(31, 0, 20, 4, "normal");	
		block.createBlock(41, 0, 10, 8, "normal");	
		block.createBlock(50, 0, 3, 27, "normal");
		block.createBlock(0, 13, 7, 48, "normal");

		block.createBlock(12, 5.1, 3, 4.9, "red");	
		block.createBlock(12, 5, 8, 3, "red");	
		block.createBlock(17, 13, 4, 2, "red");	

		block.createBlock(37, 5.1, 3, 4.9, "red");	
		block.createBlock(33, 5, 7, 3, "red");	
		block.createBlock(31, 13, 4, 2, "red");	

		//red warps
		block.createBlock(22.9, -0.1, 3.2, 1.2, "warp", 26.5*75, 37*75);	
		block.createBlock(16.9, 22.9, 1.2, 3.2, "warp", 36.1*75, 24.5*75);	
		block.createBlock(34.9, 22.9, 1.2, 3.2, "warp", 16.9*75, 24.5*75);	

		//right device
		block.createBlock(43.9, 16, 2.2, 22, "pushDown");
		block.createBlock(43.9, 38, 2.2, 23, "pushDown");
		block.createBlock(46, 22, 5, 5, "normal");
		block.createBlock(37, 18, 3, 4.9, "normal");	
		block.createBlock(34, 20, 6, 3, "normal");	
		block.createBlock(43, 14, 1, 47, "normal");	
		block.createBlock(46, 14, 1, 60, "normal");
		block.createBlock(34, 26, 10, 35, "normal");
		block.createBlock(34, 64, 7, 3, "normal");
		block.createBlock(38, 64, 3, 5, "normal");
		block.createBlock(44, 63, 3, 11, "normal");

		//left device
		block.createBlock(6.9, 26, 2.2, 22, "pushUp");
		block.createBlock(6.9, 48, 2.2, 23, "pushUp");
		block.createBlock(2, 60, 5, 5, "normal");
		block.createBlock(6, 13, 3, 11, "normal");	
		block.createBlock(12, 18, 3, 4.9, "normal");	
		block.createBlock(12, 20, 7, 3, "normal");	
		block.createBlock(9, 26, 10, 35, "normal");
		block.createBlock(6, 13, 1, 60, "normal");
		block.createBlock(9, 26, 1, 47, "normal");
		block.createBlock(13.1, 64, 5.8, 3, "normal");
		block.createBlock(13, 64, 3, 5, "normal");

		//center map
		block.createBlock(18, 20, 1, 47, "normal");	//rails
		block.createBlock(34, 20, 1, 47, "normal");	

		block.createBlock(24, 28, 5, 1, "normal");	
		block.createBlock(25, 38, 1, 5, "red");	
		block.createBlock(27, 38, 1, 5, "red");	
		block.createBlock(25, 42, 3, 1, "red");	
		block.createBlock(25, 44, 1, 5, "blue");	
		block.createBlock(27, 44, 1, 5, "blue");	
		block.createBlock(25, 44, 3, 1, "blue");	
		block.createBlock(24, 58, 5, 1, "normal");	

		//Blue south
		block.createBlock(0, 60, 3, 27, "normal");	
		block.createBlock(2, 79, 10, 8, "normal");	
		block.createBlock(2, 83, 20, 4, "normal");	
		block.createBlock(2, 86, 25, 1, "normal");	
		block.createBlock(30, 86, 23, 1, "normal");	
		block.createBlock(34, 83, 19, 4, "normal");	
		block.createBlock(52, 73, 1, 14, "normal");	
		block.createBlock(46, 26, 7, 48, "normal");	

		block.createBlock(38, 77, 3, 4.9, "blue");	
		block.createBlock(34, 79, 7, 3, "blue");	
		block.createBlock(13, 77, 3, 4.9, "blue");	
		block.createBlock(13, 79, 7, 3, "blue");	
		block.createBlock(18, 72, 4, 2, "blue");	
		block.createBlock(32, 72, 4, 2, "blue");	

		//blue warps
		block.createBlock(16.9, 60.9, 1.2, 3.2, "warp", 36.1*75, 62.5*75);	
		block.createBlock(34.9, 60.9, 1.2, 3.2, "warp", 16.9*75, 62.5*75);	
		block.createBlock(26.9, 85.9, 3.2, 1.2, "warp", 26.5*75, 49.5*75);

		// block.createBlock(-1/2, mapHeight/75, (mapWidth + 75)/75, 1/2, "normal"); //Bottom
		// block.createBlock(-1/2, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Left
		// block.createBlock(mapWidth/75, -1/2, 1/2, (mapHeight + 75)/75, "normal"); //Right
		// block.createBlock(-1/2, -1/2, (mapWidth + 75)/75, 1/2, "normal");	//Top
	}	
	else if (map == "whirlpool"){
		mapWidth = 58*75;
		mapHeight = 36*75;
		
		//Spawn areas
		spawnXminBlack = 40 * 75;
		spawnXmaxBlack = 54 * 75;
		spawnYminBlack = 3 * 75;
		spawnYmaxBlack = 33 * 75;
		
		spawnXminWhite = 4 * 75;
		spawnXmaxWhite = 18 * 75;
		spawnYminWhite = 3 * 75;
		spawnYmaxWhite = 33 * 75;
		
		//push blocks
		block.createBlock(0.9, -0.1, 9.1, 2.2, "pushRight");
		block.createBlock(10, -0.1, 9, 2.2, "pushRight");
		block.createBlock(19, -0.1, 9, 2.2, "pushRight");
		block.createBlock(28, -0.1, 9, 2.2, "pushRight");
		block.createBlock(37, -0.1, 9, 2.2, "pushRight");
		block.createBlock(46, -0.1, 9, 2.2, "pushRight");

		block.createBlock(54.9, 0, 2.2, 5, "pushDown");
		block.createBlock(54.9, 5, 2.2, 6, "pushDown");
		block.createBlock(54.9, 11, 2.2, 6, "pushDown");
		block.createBlock(54.9, 19, 2.2, 7, "pushDown");
		block.createBlock(54.9, 26, 2.2, 8, "pushDown");

		block.createBlock(3, 33.9, 9, 2.2, "pushLeft");
		block.createBlock(12, 33.9, 9, 2.2, "pushLeft");
		block.createBlock(21, 33.9, 9, 2.2, "pushLeft");
		block.createBlock(30, 33.9, 9, 2.2, "pushLeft");
		block.createBlock(39, 33.9, 9, 2.2, "pushLeft");
		block.createBlock(48, 33.9, 9.1, 2.2, "pushLeft");

		block.createBlock(0.9, 2, 2.2, 5, "pushUp");
		block.createBlock(0.9, 7, 2.2, 5, "pushUp");
		block.createBlock(0.9, 12, 2.2, 5, "pushUp");
		block.createBlock(0.9, 19, 2.2, 5, "pushUp");
		block.createBlock(0.9, 24, 2.2, 6, "pushUp");
		block.createBlock(0.9, 30, 2.2, 6, "pushUp");

		block.createBlock(3, 16.9, 1, 2.2, "pushLeft");
		block.createBlock(54, 16.9, 1, 2.2, "pushRight");

		//Outside walls
		block.createBlock(0, 0, 1, mapHeight/75, "normal"); //left wall
		block.createBlock(3, 2, 1, 15, "normal");			
		block.createBlock(3, 19, 1, 15, "normal");			

		block.createBlock(3, 2, 25, 1, "normal");//Top wall	
		block.createBlock(30.1, 2, 24.9, 1, "normal");			
		block.createBlock(30, 1, 1, 2, "normal");			

		block.createBlock(54, 2, 1, 15, "normal"); //right wall			
		block.createBlock(54, 19, 1, 15, "normal");			
		block.createBlock(57, -0.5, 1, mapHeight/75 + 1, "normal");			

		block.createBlock(3, 33, 24.9, 1, "normal");//bottom wall
		block.createBlock(30, 33, 25, 1, "normal");		
		block.createBlock(27, 33, 1, 2, "normal");		
		
		block.createBlock(0, -0.6, (mapWidth)/75, 1/2, "normal");	//Top
		block.createBlock(0, mapHeight/75 - 0.1, (mapWidth)/75, 1/2, "normal"); //Bottom



		//Red Left
		block.createBlock(12, 4, 4, 1, "red");			
		block.createBlock(12, 4, 1, 4, "red");			

		block.createBlock(22, 5, 4, 1, "red");			
		block.createBlock(25, 5, 1, 4, "red");			

		block.createBlock(18, 10, 4, 1, "red");			
		block.createBlock(18, 7, 1, 4, "red");			

		block.createBlock(8, 12, 4, 1, "red");			
		block.createBlock(8, 9, 1, 4, "red");			

		block.createBlock(7, 15, 5, 1, "red"); //base			
		block.createBlock(11, 15, 1, 6, "red");			
		block.createBlock(7, 20, 5, 1, "red");			

		block.createBlock(16, 15, 4, 1, "red");			

		block.createBlock(23, 16, 4, 1, "red");			
		block.createBlock(26, 13, 1, 4, "red");			

		block.createBlock(15, 19, 3.9, 1, "red");			
		block.createBlock(18, 19, 1, 4, "red");			

		block.createBlock(9, 26, 4, 1, "red");			
		block.createBlock(12, 23, 1, 4, "red");			

		block.createBlock(21, 25, 4, 1, "red");			
		block.createBlock(24, 22, 1, 4, "red");			

		block.createBlock(15, 30, 4, 1, "red");			
		block.createBlock(15, 27, 1, 4, "red");			

		//Blue Right
		block.createBlock(39, 5, 3.9, 1, "blue");			
		block.createBlock(42, 5, 1, 4, "blue");			

		block.createBlock(45, 9, 4, 1, "blue");			
		block.createBlock(45, 9, 1, 4, "blue");			

		block.createBlock(33.1, 10, 3.9, 1, "blue");			
		block.createBlock(33, 10, 1, 4, "blue");			

		block.createBlock(39, 16, 4, 1, "blue");			
		block.createBlock(39, 13, 1, 4, "blue");			

		block.createBlock(46, 15, 5, 1, "blue"); //base			
		block.createBlock(46, 15, 1, 6, "blue");			
		block.createBlock(46, 20, 5, 1, "blue");			

		block.createBlock(38, 20, 4, 1, "blue");			

		block.createBlock(31, 19, 4, 1, "blue");			
		block.createBlock(31, 19, 1, 4, "blue");			

		block.createBlock(46, 23, 3.9, 1, "blue");			
		block.createBlock(49, 23, 1, 4, "blue");			

		block.createBlock(36, 25, 4, 1, "blue");			
		block.createBlock(39, 25, 1, 4, "blue");			

		block.createBlock(32, 30, 4, 1, "blue");			
		block.createBlock(32, 27, 1, 4, "blue");			

		block.createBlock(42, 31, 4, 1, "blue");			
		block.createBlock(45, 28, 1, 4, "blue");			

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
