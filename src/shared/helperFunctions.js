//globalHelperFunctions global helper functions sharedHelperF shared helper



global.minutesLeft = 9;
global.secondsLeft = 99;
global.gameMinutesLength = 5;
global.gameSecondsLength = 0;
global.scoreToWin = 0;
global.whiteScore = 0;
global.blackScore = 0;

global.isGameInFullSwing = function(currentTimeLeft = false, matchTime = false, currentHighestScore = false, scoreToWinGame = false){
	if (!currentTimeLeft){
		currentTimeLeft = (minutesLeft * 60) + secondsLeft;
	}
	if (!matchTime){
		matchTime = (gameMinutesLength * 60) + gameSecondsLength;
	}
	if (!currentHighestScore){
		currentHighestScore = whiteScore > blackScore ? whiteScore : blackScore;
	}
	if (!scoreToWinGame){
		scoreToWinGame = scoreToWin == false ? 0 : scoreToWin;
	}

	log("isGameInFullSwing? currentTimeLeft:" + currentTimeLeft + " matchTime:" + matchTime + " currentHighestScore:" + currentHighestScore + " scoreToWinGame:" + scoreToWinGame);

	if (typeof joinActiveGameThreshold === 'undefined')
		var joinActiveGameThreshold = 0.5;

		var tfract = (currentTimeLeft / matchTime);
		var sfract = (currentHighestScore/scoreToWinGame);

	log("Time left fraction" + tfract + " must be less than " + joinActiveGameThreshold);
	log("Score left fraction" + sfract + " must be less than " + joinActiveGameThreshold);

	if (matchTime != 0 && tfract < joinActiveGameThreshold){
		log("game is in FullSwing cause time too low: true");
		return true;
	}
	if (scoreToWin != 0 && sfract > joinActiveGameThreshold){
		log("game is in FullSwing cause score too high: true");
		return true;
	}

	log("game is in NOT FullSwing: false");
	return false;
}

global.removeCognitoSubFromArray = function(incomingUsers, cognitoSub){
	var updatedIncomingUsers = [];
	
	for (var u = 0; u < incomingUsers.length; u++){
		if (typeof incomingUsers[u].cognitoSub != 'undefined' && incomingUsers[u].cognitoSub != cognitoSub){
			updatedIncomingUsers.push(incomingUsers[u]);
		}
	}
	
	return updatedIncomingUsers;
}

global.getSocketIdFromCognitoSub = function(cognitoSub){
	for(var s in SOCKET_LIST){
		if (SOCKET_LIST[s].cognitoSub == cognitoSub){
			return 	SOCKET_LIST[s].id;
		}
	}	
	return false;
}

global.getCurrentPlayersFromUsers = function(users){
	var players = [];
	
	if (typeof users === "undefined"){
		return players;
	}
	
	for (var u = 0; u < users.length; u++){
		if (users[u].team){
			players.push(users[u]);
		}
	}
	return players;
}

global.removeDuplicates = function(array){
	array = array.filter((item, index) => { //SELECT //WHERE
		return array.indexOf(item) === index;
	});
	return array;
}

global.removeIndexesFromArray = function(array, indexes){
	for (var i = indexes.length-1; i >= 0; i--){
		array.splice(indexes[i],1);
	}
	return array;
}

global.comparePartySize = function(a,b) { //order
  if (a.partySize < b.partySize)
    return 1;
  if (a.partySize > b.partySize)
    return -1;
  return 0;
}

global.comparePartySizeAsc = function(a,b) { //order
  if (a.partySize > b.partySize)
    return 1;
  if (a.partySize < b.partySize)
    return -1;
  return 0;
}

