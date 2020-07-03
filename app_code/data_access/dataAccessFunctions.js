var dataAccess = require(absAppDir + '/app_code/data_access/dataAccess.js');
var Player = require(absAppDir + '/app_code/entities/player.js');

///////////////////////////////USER FUNCTIONS///////////////////////////////////
var getUserFromDB = function(cognitoSub,cb){
	//log("searching for user: " + cognitoSub);
	dataAccess.dbFindAwait("RW_USER", {cognitoSub:cognitoSub}, function(err,res){
		if (res && res[0]){
			var user = res[0];
			user.username = res[0].USERNAME;
			if (typeof user.partyId === 'undefined'){
				dbUserUpdate("set", user.cognitoSub, {partyId:""});
			}
			cb(user);
		}
		else {
			cb(false);
		}
	});
}

var getAllUsersOnServer = function(cb){
	var cognitoSubs = [];
	for (var i in SOCKET_LIST){
		cognitoSubs.push(SOCKET_LIST[i].cognitoSub);
	}
	
	var searchParams = { cognitoSub: { $in: cognitoSubs } };
	dataAccess.dbFindAwait("RW_USER", searchParams, async function(err, res){
		if (res && res[0]){
			cb(res);
		}
		else {
			cb(false);
		}
	});
}

var getAllPlayersFromDB = function(cb){
	var cognitoSubsInGame = [];
	for (var i in Player.list){
		cognitoSubsInGame.push(Player.list[i].cognitoSub);
	}
	
	var searchParams = { cognitoSub: { $in: cognitoSubsInGame } };	
	dataAccess.dbFindAwait("RW_USER", searchParams, async function(err, res){
		if (res && res[0]){
			cb(res);
		}
		else {
			cb(false);
		}
	});		
}

var getPartyForUser = function(cognitoSub, cb){
	var partyData = {
		partyId:"",
		party:[] //ALL Party members [{cognitoSub:partyRes[k].cognitoSub, username:partyRes[k].USERNAME, serverUrl:partyRes[k].serverUrl, leader:false}]
	};	
	
	dataAccess.dbFindAwait("RW_USER", {cognitoSub:cognitoSub}, async function(err,userRes){
		if (err){
			logg("DB ERROR - getPartyForUser()1 - RW_USER.find: " + err);
		}
		//console.log("PARTY get user DB results:");
		//console.log(userRes);
		if (userRes && userRes[0]){
			partyData.partyId = cognitoSub; //Default the partyId to the requested User
			if (userRes[0].partyId && userRes[0].partyId.length > 0){ //User is in a party
				//console.log("PARTY Searching DB for users with partyId: " + userRes[0].partyId);
				partyData.partyId = userRes[0].partyId;
				kickOfflineFromParty(partyData.partyId, function(){
					var miliInterval = (staleOnlineTimestampThreshold * 1000);
					var thresholdDate = new Date(Date.now() - miliInterval);	
					dataAccess.dbFindAwait("RW_USER", {partyId:partyData.partyId, onlineTimestamp:{ $gt: thresholdDate }}, async function(err2,partyRes){
						if (err2){
							logg("DB ERROR - getPartyForUser()2 - RW_USER.find: " + err2);
						}
						//console.log("PARTY Get all users with partyId DB results:");
						//console.log(partyRes);
						if (partyRes && partyRes[0]){ //There is at least 1 person in the party
							for (let k = 0; k < partyRes.length; k++) {
								var partyMember = {cognitoSub:partyRes[k].cognitoSub, username:partyRes[k].USERNAME, serverUrl:partyRes[k].serverUrl, leader:false};
								if (partyRes[k].cognitoSub == partyData.partyId){
									partyMember.leader = true;
								}							
								partyData.party.push(partyMember);
							}				
						}
						cb(partyData);
					});					
				});
			}
			else { //User is not in a party
				partyData.party = [{cognitoSub:cognitoSub, username:userRes[0].USERNAME, serverUrl:userRes[0].serverUrl, leader:true}];
				cb(partyData);
			}
		}
		else { //ERROR: USER NOT FOUND
			cb(partyData);
		}
	});		
}

