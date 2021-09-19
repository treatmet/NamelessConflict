var dataAccess = require('./dataAccess.js');
const ObjectId = require('mongodb').ObjectID;

const fullShopList = require("./shopList.json");
const totalShopableItems = countTotalShopableItems(fullShopList, true);
console.log("totalShopableItems: " + totalShopableItems);

const defaultCustomizations = require("./defaultCustomizations.json");

const defaultCustomizationOptions = require("./defaultCustomizationOptions.json");
//const defaultCustomizationOptions = fullShopList.map(item => item.id); //ALL customizations unlocked

const defaultSettings = require("./defaultSettings.json");
const  totemize = require('totemize');


//////////////////////////////////////////////
function countTotalShopableItems(list, shopable){
	var count = list.filter(function(item){ //LINQ count
		var hydratedItem = item;
		if (typeof item.category === 'undefined'){
			hydratedItem = getShopItem(item);
		}

		var isItemShoppable = true;
		if (hydratedItem.hideFromShop == true){
			isItemShoppable = false;
		}

		if (isItemShoppable == shopable){
			return item;
		}
	}).length;

	return count;
}

function generateTempName(prefix){
	let name;
	
	var x = 100;
	while (x > 0){
		name = totemize();
		var index = name.indexOf(" ");
		name = name.substring(index);
		name = prefix + name;		
		name = name.replace(/\s/g, '');
		if (name.length <= 15){
			break;
		}
		x--;
	}
	return name;
	//return "tempName";
}

///////////////////////////////USER FUNCTIONS///////////////////////////////////
var getUser = function(cognitoSub,cb){
	//log("searching for user: " + cognitoSub);
	dataAccess.dbFindAwait("RW_USER", {cognitoSub:cognitoSub}, function(err,res){
		if (res && res[0]){
			var user = res[0];
			user.username = res[0].USERNAME;
			user.customizationOptions = res[0].customizationOptions;
			if (typeof user.customizationOptions === 'undefined'){
				user.customizationOptions = defaultCustomizationOptions;
				console.log("SETTING FIRST TIME CUSTOMIZATION OPTIONS");
				console.log(user.customizationOptions);
				updateUserCustomizationOptions(cognitoSub, customizationOptions);
			}

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
			cb(users);
		}
		else {
			cb({});
		}
	});
}