global.compareCurrentPlayerSize = function(a,b) { //order
	var aCurrentPlayers = getCurrentPlayersFromUsers(a.currentUsers).length;
	var bCurrentPlayers = getCurrentPlayersFromUsers(b.currentUsers).length;
	
	var aPort = a.url.substring(a.url.length - 4);
	var bPort = b.url.substring(b.url.length - 4);
	
	var aIsCustom = a.customServer;
	var bIsCustom = b.customServer;
	
  if (aCurrentPlayers < bCurrentPlayers)
    return 1;
  else if (aCurrentPlayers > bCurrentPlayers)
    return -1;
  else if (bIsCustom && !aIsCustom)
    return -1;
  else if (aIsCustom && !bIsCustom)
    return 1;
  else if (aPort < bPort)
    return -1;
  else if (aPort > bPort)
    return 1;
  else
	return 0;
}

global.parseINIString = function(data){
    var regex = {
        section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
        param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
        comment: /^\s*;.*$/
    };
    var value = {};
    var lines = data.split(/[\r\n]+/);
    var section = null;
    lines.forEach(function(line){
        if(regex.comment.test(line)){
            return;
        }else if(regex.param.test(line)){
            var match = line.match(regex.param);
            if(section){
                value[section][match[1]] = match[2];
            }else{
                value[match[1]] = match[2];
            }
        }else if(regex.section.test(line)){
            var match = line.match(regex.section);
            value[match[1]] = {};
            section = match[1];
        }else if(line.length == 0 && section){
            section = null;
        };
    });
    return value;
}

