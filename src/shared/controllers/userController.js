var dataAccess = require('../data_access/dataAccess.js');
var dataAccessFunctions = require('../data_access/dataAccessFunctions.js');
var authenticationEngine = require('../engines/authenticationEngine.js');
var tradingEngine = require('../engines/tradingEngine.js');

const express = require('express');
const router = express.Router();
const path = require("path");
const  totemize = require('totemize');
const request = require('request-promise');
router.use(express.urlencoded({extended: true})); //To support URL-encoded bodies

// router.get('/getSharedCode', function(req, res) {
// 	var pathToFile = path.join(__dirname, "../../shared/engines", "smallFile.js")
// 	res.send(
// 		fs.readFileSync(pathToFile)
// 	);
// });

router.post('/getPlayerRelationship', async function (req, res) {
	//log("Get player Relationship endpoint called with:");
	//console.log("--BODY");
	//console.log(req.body);
	dataAccessFunctions.getPlayerRelationshipFromDB(req.body, function(dbResults){
		res.status(200);
		res.send(dbResults);
	});
});

router.post('/addFriend', async function (req, res) {
	log("ADD FRIEND ENDPOINT CALLED WITH:");
	console.log(req.body);
	dataAccessFunctions.removeRequest({targetCognitoSub:req.body.cognitoSub, cognitoSub:req.body.targetCognitoSub, type:"friend"}); //remove any friend request that the player you are friending may have had to you 
	dataAccessFunctions.upsertFriend(req.body, function(dbResults){
		res.status(200);
		res.send(dbResults);
	});
});

router.post('/kickFromParty', async function (req, res) {
	log("KICK FROM PARTY ENDPOINT CALLED WITH:");
	console.log(req.body);
	var authorizedUser = await authenticationEngine.getAuthorizedUser(req.cookies); //Get authorized user Get authenticated User
	if (!authorizedUser.cognitoSub || authorizedUser.cognitoSub != req.body.cognitoSub){
		var errorMsg = "ERROR: User unauthorized to perform this action!";
		logg(errorMsg);
		res.status(200);
		res.send({msg:errorMsg});
		return;
	}		
	dataAccess.dbUpdateAwait("RW_USER", "set", {partyId: req.body.cognitoSub, cognitoSub:req.body.targetCognitoSub}, {partyId:""}, async function(err, dbRes){
		if (!err){
			//logg("DB: Set: cognitoSub=" + req.body.cognitoSub + " with: ");
			//console.log('partyId:""');
			res.status(200);
			res.send({msg:"Kicked this user from party: " + req.body.targetCognitoSub});
		}
		else {
			logg("DB ERROR: Failed to update" + req.body.cognitoSub);
			res.status(200);
			res.send({msg:"Failed to kick from party " + req.body.targetCognitoSub});			
		}
	});	
});