var getPartyById = function(partyId, cb){
	var partyData = {
		partyId:partyId,
		party:[] //ALL Party members [{cognitoSub:partyRes[k].cognitoSub, username:partyRes[k].USERNAME, serverUrl:partyRes[k].serverUrl, leader:false}]
	};	
	kickOfflineFromParty(partyData.partyId, function(){
		var miliInterval = (staleOnlineTimestampThreshold * 1000);
		var thresholdDate = new Date(Date.now() - miliInterval);		

		dataAccess.dbFindAwait("RW_USER", {partyId:partyData.partyId, onlineTimestamp:{ $gt: thresholdDate }}, async function(err, partyRes){
			if (err){
				logg("DB ERROR - getPartyById() - RW_USER.find: " + err);
			}
			//console.log("PARTY Get all users with partyId DB results:");
			//console.log(partyRes);
			if (partyRes && partyRes[0]){ //There is at least 1 person in the party
				for (let k = 0; k < partyRes.length; k++) {
					var partyMember = {cognitoSub:partyRes[k].cognitoSub, username:partyRes[k].USERNAME, serverUrl:partyRes[k].serverUrl, leader:false};
					if (partyRes[k].cognitoSub == partyData.partyId){
						partyMember.leader = true;
					}							
					partyData.party.push(partyMember);
				}				
			}
			cb(partyData);
		});
	});
}

var kickOfflineFromParty = function(partyId, cb){
	if (!partyId || partyId.length < 1){
		return;
	}

	dataAccess.dbFindAwait("RW_USER", {cognitoSub:partyId}, async function(err, partyRes){
		if (err){
			logg("DB ERROR - kickOfflineFromParty()1 - RW_USER.update: " + err);
		}
		var miliInterval = (staleOnlineTimestampThreshold * 1000);
		var thresholdDate = new Date(Date.now() - miliInterval);
		if (partyRes && partyRes[0] && (partyRes[0].partyId != partyRes[0].cognitoSub || partyRes[0].onlineTimestamp < thresholdDate)){ //PartyId where the 'leader' is in a different party or offline. Clearing all users with partyId
			dataAccess.dbUpdateAwait("RW_USER", "set", {partyId: partyId}, {partyId: ""}, async function(err2, res1){
				if (err2){
					logg("DB ERROR - kickOfflineFromParty()1 - RW_USER.update: " + err2);
				}
				logg("PartyId where the 'leader' is in a different party or offline. Clearing party for ALL users with partyId: " + partyId);
				cb();
			});				
		}
		else if(partyRes && partyRes[0] && partyRes[0].partyId == partyRes[0].cognitoSub && partyRes[0].onlineTimestamp >= thresholdDate){ //Valid party with online leader who is also in the party		
			var searchParams = { partyId: partyId, onlineTimestamp:{ $lt: thresholdDate } };		
						
			dataAccess.dbUpdateAwait("RW_USER", "set", searchParams, {partyId: ""}, async function(err3, res2){
				if (err3){
					logg("DB ERROR - kickOfflineFromParty()2 - RW_USER.update: " + err3);
				}
				logg("Valid, online party. Clearing all party members that are offline");
				cb();
			});	
		}
		else { //Catch all, do nothing
			cb();
		}	
	});
}

var searchUserFromDB = function(searchText,cb){
	//log("searching for user with text: " + searchText);
	var re = new RegExp(searchText,"i");
	dataAccess.dbFindOptionsAwait("RW_USER", {USERNAME:re}, {limit:50}, async function(err, res){	
		if (res && res[0]){
			var users = res;
			console.log(users);
			cb(users);
		}
		else {
			cb({});
		}
	});
}

var addUser = function(cognitoSub, username, cb){
	if (!cognitoSub || !username){
		cb();
		return;
	}
	var today = new Date();
	var date = today.getUTCFullYear()+'-'+(today.getUTCMonth()+1)+'-'+today.getUTCDate();

	var obj = {cognitoSub:cognitoSub, USERNAME:username, experience:0, cash:0, level:0, kills:0, benedicts:0, deaths:0, captures:0, steals:0, returns:0, gamesPlayed:0, gamesWon:0, gamesLost:0, rating:0, dateJoined:date, onlineTimestamp:today, partyId:'', serverUrl:''};

	dataAccess.dbUpdateAwait("RW_USER", "ups", {cognitoSub:cognitoSub}, obj, async function(err, res){
		if (err){
			logg("DB ERROR - addUser() - RW_USER.insert: " + err);
		}	
		cb();
	});
}

