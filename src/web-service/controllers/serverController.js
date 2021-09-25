var dataAccess = require('../../shared/data_access/dataAccess.js');
var dataAccessFunctions = require('../../shared/data_access/dataAccessFunctions.js');
const express = require('express');
const router = express.Router();
const request = require('request-promise');
router.use(express.urlencoded({extended: true})); //To support URL-encoded bodies

router.post('/getServerList', async function (req, res) {
	console.log("GET SERVER LIST");
	var serverList = [];

	dataAccessFunctions.getAllServersFromDB(function(servers){
		servers.sort(compareCurrentPlayerSize);
		
		for (let j = 0; j < servers.length; j++) {
			var currentPlayers = getCurrentPlayersFromUsers(servers[j].currentUsers).length;
			servers[j].currentPlayers = currentPlayers;
			serverList.push(servers[j]);	
		}		
		res.send(serverList);
	});	
});



router.post('/getJoinableServer', async function (req, res) {
	if (myUrl == ""){
		log("SENDING " + "Url for current server not set");
		res.send({autoJoin:false, error:"Url for current server not set"});
		return;
	}
	/*req.body
	{
		partyId:'12345',
		cognitoSub:'12345',
		server:'127.0.0.1:3000',		
	}*/

	var party = [];

	if (req.body.cognitoSub.substring(0,2) == "0."){
		var options = req.body;
		options.party = [{
			cognitoSub:req.body.cognitoSub,
			username:req.body.username,
			leader:true				
		}];

		getJoinableServer(options, function(msg, joinableServer){
			if (!joinableServer){
				log("SENDING " + msg);
				res.send({msg:msg, server:false});
			}
			else { //Join approved
				var tempCognitoSubQueryString = "&tempCognito=" + options.cognitoSub;
				joinableServer += tempCognitoSubQueryString;
				log("SENDING UNREGISTERED PLAYER TO SERVER: " + msg);				
				res.send({msg:msg, server:joinableServer, unregisteredPlayer:true});
			}
		}); //End getJoinableServer
	}
	else {
		dataAccessFunctions.getPartyForUser(req.body.cognitoSub, function(dbResults){
			/*
			var dbResults = {
				partyId:"", 
				party:[] //{cognitoSub:"12345",username:"myguy",serverUrl:"123.45.678"}
			};	
			*/
			party = dbResults.party;
			
			log("GOT PARTY:");
			console.log(party);

			var options = req.body;
			options.party = party;
			
			log("getJoinableServer endpoint called with:");
			console.log("Server: " + req.body.server);
			console.log("PARTY:");
			console.log(options.party);

			//If matchmaking request, return res immediately, and submit matchmaking ticket to db TODO

			logg("Attempting to join server: " + req.body.server);
			getJoinableServer(options, function(msg, joinableServer){
				if (!joinableServer){
					log("SENDING " + msg);
					res.send({msg:msg, server:false});
				}
				else { //Join approved
					log("SENDING PARTY TO SERVER: " + msg);				
					sendUsersToServer(party, joinableServer);
					res.send({msg:msg, server:joinableServer});
				}
			}); //End getJoinableServer
		}); //End getParty
	}
}); //End .post('/getJoinableServer