router.post('/requestResponse', async function (req, res) {
	log("1REQUEST RESPONSE ENDPOINT CALLED WITH:");
	logObj(req.body);

	//First look up request by req.body.id
	dataAccessFunctions.getRequestById(req.body.id, async function(requestDB){
		if (requestDB){		
			var authorizedUser = await authenticationEngine.getAuthorizedUser(req.cookies); //Get authorized user
			if (!authorizedUser.cognitoSub || authorizedUser.cognitoSub != requestDB.targetCognitoSub){ //Make sure the one responding to this request is authorized as the person this request was sent to
				var errorMsg = "ERROR: User unauthorized to perform this action!";
				logg(errorMsg);
				res.status(200);
				res.send({msg:errorMsg});
				return;
			}		

			//Perform decline operation			
			if (req.body.accept == "false"){
				dataAccessFunctions.removeRequestById(req.body.id);
				res.status(200);
				res.send({msg:"Removed request"});
			}
			else {
				//Perform accept operation							
				if(req.body.type == "friend") {
					dataAccessFunctions.upsertFriend({cognitoSub:authorizedUser.cognitoSub, targetCognitoSub:requestDB.cognitoSub}, function(dbResults){
						if (!dbResults.error){
							dataAccessFunctions.removeRequestById(req.body.id);
						}
						res.status(200);
						res.send(dbResults);
					});
				}
				else if(req.body.type == "party") {
					dataAccessFunctions.getPartyForUser(requestDB.cognitoSub, function(partyDbResults){
						/*
						var partyDbResults = {
							partyId:"12345",
							party:[]
						};	
						*/
						log("2REQUEST RESPONSE ENDPOINT - FOUND PARTY WE ARE JOINING:");
						//console.log(partyDbResults);
						dataAccessFunctions.getUser(authorizedUser.cognitoSub, function(partyJoiner){
							if (partyJoiner && partyJoiner.partyId && partyJoiner.partyId.length > 0 && partyJoiner.partyId == partyJoiner.cognitoSub && partyJoiner.partyId != partyDbResults.partyId){ //If party leader of a previous party (which is NOT the party currently requested to join) and accepting a new party request
								var re = new RegExp(partyJoiner.cognitoSub,"g");
								dataAccess.dbUpdateAwait("RW_USER", "set", {partyId: partyJoiner.partyId, cognitoSub: {$not: re}}, {partyId: ""}, async function(err, dbRes){}); //Disband the previous party							
							}
							//log("dataAccessFunctions.dbUserUpdate - Party request accepted, joining party.");
							dataAccessFunctions.dbUserUpdate("set", authorizedUser.cognitoSub, {partyId:partyDbResults.partyId});
							dataAccess.dbUpdateAwait("RW_REQUEST", "rem", {targetCognitoSub:requestDB.targetCognitoSub, type:"party"}, {}, async function(err, dbRes){}); //Remove all party requests targeted at the responder
							dataAccess.dbUpdateAwait("RW_REQUEST", "rem", {targetCognitoSub:requestDB.cognitoSub, cognitoSub:requestDB.targetCognitoSub, type:"party"}, {}, async function(err, dbRes){}); //Remove any mirrored requests (where both users request each other, but then one clicks accept)
						});
					});					
					res.status(200);
					res.send({msg:"Joined player's party"});	
				}				
				else if(req.body.type == "trade") { //Accept

				//Should cancel all other outgoing trade requests from this user (so they dont get redirected again)!!!

					dataAccessFunctions.getUser(requestDB.cognitoSub, function(requestingUser){
						dataAccessFunctions.getUser(requestDB.targetCognitoSub, function(targetUser){

							if (!(requestingUser && targetUser && targetUser.serverUrl && requestingUser.serverUrl)){
								logg("ERROR (/requestResponse) - Did not retrieve users from DB");
								return;
							}
							var tradeModel = {
								requestorCognitoSub:requestDB.cognitoSub,
								targetCognitoSub:requestDB.targetCognitoSub,
								tradeId:req.body.id
							}; 
							console.log("TTTTTTTTTTTTTTTTTtradeModel");
							console.log(tradeModel);
							createTradeFromRequest(tradeModel, requestingUser.serverUrl, function(createTradeSuccess){
								if (createTradeSuccess){
									var targetUrl = serverHomePage + "/trade/?tradeId=" + requestDB._id;
									if (isLocal)
										targetUrl = "http://" + requestingUser.serverUrl  + "/trade/?tradeId=" + requestDB._id; 
									
									//Redirect Both Users
									var party = [
										{cognitoSub:requestingUser.cognitoSub, serverUrl:requestingUser.serverUrl},
										{cognitoSub:targetUser.cognitoSub, serverUrl:targetUser.serverUrl},
									];
									sendUsersToServer(party, targetUrl, true);

									//Return data to targetUser (the one accepting the trade request)
									res.status(200);
									res.send({error:false, msg:"Successfully initiated trade, you should be redirected shortly..."});									
								}	
								else {
									res.status(200);
									res.send({error:"Failed to create trade. Please try requesting a trade again."});	
								}
							}); //Create trade
						}); //Get second user from DB
					});	//Get first user from DB				
				}				
			}
		}
		else {
			var errorMsg = "ERROR: Request no longer exists: " + req.body.id;
			logg(errorMsg);
			res.status(200);
			res.send({msg:errorMsg});
			return;		
		}
	});
});