var addUser = function(cognitoSub, username, cb){ //createUser create User add mongo user addMongoUser createMongo User
	if (!cognitoSub || !username){
		cb({});
		return;
	}
	var today = new Date();
	var date = today.getUTCFullYear()+'-'+(today.getUTCMonth()+1)+'-'+today.getUTCDate();

	if (username.indexOf("Facebook_") > -1){
		username = generateTempName("Facebook_");
	}
	
	if (username.indexOf("Google_") > -1){
		username = generateTempName("Google_");
	}

	var obj = {cognitoSub:cognitoSub, USERNAME:username, experience:0, cash:0, level:0, kills:0, assists:0, benedicts:0, deaths:0, captures:0, steals:0, returns:0, gamesPlayed:0, gamesWon:0, gamesLost:0, rating:0, dateJoined:date, onlineTimestamp:today, partyId:'', serverUrl:myUrl};

	dataAccess.dbUpdateAwait("RW_USER", "ups", {cognitoSub:cognitoSub}, obj, async function(err, res){
		if (err){
			logg("DB ERROR - addUser() - RW_USER.insert: " + err);
		}	
		cb(obj);
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



var giveUsersItemsByTimestamp = function(){ //BasedOffTimestamp
	var thresholdDate = new Date("September 16, 2021 16:00:00");
	//var params = {};
	var params = {onlineTimestamp:{ $gt: thresholdDate }};
/* 	var params = { USERNAME: { $in: [ 
		"bigballer4liver"
	] } }; //Bronze
 */


	console.log("DB MANIPULATION!!!!!!!!!!!!!!!!!!!!!");
	dataAccess.dbFindOptionsAwait("RW_USER", params, {limit:2000}, async function(err, resy){
		if (resy && resy[0]){ 
			for (let k = 0; k < resy.length; k++) {
				var updatey = false;
				var cognitoSub = resy[k].cognitoSub;
				var customizationOptions = resy[k].customizationOptions; 
				var customizations = resy[k].customizations; 
					 
				console.log("Updating " + resy[k].USERNAME);

//				console.log("Timestamp " + resy[k].onlineTimestamp);
		   
 				if (!customizationOptions){
					console.log("ERROR - no customizationOptions");
					continue;
				}
				if (!customizations || !customizations["1"] || !customizations["2"] ){
				  	console.log("ERROR - no customizations");
				  	continue;
				}

				if (customizationOptions.indexOf("goldSGWeapon") == -1){
					customizationOptions.push("goldSGWeapon");
					console.log("Pushing SG");
					updatey = true;
				}
    
/* 				console.log("-----------------------------------customizations");
				console.log(customizations);
				
				customizations["1"].mgColor = "#ffcc00"; //CONFIGURATION
				customizations["2"].mgColor = "#ffcc00"; //CONFIGURATION
 */
				//customizationOptions.push("bronze3_0Icon");
				//customizationOptions.push("silver3_0Icon");
				//customizationOptions.push("gold3_0Icon");
				//customizationOptions.push("diamond_0Icon");
				var obj = {
					customizationOptions:customizationOptions
				};

				if (!updatey){
					console.log("Nothing to update...");
					continue;
				}
				if (cognitoSub != "0192fb49-632c-47ee-8928-0d716e05ffea"){ //Safety
					console.log("SAFETYS ON");
					continue;
				}

				dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, obj, async function(err, res){
				});			
				await sleep(10);	

			}				
		}
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
			if (typeof customizations === 'undefined' || typeof res[0].customizations[1] === 'undefined'){
				logg("ERROR - COULD NOT GET CUSTOMIZATIONS FOR " + cognitoSub);
				customizations = JSON.parse(JSON.stringify(defaultCustomizations)); //clone //copy array //clone array //copy object //clone object 
				setUserCustomizations(cognitoSub, defaultCustomizations);
			}
			for (var t in customizations){
				if (customizations[t].icon == "rank"){
					customizations[t].icon = getRankFromRating(res[0].rating).rank;
				}
			}
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
			setUserCustomizations(cognitoSub, customizations.result);
		}
	});
}

var setUserCustomizations = function(cognitoSub, obj) {
	for (var t in obj){
		if (isRank(obj[t].icon)){
			obj[t].icon = "rank";
		}
	}


	dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, {customizations: obj}, async function(err, obj){
	});		
}

function isRank(value){
    const rankings = [
		"bronze1",
		"bronze2",
		"bronze3",
		"silver1",
		"silver2",
		"silver3",
		"gold1",
		"gold2",
		"gold3",
		"diamond",
		"diamond2"
    ];
    
    if (rankings.indexOf(value) > -1){
        return true;
    }
    return false;
}

var getUserCustomizationOptions = function(cognitoSub,cb){ //GetCustomizationOptions
	//log("searching for user: " + cognitoSub);
	dataAccess.dbFindAwait("RW_USER", {cognitoSub:cognitoSub}, function(err,res){
		if (res && res[0]){
			var customizationOptions = res[0].customizationOptions;
			if (typeof customizationOptions === 'undefined' || !Array.isArray(customizationOptions)){
				console.log("ERROR - COULD NOT GET CUSTOMIZATION OPTIONS FOR " + cognitoSub);
				customizationOptions = defaultCustomizationOptions;
				console.log("SETTING FIRST TIME CUSTOMIZATION OPTIONS");
				console.log(customizationOptions);
				updateUserCustomizationOptions(cognitoSub, customizationOptions);
			}

			var clientCustomizationResponse = {
				items:{},
				completion:{}
			};

			clientCustomizationResponse.items = transformToClientCustomizationOptions(customizationOptions, res[0].rating);
			clientCustomizationResponse.completion = getCompletion(customizationOptions);

			console.log("RETURNING CUSTOMIZATION OPTIONS FOR " + cognitoSub);
			console.log(customizationOptions);
			cb({msg: "Successfully got customization options", result:clientCustomizationResponse});
		}
		else {
			console.log("ERROR - COULD NOT FIND USER WHEN GETTING CUSTOMIZATION OPTIONS FOR " + cognitoSub);
			cb({msg: "Failed to get customization options for [" + cognitoSub + "] from DB", result:false});
		}
	});
}