var dbUserUpdate = function(action, cognitoSub, obj) {
	dataAccess.dbUpdateAwait("RW_USER", action, {cognitoSub: cognitoSub}, obj, async function(err, obj){
	});		
}

var updateOnlineTimestampForUsers = function(){
	for(var i in SOCKET_LIST){
		if (SOCKET_LIST[i].cognitoSub){			
			updateOnlineTimestampForUser(SOCKET_LIST[i].cognitoSub);
		}
	}	
}

var updateOnlineTimestampForUser = function(cognitoSub){
	var newDate = new Date();	
	dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, {onlineTimestamp: newDate}, async function(err, res){
		if (err){
			logg("DB ERROR - updateOnlineTimestampForUser() - RW_USER.update: " + err);
		}	
		//logg("Updated player[" + cognitoSub + "] onlineTimestamp to " + newDate);
	});		
}

var setPartyIdIfEmpty = function(cognitoSub) {
	dataAccess.dbFindAwait("RW_USER", {cognitoSub:cognitoSub}, function(err,res){
		if (res && res[0]){
			if (!res[0].partyId || res[0].partyId == ""){
				dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, {partyId:cognitoSub}, async function(err, obj){
					//logg("DB: Set: " + cognitoSub + " with: ");
					//console.log("partyId:" + cognitoSub);
				});						
			}
		}
	});
}

var updateServerUrlForUser = function(cognitoSub){
	dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, {serverUrl: myUrl}, async function(err, res){
		if (err){
			logg("DB ERROR - updateServerUrlForUser() - RW_USER.update: " + err);
		}		
		//logg("Updated player[" + cognitoSub + "] onlineTimestamp to " + newDate);
	});
}


///////////////////////////////REQUEST FUNCTIONS////////////////////////////////
var removeRequest = function(data){
	/*const data = {
		cognitoSub:cognitoSub,
		targetCognitoSub:getUrl().split('/user/')[1],
		type:"friend"		
	};*/
	try {
		logg("Removing request:");
		console.log(data);
		dataAccess.dbUpdateAwait("RW_REQUEST", "rem", data, {}, async function(err, res){
		});
	}
	catch(e) {
		logg("ERROR REMOVING REQUEST");
	}
}

var upsertRequest = function(data,cb){
	/*const data = {
		cognitoSub:cognitoSub,
		username:username,
		targetCognitoSub:getUrl().split('/user/')[1],
		type:"friend" || "party" || "block",
		timestamp:"1234-12-12"
	};*/
	var result = {};
	try {
		log("searching for request: ");
		logObj(data);
		dataAccess.dbFindAwait("RW_REQUEST", {cognitoSub:data.cognitoSub, targetCognitoSub:data.targetCognitoSub, type:data.type}, function(err,friendRes){
			if (friendRes[0]){
				logg("REQUEST ALREADY EXISTS SPAMMER, exiting");
				cb(false);
			}
			else {
				dataAccess.dbUpdateAwait("RW_REQUEST", "ups", {cognitoSub:data.cognitoSub, targetCognitoSub:data.targetCognitoSub, type:data.type}, {cognitoSub:data.cognitoSub, username:data.username, targetCognitoSub:data.targetCognitoSub, type:data.type, timestamp:new Date()}, async function(err, doc){
					if (!err){
						logg("New request added to RW_REQUEST: " + data.cognitoSub + "," + data.targetCognitoSub + "," + data.type);
						cb({status:"added"});
					}
					else {
						logg("ERROR when adding friend to RW_FRIEND: " + data.cognitoSub + "," + data.targetCognitoSub);
						logg(err);
						cb({error:"ERROR when adding friend to RW_FRIEND: " + data.cognitoSub + "," + data.targetCognitoSub});
					}
				});				
			}
		});
	}
	catch(e) {
		cb({error:"ERROR in upsertFriend database action!"});
	}
}

var getFriendRequests = function(cognitoSub, cb){
	var friendRequests = [];
	
	//console.log("Searching DB for friend requests of: " + cognitoSub);
	dataAccess.dbFindAwait("RW_REQUEST", {targetCognitoSub:cognitoSub, type:"friend"}, async function(err, friendRes){
		if (err){
			logg("DB ERROR - getFriendRequests() - RW_REQUEST.find: " + err);
		}
		var cognitoSubArray = [];
		//console.log("Friend request DB results:");
		//console.log(friendRes);
		if (friendRes[0]){
			for (let j = 0; j < friendRes.length; j++) {
				friendRequests.push(friendRes[j]);
			}						
		}
		cb(friendRequests);
	});	
}