function createTradeFromRequest(tradeModel, serverUrl, cb){
	var createTradeOptions = {
		method: 'POST',
		uri: 'http://' + serverUrl + '/createTrade',
		form: {
			tradeModel: tradeModel
		}
	};	
	
	request(createTradeOptions)
		.then(function (parsedBody) {
			// POST succeeded...
			logg("SUCCESSFUL trade creation!");
			cb(true);
			
		})
		.catch(function (err) {
			// POST failed...
			logg("ERROR creating trade!");
			logObj(err);
			cb(false);
	});
}

router.post('/createTrade', async function (req, res) {
	log("createTrade ENDPOINT CALLED WITH:");
	console.log(req.body);
	tradingEngine.newTrade(req.body.tradeModel.requestorCognitoSub, req.body.tradeModel.targetCognitoSub, req.body.tradeModel.tradeId, function(tradeId){
		res.status(200);
		res.send({msg:"Created Trade"});	
	});
});

/*//Delete trade requsts
	if (deleteOutgoingTradeRequests)
		dataAccess.dbUpdateAwait("RW_REQUEST", "rem", {cognitoSub:party[p].cognitoSub, type:"trade"}, {}, async function(err, dbRes){}); //Remove any mirrored requests (where both users request each other, but then one clicks accept)				

*/

function sendUsersToServer(party, targetUrl, deleteOutgoingTradeRequests = false) {
	logg("function sendUsersToServer with this party:");
	console.log(party);

	for (var p = 0; p < party.length; p++){
		//if (party[p].typeOf == 'undefined'){continue;}
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

router.post('/registerForTrade', async function (req, res) {
	log("registerForTrade ENDPOINT CALLED WITH:");
	console.log(req.body);	
	
	//Check if trade exists
	if (tradingEngine.getTradeById(req.body.tradeId)){
		var socket = SOCKET_LIST[getSocketIdFromCognitoSub(req.body.cognitoSub)];
		var createResult = tradingEngine.createTradeSocketEvents(socket, req.body.cognitoSub, req.body.tradeId);
		if (createResult.error){
			res.status(200);
			res.send({status:false, msg:createResult.msg});
		}
		else {
			res.status(200);
			res.send({status:true, msg:"Successfully registered for existing trade"});
		}
	}
	else {
		res.status(200);
		res.send({status:false, msg:"You have no active trades on this server. Please create another Trade request."});
	}
	

});

router.post('/leaveParty', async function (req, res) {
	log("LEAVE PARTY ENDPOINT CALLED WITH:");
	console.log(req.body);

	if (req.body.partyId == req.body.cognitoSub){ //Leaving a party that user is the leader of (disband ALL party members' partyId)
		dataAccess.dbUpdateAwait("RW_USER", "set", {partyId: req.body.partyId}, {partyId:""}, async function(err, userRes){
			res.status(200);
			res.send({msg:"Ended Party " + req.body.partyId});
		});	
	}
	else { //Leaving someone else's party
		dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: req.body.cognitoSub}, {partyId:""}, async function(err, userRes){
			res.status(200);
			res.send({msg:"Left Party " + req.body.partyId});
		});	
	}
})



router.post('/removeFriend', async function (req, res) {
	log("REMOVE FRIEND ENDPOINT CALLED WITH:");
	console.log("--BODY");
	console.log(req.body);
	dataAccessFunctions.removeFriend({targetCognitoSub:req.body.targetCognitoSub, cognitoSub:req.body.cognitoSub});
	res.status(200);
	res.send("request sent to remove friend");
});