//This will be overhauled greatly with matchmaking, don't fret too much over its current state
var getJoinableServer = function(options, cb){
	logg("getJoinableServer called with:");
	console.log(options);

	var joinableServer = "";
	var unfavorableServers = [];

	//Set server search params
	var params = {privateServer:false};	
	if (options.server == "ctf" || options.server == "slayer"){ //Specific gametype
		params = {gametype:options.server, privateServer:false};
		cb("ERROR - Matchmaking not yet implemented", false);
		//return;
	}
	else if (options.server.indexOf(':') > -1) { //Server IP provided
		params = {url:options.server};
		options.matchmaking = false;
	}
	else if (options.server.indexOf('any') > -1) { //Any server //Contains
		//params = {privateServer:false};
		params = {privateServer:false};
		if (isLocal){
			params.instanceId = "local";
		}
		else {
			params.instanceId = { $not: /local/ };
		}
		params.gametype = { $not: /horde/ };
		options.matchmaking = false;
	}
	
	dataAccess.dbFindAwait("RW_SERV", params, async function(err, serverResult){	
		var serv = serverResult.sort(compareCurrentPlayerSize);
		
		if (typeof serv != 'undefined' && typeof serv[0] != 'undefined'){	
			log("FOUND " + serv.length + " POSSIBLE SERVERS");
			for (var i = 0; i < serv.length; i++){			
				log("CHECKING OUT SERVER:" + serv[i].url + "");
				console.log(serv[i]);
				if (!options.matchmaking){

					if (serv[i].privateServer){
						if (options.password != serv[i].serverPassword){
							cb("Wrong Password", false);
							break;
						}
						//else, correct password, continue allowing joining						
					}
				
					////////////////////RULES////////////////////////////////					
					var team = -1;
					//Server full dis-qualifier
					var currentActualPlayers = 0;
					for (var u in serv[i].currentUsers){
						if (serv[i].currentUsers[u].team){
							currentActualPlayers++;
						}
					}

					if (getCurrentPlayersFromUsers(serv[i].currentUsers).length + options.party.length > serv[i].maxPlayers){						
						console.log("SHOULD BE SPECTATING TEAM!1" + allowFullGameSpectating);
						logg("SERVER (" + serv[i].url + ") is too full for " + options.party.length + " more. We got " + getCurrentPlayersFromUsers(serv[i].currentUsers) + " already.");
						if (!allowFullGameSpectating){
							if (options.server.indexOf(':') > -1)
								cb("Server full", false);
							continue;
						}
						else if (options.server.indexOf(':') > -1){
							team = 0;
						}
						else if (options.server.indexOf('any') > -1){
							continue;
						}
						else {
							continue;
						}
					}

					//Determine if spectatingTeam
					var incomingUsers = serv[i].incomingUsers || [];
					var currentUsers = serv[i].currentUsers || [];
					
					/*
					console.log("Incoming users:");
					console.log(incomingUsers);
					console.log("Current users:");
					console.log(currentUsers);
					log("Percentage of match remaining: " + (serv[i].currentTimeLeft / serv[i].matchTime));
					*/

					var moreWhitePlayers = 0; 
					if (team === 0){
						logg("Spectating full match.");
						//Spectating full game
					}
					else {
						for (var u in currentUsers){
							if (currentUsers[u].team == 1){moreWhitePlayers++;}
							else if (currentUsers[u].team == 2){moreWhitePlayers--;}
						}
						for (var s in incomingUsers){
							var continueLoop = false;
							for (var u in currentUsers){
								if (incomingUsers[s].cognitoSub == currentUsers[u].cognitoSub){continueLoop = true;}
							}
							if (continueLoop)
								continue;						
							if (incomingUsers[s].team == 1){moreWhitePlayers++;}
							else if (incomingUsers[s].team == 2){moreWhitePlayers--;}
						}					
						if (moreWhitePlayers <= 0){
							team = 1;
						}
						else {
							team = 2;
						}
					}
					log("DECIDED TO SEND PLAYER TO TEAM " + team + " (unless it's horde)");
					
					var matchRemaining = (serv[i].currentTimeLeft / serv[i].matchTime);
					var possibleTeamDifference = Math.abs(Math.abs(moreWhitePlayers) - options.party.length);					
					log("(REMAINING TIME) IS " + matchRemaining + " LESS THAN " + joinActiveGameThreshold);
					log("(isGameInFullSwing) " + isGameInFullSwing(serv[i].currentTimeLeft, serv[i].matchTime, serv[i].currentHighestScore, serv[i].scoreToWin));
					log("(CURRENT PLAYERS) IS " + getCurrentPlayersFromUsers(serv[i].currentUsers).length + " GREATER THAN OR EQUAL TO 8?");
					log("(POSSIBLE TEAM DIFF) IS " + possibleTeamDifference + " GREATER THAN OR EQUAL TO " + Math.abs(moreWhitePlayers));


					//This code replaced by spectating logic above
					// if (!isGameInFullSwing(serv[i].currentTimeLeft, serv[i].matchTime, serv[i].currentHighestScore, serv[i].scoreToWin) &&
					// 	Math.abs(Math.abs(moreWhitePlayers) - options.party.length) >= Math.abs(moreWhitePlayers) &&
					// 	getCurrentPlayersFromUsers(serv[i].currentUsers).length >= 8){ //Spectate - if percentage of match remaining is less than threshold, and there is a 2 sided match underway that isn't unbalanced
					// 	team = 0;
					// }

					if (serv[i].gametype == "horde"){
						team = 2;
					}
					
					//Set DB incoming Users
					for (var p = 0; p < options.party.length; p++){
						options.party[p].timestamp = new Date();
						options.party[p].team = team;
						options.party[p].partyId = options.partyId;						
						incomingUsers = removeCognitoSubFromArray(incomingUsers, options.party[p].cognitoSub); //Before merging arrays, remove duplicate cognitoSubs from incomingUser
					}
					
					incomingUsers.push.apply(incomingUsers, options.party); //Merge 2 arrays mergeArrays merge arrays append arrays combine arrays combineArrays two arrays	
					var obj = {incomingUsers:incomingUsers};
					var selectedServer = i;
					dataAccess.dbUpdateAwait("RW_SERV", "set", {url: serv[selectedServer].url}, obj, async function(err2, res){
						if (!err2){
							logg("DB: UPDATING incomingUsers: " + serv[selectedServer].url + " with: " + JSON.stringify(obj));
							var targetUrl = serverHomePage + "game/" + serv[selectedServer].queryString;
							if (isLocal)
								targetUrl = "http://" + serv[selectedServer].url  + "/game" + "/?join=true"; 
							cb("Found joinable server. Joining...", targetUrl);
						}
						else {
							cb("FAILED TO UPDATE INCOMING USERS", false);
						}
					});	
					if (options.server.indexOf('any') > -1) //WHAT?
						break;
				}				
			}
		}
		else {
			cb("FAILED TO FIND JOINABLE SERVER", false);
		}
	});
}

