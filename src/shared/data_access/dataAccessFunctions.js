var dataAccess = require('./dataAccess.js');
const ObjectId = require('mongodb').ObjectID;

var defaultCustomizations = require("./defaultCustomizations.json");
var defaultCustomizationOptions = require("./defaultCustomizationOptions.json");

var fullShopList = require("./shopList.json");


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


var getUserCustomizations = function(cognitoSub,cb){
	//log("searching for user: " + cognitoSub);
	dataAccess.dbFindAwait("RW_USER", {cognitoSub:cognitoSub}, function(err,res){
		if (res && res[0]){
			var customizations = res[0].customizations;
			if (typeof customizations === 'undefined' || typeof res[0].customizations.red === 'undefined'){
				logg("ERROR - COULD NOT GET CUSTOMIZATIONS FOR " + cognitoSub);
				customizations = defaultCustomizations;
				setUserCustomizations(cognitoSub, customizations);
			}
			console.log("RETURNING CUSTOMIZATIONS FOR " + cognitoSub);
			console.log(customizations);
			cb({msg: "Successfully got customizations", result:customizations});
		}
		else {
			console.log("ERROR - COULD NOT FIND USER WHEN GETTING CUSTOMIZATIONS FOR " + cognitoSub);
			cb({msg: "Failed to get customizations for [" + cognitoSub + "] from DB", result:defaultCustomizations});
		}
	});
}

var setUserCustomization = function(cognitoSub, team, key, value) {
	getUserCustomizations(cognitoSub, function(customizations){
		customizations.result[team][key] = value;
		if (customizations.result){
			dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, {customizations: customizations.result}, async function(err, obj){
			});		
		}
	});
}

var setUserCustomizations = function(cognitoSub, obj) {
	dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, {customizations: obj}, async function(err, obj){
	});		
}

var getUserCustomizationOptions = function(cognitoSub,cb){
	//log("searching for user: " + cognitoSub);
	dataAccess.dbFindAwait("RW_USER", {cognitoSub:cognitoSub}, function(err,res){
		if (res && res[0]){
			var customizationOptions = res[0].customizationOptions;
			if (typeof customizationOptions === 'undefined'){
				console.log("ERROR - COULD NOT GET CUSTOMIZATION OPTIONS FOR " + cognitoSub);
				customizationOptions = defaultCustomizationOptions;
				updateUserCustomizationOptions(cognitoSub, customizationOptions);
			}
			customizationOptions = transformToClientCustomizationOptions(customizationOptions);
			console.log("RETURNING CUSTOMIZATION OPTIONS FOR " + cognitoSub);
			console.log(customizationOptions);
			cb({msg: "Successfully got customization options", result:customizationOptions});
		}
		else {
			console.log("ERROR - COULD NOT FIND USER WHEN GETTING CUSTOMIZATION OPTIONS FOR " + cognitoSub);
			cb({msg: "Failed to get customization options for [" + cognitoSub + "] from DB", result:defaultCustomizationOptions});
		}
	});
}

function transformToClientCustomizationOptions(customizationOptions){ //customizationOptions = list of strings (id of shopList)
	var clientOptions = getEmptyClientCustomizationOptions();
	clientOptions.fullList = customizationOptions;


  	customizationOptions = removeDuplicates(customizationOptions);

	for (var o = 0; o < customizationOptions.length; o++){
		var shopItem = getShopItem(customizationOptions[o]); 

		if (!shopItem)
			continue;

		if (shopItem.category == "other")
			continue;

		var optionDataType = "canvasPng"; //color || canvasPng			
		if (shopItem.subCategory == "color"){
				optionDataType = "color"; 
		}

		var customizationOption = {
			id:shopItem.id,
			title: shopItem.title,
			text: shopItem.text,
			icon: shopItem.icon,
			rarity: shopItem.rarity
		};
		customizationOption[optionDataType] = shopItem.canvasPngOrColor;		

		if (shopItem.team == 0 || shopItem.team == 1){
			clientOptions["red"][shopItem.category][shopItem.subCategory].push(customizationOption);
		}
		if (shopItem.team == 0 || shopItem.team == 2){
			clientOptions["blue"][shopItem.category][shopItem.subCategory].push(customizationOption);
		}
	}
	return clientOptions;
}

function getEmptyClientCustomizationOptions(){
	return {
        red: {
            hat: {
                type:[]
			},
            hair: {
                type:[],
				color:[]
            },
            skin: {
				color:[]
            },
            shirt: {
				type:[],
				color:[],
				pattern:[]
            },
            pants: {
				color:[]
            },
            boost: {
				type:[]
            },
            name: {
				color:[]
            },
            icon: {
				type:[]
            }
        },
        blue: {
            hat: {
                type:[]
			},
            hair: {
                type:[],
				color:[]
            },
            skin: {
				color:[]
            },
            shirt: {
				type:[],
				color:[],
				pattern:[]
            },
            pants: {
				color:[]
            },
            boost: {
				type:[]
            },
            name: {
				color:[]
            },
            icon: {
				type:[]
            }        
        }
    };
}