var getPartyRequests = function(cognitoSub, cb){
	var partyRequests = [];
	
	//console.log("Searching DB for party requests of: " + cognitoSub);
	dataAccess.dbFindAwait("RW_REQUEST", {targetCognitoSub:cognitoSub, type:"party"}, async function(err, partyRes){
		if (err){
			logg("DB ERROR - getPartyRequests() - RW_REQUEST.find: " + err);
		}
		var cognitoSubArray = [];
		//console.log("Party  request DB results:");
		//console.log(partyRes);
		if (partyRes[0]){
			for (let j = 0; j < partyRes.length; j++) {
				partyRequests.push(partyRes[j]);
			}						
		}
		cb(partyRequests);
	});		
}

var getRequestById = function(id, cb){
	console.log("DB getRequestById: " + id);
	
	dataAccess.dbFindAwait("RW_REQUEST", {"_id": ObjectId(id)}, async function(err, res){
		if (err){
			logg("DB ERROR - getRequestById() - RW_REQUEST.find: " + err);
			cb(false);
		}	
		else if (!err && typeof res != 'undefined' && res[0]){
			cb(res[0]);			
		}
		else {
			cb(false);
		}		
	});	
}

var removeRequestById = function(id){
	console.log("DB Removing request by id: " + id);

	dataAccess.dbUpdateAwait("RW_REQUEST", "rem", {"_id": ObjectId(id)}, {}, async function(err, res){
		if (err){
			logg("DB ERROR - removeRequestById() - RW_REQUEST.remove: " + err);
		}
	});
}

var removeStaleFriendRequests = function(){
	var miliInterval = (staleFriendRequestThreshold * 1000 * 60 * 60 * 24);
	var thresholdDate = new Date(Date.now() - miliInterval);
	var searchParams = { type:"friend", timestamp:{ $lt: thresholdDate } };

	dataAccess.dbUpdateAwait("RW_REQUEST", "rem", searchParams, {}, async function(err, res){
		if (err){
			logg("DB ERROR - removeStaleFriendRequests() - RW_REQUEST.remove: " + err);
		}
	});
}

var removeStalePartyRequests = function(){
	var miliInterval = (stalePartyRequestThreshold * 1000);
	var thresholdDate = new Date(Date.now() - miliInterval);
	var searchParams = { type:"party", timestamp:{ $lt: thresholdDate } };
	
	dataAccess.dbUpdateAwait("RW_REQUEST", "rem", searchParams, {}, async function(err, res){
		if (err){
			logg("DB ERROR - removeStalePartyRequests() - RW_REQUEST.remove: " + err);
		}
	});
}

///////////////////////////////FRIEND FUNCTIONS/////////////////////////////////
var getOnlineFriends = function(cognitoSub, cb){
	var onlineFriends = [];
	
	//console.log("Searching DB for online friends of: " + cognitoSub);
	
	dataAccess.dbFindAwait("RW_FRIEND", {cognitoSub:cognitoSub}, async function(err, friendRes){
		if (err){
			logg("DB ERROR - getOnlineFriends() - RW_FRIEND.find: " + err);
		}	
		var cognitoSubArray = [];
		//console.log("Friend DB results:");
		//console.log(friendRes);
		if (friendRes[0]){
			for (let j = 0; j < friendRes.length; j++) {
				cognitoSubArray.push(friendRes[j].friendCognitoSub);
			}						
			var miliInterval = (staleOnlineTimestampThreshold * 1000);
			var thresholdDate = new Date(Date.now() - miliInterval);
			var searchParams = { cognitoSub:{ $in: cognitoSubArray }, onlineTimestamp:{ $gt: thresholdDate } };
			//console.log("Searching DB for which of the above friends are online?");
			dataAccess.dbFindAwait("RW_USER", searchParams, async function(err2, userRes){
				if (err2){
					logg("DB ERROR - getOnlineFriends() - RW_USER.find: " + err2);
				}
				//console.log("Online friend result:");
				//console.log(userRes);
				if (userRes[0]){
					for (let k = 0; k < userRes.length; k++) {
						var user = userRes[k];
						user.username = userRes[k].USERNAME;
						onlineFriends.push(user);
					}						
				}
				cb(onlineFriends);
			});						
		}
		else {
			cb(onlineFriends);
		}

	});
}

