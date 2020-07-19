console.log("home.js loading");

page = "home";
initializePage();
function initializePage(){
    showLocalElements();
	populateLeaderboard();
	getTokenFromUrlParameterAndLogin(); 
    getServerList();
}

function populateLeaderboard(){
	if (document.getElementById('tablePrint')){
		$.post('/getLeaderboard', {}, function(res,status){
			var leaderboardHTML= "<table class='leaderboard'><tr><th>Rank</th><th style='width: 900px;'>Username</th><th>Rating</th><th>Kills</th><th>Capts</th><th>Wins</th><th>Exp</th></tr>";
			for (let i = 0; i < res.length; i++) {
				leaderboardHTML+="<tr><td style='background-color: #728498; text-align: center; font-weight: bold;'>" + (i + 1) + "</td><td><a href='{{serverHomePage}}user/"+res[i].cognitoSub+"'>" + res[i].username + "</td><td>" + res[i].rating + "</td><td>" + res[i].kills + "</td><td>" + res[i].captures + "</td><td>" + res[i].gamesWon + "</td><td>" + res[i].experience + "</td></tr>";			
			}		
			leaderboardHTML = leaderboardHTML.replace(/{{serverHomePage}}/g, serverHomePage);
			leaderboardHTML+="</table>";
		
			document.getElementById('tablePrint').innerHTML = leaderboardHTML;
		});
	}	
}

function getServerList(){
	$.post('/getServerList', {}, function(data,status){
		console.log("Get server list response:");
		console.log(data);		

		var serversHTML = "";
		for (let j = 0; j < data.length; j++) {
			serversHTML += '<div class="serverSelectButton" onclick="getJoinableServer({server:\'' + data[j].url + '\'})" style="cursor: pointer;">' + data[j].serverName + '<br><span style="font-size: 12;text-shadow: none;">' + data[j].gametype + ' -- ' + data[j].currentPlayers + '/' + data[j].maxPlayers + ' Players</span></div>';
		}		
		document.getElementById("serverList").innerHTML = serversHTML;
	});
}
console.log("home.js loaded");
