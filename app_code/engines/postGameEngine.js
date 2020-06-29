var getRankFromRating = function(rating){
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
		var rPlus = parseInt(r)+1;
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

var getLevelFromExperience = function(experience){
	var pointsBetweenThisLevelAndNext = 2500;
	var additionalPointsBetweenLevels = 2500; //This never gets updated. It is whats added to pointsBetweenLevels, which increases the higher the level.
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

module.exports.getRankFromRating = getRankFromRating;
module.exports.getLevelFromExperience = getLevelFromExperience;