var getPlayerRelationshipFromDB = function(data,cb){
	/*const data = {
		callerCognitoSub:cognitoSub,
		targetCognitoSub:getUrl().split('/user/')[1]
	};*/
	var result = {
		friends:false,
		inParty:false
	}
	try {
		//log("searching for user: " + data.callerCognitoSub);
		dataAccess.dbFindAwait("RW_FRIEND", {cognitoSub:data.callerCognitoSub}, function(err,friendRes){
			if (friendRes[0]){
				for (let j = 0; j < friendRes.length; j++) {
					if (friendRes[j].friendCognitoSub == data.targetCognitoSub){
						result.friends = true;
						break;
					}
				}
			}
			getUserFromDB(data.callerCognitoSub, function(callingUser){
				if (callingUser){
					getUserFromDB(data.targetCognitoSub, function(targetUser){
						if (targetUser){
							if (callingUser.partyId && targetUser.partyId == callingUser.partyId){
								result.inParty = true;
							}
						}
						cb(result);
					});
				}
				else {
					cb(result);
				}
			});
			
		});
	}
	catch(e) {
		cb({error:"ERROR in getPlayerRelationshipFromDB!"});
	}
}

var upsertFriend = function(data,cb){
	/*const data = {
		cognitoSub:cognitoSub,
		targetCognitoSub:getUrl().split('/user/')[1]
	};*/
	var result = {};
	try {
		//log("searching for user: " + data.cognitoSub);
		dataAccess.dbFindAwait("RW_FRIEND", {cognitoSub:data.cognitoSub}, function(err,friendRes){
			if (friendRes[0]){
				for (let j = 0; j < friendRes.length; j++) {
					if (friendRes[j].friendCognitoSub == data.targetCognitoSub){
						result.status = "present";
						cb(result);
						break;
						return;
					}
				}
			}
			if (result.status != "present"){
				dataAccess.dbUpdateAwait("RW_FRIEND", "ups", {cognitoSub:data.cognitoSub, friendCognitoSub:data.targetCognitoSub}, {cognitoSub:data.cognitoSub, friendCognitoSub:data.targetCognitoSub, timestamp:new Date()}, async function(err, doc){
					if (!err){
						logg("New friend added to RW_FRIEND: " + data.cognitoSub + "," + data.targetCognitoSub);
						cb({status:"added"});
					}
					else {
						logg("ERROR when adding friend to RW_FRIEND: " + data.cognitoSub + "," + data.targetCognitoSub);
						logg(err);
						cb({error:"ERROR when adding friend to RW_FRIEND: " + data.cognitoSub + "," + data.targetCognitoSub});
					}
				});				
			}
		});
	}
	catch(e) {
		cb({error:"ERROR in upsertFriend database action!"});
	}
}

var removeFriend = function(data){
	/*const data = {
		cognitoSub:cognitoSub,
		targetCognitoSub:getUrl().split('/user/')[1]
	};*/
	try {
		logg("Removing friendship: " + data.cognitoSub + " friends with " + data.targetCognitoSub);
		dataAccess.dbUpdateAwait("RW_FRIEND", "rem", {cognitoSub:data.cognitoSub, friendCognitoSub:data.targetCognitoSub}, {}, async function(err, res){
		});
	}
	catch(e) {
		logg("ERROR REMOVING FRIEND");
	}
}


///////////////////////////////SERVER FUNCTIONS/////////////////////////////////
var getPublicServersFromDB = function(cb){
	var servers = [];
	dataAccess.dbFindAwait("RW_SERV", {privateServer:false}, function(err,res){
		if (res && res[0]){
				
			for (var i = 0; i < res.length; i++){

				if (res[i].gametype == "ctf"){
					res[i].gametype = "CTF";
				}
				else if (res[i].gametype == "slayer"){
					res[i].gametype = "Deathmatch";
				}

				servers.push(res[i]);
			}		
			
			cb(servers);
		}
		else {
			cb(servers);
		}
	});
}