/*	const req.body = {
		cognitoSub:cognitoSub,
		username:username,
		targetCognitoSub:getUrl().split('/user/')[1],
		type:"party"
	};	*/
	
var requireFriendsForTrade = false;
router.post('/upsertRequest', async function (req, res) {
	log("ADD REQUEST ENDPOINT CALLED WITH:");
	console.log("--BODY");
	console.log(req.body);
	
	if (req.body.type == "friend"){
		dataAccess.dbFindAwait("RW_FRIEND", {cognitoSub:req.body.targetCognitoSub, friendCognitoSub:req.body.cognitoSub}, function(err,friendRes){ //Make sure they're not already a friend
			if (friendRes[0]){
				res.status(200);
				res.send({error:false, msg:"Player has already added you as a friend too"});				
			}
			else {
				var msg = "Added friend has not friended back yet, so adding request to do so";
				console.log(msg);
				dataAccessFunctions.upsertRequest(req.body, function(dbResults){
					res.status(200);
					res.send({error:false, msg:msg});
				});			
			}
		});
	}
	else if (req.body.type == "party"){
		dataAccessFunctions.setPartyIdIfEmpty(req.body.cognitoSub);
		dataAccessFunctions.upsertRequest(req.body, function(dbResults){
			res.status(200);
			res.send({error:false, msg:"Party request added"});
		});
	}
	else if (req.body.type == "trade"){
		dataAccess.dbFindAwait("RW_FRIEND", {cognitoSub:req.body.targetCognitoSub, friendCognitoSub:req.body.cognitoSub}, function(err,friendRes){ //Make sure they're not already a friend
			if (friendRes[0] || !requireFriendsForTrade){
				dataAccessFunctions.upsertRequest(req.body, function(dbResults){
					if (dbResults.status == true){
						var msg = "Trade requested";
						console.log(msg);
						res.status(200);
						res.send({error:false, msg:msg});
					}
					else if(dbResults.tradeId){
						var msg = "Trade already exists";
						res.status(200);
						res.send({error:false, msg:msg});
					}
				});
			}
			else {
				var msg = "This player has not added you as a friend. Both players must be friends to initiate a trade.";
				console.log(msg);
				res.status(200);
				res.send({error:true, msg:msg});	
			}
		});
	}
	else {
		res.status(200);
		res.send({error:"Invalid Request type: " + req.body.type});
	}
});


function getTradeUrl(tradeId){
	var targetUrl = serverHomePage + "trade/?server=" + instanceId + "&tradeId=" + tradeId;
	if (isLocal)
		targetUrl = "http://" + serverHomePage  + "/trade" + "/?tradeId=" + tradeId; 
}

router.post('/getOnlineFriends', async function (req, res) {
	//log("getOnlineFriends endpoint called with:");
	//console.log("--BODY");
	//console.log(req.body);
	
	dataAccessFunctions.getOnlineFriends(req.body.cognitoSub, function(dbResults){
		res.status(200);
		res.send(dbResults);
	});
});

/*	const data = {
		cognitoSub:cognitoSub
	};*/
router.post('/getParty', async function (req, res) {
	//log("getParty endpoint called with:");
	console.log("--BODY");
	console.log(req.body);
	
	dataAccessFunctions.getPartyForUser(req.body.cognitoSub, function(dbResults){
		/*
		var dbResults = {
			partyId:"12345",
			party:[]
		};	
		*/
		
		//Create party endpoint result
		
		res.status(200);
		res.send(dbResults);
	});
});

router.post('/getRequests', async function (req, res) {
	log("Get requests endpoint called with:");
	console.log(req.body);
	
	dataAccessFunctions.getRequests(req.body.cognitoSub, function(requests){
		res.status(200);
		res.send(requests);
	});
});

function getShortenedValue(val){
	if (val && val.length > 0){
		if (val.length > 15){
			return val.substring(0, 15) + "...";
		}
		else {
			return val;
		}
	}
	else {
		return "";
	}
}