function transformToClientCustomizationOptions(customizationOptions, rating){ //customizationOptions = list of strings (id of shopList)
	var items = getEmptyClientCustomizationOptions();

	for (var o = 0; o < customizationOptions.length; o++){
		var shopItem = getShopItem(customizationOptions[o]);
		if (!shopItem || shopItem.category == "other")
			continue;

		//Get owned Count
		var duplicateItems = customizationOptions.filter(item => item  == shopItem.id);
		shopItem.ownedCount = duplicateItems.length;
		
		//Add dyanmic canvasValues (rank icon)
		if (shopItem.canvasValue == "rank"){
			shopItem.dynamicCanvasValue = getRankFromRating(rating).rank;
		}

		//Identify as default item
		if (defaultCustomizationOptions.indexOf(shopItem.id) > -1){
			shopItem.defaultItem = true;
		}
		
		if (items[shopItem.category][shopItem.subCategory].filter(item => item.id  == shopItem.id).length > 0){continue;} //Do not add duplicates		
		items[shopItem.category][shopItem.subCategory].push(shopItem);
	}
	return items;
}

function getCompletion(customizationOptions){
	customizationOptions = removeDuplicates(customizationOptions);
	if (!customizationOptions){return false;}
	var completion = {};
	completion.percent = Math.round(((countTotalShopableItems(customizationOptions, true) / totalShopableItems) * 1000)) / 10;
	completion.exclusives = countTotalShopableItems(customizationOptions, false);
	return completion;
}

function getEmptyClientCustomizationOptions(){
	return {
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
		shoes: {
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
		},
		weapons: {
			pistol:[],
			dualPistols:[],
			machineGun:[],
			shotgun:[]
		}
    };
}


var updateUserCustomizationOptions = function(cognitoSub, obj) {
	dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, {customizationOptions: obj}, async function(err, obj){
	});		
}

var updateUserCustomizationOptionsAwait = function(cognitoSub, obj, cb) {
	dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, {customizationOptions: obj}, async function(err, obj){
		if (!err){
			cb(true);
		}
		else {
			cb(false);
		}
	});		
}


var getUserShopList = function(cognitoSub,cb){ //getShopList
	//log("searching for user: " + cognitoSub);
	dataAccess.dbFindAwait("RW_USER", {cognitoSub:cognitoSub}, function(err,res){
		if (res && res[0]){
			var shopList = res[0].shopList;
			var shopSlotsUnlocked = defaultShopSlotsUnlocked + getCountInArray("unlock", res[0].customizationOptions);
			
			var lastMidnight = new Date();
			lastMidnight.setUTCHours(0,0,0,0);
			var nextMidnight = new Date();
			nextMidnight.setUTCHours(0,0,0,0);
			nextMidnight.setUTCDate(nextMidnight.getUTCDate() + 1); 


			var updateUserObj = {};
			if (typeof shopSlotsUnlocked === 'undefined'){
				shopSlotsUnlocked = defaultShopSlotsUnlocked;
				updateUserObj.shopSlotsUnlocked = defaultShopSlotsUnlocked;
			}
			
			//delete res[0].shopList; //Testing
			//lastMidnight = nextMidnight; //Testing
			if (typeof res[0].shopRefreshTimestamp === 'undefined' || typeof res[0].shopList === 'undefined' || res[0].shopRefreshTimestamp < lastMidnight){				
				console.log("REFRESHING STORE BECAUSE LAST REFRESH [" + res[0].shopRefreshTimestamp + "] IS LESS THAN LASTMIDNIGHT[" + lastMidnight.toUTCString() + "]. CURRENT TIME IS " + new Date() + ". ADDING...");
				updateUserObj.shopRefreshTimestamp = new Date();
				
				shopList = getNewUserShopList(shopSlotsUnlocked);
				updateUserObj.shopList = shopList;
			}
			else if (shopList.filter(item => item != "unlock").length < shopSlotsUnlocked){
				shopList.splice(shopList.length - 1, 0, getNewShopItem(shopList));
				updateUserObj.shopList = shopList;
			}
			if (shopList.filter(item => item != "unlock").length >= maxShopSlotsUnlocked && shopList.filter(item => item == "unlock").length > 0){
				shopList = shopList.filter(item => item != "unlock");
				updateUserObj.shopList = shopList;
			}
			shopList.splice(maxShopSlotsUnlocked, 10); //Just makes sure list is shorter than the max allowed shop list

			if (Object.keys(updateUserObj).length > 0){
				dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, updateUserObj, async function(err, obj){
				});
			}

			//shopList[0] = "deerHat";
			// shopList[1] = "alertIcon";
			// shopList[2] = "birdIcon";
			// shopList[3] = "bulbIcon";
			// shopList[4] = "cloverIcon";

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

var getUserSettings = function(cognitoSub,cb){
	//log("searching for user: " + cognitoSub);
	dataAccess.dbFindAwait("RW_USER", {cognitoSub:cognitoSub}, function(err,res){
		if (res && res[0]){
			var settings = res[0].settings;

			if (typeof settings === 'undefined'){								
				dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, {settings:defaultSettings}, async function(err, obj){
				});
				cb({msg:"Set default user settings", result:defaultSettings});
			}
			else {
				if (!settings["quickChat"]){
					settings.quickChat = defaultSettings.quickChat;
					dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, {settings:settings}, async function(err, obj){
					});
				}

				cb({msg:"Successfully retrieved user settings!", result:settings});
			}
		}
		else {
			console.log("ERROR - COULD NOT FIND USER WHEN GETTING SETTINGS FOR " + cognitoSub);
			cb({msg: "Failed to get settings for [" + cognitoSub + "] from DB", result:defaultSettings});
		}
	});
}

var setUserSettings = function(request, cb){
	dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: request.cognitoSub}, {settings:request.settings}, async function(err, obj){
		if (err)
			cb({msg:"Error while updating settings", result:false});
		else
			cb({msg:"Successfully updated settings", result:true});
	});
}