var dbGameServerRemoveAndAdd = function(){
	dataAccess.dbUpdateAwait("RW_SERV", "rem", {url: myUrl}, {}, async function(err, obj){
		if (!err){
			dbGameServerUpdate();
		}
	});
}

var dbGameServerUpdate = function() {
	if (!myUrl || myUrl == ""){
		logg("ERROR - NO SERVER URL - NOT READY TO SYNC WITH DB");
		return;
	}
	
	serverName = "";
	
	if (maxPlayers >= 14){
		serverName = "BigTeam ";
	}
	else if (maxPlayers == 8){
		serverName = "4v4 ";
	}	
	else if (maxPlayers == 6){
		serverName = "3v3 ";
	}	
	else if (maxPlayers == 10){
		serverName = "5v5 ";
	}	
	
	if (gametype == "ctf"){
		serverName += "CTF" + " [" + port.substring(1) + "]";
	}
	else if (gametype == "slayer"){
		serverName += "Deathmatch" + " [" + port.substring(1) + "]";
	}
	
	var healthCheckTimestamp = new Date();
	var matchTime = (gameMinutesLength * 60) + gameSecondsLength;
	var currentTimeLeft = (minutesLeft * 60) + secondsLeft;
	if (pregame == true || gameOver == true){currentTimeLeft = matchTime;}
	var currentHighestScore = 0;
	if (blackScore > whiteScore){
		currentHighestScore = blackScore;
	}
	else {
		currentHighestScore = whiteScore;
	}

	var currentUsers = [];
	for (var s in SOCKET_LIST){
		currentUsers.push({
			socketId:SOCKET_LIST[s].id,
			cognitoSub:SOCKET_LIST[s].cognitoSub,
			username:SOCKET_LIST[s].username,
			partyId:SOCKET_LIST[s].partyId,
			rating:SOCKET_LIST[s].rating,
			experience:SOCKET_LIST[s].experience,
			team:SOCKET_LIST[s].team
		});
	}
	
	console.log(currentUsers);
	var obj = {serverNumber:serverNumber, serverName:serverName,  privateServer:privateServer, healthCheckTimestamp:healthCheckTimestamp, gametype:gametype, maxPlayers:maxPlayers, voteGametype:voteGametype, voteMap:voteMap, matchTime:matchTime, currentTimeLeft:currentTimeLeft, scoreToWin:scoreToWin, currentHighestScore:currentHighestScore, currentUsers:currentUsers};
	
	dataAccess.dbUpdateAwait("RW_SERV", "ups", {url: myUrl}, obj, async function(err, res){
		//logg("dbGameServerUpdate DB: Set: " + myUrl + " with: ");
		//console.log(obj);
	});		
}

var syncGameServerWithDatabase = function(){	
	if (myIP == ""){
		logg("WARNING - Unable to get server IP. Retrying in " + syncServerWithDbInterval + " seconds...");
		return;
	}
	//logg("Syncing server with Database...");
	
	dataAccess.dbFindAwait("RW_SERV", {url:myUrl}, async function(err, res){
		if (res && res[0]){
			//log("Server " + myUrl + " present in IN_SERV. Grabbing server config...");
			serverNumber = res[0].serverNumber;
			
			//serverName = res[0].serverName;
			
			//These source of truth are the DB. Be sure to differentiate these from the ones that should be written to DB from server values
			//maxPlayers = res[0].maxPlayers;
			//voteGametype = res[0].voteGametype;
			//voteMap = res[0].voteMap;
			if (res[0].gametype == "slayer" || res[0].gametype == "ctf"){
				//gametype = res[0].gametype;
			}
			
			var healthyTimestamp = new Date();
			if (res[1]){ //More than one entry found for this URL. Remove all, and add just one.				
				dbGameServerRemoveAndAdd();
			}	
			else {
				dbGameServerUpdate();
				
				//Check for stale incoming users
				var incomingUsers = res[0].incomingUsers || [];
				var usersToRemove = [];
				var miliInterval = (staleOnlineTimestampThreshold /4 * 1000); //Stale incoming player threshold is a quarter of online timestamp threshold
				var thresholdDate = new Date(Date.now() - miliInterval);


				
				for (var u = 0; u < incomingUsers.length; u++){
					if (incomingUsers[u].timestamp < thresholdDate){
						usersToRemove.push(u);
					}
				}
				incomingUsers = removeIndexesFromArray(incomingUsers, usersToRemove);	

			
				dataAccess.dbUpdateAwait("RW_SERV", "set", {url: myUrl}, {incomingUsers:incomingUsers}, async function(err, res){
					//logg("DB: Set: " + myUrl + " with: " + obj);
				});	
			}			
		}
		else {
			//Server url does not exist
			logg('Server does not exist');
			dataAccess.dbFindOptionsAwait("RW_SERV", {}, {sort:{serverNumber: -1}}, async function(err, res){		
				if (res && res[0]){
					serverNumber = res[0].serverNumber;
					serverNumber++;						
				}
				else {
					logg('There are no servers live');
				}

				console.log("ADDING SERVER WITH NO PARAMS");
				dbGameServerUpdate();			
			});
		}	
	});	
}