function sendUsersToServer(party, targetUrl) {
	logg("function sendUsersToServer with this party:");
	console.log(party);
	for (var p = 0; p < party.length; p++){
		var options = {
			method: 'POST',
			uri: 'http://' + party[p].serverUrl + '/sendUserToUrl',
			form: {
				cognitoSub: party[p].cognitoSub,
				targetUrl: targetUrl
			}
		};
		 
		logg("Attempting to summon party member [" + party[p].cognitoSub + "] on server [" + party[p].serverUrl + "]...");
		request(options)
			.then(function (parsedBody) {
				// POST succeeded...
				logg("SUCCESSFUL request for party member!");
			})
			.catch(function (err) {
				// POST failed...
				logg("ERROR summoning party member! Classic...");
				logObj(err);
		});
	}
}


router.post('/sendUserToUrl', async function (req, res) {
	/*req.body
	{
		cognitoSub: "1534523452345",
		targetUrl: "123.43.2345:3000"
	}*/
	log("HIT SEND PLAYER TO GAME SERVER ENDPOINT: cognitoSub=" + req.body.cognitoSub + " targetUrl=" + req.body.targetUrl);
	for (var s in SOCKET_LIST){
		log("CHECKING SOCKET " + SOCKET_LIST[s].id);
		if (SOCKET_LIST[s].cognitoSub == req.body.cognitoSub){
			log("FOUND USER'S SOCKET (" + SOCKET_LIST[s].id + ") REDIRECTING USER");
			SOCKET_LIST[s].emit('redirectToUrl', req.body.targetUrl);
		}
	}
	res.send({msg:"Request received"});
});

//-------------------------------------------------------------------------------------
//Custom game server

//CONFIG
var customSettingsList = [
	{name:"serverName", desc:"Server Name (Letters and numbers only)", type:2, default:"Custom", standard:true},
	{name:"serverPassword", desc:"Password (Letters and numbers only, leave blank for no password)", type:2, default:"", standard:true},
	{name:"gameMinutesLength", desc:"Game Length in Minutes [0 is no time limit]", type:2, default:5, standard:true},
	{name:"scoreToWin", desc:"Score to win [0 is no score limit]", type:2, default:0, standard:true},
	{name:"map", desc:"Map [1=Hall, 2=Warehouse, 3=Bunkers, 4=Narrowed, 5=LongNarrowed]", type:2, default:1, standard:true},
	{name:"gametype", desc:"Gametype [1=Capture, 2=TeamKillfest, 3=Invasion 4=Elimination 5=FreeForAll]", type:2, default:1, standard:true},
	{name:"maxPlayers", desc:"Max Players", type:2, default:7, standard:true},
	{name:"voteGametype", desc:"Allow voting for gametype after match", type:1, default:true, standard:true},
	{name:"voteMap", desc:"Allow voting for map after match", type:1, default:true, standard:true},
	{name:"startingWeapon", desc:"Starting Weapon [1: Pistol, 2:DP, 3:MG, 4:SG, 5:Laser]", type:2, default:1},
	{name:"maxEnergyMultiplier", desc:"Max Energy Multiplier", type:2, default:1},
	{name:"cloakingEnabled", desc:"Cloaking Enabled", type:1, default:true},
	{name:"boostAmount", desc:"Boost Power", type:2, default:19},
	{name:"playerMaxSpeed", desc:"Max Player Speed", type:2, default:5},
	{name:"healRate", desc:"Heal Delay [lower number is faster heal]", type:2, default:10},
	{name:"bagDrag", desc:"Player speed ratio while carying bag", type:2, default:0.85},
	{name:"damageScale", desc:"Global Damage Multiplier", type:2, default:1},
	{name:"spawnOpposingThug", desc:"Bots Enabled", type:1, default:false},
	{name:"timeBeforeNextGame", desc:"Time Between Games [Seconds]", type:2, default:45}
];