var updateUserCustomizationOptions = function(cognitoSub, obj) {
	dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, {customizationOptions: obj}, async function(err, obj){
	});		
}


var getUserShopList = function(cognitoSub,cb){
	//log("searching for user: " + cognitoSub);
	dataAccess.dbFindAwait("RW_USER", {cognitoSub:cognitoSub}, function(err,res){
		if (res && res[0]){
			var shopList = res[0].shopList;
			
			var lastMidnight = new Date();
			lastMidnight.setUTCHours(0,0,0,0);
			var nextMidnight = new Date();
			nextMidnight.setUTCHours(0,0,0,0);
			nextMidnight.setUTCDate(nextMidnight.getUTCDate() + 1); 

			var shopSlotsUnlocked = res[0].shopSlotsUnlocked;


			var updateUserObj = {};
			if (typeof shopSlotsUnlocked === 'undefined'){
				shopSlotsUnlocked = defaultShopSlotsUnlocked;
				updateUserObj.shopSlotsUnlocked = defaultShopSlotsUnlocked;
			}
			
			//delete res[0].shopList; //Testing
			lastMidnight = nextMidnight; //Testing
			if (typeof res[0].shopRefreshTimestamp === 'undefined' || typeof res[0].shopList === 'undefined' || res[0].shopRefreshTimestamp < lastMidnight){				
				console.log("REFRESHING STORE BECAUSE LAST REFRESH [" + res[0].shopRefreshTimestamp.toUTCString() + "] IS LESS THAN LASTMIDNIGHT[" + lastMidnight.toUTCString() + "]. CURRENT TIME IS " + new Date().toUTCString() + ". ADDING...")
				updateUserObj.shopRefreshTimestamp = new Date();
				
				shopList = getNewUserShopList(shopSlotsUnlocked);
				updateUserObj.shopList = shopList;
			}
			else {
				console.log("NOTTT REFRESHING STORE BECAUSE LAST REFRESH [" + res[0].shopRefreshTimestamp.toUTCString() + "] IS GREATER THAN LASTMIDNIGHT[" + lastMidnight.toUTCString() + "]. CURRENT TIME IS " + new Date().toUTCString())
			}

			if (Object.keys(updateUserObj).length > 0){
				dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, updateUserObj, async function(err, obj){
				});
			}

			var clientShopList = transformToClientShop(shopList, nextMidnight);

			console.log("RETURNING SHOP LIST FOR " + cognitoSub);
			console.log(clientShopList);
			cb({msg:"Successfully authenticated user, and got shop list", result:clientShopList});
		}
		else {
			console.log("ERROR - COULD NOT FIND USER WHEN GETTING SHOP LIST FOR " + cognitoSub);
			cb({msg: "Failed to get shopList for [" + cognitoSub + "] from DB", result:transformToClientShop([], new Date())});
		}
	});
}

function getNewUserShopList(shopSlotsUnlocked){
	var newShopList = [];

	for (var s = 0; s < shopSlotsUnlocked; s++){

		var shopIndex = 0;
		while (true){
			shopIndex = randomInt(2, fullShopList.length - 1);
			console.log("IS " + fullShopList[shopIndex].id + " WHITHIN");
			console.log(defaultCustomizationOptions);

			//New shop rules
			if (defaultCustomizationOptions.indexOf(fullShopList[shopIndex].id) == -1){ //Item part of default unlocks?
				if (newShopList.indexOf(fullShopList[shopIndex].id) == -1){ //Item already added to new shop?
					break;				
				}
			}
		}

		newShopList.push(fullShopList[shopIndex].id); //Random element from shop, starting with index 2 (to skip unlock and refresh)
	}
	if (shopSlotsUnlocked < maxShopSlotsUnlocked){
		newShopList.push(fullShopList[1].id);
	}
	return newShopList;
}

function transformToClientShop(shopList, nextRefreshTime){ //shopList is list of id's
	var clientShop = getEmptyClientShop();
	clientShop.timer.time = Math.floor((nextRefreshTime - new Date()) / 1000); //Seconds until next refresh
	clientShop.timer.resetPrice = resetPrice; //Seconds until next refresh

	//transform from list of id's to full shop object
	var clientShopList = [];
	for (var i = 0; i < shopList.length; i++){
		var shopItem = fullShopList.find(item => item.id == shopList[i]);
		if (shopItem){
			clientShopList.push(shopItem);
		}
	}
	clientShop.shop = clientShopList;

	return clientShop;
}

function getEmptyClientShop(){
	return {
		timer: {
			time:0,
			resetPrice: resetPrice
		},
		shop: []
	};
}

