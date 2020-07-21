var dataAccess = require(absAppDir + '/server/shared/data_access/dataAccess.js');
var dataAccessFunctions = require(absAppDir + '/server/shared/data_access/dataAccessFunctions.js');
var authenticationEngine = require(absAppDir + '/server/shared/engines/authenticationEngine.js');

const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
router.use(express.urlencoded({extended: true})); //To support URL-encoded bodies
router.use(cookieParser());

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
	dataAccess.dbUpdateAwait("RW_USER", "set", {partyId: req.body.cognitoSub, cognitoSub:req.body.targetCognitoSub}, {partyId:""}, async function(err, res){
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
	console.log(req.body);

	//First look up request by req.body.id
	dataAccessFunctions.getRequestById(req.body.id, async function(request){
		if (request){		
			var authorizedUser = await authenticationEngine.getAuthorizedUser(req.cookies); //Get authorized user
			if (!authorizedUser.cognitoSub || authorizedUser.cognitoSub != request.targetCognitoSub){ //Make sure the one responding to this request is authorized as the person this request was sent to
				var errorMsg = "ERROR: User unauthorized to perform this action!";
				logg(errorMsg);
				res.status(200);
				res.send({msg:errorMsg});
				return;
			}		
			//Perform decline operation			
			if (req.body.accept == "false"){
				dataAccessFunctions.dataAccessFunctions.removeRequestById(req.body.id);
				res.status(200);
				res.send({msg:"Removed request"});
			}
			else {
				//Perform accept operation							
				if(req.body.type == "friend") {
					dataAccessFunctions.upsertFriend({cognitoSub:authorizedUser.cognitoSub, targetCognitoSub:request.cognitoSub}, function(dbResults){
						if (!dbResults.error){
							dataAccessFunctions.dataAccessFunctions.removeRequestById(req.body.id);
						}
						res.status(200);
						res.send(dbResults);
					});
				}
				else if(req.body.type == "party") {
					dataAccessFunctions.getPartyForUser(request.cognitoSub, function(partyDbResults){
						/*
						var partyDbResults = {
							partyId:"12345",
							party:[]
						};	
						*/
						log("2REQUEST RESPONSE ENDPOINT - FOUND PARTY WE ARE JOINING:");
						//console.log(partyDbResults);
						dataAccessFunctions.getUserFromDB(authorizedUser.cognitoSub, function(partyJoiner){
							if (partyJoiner && partyJoiner.partyId && partyJoiner.partyId.length > 0 && partyJoiner.partyId == partyJoiner.cognitoSub && partyJoiner.partyId != partyDbResults.partyId){ //If party leader of a previous party (which is NOT the party currently requested to join) and accepting a new party request
								var re = new RegExp(partyJoiner.cognitoSub,"g");
								dataAccess.dbUpdateAwait("RW_USER", "set", {partyId: partyJoiner.partyId, cognitoSub: {$not: re}}, {partyId: ""}, async function(err, res){}); //Disband the previous party							
							}
							//log("dataAccessFunctions.dbUserUpdate - Party request accepted, joining party.");
							dataAccessFunctions.dbUserUpdate("set", authorizedUser.cognitoSub, {partyId:partyDbResults.partyId});
							dataAccess.dbUpdateAwait("RW_REQUEST", "rem", {targetCognitoSub:request.targetCognitoSub, type:"party"}, {}, async function(err, res){}); //Remove all party requests targeted at the responder
							dataAccess.dbUpdateAwait("RW_REQUEST", "rem", {targetCognitoSub:request.cognitoSub, cognitoSub:request.targetCognitoSub, type:"party"}, {}, async function(err, res){}); //Remove any mirrored requests (where both users request each other, but then one clicks accept)
						});
					});					
					res.status(200);
					res.send({msg:"Joined player's party"});	
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

router.post('/leaveParty', async function (req, res) {
	log("LEAVE PARTY ENDPOINT CALLED WITH:");
	console.log("--BODY");
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
});

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
router.post('/upsertRequest', async function (req, res) {
	log("ADD REQUEST ENDPOINT CALLED WITH:");
	console.log("--BODY");
	console.log(req.body);
	
	if (req.body.type == "friend"){
		dataAccess.dbFindAwait("RW_FRIEND", {cognitoSub:req.body.targetCognitoSub, friendCognitoSub:req.body.cognitoSub}, function(err,friendRes){ //Make sure they're not already a friend
			if (friendRes[0]){
				res.status(200);
				res.send("Already friends!");				
			}
			else {
				console.log("Added friend has not friended back yet, so adding request to do so");
				dataAccessFunctions.upsertRequest(req.body, function(dbResults){
					res.status(200);
					res.send(dbResults);
				});			
			}
		});
	}
	else if (req.body.type == "party"){
		dataAccessFunctions.setPartyIdIfEmpty(req.body.cognitoSub);
		dataAccessFunctions.upsertRequest(req.body, function(dbResults){
			res.status(200);
			res.send(dbResults);
		});
	}
	else {
		res.status(200);
		res.send({error:"Invalid Request type: " + req.body.type});
	}
});

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
	log("getParty endpoint called with:");
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
	console.log("--BODY");
	console.log(req.body);
	
	var response = {
		friendRequests:[],
		partyRequests:[]
	};
	
	dataAccessFunctions.getFriendRequests(req.body.cognitoSub, function(friendDbResults){
		dataAccessFunctions.getPartyRequests(req.body.cognitoSub, function(partyDbResults){
			response.friendRequests = friendDbResults;
			response.partyRequests = partyDbResults;			
			res.status(200);
			res.send(response);
		});

	});
});

router.post('/validateToken', async function (req, res) {
	//log("VALIDATE TOKEN ENDPOINT");
	var code = req.body.code;
	//console.log("--BODY");
	//console.log(req.body);
	
	var result = {};
	
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
	if (!result.cognitoSub){
		logg("Authentication failed");
		result.msg = "Authentication failed. Please log in.";
	}

	var httpResult = {};
	if (result && result.cognitoSub && result.username && result.refresh_token && result.access_token) {
		//Success
		logg("Authentication SUCCESS!");
		dataAccessFunctions.updateOnlineTimestampForUser(result.cognitoSub);
		dataAccessFunctions.updateServerUrlForUser(result.cognitoSub);
		res.status(200);
		res.cookie("cog_a", result.access_token, { httpOnly: httpOnlyCookies });
		res.cookie("cog_r", result.refresh_token, { httpOnly: httpOnlyCookies });
		httpResult = {
			cognitoSub:result.cognitoSub,
			username:result.username,
			federatedUser:result.federatedUser,
			ip:myIP,
			port:port,
			isWebServer:isWebServer,
			isLocal:isLocal,
			pcMode:pcMode,
			msg:result.msg || "(no response message)"
		};
	}
	else { //error
		res.status(200);
		if (result){
			httpResult = {
				isWebServer:isWebServer,
				isLocal:isLocal,
				pcMode:pcMode,
				msg:result.msg || "(unhandled error)"
			};
		}
		res.send(httpResult);
		return;
	}

	//Get or create mongo username, and then return to the client
	dataAccessFunctions.getUserFromDB(httpResult.cognitoSub, function(mongoRes){
		if (mongoRes && mongoRes.username){
			httpResult.username = mongoRes.username;
			res.send(httpResult);
		}
		else {
			dataAccessFunctions.addUser(httpResult.cognitoSub, httpResult.username, function(){
				logg("Added user: " + httpResult.username + ". Returning ValidateToken response:");
				logObj(httpResult);
				res.send(httpResult);
			});
		}
	});
});

router.post('/getLeaderboard', async function (req, res) {
	console.log("GET LEADERBOARD");
	var leaderboard = [];

	dataAccess.dbFindOptionsAwait("RW_USER", {$and:[{"USERNAME":{$exists:true}}, {"USERNAME":{$not:/^testuser.*/}}]}, {sort:{experience: -1},limit:100}, async function(err, dbRes){
		if (dbRes && dbRes[0]){
			for (var i = 0; i < dbRes.length; i++){
				if (dbRes[i].USERNAME){
					leaderboard.push({cognitoSub:dbRes[i].cognitoSub, username:dbRes[i].USERNAME.substring(0, 15), rating:dbRes[i].rating, kills:dbRes[i].kills, captures:dbRes[i].captures, gamesWon:dbRes[i].gamesWon, experience:dbRes[i].experience});
				}
				else {
					logg("ERROR ACQUIRING USERNAME:");
					console.log(dbRes[i]);
				}
			}
		}
		res.send(leaderboard);
	});	
});

router.post('/getProfile', async function (req, res) {
	var cognitoSub = req.body.cognitoSub;		
	var returnData = {};

	dataAccessFunctions.getUserFromDB(cognitoSub, function(pageData){
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
	res.send({msg:"Logout - Successfully removed auth cookies"});
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