router.post('/validateToken', async function (req, res) {
	var code = req.body.code;
	logg("VALIDATE TOKEN ENDPOINT");
	//logg("VALIDATE TOKEN ENDPOINT -- code:" + getShortenedValue(code) + " cookies: cog_a=" + getShortenedValue(req.cookies["cog_a"]) + " cog_r=" + getShortenedValue(req.cookies["cog_r"]) + " body: cog_a=" + req.body.cog_a + " cog_r=" + req.body.cog_r);

	//console.log("--BODY");
	//console.log(req.body);
	
	var result = {};


	if (!req.body.tempCognitoSub){ //Url parameter for guest game join
		if (code && code != ""){ //If code present in URL, use that
			result = await authenticationEngine.getTokenFromCodeAndValidate(code);
		}
		if (!result.cognitoSub && (req.cookies["cog_r"] || req.body.cog_r)){ //Otherwise, check for token in cookie and body
			//logg("COULDN'T GET TOKEN FROM CODE - ACCESSING COOKIES (or request body)");
			
			var tokens = {};
			
			if(req.body.cog_r && req.body.cog_r.length > 0) {
				//logg("Found token on request body. Ignoring cookies.");
				tokens = {
					access_token:req.body.cog_a,
					refresh_token:req.body.cog_r
				};
			}
			else if (req.cookies["cog_r"] && req.cookies["cog_r"].length > 0){
				//logg("Could not find code or tokens on request body. Trying site cookies...");
				tokens = {
					access_token:req.cookies["cog_a"],
					refresh_token:req.cookies["cog_r"]
				};			
			}
			
			result = await authenticationEngine.validateTokenOrRefresh(tokens);
		}
	}
	if (!result.cognitoSub){
		logg("Authentication failed");
		if (!result.msg){
			result.msg = "Authentication failed. Please log in.";
		}
	}

	var httpResult = {};


		
	if (result && result.cognitoSub && result.username && result.refresh_token && result.access_token) {
		//Success
		logg("Authentication SUCCESS!");
		dataAccessFunctions.updateOnlineTimestampForUser(result.cognitoSub);
		dataAccessFunctions.updateServerUrlForUser(result.cognitoSub);
		res.status(200);
		res.cookie("cog_a", result.access_token, { maxAge: 300000000000, httpOnly: httpOnlyCookies }); //maxAge: about 10 years
		res.cookie("cog_r", result.refresh_token, { maxAge: 300000000000, httpOnly: httpOnlyCookies }); //maxAge: about 10 years
		res.cookie("cog_t", "", { httpOnly: httpOnlyCookies });

		httpResult = {
			cognitoSub:result.cognitoSub,
			username:result.username,
			federatedUser:result.federatedUser,
			ip:myIP,
			port:port,
			isWebServer:isWebServer,
			isLocal:isLocal,
			serverHomePage:serverHomePage,
			pcMode:pcMode,
			defaultCustomizations:dataAccessFunctions.defaultCustomizations,
			msg:result.msg || "(no response message)"
		};
	}
	else { //error
		logg("Authentication failed");
		res.status(200);
		let tempCognitoSub;
		if (req.body.tempCognitoSub){
			tempCognitoSub = req.body.tempCognitoSub;
		}
		else if (req.cookies["cog_t"]){
			tempCognitoSub = req.cookies["cog_t"];
		}
		else {
			tempCognitoSub = Math.random();		
		}
		res.cookie("cog_t", tempCognitoSub, { maxAge: 300000000000, httpOnly: httpOnlyCookies }); //maxAge: about 10 years
		if (result){
			httpResult = {
				isWebServer:isWebServer,
				isLocal:isLocal,
				cognitoSub:tempCognitoSub,
				username: generateTempName(),
				serverHomePage:serverHomePage,
				pcMode:pcMode,
				msg:result.msg || "(unhandled error)"
			};
		}
		res.send(httpResult);
		return;
	}

	//(Auth success) Get or create mongo username, and then return to the client
	dataAccessFunctions.getUser(httpResult.cognitoSub, function(mongoRes){
		if (mongoRes && mongoRes.username){
			httpResult.username = mongoRes.username;
			httpResult.cash = mongoRes.cash;
			res.send(httpResult);
		}
		else {
			dataAccessFunctions.addUser(httpResult.cognitoSub, httpResult.username, function(newUser){
				logg("Added user: " + httpResult.username + ". Returning ValidateToken response:");
				httpResult.cash = newUser.cash;
				logObj(httpResult);
				res.send(httpResult);
			});
		}
	});
});