global.numberWithCommas = function(x) {
	if (x.typeOf == 'undefined'){
		return "";
	}
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

global.toCamelCase = function(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}


global.getProgressBarPercentage = function(value, floor, ceiling){
	value -= floor;
	ceiling -= floor;	
	return Math.round((value/ceiling) * 1000) / 1000;
}

global.getFullRankName = function(rank){
	switch(rank) {
		case "bronze1":
			return "Bronze I";
		case "bronze2":
			return "Bronze II";
		case "bronze3":
			return "Bronze III";
		case "silver1":
			return "Silver I";
		case "silver2":
			return "Silver II";
		case "silver3":
			return "Silver III";
		case "gold1":
			return "Gold I";
		case "gold2":
			return "Gold II";
		case "gold3":
			return "Gold III";
		case "diamond":
			return "Diamond";
		case "diamond2":
			return "Super Diamond";
		default:
			return "Bronze I";
	}
}

global.getDistance = function(entity1, entity2){
	if (!entity1){
		console.log("ERROR - getDistance:entity1 not defined");
	}
	if (!entity2){
		console.log("ERROR - getDistance:entity2 not defined");
	}
	var dx1 = entity1.x - entity2.x;
	var dy1 = entity1.y - entity2.y;
	return Math.round(Math.sqrt(dx1*dx1 + dy1*dy1) * 10)/10;	
}


global.checkIfBlocking = function(object, pointA, pointB){
	//intersect with top side of block?
	if (line_intersects(pointA.x, pointA.y, pointB.x, pointB.y, object.x, object.y, (object.x + object.width), object.y)){
		return true;
	}
	//intersect with bottom side of block?
	else if (line_intersects(pointA.x, pointA.y, pointB.x, pointB.y, object.x, (object.y + object.height), (object.x + object.width), (object.y + object.height))){
		return true;
	}
	//intersect with left side of block?
	else if (line_intersects(pointA.x, pointA.y, pointB.x, pointB.y, object.x, object.y, object.x, (object.y + object.height))){
		return true;
	}
	//intersect with right side of block?
	else if (line_intersects(pointA.x, pointA.y, pointB.x, pointB.y, (object.x + object.width), object.y, (object.x + object.width), (object.y + object.height))){
		return true;
	}
	//intersect with mid x axis of block? //for glitch where SG shoots through blocks if shooter & target are both up against block
	if (line_intersects(pointA.x, pointA.y, pointB.x, pointB.y, object.x, (object.y + object.height/2), (object.x + object.width), (object.y + object.height/2))){
		return true;
	}
	//intersect with mid y axis of block? //for glitch where SG shoots through blocks if shooter & target are both up against block
	else if (line_intersects(pointA.x, pointA.y, pointB.x, pointB.y, (object.x + object.width/2), object.y, (object.x + object.width/2), (object.y + object.height))){
		return true;
	}
	return false;
}

global.line_intersects = function(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y) {

    var s1_x, s1_y, s2_x, s2_y;
    s1_x = p1_x - p0_x;
    s1_y = p1_y - p0_y;
    s2_x = p3_x - p2_x;
    s2_y = p3_y - p2_y;

    var s, t;
    s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
    t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

    if (s > 0 && s < 1 && t > 0 && t < 1)
    {
        return true;
    }
	
    return false; // No collision
}

global.isNumBetween = function(numBetween, num1, num2){
	if (num1 <= numBetween && numBetween <= num2){
		return true;
	}
	else if (num1 >= numBetween && numBetween >= num2){
		return true;
	}
	return false
}

global.getCountInArray = function(string, array){
    var count = 0;
    if (!array || !array.length)
        return count;
    
    for (var i = 0; i < array.length; i++){
        if (array[i] == string)
            count++;
    }

	return count;
}

global.Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

global.randomInt = function(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

global.replaceValues = function(userData, content){
	for (var value in userData){
		content = content.replace("{{"+value+"}}", userData[value]);
	}
	return content;
}

global.getRankFromRating = function(rating){
	if (!rating)
		return {rank:"bronze1", floor:0, nextRank:"bronze2", ceiling:100};
		
	const rankings = [
		{rank:"bronze1",rating:0},
		{rank:"bronze2",rating:100},
		{rank:"bronze3",rating:200},
		{rank:"silver1",rating:300},
		{rank:"silver2",rating:500},
		{rank:"silver3",rating:700},
		{rank:"gold1",rating:1000},
		{rank:"gold2",rating:1300},
		{rank:"gold3",rating:1600},
		{rank:"diamond",rating:2000},
		{rank:"diamond2",rating:9999}
	];

	for (var r in rankings){
		var rPlus = parseInt(r)+1; //ToInt32
		var rMinus = parseInt(r)-1;
		if (rating < rankings[rPlus].rating){
			log(rankings[r].rank + " is his rank");
			var response = {rank:rankings[r].rank, floor:rankings[r].rating, previousRank:"bronze1", nextRank:"diamond2", ceiling:9999};
			if (rankings[rPlus]){
				response.nextRank = rankings[rPlus].rank;
				response.ceiling = rankings[rPlus].rating;
			}
			if (rankings[rMinus]){
				response.previousRank = rankings[rMinus].rank;
			}
			return response;
		}		
	}
	return {rank:"bronze1", floor:0, nextRank:"bronze2", ceiling:100};
}

global.getLevelFromExperience = function(experience){
	var pointsBetweenThisLevelAndNext = 1000;
	var additionalPointsBetweenLevels = 1000; //This never gets updated. It is whats added to pointsBetweenLevels, which increases the higher the level.
	var pointsForLevel = 0;
	var experienceProgressInfo = {};

	for (var x = 1; x < 99; x++){
		experienceProgressInfo.level = x;
		experienceProgressInfo.floor = pointsForLevel;
		experienceProgressInfo.ceiling = pointsForLevel + pointsBetweenThisLevelAndNext;

		if (experience < experienceProgressInfo.ceiling){
			return experienceProgressInfo;
		}

		pointsForLevel += pointsBetweenThisLevelAndNext;
		pointsBetweenThisLevelAndNext += additionalPointsBetweenLevels;
	}

	return {
		level: 99,
		floor: experience,
		ceiling: (experience + 1000000)
	};
}

global.getObjectiveText = function(){
	var objectiveText = "Kill enemy players to win!";
	if (customServer && pregame)
		objectiveText = "Type ./start to start the match!";
	else if (gametype == "ctf")
		objectiveText = "Capture the enemy's bag to win!";
	else if (gametype == "elim")
		objectiveText = "Eliminate the other team to win!";
	return objectiveText;
}

global.sleep = function(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
  }