var setUserSetting = function(cognitoSub, section, key, value){
	getUserSettings(cognitoSub, function(getSettingsResult){
		if (!getSettingsResult.result){return;}

		var settings = getSettingsResult.result;
		if (!settings[section]){
			settings[section] = [];
		}
		if (!settings[section].find(setting => setting.key == key)){
			settings[section].push({key:key, value:value});
		}
		else {
			var foundIndex = settings[section].findIndex(setting => setting.key == key); //LINQ + Update
			settings[section][foundIndex] = {key:key, value:value};
		}

		dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, {settings:settings}, async function(err, obj){
			if (err)
				logg("Error updating Setting: " + key + " to " + value);
			else
				logg("Successfully updated setting: " + key + " to " + value);
		});
	

	})

}

function getNewUserShopList(shopSlotsUnlocked){
	var newShopList = [];

	for (var s = 0; s < shopSlotsUnlocked; s++){
		newShopList.push(getNewShopItem(newShopList)); //Random element from shop, starting with index 2 (to skip unlock and refresh)
	}
	if (shopSlotsUnlocked < maxShopSlotsUnlocked){
		newShopList.push(fullShopList[1].id); //unlock slot
	}
	return newShopList;
}

function getNewShopItem(currentShopList){
	var shopIndex = 0;
	var loopCount = 0;
	while (loopCount < 1000){
		shopIndex = randomInt(2, fullShopList.length - 1); //Random element from shop, starting with index 2 (to skip unlock and refresh)
		//New shop rules
		if (defaultCustomizationOptions.indexOf(fullShopList[shopIndex].id) == -1){ //Item NOT part of default unlocks?
		if (currentShopList.indexOf(fullShopList[shopIndex].id) == -1){ //Item NOT already added to new shop?
		if (!fullShopList[shopIndex].hideFromShop){ //Hide from shop
			break; //PASSED RULES, ADD THIS ITEM
		}
		}
		}
		loopCount++;
	}
	return fullShopList[shopIndex].id;
}