function generateTempName(){
	let name;
	
	var x = 100;
	while (x > 0){
		name = totemize();
		name = name.replace(/\s/g, '');
		if (name.length <= 15){
			break;
		}
		x--;
	}
	return name;
	//return "tempName";
}


router.post('/getLeaderboard', async function (req, res) {
	console.log("GET LEADERBOARD");
	var leaderboard = {
		exp:[],
		rating:[]
	};

	dataAccess.dbFindOptionsAwait("RW_USER", {$and:[{"USERNAME":{$exists:true}}, {"USERNAME":{$not:/^testuser.*/}}]}, {sort:{experience: -1},limit:100}, async function(err, dbRes){
		if (dbRes && dbRes[0]){
			for (var i = 0; i < dbRes.length; i++){
				if (dbRes[i].USERNAME){
					if (dbRes[i].rating == "310"){dbRes[i].rating = "unrated";}
					leaderboard.exp.push({cognitoSub:dbRes[i].cognitoSub, username:dbRes[i].USERNAME.substring(0, 15), rating:dbRes[i].rating, kills:dbRes[i].kills, captures:dbRes[i].captures, gamesWon:dbRes[i].gamesWon, experience:dbRes[i].experience});
				}
				else {
					logg("ERROR ACQUIRING USERNAME:");
					console.log(dbRes[i]);
				}
			}
		}

		dataAccess.dbFindOptionsAwait("RW_USER", {$and:[{"USERNAME":{$exists:true}}, {"USERNAME":{$not:/^testuser.*/}}, {"rating":{$ne:310}} ] }, {sort:{rating: -1},limit:100}, async function(err, ratingRes){
			if (ratingRes && ratingRes[0]){
				for (var i = 0; i < ratingRes.length; i++){
					if (ratingRes[i].USERNAME){
						leaderboard.rating.push({cognitoSub:ratingRes[i].cognitoSub, username:ratingRes[i].USERNAME.substring(0, 15), rating:ratingRes[i].rating, kills:ratingRes[i].kills, captures:ratingRes[i].captures, gamesWon:ratingRes[i].gamesWon, experience:ratingRes[i].experience});
					}
					else {
						logg("ERROR ACQUIRING USERNAME:");
						console.log(ratingRes[i]);
					}
				}
			}
			res.send(leaderboard);
		});	
	});	
});

router.post('/getProfile', async function (req, res) {
	var cognitoSub = req.body.cognitoSub;		
	var returnData = {};

	dataAccessFunctions.getUser(cognitoSub, function(pageData){
		if (pageData){

			var rankProgressInfo = getRankFromRating(pageData["rating"]);
			var experienceProgressInfo = getLevelFromExperience(pageData["experience"]);

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
			pageData["success"] = true;

			res.send(pageData);
		}
		else {
			res.send({success:false});
		}
	});	
});

router.post('/getPlayerSearchResults', async function (req, res) {
	var searchText = req.body.searchText;		
	var returnData = [];
	dataAccessFunctions.searchUserFromDB(searchText, function(searchRes){
		if (searchRes){			
			for (var i = 0; i < searchRes.length; i++){
				if (searchRes[i].USERNAME){
					returnData.push({cognitoSub:searchRes[i].cognitoSub, username:searchRes[i].USERNAME});
				}
				else {
					logg("ERROR ACQUIRING USERNAME:");
					logg(searchRes[i]);
				}
			}		
		}
		res.send(returnData);
	});	
});

