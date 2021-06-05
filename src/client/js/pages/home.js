console.log("home.js loading");

page = "home";
initializePage();
function initializePage(){
    showLocalElements();
	getTokenFromUrlParameterAndLogin();     
}

function loginSuccess(){
	hide("serverLoginButtons");
	showAuthorizedLoginButtons();            
	getRequests();
	getServerList();
}

function loginFail(){
	showDefaultLoginButtons();
}

function loginAlways(){
	populateLeaderboard();
	showUnset("mainContent");
}

function populateLeaderboard(){
	console.log("POPULATING LEADERBOARD: " + serverHomePage);
	if (document.getElementById('tablePrint')){
		$.post('/getLeaderboard', {}, function(res,status){
			var leaderboardHTML= "<table class='statsTable' id='leaderboard'><tr><th>Rank</th><th style='width: 900px;'>Username</th><th>Rating</th><th>Kills</th><th>Capts</th><th>Wins</th><th>Exp</th></tr>";
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

		serversHTML += '<div class="serverSelectButton customServerButton" onclick="getAndShowCustomServerHTML()">+Create Custom Server</div>';
		for (let j = 0; j < data.length; j++) {
			var serverNameHtml = "";
			var serverName = data[j].serverName;
			if (serverName && typeof serverName != 'undefined'){
				serverNameHtml += data[j].serverName + '<br>';
			}
			if ((data[j].instanceId == "local" && isLocal) || (data[j].instanceId != "local" && !isLocal)){
				var buttonClassName = "serverSelectButton";
				if (data[j].gametype == "horde"){
					buttonClassName = "hordeServerSelectButton"
				}
				if (data[j].customServer){
					buttonClassName = "customServerSelectButton"
				}
				serversHTML += '<div class="' + buttonClassName + ' RWButton" onclick="getJoinableServer({server:\'' + data[j].url + '\'})">' + serverNameHtml + data[j].serverSubName + '<br><span style="font-size: 12;text-shadow: none;">' + data[j].currentPlayers + '/' + data[j].maxPlayers + ' Players</span></div>';
			}
		}		
		document.getElementById("serverList").innerHTML = serversHTML;
	});
}

function getAndShowCustomServerHTML(){
	hide("tablePrint");
	document.getElementById("sectionTitle2").innerHTML = "";

	$.post('/getCustomServerHTML', {}, function(data,status){
		console.log("getCustomServerHTML response:");
		console.log(data);		
		if (data.HTML)
			document.getElementById("leaderboards").innerHTML =	data.HTML;
	});
}

function createServerClick(){
	var params = {settings:[]};
	var settings = document.getElementsByClassName("customServerSettingInput");
	params.createdByCognitoSub = cognitoSub;

	for (var s in settings){
		let pushMe;
		switch(settings[s].type){
			case "checkbox":
				pushMe = {};
				pushMe.name = settings[s].id;
				pushMe.value = settings[s].checked;
				pushMe.type = 1;
				break;
			case "text":
				pushMe = {};
				pushMe.name = settings[s].id;
				pushMe.value = settings[s].value ? settings[s].value : settings[s].placeholder;
				pushMe.type = 2;
				break;
			default:
				break;
		}
		if (pushMe)
			params.settings.push(pushMe);
		
	}

	// var params = {
	// 	settings: [
	// 		{name: "minutesLeft", value: 8},
	// 		{name: "laserPushSpeed", value: 8},
	// 		{name: "customServer", value: true}
	// 	]
	// }


    $.post("/sendUpdateRequestToGameServer", params, function(data,status){
		console.log("sendUpdateRequestToGameServer response");
		console.log(data);
		if (data.server)
			getJoinableServer({server:data.server});
		else 
			alert(data.msg.message);
    });
}


function createServerCancelClick(){
	window.location.reload();
}

function showAdvancedCustomSettings(){
	show("advancedCustomSettings");
	hide("advancedSettingsLink");
}

console.log("home.js loaded");
