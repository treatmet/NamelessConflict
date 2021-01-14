var dataAccess = require('../../shared/data_access/dataAccess.js');
var dataAccessFunctions = require('../../shared/data_access/dataAccessFunctions.js');
const express = require('express');
const router = express.Router();
const request = require('request-promise');
router.use(express.urlencoded({extended: true})); //To support URL-encoded bodies

router.post('/getServerList', async function (req, res) {
	console.log("GET SERVER LIST");
	var serverList = [];

	dataAccessFunctions.getPublicServersFromDB(function(servers){
		servers.sort(compareCurrentPlayerSize);
		
		for (let j = 0; j < servers.length; j++) {
			var currentPlayers = getCurrentPlayersFromUsers(servers[j].currentUsers).length;
			serverList.push({url:servers[j].url, serverName:servers[j].serverName, gametype:servers[j].gametype, currentPlayers:currentPlayers, maxPlayers:servers[j].maxPlayers});			
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
	dataAccessFunctions.getPartyForUser(req.body.cognitoSub, function(dbResults){
		/*
		var dbResults = {
			partyId:"", 
			party:[] //{cognitoSub:"12345",username:"myguy",serverUrl:serverUrl}
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
				sendPartyToGameServer(party, joinableServer);
				res.send({msg:msg, server:joinableServer});
			}
		}); //End getJoinableServer
	}); //End getParty
}); //End .post('/getJoinableServer


//This will be overhauled greatly with matchmaking, don't lose too much sleep over its current state
var getJoinableServer = function(options, cb){
	var joinableServer = "";
	var unfavorableServers = [];
	var params = {privateServer:false};
	
	if (options.server == "ctf" || options.server == "slayer"){ //Specific gametype
		params = {gametype:options.server, privateServer:false};
		cb("ERROR - Matchmaking not yet implemented", false);
		//return;
	}
	else if (options.server.indexOf(':') > -1) { //Server IP provided
		params = {url:options.server, privateServer:false};
		options.matchmaking = false;
	}
	else if (options.server.indexOf('any') > -1) { //Server IP provided //contains
		//params = {privateServer:false};
		params = {privateServer:false};
		options.matchmaking = false;
	}
	
	dataAccess.dbFindOptionsAwait("RW_SERV", params, {sort:{serverNumber: 1}}, async function(err, serverResult){	
		var serv = serverResult.sort(compareCurrentPlayerSize);
		
		if (typeof serv != 'undefined' && typeof serv[0] != 'undefined'){	
			console.log("FOUND " + serv.length + " POSSIBLE SERVERS");
			for (var i = 0; i < serv.length; i++){			
				console.log("CHECKING OUT SERVER:" + serv[i].url + "");
				if (!options.matchmaking){
				
					////////////////////RULES////////////////////////////////
					
					//Server full dis-qualifier
					if (getCurrentPlayersFromUsers(serv[i].currentUsers) + options.party.length > serv[i].maxPlayers){
						logg("SERVER (" + serv[i].url + ") is too full for " + options.party.length + " more. We got " + getCurrentPlayersFromUsers(serv[i].currentUsers) + " already.");
						if (options.server.indexOf(':') > -1)
							cb("Server full", false);
						continue;
					}
					
					//Determine if spectatingTeam
					var team = 0;
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
					
					var matchRemaining = (serv[i].currentTimeLeft / serv[i].matchTime);
					var possibleTeamDifference = Math.abs(Math.abs(moreWhitePlayers) - options.party.length);					
					console.log("(REMAINING TIME) IS " + matchRemaining + " LESS THAN " + joinActiveGameThreshold);
					console.log("(CURRENT PLAYERS) IS " + getCurrentPlayersFromUsers(serv[i].currentUsers).length + " GREATER THAN OR EQUAL TO 2?");
					console.log("(POSSIBLE TEAM DIFF) IS " + possibleTeamDifference + " GREATER THAN OR EQUAL TO " + Math.abs(moreWhitePlayers));
					
					if ((serv[i].currentTimeLeft / serv[i].matchTime) < joinActiveGameThreshold && Math.abs(Math.abs(moreWhitePlayers) - options.party.length) >= Math.abs(moreWhitePlayers) && getCurrentPlayersFromUsers(serv[i].currentUsers).length >= 2){ //Spectate - if percentage of match remaining is less than threshold, and there is a 2 sided match underway that isn't unbalanced
						team = 0;
					}
					
					//Set DB incoming Users
					for (var p = 0; p < options.party.length; p++){
						options.party[p].timestamp = new Date();
						options.party[p].team = team;
						options.party[p].partyId = options.partyId;						
						incomingUsers = removeCognitoSubFromArray(incomingUsers, options.party[p].cognitoSub); //Before merging arrays, remove duplicate cognitoSubs from incomingUser
					}
					
					incomingUsers.push.apply(incomingUsers, options.party); //Merge 2 arrays mergeArrays merge arrays append arrays			
					var obj = {incomingUsers:incomingUsers};
					var selectedServer = i;
					dataAccess.dbUpdateAwait("RW_SERV", "set", {url: serv[selectedServer].url}, obj, async function(err2, res){
						if (!err2){
							logg("DB: UPDATING incomingUsers: " + serv[selectedServer].url + " with: " + JSON.stringify(obj));
							var targetUrl = serverHomePage + serv[selectedServer].queryString;
							if (isLocal)
								targetUrl = "http://" + serv[selectedServer].url + "/?join=true"; 
							cb("Found joinable server. Joining...", targetUrl);
						}
						else {
							cb("FAILED TO UPDATE INCOMING USERS", false);
						}
					});	
					if (options.server.indexOf('any') > -1)
						break;
				}				
			}
		}
		else {
			cb("FAILED TO FIND JOINABLE SERVER", false);
		}
	});
}

function sendPartyToGameServer(party, targetUrl) {
	logg("function sendPartyToGameServer with this party:");
	console.log(party);
	for (var p = 0; p < party.length; p++){
		var options = {
			method: 'POST',
			uri: 'http://' + party[p].serverUrl + '/sendPlayerToGameServer',
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

router.post('/sendPlayerToGameServer', async function (req, res) {
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
			SOCKET_LIST[s].emit('redirectToGame', req.body.targetUrl);
		}
	}
	res.send({msg:"Request received"});
});

module.exports = router;