function transformToClientShop(shopList, nextRefreshTime){ //shopList is list of id's
	var clientShop = getEmptyClientShop();
	clientShop.timer.time = Math.floor((nextRefreshTime - new Date()) / 1000); //Seconds until next refresh
	clientShop.timer.resetPrice = fullShopList.find(item => item.id == "refresh").price;

	//transform from list of id's to full shop object
	var clientShopList = [];
	for (var i = 0; i < shopList.length; i++){
		var shopItem = fullShopList.find(item => item.id == shopList[i]);	
		if (shopItem){
			if (!shopItem.price && shopItem.category != "other"){
				switch(shopItem.rarity){
					default:
						shopItem.price = 2000;
						break;
					case 1:
						shopItem.price = 5000;
						break;
					case 2:
						shopItem.price = 20000;
						break;
					case 3:
						shopItem.price = 50000;
						break;
				}
			}
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
			resetPrice: fullShopList.find(item => item.id == "refresh").price
		},
		shop: []
	};
}

var updateUserShopList = function(cognitoSub, obj) {
	dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, {shopList: obj}, async function(err, obj){
	});		
}

var getShopItem = function(itemId){
	var shopItem = fullShopList.find(item => item.id == itemId); //LINQ SELECT SINGLE
	if (!shopItem){
		shopItem = false;
	}
	return shopItem;
}