router.post('/getCustomServerHTML', async function (req, res) {
	var customServerHTML = "";
	var standardCustomSettingsHTML = "";
	var advancedCustomSettingsHTML = "";

	for (var s in customSettingsList){
		var addHTML = "";
		addHTML += "<div class='customServerSetting'>";
		switch(customSettingsList[s].type){
			case 1:
				var defaultCheckBoxValue = customSettingsList[s].default ? 'checked' : '';
				addHTML += '<input type="checkbox" class="settingsCheckbox customServerSettingInput" id="' + customSettingsList[s].name + '" name="' + customSettingsList[s].name + '" value="' + customSettingsList[s].name + '" ' + defaultCheckBoxValue + '>';
				addHTML += '<label for="' + customSettingsList[s].name + '">' + customSettingsList[s].desc + '</label>';
				break;
			case 2:
				addHTML += '<div class="settingsLabel" style="display: block;padding-top: 5px;">' + customSettingsList[s].desc + '</div>';
				var nameOfClass = "settingsTextInput";
				var maxLength = 2;
				if (customSettingsList[s].name == "serverName" || customSettingsList[s].name == "serverPassword"){
					nameOfClass = "settingsTextInputLarge";
					maxLength = 25;
				}
				addHTML += '<input maxlength="' + maxLength + '" placeholder="' + customSettingsList[s].default + '" id="' + customSettingsList[s].name + '" autocomplete="off" class="' + nameOfClass + ' customServerSettingInput">';
				break;
			default:
				break;
		}

		addHTML += "</div>";		
		if (customSettingsList[s].standard){
			standardCustomSettingsHTML += addHTML;
		}
		else {
			advancedCustomSettingsHTML += addHTML;
		}
	}

	customServerHTML += "<div id='standardCustomSettings'>";
	customServerHTML += standardCustomSettingsHTML;
	customServerHTML += "</div>";
	customServerHTML += "<div id='advancedSettingsLink'><a href='#' onclick='showAdvancedCustomSettings()'>Show Advanced Custom Settings</a></div>";
	customServerHTML += "<div id='advancedCustomSettings'>";
	customServerHTML += advancedCustomSettingsHTML;
	customServerHTML += "</div>";

	customServerHTML+= '<div id="customServerButtons">'
	customServerHTML+= '<button id="createCustomServerButton" class="RWButton" onclick="createServerClick()">CREATE SERVER</button>'
	customServerHTML+= '<button id="createCustomServerCancelButton" class="RWButton" onclick="createServerCancelClick()">Cancel</button>'
	customServerHTML+= '</div>'

	res.send({success:true, HTML:customServerHTML, data:customSettingsList});
});

router.post('/sendUpdateRequestToGameServer', async function (req, res) {
	log("HIT SEND REQUEST TO GAME SERVER ENDPOINT:");
	console.log(req.body);
	req.body.settings = processCustomGameServerUpdateRequest(req.body.settings);

	dataAccessFunctions.getEmptyServersFromDB(function(emptyServers){
		if (!emptyServers[0]){
			var err = "No empty servers to customize currently. Autoscaling should be creating more. Please wait a few minutes and try again.";
			logg(err);
			res.send({msg:{message:err}, success:false});
			return;
		}
		var selectedServerUrl = emptyServers[0].url;
	
		var options = {
			method: 'POST',
			uri: "http://" + selectedServerUrl + "/updateGameServer",
			form: req.body
		};
		 
		logg("Attempting to update server [" + selectedServerUrl + "]...");
		request(options)
			.then(function (parsedBody) {
				// POST succeeded...
				logg("SUCCESSFUL update of game server!");
				res.send({msg:"Success!!", server:selectedServerUrl, success:true});
			})
			.catch(function (err) {
				// POST failed...
				logg("ERROR updating game server");
				logObj(err);
				res.send({msg:err, server:false, success:false});
		});	
	});
});