router.post('/updateUsername', async function (req, res) {
	var updateNewUsername = req.body.newUsername;
	var updateCognitoSub = req.body.cognitoSub;
	logg("Updating username for sub " + updateCognitoSub + ". New username: " + updateNewUsername);
	
	var goodToUpdateUsername = false;
	try {
		dataAccess.dbFindAwait("RW_USER", {USERNAME:updateNewUsername}, function(err,result){
			if (result && result[0]){
				if (allowDuplicateUsername){
					goodToUpdateUsername = true;
				} else {
					res.send({error:"Another user with that username already exists. Please choose another username."});
				}
			}
			else {
				goodToUpdateUsername = true;
			}		
			if (goodToUpdateUsername){
				dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: updateCognitoSub}, {USERNAME: updateNewUsername}, async function(err, updateRes){
					res.send({msg:"Updated username to " + updateNewUsername});
				});			
			}
		});
	}
	catch(e) {
		res.send({error:"Error while updating username. Please try again."});
	}
});


router.post('/logOut', async function (req, res) {
	log("Logging out user");
	res.cookie("cog_a", "", { httpOnly: httpOnlyCookies });
	res.cookie("cog_r", "", { httpOnly: httpOnlyCookies });
	res.cookie("cog_t", "", { httpOnly: httpOnlyCookies });
	res.send({msg:"Logout - Successfully removed auth cookies"});
});

router.get('/getUserCustomizations', async function (req, res) {
	//Transform to get, cog will be at req.query.cognitoSub
	console.log("GETTING CUSTOMIZATIONS FOR: " + req.query.cognitoSub);
	console.log(req.body);
	dataAccessFunctions.getUserCustomizations(req.query.cognitoSub, function(dbResults){
		res.status(200);
		res.send(dbResults);
	});
});

router.get('/getUserCustomizationOptions', async function(req, res) {
	console.log("/getUserCustomizationOptions with BODY:");
	console.log(req.query.cognitoSub);
	var authorizedUser = await authenticationEngine.getAuthorizedUser(req.cookies); //Get authorized user Get authenticated User
	logg("GETTING USER CUSTOMIZATIONS FOR PAGE:" + req.query.cognitoSub + ". REQUEST FROM USER:" + authorizedUser.cognitoSub);
	if (authorizedUser.cognitoSub == req.query.cognitoSub){
		dataAccessFunctions.getUserCustomizationOptions(req.query.cognitoSub, function(dbResults){
			res.status(200);
			res.send(dbResults);
		});
	}
	else {
		res.status(200);
		var msg = "Did not get userCustomizationOptions because User's cognitoSub[" + authorizedUser.cognitoSub + "] did not match viewed profile cognitoSub[" + req.query.cognitoSub + "]";
		res.send({msg:msg, result:false});
	}
});

router.post('/setUserCustomizations', async function (req, res) {
	var authorizedUser = await authenticationEngine.getAuthorizedUser(req.cookies); //Get authorized user Get authenticated User
	
	console.log("SETTING CUSTOMIZATIONS FOR: " + req.body.cognitoSub + ". REQUESTING USER:" + authorizedUser.cognitoSub);
	console.log(req.body);
	if (authorizedUser.cognitoSub == req.body.cognitoSub && typeof req.body.team != 'undefined' && typeof req.body.key != 'undefined' && typeof req.body.value != 'undefined'){
		dataAccessFunctions.setUserCustomization(authorizedUser.cognitoSub, req.body.team, req.body.key, req.body.value);
		response = {msg:"Successfully Updated User Customizations"};
	}
	else {
		response = {msg:"Failed to update User Customizations. Either the user was not authorized, or insuficient data was provided."};
	}

	res.status(200);
	res.send(response);
});

