var appDir = ""; var searchingDir = __dirname + "/";
for (var x = 0; x < 9; x++){
	if (fs.existsSync(searchingDir + "app.js")) { break; }
	else { appDir += "../"; searchingDir += "../"; }}

const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
router.use(express.urlencoded({extended: true})); //To support URL-encoded bodies
router.use(cookieParser());

var dataAccessFunctions = require(appDir + 'app_code/data_access/dataAccessFunctions.js');
var gameEngine = require(appDir + 'app_code/engines/gameEngine.js');



//Homepage
router.get('/', function(req, res) {
	var pageData = {};

	dataAccessFunctions.getPublicServersFromDB(function(servers){
		var serversHtml = "";
		servers.sort(compareCurrentPlayerSize);
		
		for (let j = 0; j < servers.length; j++) {
			var currentPlayers = getCurrentPlayersFromUsers(servers[j].currentUsers).length;
			//<div class="serverSelectButton" onclick="location.href='http://3.19.27.250:3004/?join=true';" style="cursor: pointer;">PlayersChoice_1_3004<br><span style="font-size: 12;text-shadow: none;">Deathmatch -- 0/14 Players</span></div>
			var serverHtml = '<div class="serverSelectButton" onclick="getJoinableServer({server:\'' + servers[j].url + '\'})" style="cursor: pointer;">' + servers[j].serverName + '<br><span style="font-size: 12;text-shadow: none;">' + servers[j].gametype + ' -- ' + currentPlayers + '/' + servers[j].maxPlayers + ' Players</span></div>';
			//var serverHtml = '<a class="serverSelectLink" href="http://' + servers[j].url + '/?join=true" style="text-decoration: none;"><div class="serverSelectButton">' + servers[j].serverName + '<br><span style="font-size: 12;text-shadow: none;">' + servers[j].gametype + ' -- ' + currentPlayers + '/' + servers[j].maxPlayers + ' Players</span></div></a>';
			
			serversHtml += serverHtml;
		}		
		pageData["servers"] = serversHtml;
		pageData["header"] = fs.readFileSync(absAppDir + '/client/header.html', 'utf8');
		
		var homePageContent = fs.readFileSync(absAppDir + '/client/home.html', 'utf8');
		homePageContent = replaceValues(pageData, homePageContent);
		
		res.send(homePageContent);
	});	
});

//User profile page
router.get('/user/:cognitoSub', function(req, res) {
	var cognitoSub = req.params.cognitoSub;		
	
	dataAccessFunctions.getUserFromDB(cognitoSub, function(pageData){
		if (pageData){

			var rankProgressInfo = gameEngine.getRankFromRating(pageData["rating"]);
			var experienceProgressInfo = gameEngine.getLevelFromExperience(pageData["experience"]);

			pageData["username"] = pageData["username"].substring(0,15);
			pageData["playerLevel"] = experienceProgressInfo.level;
			pageData["levelProgressPercent"] = getProgressBarPercentage(pageData["experience"], experienceProgressInfo.floor, experienceProgressInfo.ceiling) * 100;
			pageData["expToNext"] = numberWithCommas(experienceProgressInfo.ceiling - pageData["experience"]);
			pageData["rank"] = rankProgressInfo.rank;
			pageData["rankFullName"] = getFullRankName(rankProgressInfo.rank);
			pageData["rankProgressPercent"] = getProgressBarPercentage(pageData["rating"], rankProgressInfo.floor, rankProgressInfo.ceiling) * 100;
			pageData["nextRank"] = rankProgressInfo.nextRank;
			pageData["nextRankFullName"] = getFullRankName(rankProgressInfo.nextRank);
			pageData["ratingToNext"] = rankProgressInfo.ceiling - pageData["rating"];
			pageData["experience"] = numberWithCommas(pageData["experience"]);
			pageData["header"] = fs.readFileSync(absAppDir + '/client/header.html', 'utf8');

			
			//logg("Requesting User Profile page with this data:");
			//logObj(pageData);

			var profilePageContent = fs.readFileSync(absAppDir + '/client/profile.html', 'utf8');
			profilePageContent = replaceValues(pageData, profilePageContent);

			res.send(profilePageContent);
		}
		else {
			var data = {};
			data["header"] = fs.readFileSync(absAppDir + '/client/header.html', 'utf8');
			var pageContent = replaceValues(data, fs.readFileSync(absAppDir + '/client/invalidUsername.html', 'utf8'));

			res.send(pageContent);
		}
	});	
});

//Player Search
router.get('/search/:searchText', function(req, res) {
	var searchText = req.params.searchText;		
	
	dataAccessFunctions.searchUserFromDB(searchText, function(searchRes){
		if (searchRes){
			
			var searchResultsHTML = "";
			for (var i = 0; i < searchRes.length; i++){
				if (searchRes[i].USERNAME){
					searchResultsHTML+="<a href='" + serverHomePage + "user/" + searchRes[i].cognitoSub + "'>" + searchRes[i].USERNAME + "</a><br>";
				}
				else {
					logg("ERROR ACQUIRING USERNAME:");
					logg(searchRes[i]);
				}
			}		
			var pageData = {};
			pageData["searchResults"] = searchResultsHTML;
			pageData["header"] = fs.readFileSync(absAppDir + '/client/header.html', 'utf8');
			var pageContent = fs.readFileSync(absAppDir + '/client/playerSearch.html', 'utf8');
			pageContent = replaceValues(pageData, pageContent);

			res.send(pageContent);
		}
		else {
			res.sendFile(absAppDir + '/client/playerSearch.html');
		}
	});	
});

module.exports = router;