var updateUserShopList = function(cognitoSub, obj) {
	dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, {shopList: obj}, async function(err, obj){
	});		
}

var getShopItem = function(itemId){
	var shopItem = fullShopList.find(item => item.id == itemId); //LINQ
	if (!shopItem){
		shopItem = false;
	}
	return shopItem;
}

var buyItem = function(data, cb){
	var cognitoSub = data.cognitoSub;
	var itemId = data.itemId;
	var price = getShopItem(itemId).price;
	var msg = "";

	//price = 100000000000;

	dataAccess.dbFindAwait("RW_USER", {cognitoSub:cognitoSub}, function(err,res){
		if (res && res[0]){
			if (res[0].cash >= price){
				//purchase item
				dataAccess.dbUpdateAwait("RW_USER", "inc", {cognitoSub: cognitoSub}, {cash: -price}, async function(err, obj){
					if (!err){
						var updatedCustomizationOptions = res[0].customizationOptions
						updatedCustomizationOptions.push(itemId);
						dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, {customizationOptions: updatedCustomizationOptions}, async function(err2, obj){
							if (!err2){
								msg = "Successful purchase";
								logg(msg);
								cb({msg:msg, result:true});
							}
							else {
								msg = "Database error during purchase. Please try again.";
								logg(msg);
								cb({msg:msg, result:false});						
							}
						});

					}
					else {
						msg = "Database error during purchase. Please try again. You should not have been charged any money.";
						logg(msg);
						cb({msg:msg, result:false});						
					}
				});		
			}
			else {
				msg = "ERROR - User[" + cognitoSub +  "] does not have enough cash[" + res[0].cash + "] to purchase [" + itemId + "] for [" + price + "]";
				logg(msg);
				cb({msg:msg, result:false});				
			}
		}
		else{
			msg = "ERROR - COULD NOT FIND USER : " + cognitoSub + "!!!";
			logg(msg);
			cb({msg:msg, result:false});
		}
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
		logObj(data);
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
				cb({error:"REQUEST ALREADY EXISTS"});
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
	if ((!myUrl || myUrl == "") || (!isLocal && myQueryString.length <= 0)){
		logg("ERROR - NO SERVER URL - NOT READY TO SYNC WITH DB");
		return;
	}
	if (isWebServer == true)
		return;
	
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
	var obj = {serverNumber:serverNumber, serverName:serverName,  privateServer:privateServer, healthCheckTimestamp:healthCheckTimestamp, gametype:gametype, maxPlayers:maxPlayers, voteGametype:voteGametype, voteMap:voteMap, matchTime:matchTime, currentTimeLeft:currentTimeLeft, scoreToWin:scoreToWin, currentHighestScore:currentHighestScore, currentUsers:currentUsers, queryString:myQueryString};
	
	dataAccess.dbUpdateAwait("RW_SERV", "ups", {url: myUrl}, obj, async function(err, res){
		//logg("dbGameServerUpdate DB: Set: " + myUrl + " with: ");
		//console.log(obj);
	});		
}

var syncGameServerWithDatabase = function(){	
	if (myUrl == "" && (isLocal || (!isLocal && myQueryString.length > 0))){
		logg("WARNING - Unable to get server IP. Retrying in " + syncServerWithDbInterval + " seconds...");
		return;
	}
	//logg("Syncing server with Database...");
	
	dataAccess.dbFindAwait("RW_SERV", {url:myUrl}, async function(err, res){
		if (res && res[0]){
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

				log("ADDING SERVER WITH NO PARAMS");
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
module.exports.getPartyForUser = getPartyForUser;
module.exports.getPartyById = getPartyById;
module.exports.kickOfflineFromParty = kickOfflineFromParty;
module.exports.searchUserFromDB = searchUserFromDB;
module.exports.dbUserUpdate = dbUserUpdate;
module.exports.updateOnlineTimestampForUsers = updateOnlineTimestampForUsers;
module.exports.updateOnlineTimestampForUser = updateOnlineTimestampForUser;
module.exports.setUserCustomization = setUserCustomization;
module.exports.setUserCustomizations = setUserCustomizations;
module.exports.getUserCustomizations = getUserCustomizations;
module.exports.getUserCustomizationOptions = getUserCustomizationOptions;
module.exports.defaultCustomizations = defaultCustomizations;
module.exports.getShopItem = getShopItem;
module.exports.getUserShopList = getUserShopList;
module.exports.buyItem = buyItem;
module.exports.setPartyIdIfEmpty = setPartyIdIfEmpty;
module.exports.updateServerUrlForUser = updateServerUrlForUser;
module.exports.removeRequest = removeRequest;
module.exports.upsertRequest = upsertRequest;
module.exports.getFriendRequests = getFriendRequests;
module.exports.getPartyRequests = getPartyRequests;
module.exports.getRequestById = getRequestById;
module.exports.removeRequestById = removeRequestById;
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