router.get('/getUserShopList', async function(req, res) {
	var authorizedUser = await authenticationEngine.getAuthorizedUser(req.cookies); //Get authorized user Get authenticated User
	console.log("/getUserShopList ENDPOINT");
	logg("GETTING USER SHOP LIST FOR PAGE:" + req.query.cognitoSub + ". REQUEST FROM USER:" + authorizedUser.cognitoSub);
	if (authorizedUser.cognitoSub == req.query.cognitoSub){
		dataAccessFunctions.getUserShopList(authorizedUser.cognitoSub, function(userShopList){
			res.status(200);
			res.send(userShopList);
		});

	}
	else {
		res.status(200);
		var msg = "Did not get userShopList because requester's cognitoSub[" + authorizedUser.cognitoSub + "] did not match viewed profile cognitoSub[" + req.query.cognitoSub + "]";
		res.send({msg:msg, result:false});
	}
});

router.post('/buyItem', async function (req, res) {
	var authorizedUser = await authenticationEngine.getAuthorizedUser(req.cookies); //Get authorized user Get authenticated User
	var authorizedUserCognitoSub = authorizedUser.cognitoSub;
	var viewedProfileCognitoSub = req.body.viewedProfileCognitoSub;
	var itemId = req.body.itemId;

	logg("/buyItem Endpoint")
	logg("BUYING ITEM FOR USER: " + viewedProfileCognitoSub + ". REQUESTING USER:" + authorizedUserCognitoSub + ". TRYING TO BUY: " + itemId);
	if (authorizedUserCognitoSub && authorizedUserCognitoSub == viewedProfileCognitoSub && typeof itemId != 'undefined'){
		dataAccessFunctions.buyItem({cognitoSub:authorizedUserCognitoSub, itemId:itemId}, function(dbBuyResponse){
			res.status(200);
			res.send(dbBuyResponse);
		});		
	}
	else {
		response = {msg:"Failed to Purchase item. Either the user was not authorized, or insuficient data was provided."};
		res.status(200);
		res.send(response);
	}
});

router.get('/getUserSettings', async function(req, res) {
	var authorizedUser = await authenticationEngine.getAuthorizedUser(req.cookies); //Get authorized user Get authenticated User
	console.log("/getUserShopList ENDPOINT");
	logg("GETTING USER SHOP LIST FOR PAGE:" + req.query.cognitoSub + ". REQUEST FROM USER:" + authorizedUser.cognitoSub);
	if (authorizedUser.cognitoSub == req.query.cognitoSub){
		dataAccessFunctions.getUserSettings(authorizedUser.cognitoSub, function(result){
			res.status(200);
			res.send(result);
		});

	}
	else {
		res.status(200);
		var msg = "Did not get settings because requester's cognitoSub[" + authorizedUser.cognitoSub + "] did not match viewed profile cognitoSub[" + req.query.cognitoSub + "]";
		res.send({msg:msg, result:false});
	}
});

router.post('/setUserSettings', async function (req, res) {
	var authorizedUser = await authenticationEngine.getAuthorizedUser(req.cookies); //Get authorized user Get authenticated User
	var authorizedUserCognitoSub = authorizedUser.cognitoSub;
	var viewedProfileCognitoSub = req.body.viewedProfileCognitoSub;


	
	logg("/setUserSettings Endpoint for " + authorizedUserCognitoSub);
	if (authorizedUserCognitoSub && authorizedUserCognitoSub == viewedProfileCognitoSub && typeof req.body.settings != 'undefined'){
		const settings = JSON.parse(req.body.settings);
		dataAccessFunctions.setUserSettings({cognitoSub:authorizedUserCognitoSub, settings:settings}, function(response){
			res.status(200);
			res.send(response);
		});		
	}
	else {
		response = {msg:"Failed to set settings. Either the user was not authorized, or insuficient data was provided."};
		res.status(200);
		res.send(response);
	}
});

function getLeaderFromParty(partyData){
	for (var p = 0; p < partyData.party.length; p++){
		if (partyData.party[p].leader == true){
			return partyData.party[p];
		}
	}
	return false;
}

module.exports = router;