function checkForUnhealthyServers(){
	//logg("Checking for dead servers on server DB...");	
	dataAccess.dbFindOptionsAwait("RW_SERV", {}, {sort:{serverNumber: 1}}, async function(err, res){
		if (res && res[0]){
			for (var i = 0; i < res.length; i++){
				var serverLastHealthCheck = new Date(res[i].healthCheckTimestamp);
											
				var acceptableLastHealthCheckTime = new Date();
				acceptableLastHealthCheckTime.setSeconds(acceptableLastHealthCheckTime.getUTCSeconds() - serverHealthCheckTimestampThreshold);
				//Should delete url:null here as well !!!!
				if (serverLastHealthCheck < acceptableLastHealthCheckTime || typeof res[i].healthCheckTimestamp === 'undefined'){
					if (typeof res[i].healthCheckTimestamp === 'undefined'){
						logg("DEAD SERVER FOUND: " + res[i].url + ". [No set healthCheckTimestamp] Removing...");					
					}
					else {
						logg("DEAD SERVER FOUND: " + res[i].url + ". [" + serverLastHealthCheck.toISOString() + " is less than " + acceptableLastHealthCheckTime.toISOString() + ". Current time is " + new Date().toISOString() + "] Removing...");
					}					
					dataAccess.dbUpdateAwait("RW_SERV", "rem", { url: res[i].url }, {}, async function(err2, obj){
						if (!err2){
							logg("Unhealthy Server successfully removed from database.");
						}
					});										
				}
			}					
		}	
	});
}

module.exports.getUserFromDB = getUserFromDB;
module.exports.getAllUsersOnServer = getAllUsersOnServer;
module.exports.getAllPlayersFromDB = getAllPlayersFromDB;
module.exports.getPartyForUser = getPartyForUser;
module.exports.getPartyById = getPartyById;
module.exports.kickOfflineFromParty = kickOfflineFromParty;
module.exports.searchUserFromDB = searchUserFromDB;
module.exports.dbUserUpdate = dbUserUpdate;
module.exports.updateOnlineTimestampForUsers = updateOnlineTimestampForUsers;
module.exports.updateOnlineTimestampForUser = updateOnlineTimestampForUser;
module.exports.setPartyIdIfEmpty = setPartyIdIfEmpty;
module.exports.updateServerUrlForUser = updateServerUrlForUser;
module.exports.removeRequest = removeRequest;
module.exports.upsertRequest = upsertRequest;
module.exports.getFriendRequests = getFriendRequests;
module.exports.getPartyRequests = getPartyRequests;
module.exports.getRequestById = getRequestById;
module.exports.removeRequestById = removeRequestById;
module.exports.removeStaleFriendRequests = removeStaleFriendRequests;
module.exports.removeStalePartyRequests = removeStalePartyRequests;
module.exports.getOnlineFriends = getOnlineFriends;
module.exports.getPlayerRelationshipFromDB = getPlayerRelationshipFromDB;
module.exports.upsertFriend = upsertFriend;
module.exports.removeFriend = removeFriend;
module.exports.getPublicServersFromDB = getPublicServersFromDB;
module.exports.dbGameServerRemoveAndAdd = dbGameServerRemoveAndAdd;
module.exports.dbGameServerUpdate = dbGameServerUpdate;
module.exports.syncGameServerWithDatabase = syncGameServerWithDatabase;
module.exports.checkForUnhealthyServers = checkForUnhealthyServers;
module.exports.addUser = addUser;