var getShopItems = function(array){
	var shopItems = [];
	array.forEach(function(shopItemId){
		var shopItem = fullShopList.find(item => item.id == shopItemId); //LINQ SELECT SINGLE
		if (shopItem){
			shopItems.push(shopItem);
		}
	});

	return shopItems;
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
				if (itemId == "unlock" && res[0].customizationOptions && res[0].customizationOptions.filter(item => item == "unlock").length + defaultShopSlotsUnlocked >= maxShopSlotsUnlocked){
					msg = "Tried to buy too many unlock slots";
					logg(msg);
					cb({msg:msg, result:false});					
				}
				else {
					//purchase item
					dataAccess.dbUpdateAwait("RW_USER", "inc", {cognitoSub: cognitoSub}, {cash: -price}, async function(err, obj){
						if (!err){
							var updateObject = {};
							if (itemId != "refresh"){
								var updatedCustomizationOptions = res[0].customizationOptions
								updatedCustomizationOptions.push(itemId);
								updateObject = {customizationOptions: updatedCustomizationOptions};	 		
							}
							else {
								var shopSlotsUnlocked = defaultShopSlotsUnlocked + getCountInArray("unlock", res[0].customizationOptions);
								updateObject = {shopList:getNewUserShopList(shopSlotsUnlocked)};
							}
							dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, updateObject, async function(err2, obj){
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
		dataAccess.dbFindAwait("RW_REQUEST", {cognitoSub:data.cognitoSub, targetCognitoSub:data.targetCognitoSub, type:data.type}, function(err,requestRes){
			if (requestRes[0]){
				logg("REQUEST ALREADY EXISTS SPAMMER, exiting");
				cb({error:"REQUEST ALREADY EXISTS", status:false});
			}
			else {
				var upsObj = {
					cognitoSub:data.cognitoSub,
					username:data.username,
					targetCognitoSub:data.targetCognitoSub,
					type:data.type,
					timestamp:new Date()
				};
				if (data.targetUsername){upsObj.targetUsername = data.targetUsername;}
				
				dataAccess.dbUpdateAwait("RW_REQUEST", "ups", {cognitoSub:data.cognitoSub, targetCognitoSub:data.targetCognitoSub, type:data.type}, upsObj, async function(err, doc){
					if (!err){
						logg("New request added to RW_REQUEST: " + data.cognitoSub + "," + data.targetCognitoSub + "," + data.type);
						cb({error:false, status:true});
					}
					else {
						logg("ERROR when adding friend to RW_FRIEND: " + data.cognitoSub + "," + data.targetCognitoSub);
						logg(err);
						cb({error:"ERROR when adding friend to RW_FRIEND: " + data.cognitoSub + "," + data.targetCognitoSub, status:false});
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

var getRequests = function(cognitoSub, cb){
	var requests = {
		party:[],
		friend:[],
		trade:[]
	};
	
	//console.log("Searching DB for party requests of: " + cognitoSub);
	dataAccess.dbFindAwait("RW_REQUEST", {targetCognitoSub:cognitoSub}, async function(err, reqRes){
		if (err){
			logg("DB ERROR - getRequests() - RW_REQUEST.find: " + err);
		}
		if (reqRes[0]){
			for (let j = 0; j < reqRes.length; j++) {
				requests[reqRes[j].type].push(reqRes[j]);
			}						
		}
		cb(requests);
	});		
}

var completeTrade = function(trade, cb){ //tradeComplete
	var finalRequestorCashDifference = parseInt(-trade.requestorCashOffered) + parseInt(trade.targetCashOffered);
	var finalTargetCashDifference = parseInt(-trade.targetCashOffered) + parseInt(trade.requestorCashOffered);
	if (trade && trade.requestorCognitoSub && trade.requestorItemsOwned && trade.targetCognitoSub && trade.targetItemsOwned && Array.isArray(trade.requestorItemsOwned) && Array.isArray(trade.targetItemsOwned)){
		updateUserCustomizationOptionsAwait(trade.requestorCognitoSub, trade.requestorItemsOwned, function(requestorResult){
			updateUserCustomizationOptionsAwait(trade.targetCognitoSub, trade.targetItemsOwned, function(targetResult){
				updateUserCash(trade.targetCognitoSub, finalTargetCashDifference, function(targetCashResult){
					updateUserCash(trade.requestorCognitoSub, finalRequestorCashDifference, function(requestorCashResult){
						if (targetResult && requestorResult && targetCashResult && requestorCashResult){
							cb(trade.tradeId);
						}
						else {
							cb(false);
						}
					});	
				});	
			});	
		});
	}
	else {
		cb(false);
	}
}

var updateUserCash = function(cognitoSub, amount, cb){
	dataAccess.dbUpdateAwait("RW_USER", "inc", {cognitoSub: cognitoSub}, {cash: amount}, async function(err, obj){
		if (!err){
			cb(true);
		}
		else {
			msg = "Database error during purchase. Please try again. You should not have been charged any money.";
			logg(msg);
			cb(false);						
		}
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
			getUser(data.callerCognitoSub, function(callingUser){
				if (callingUser){
					getUser(data.targetCognitoSub, function(targetUser){
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
				servers.push(res[i]);
			}		
			
			cb(servers);
		}
		else {
			cb(servers);
		}
	});
}

var getAllServersFromDB = function(cb){
	var servers = [];
	dataAccess.dbFindAwait("RW_SERV", {environment:process.env.Environment}, function(err,res){
		if (res && res[0]){
				
			for (var i = 0; i < res.length; i++){
				servers.push(res[i]);
			}		
			
			cb(servers);
		}
		else {
			cb(servers);
		}
	});
}

var getEmptyServersFromDB = function(cb){
	var servers = [];

	var searchObj = { privateServer:false, currentUsers: {$size:0}, incomingUsers: {$size:0}};
	searchObj.instanceId = isLocal ? "local" : {$not:/local/};
	dataAccess.dbFindAwait("RW_SERV", searchObj, function(err,res){
		if (res && res[0]){
			for (var i = 0; i < res.length; i++){
				servers.push(res[i]);
			}		
			cb(servers);
		}
		else {
			cb(servers);
		}
	});
}

//sync gameServerSync gameSync upsertGameServer update game server
var dbGameServerUpdate = function(obj, cognitoSubToRemoveFromIncoming = false) {
	dataAccess.dbFindAwait("RW_SERV", {url:myUrl}, async function(err, res){ //!!! Sort by timestamp
		var serverParam = {url:myUrl};
		if (res && res[0]){
			serverParam = {"_id": ObjectId(res[0]._id)}; //Update only based on MongoId to avoid the off-chance that there are duplicate urls in DB. (any duplicate will get deleted from lack of healthy timestamp updates)
			var healthyTimestamp = new Date();
				
			//Check for stale incoming users
			var incomingUsers = res[0].incomingUsers || [];
			var usersToRemove = [];
			var miliInterval = (staleOnlineTimestampThreshold /4 * 1000); //Stale incoming player threshold is a quarter of online timestamp threshold
			var thresholdDate = new Date(Date.now() - miliInterval);
			for (var u = 0; u < incomingUsers.length; u++){
				if (incomingUsers[u].timestamp < thresholdDate || incomingUsers[u].cognitoSub == cognitoSubToRemoveFromIncoming){
					usersToRemove.push(u);
				}
			}
			incomingUsers = removeIndexesFromArray(incomingUsers, usersToRemove);	
			obj.incomingUsers = incomingUsers;			
		}

		dataAccess.dbUpdateAwait("RW_SERV", "ups", serverParam, obj, async function(err, res){
			//logg("DB: Set: " + myUrl + " with: " + obj);
		});	
	});	
}

var setHordePersonalBest = function(cognitoSub, kills){
	if (cognitoSub.substring(0,2) == "0."){return;}
	dataAccess.dbUpdateAwait("RW_USER", "set", {cognitoSub: cognitoSub}, {hordePersonalBest: kills}, async function(err, obj){
		console.log("Successfully set user personal best");
	});		
}

var setHordeGlobalBest = function(names, kills){
	dataAccess.dbUpdateAwait("RW_USER", "set", {USERNAME:"scorekeeper"}, {hordeGlobalBest: kills, hordeGlobalBestNames: names}, async function(err, obj){
	});		
}

var getHordePersonalBest = function(cognitoSub, cb){
	dataAccess.dbFindAwait("RW_USER", {cognitoSub:cognitoSub}, function(err,res){
		if (res && res[0]){
			if (typeof res[0].hordePersonalBest === 'undefined'){
				dbUserUpdate("set", cognitoSub, {hordePersonalBest:0});
				cb(0);
			}
			else {
				cb(res[0].hordePersonalBest);
			}
		}
		else {
			cb(0);
		}
	});
}

var getHordeGlobalBest = function(cb){
	dataAccess.dbFindAwait("RW_USER", {USERNAME:"scorekeeper"}, function(err,res){
		if (res && res[0]){
			if (typeof res[0].hordeGlobalBest === 'undefined'){
				cb({kills:0, names:"RTPM3"});
			}
			else {
				cb({kills:res[0].hordeGlobalBest, names:res[0].hordeGlobalBestNames});
			}
		}
		else {
			cb({kills:0, names:"RTPM3"});
		}
	});
}

function checkForUnhealthyServers(){
	//logg("Checking for dead servers on server DB...");	
	dataAccess.dbFindAwait("RW_SERV", {}, async function(err, res){
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

module.exports.getUser = getUser;
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
module.exports.getUserSettings = getUserSettings;
module.exports.setUserSettings = setUserSettings;
module.exports.setUserSetting = setUserSetting;
module.exports.getShopItem = getShopItem;
module.exports.getShopItems = getShopItems;
module.exports.getUserShopList = getUserShopList;
module.exports.buyItem = buyItem;
module.exports.setPartyIdIfEmpty = setPartyIdIfEmpty;
module.exports.updateServerUrlForUser = updateServerUrlForUser;
module.exports.removeRequest = removeRequest;
module.exports.upsertRequest = upsertRequest;
module.exports.getFriendRequests = getFriendRequests;
module.exports.getPartyRequests = getPartyRequests;
module.exports.getRequests = getRequests;
module.exports.getRequestById = getRequestById;
module.exports.removeRequestById = removeRequestById;
module.exports.getOnlineFriends = getOnlineFriends;
module.exports.getPlayerRelationshipFromDB = getPlayerRelationshipFromDB;
module.exports.upsertFriend = upsertFriend;
module.exports.removeFriend = removeFriend;
module.exports.getPublicServersFromDB = getPublicServersFromDB;
module.exports.getAllServersFromDB = getAllServersFromDB;
module.exports.getEmptyServersFromDB = getEmptyServersFromDB;
module.exports.dbGameServerUpdate = dbGameServerUpdate;
module.exports.checkForUnhealthyServers = checkForUnhealthyServers;
module.exports.addUser = addUser;
module.exports.setHordePersonalBest = setHordePersonalBest;
module.exports.setHordeGlobalBest = setHordeGlobalBest;
module.exports.getHordePersonalBest = getHordePersonalBest;
module.exports.getHordeGlobalBest = getHordeGlobalBest;
module.exports.giveUsersItemsByTimestamp = giveUsersItemsByTimestamp;
module.exports.completeTrade = completeTrade;
module.exports.defaultCustomizations = defaultCustomizations;
module.exports.fullShopList = fullShopList;
module.exports.defaultCustomizationOptions = defaultCustomizationOptions;