function processCustomGameServerUpdateRequest(settings){
	for (var s in settings){
		if (settings[s].name == "serverName"){
			settings[s].value = settings[s].value.substring(0,25);
			if (!settings[s].value.match(/^[a-z 0-9]+$/i)){
				settings[s].value = "Custom";
			}
		}
		else if (settings[s].name == "serverPassword"){
			settings[s].value = settings[s].value.substring(0,25);
			if (!settings[s].value.match(/^[a-z 0-9]+$/i)){
				settings[s].value = "";
			}
		}
		else if (settings[s].name == "gameMinutesLength"){
			if (isNaN(settings[s].value) || settings[s].value > 99 || settings[s].value < 0){
				settings[s].value = 5;
				continue;
			} 
			settings[s].value = Math.round(settings[s].value);
		}
		else if (settings[s].name == "scoreToWin"){
			if (isNaN(settings[s].value) || settings[s].value > 99 || settings[s].value < 0){
				settings[s].value = 0;
				continue;
			} 
			settings[s].value = Math.round(settings[s].value);
		}
		else if (settings[s].name == "map"){
			switch(settings[s].value){
				case "1":
					settings[s].value = "'longest'";
					break;
				case "2":
					settings[s].value = "'thepit'";
					break;
				case "3":
					settings[s].value = "'crik'";
					break;
				case "4":
					settings[s].value = "'narrows'";
					break;
				case "5":
					settings[s].value = "'longNarrows'";
					break;
				default:								
					settings[s].value = "'longest'";
				break;
			}
		}
		else if (settings[s].name == "gametype"){
			switch(settings[s].value){
				case "1":
					settings[s].value = "'ctf'";
					break;
				case "2":
					settings[s].value = "'slayer'";
					break;
				case "3":
					settings[s].value = "'horde'";
					break;
				case "4":
					settings[s].value = "'elim'";
					break;
				case "5":
					settings[s].value = "'ffa'";
					break;
				default:								
					settings[s].value = "'ctf'";
				break;
			}
		}
		else if (settings[s].name == "maxPlayers"){
			if (isNaN(settings[s].value) || settings[s].value > 10 || settings[s].value < 0){
				settings[s].value = 14;
				continue;
			} 
			settings[s].value = parseFloat(settings[s].value);
			settings[s].value = Math.round(settings[s].value);
		}
		else if (settings[s].name == "startingWeapon"){
			if (isNaN(settings[s].value) || settings[s].value > 5 || settings[s].value < 1){
				settings[s].value = 1;
				continue;
			} 
			settings[s].value = Math.round(settings[s].value);
		}
		else if (settings[s].name == "maxEnergyMultiplier"){
			if (isNaN(settings[s].value) || settings[s].value < 0){
				settings[s].value = 1;
				continue;
			} 
			else if (settings[s].value > 9){
				settings[s].value = 9;
			}
		}
		else if (settings[s].name == "boostAmount"){
			if (isNaN(settings[s].value) || settings[s].value > 99){
				settings[s].value = 19;
				continue;
			} 
		}
		else if (settings[s].name == "playerMaxSpeed"){
			if (isNaN(settings[s].value) || settings[s].value > 99){
				settings[s].value = 5;
				continue;
			} 
		}
		else if (settings[s].name == "healRate"){
			if (isNaN(settings[s].value) || settings[s].value > 99){
				settings[s].value = 10;
				continue;
			} 
		}
		else if (settings[s].name == "bagDrag"){
			if (isNaN(settings[s].value) || settings[s].value > 99){
				settings[s].value = 0.85;
				continue;
			} 
		}
		else if (settings[s].name == "damageScale"){
			if (isNaN(settings[s].value) || settings[s].value > 99){
				settings[s].value = 1;
				continue;
			} 
		}
		else if (settings[s].name == "timeBeforeNextGame"){
			if (isNaN(settings[s].value) || settings[s].value > 99){
				settings[s].value = 45;
				continue;
			} 
		}
		else if (settings[s].name == "voteGametype" || settings[s].name == "voteMap" || settings[s].name == "spawnOpposingThug" || settings[s].name == "cloakingEnabled"){
			if (!settings[s].value === 'true'){
				settings[s].value = 'false';
			}
		}
	}
	return settings;

}

module.exports = router;