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
	console.log("gpu");
	console.log(gpu);
}

function populateLeaderboard(){
	console.log("POPULATING LEADERBOARD: " + serverHomePage);
	if (document.getElementById('tablePrint')){
		$.post('/getLeaderboard', {}, function(leaderboard,status){
			var leaderboardHTML = "";
			leaderboardHTML += getLeaderboardToggleHTML();
			leaderboardHTML += getLeaderboardTableHTML(leaderboard.rating, "rating", "experience", "block");
			leaderboardHTML += getLeaderboardTableHTML(leaderboard.exp, "experience", "rating", "none");
		
			document.getElementById('tablePrint').innerHTML = leaderboardHTML;
		});
	}	
}

function getLeaderboardTableHTML(leaderboard, primaryColumn, secondaryColumn, defaultDisplay){
	var leaderboardHTML = "";

	var primaryColumnLabel = "Rating";
	var secondaryColumnLabel = "$ Earned";

	if (primaryColumn == "rating"){
		primaryColumnLabel = "Rating";
	}
	else if (primaryColumn == "experience"){
		primaryColumnLabel = "$ Earned";
	}

	if (secondaryColumn == "rating"){
		secondaryColumnLabel = "Rating";
	}
	else if (secondaryColumn == "experience"){
		secondaryColumnLabel = "$ Earned";
	}

	var tableId = "leaderboard";
	if (primaryColumnLabel == "$ Earned"){
		tableId += "Exp";
	}
	else {
		tableId += primaryColumnLabel;
	}


	leaderboardHTML += "<table class='statsTable' style='display:" + defaultDisplay + ";' id='" + tableId + "'><tr><th>Rank</th><th style='width: 900px;'>Username</th><th>" + primaryColumnLabel + "</th><th>" + secondaryColumnLabel + "</th><th>Kills</th><th>Capts</th><th>Wins</th></tr>";
	for (let i = 0; i < leaderboard.length; i++) {
		leaderboardHTML+="<tr><td style='background-color: #728498; text-align: center; font-weight: bold;'>" + (i + 1) + 
		"</td><td><a href='{{serverHomePage}}user/"+leaderboard[i].cognitoSub+"'>" + 
		leaderboard[i].username + 
		"</td><td>" + leaderboard[i][primaryColumn] + 
		"</td><td>" + leaderboard[i][secondaryColumn] + 
		"</td><td>" + leaderboard[i].kills + 
		"</td><td>" + leaderboard[i].captures + 
		"</td><td>" + leaderboard[i].gamesWon + 
		"</td></tr>";			
	}		
	leaderboardHTML = leaderboardHTML.replace(/{{serverHomePage}}/g, serverHomePage);
	leaderboardHTML+="</table>";

	return leaderboardHTML;
}

function getLeaderboardToggleHTML(){
	var leaderboardHTML = "";
	leaderboardHTML += '<div class="columnTabContainer" id="leaderboardToggle">';
		leaderboardHTML += '<div class="columnTab active" id="leaderboardRatingTab" onclick="toggleLeaderboard(\'leaderboardRatingTab\')">';
			leaderboardHTML += '<img src="/src/client/img/icons/iconRank.png">';
			leaderboardHTML += '<span>Rating</span>';
		leaderboardHTML += '</div>';
		leaderboardHTML += '<div class="columnTab" id="leaderboardExpTab" onclick="toggleLeaderboard(\'leaderboardExpTab\')">';
			leaderboardHTML += '<img src="/src/client/img/icons/iconMoney.png">';
			leaderboardHTML += '<span>Cash Earned</span>';
		leaderboardHTML += '</div>';
	leaderboardHTML += '</div>';

	return leaderboardHTML;
}

function toggleLeaderboard(divId){
    var div = document.getElementById(divId);

    var tablinks = [ document.getElementById("leaderboardRatingTab"), document.getElementById("leaderboardExpTab") ]; 
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    div.className += " active";

    var ratingContent = document.getElementById("leaderboardRating");
    var expContent = document.getElementById("leaderboardExp");

    if (ratingContent && expContent){
        switch (divId){
            case "leaderboardRatingTab":
                ratingContent.style.display = "block";
                expContent.style.display = "none";
                break;
            case "leaderboardExpTab":
                ratingContent.style.display = "none";
                expContent.style.display = "block";            
                break;
            default:
                log("Unknown appearance mode clicked...");
                break;
        }
    }
    else {
        log("DETECTED NONEXISTANT DIV:" + divId);
    }     
}

function getServerList(){
	$.post('/getServerList', {}, function(data,status){
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
				if (data[j].customServer){
					buttonClassName += " customServerSelectButton"
				}

				if (data[j].gametype == "horde"){
					buttonClassName = "hordeServerSelectButton"
				}
				else if (data[j].gametype == "elim"){
					buttonClassName = "elimServerSelectButton"
				}
				if (data[j].customServer){
					buttonClassName = "customServerSelectButton"
				}
				serversHTML += '<div class="' + buttonClassName + ' RWButton" onclick="getJoinableServer({server:\'' + data[j].url + '\', privateServer:' + data[j].privateServer + '})">' + serverNameHtml + data[j].serverSubName + '<br><span style="font-size: 12;text-shadow: none;">' + data[j].currentPlayers + '/' + data[j].maxPlayers + ' Players</span></div>';
			}
		}		
		document.getElementById("serverList").innerHTML = serversHTML;
	});
}

function getAndShowCustomServerHTML(){
	hide("tablePrint");
	if (document.getElementById("sectionTitle2")){
		document.getElementById("sectionTitle2").innerHTML = "";
	}

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
