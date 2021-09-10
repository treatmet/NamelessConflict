var dataAccessFunctions = require('../data_access/dataAccessFunctions.js');
var tradeList = [];

//Config
var maxAcceptedTimer = 5;

var newTrade = function(requestorCognitoSub, targetCognitoSub, tradeId, cb){
	console.log("CREATING NEW TRADE: " + tradeId);
	//Check for existing trade
	var existingTrade = tradeList.find(trade => trade.tradeId == tradeId);
	if (existingTrade){
		cb(tradeId);
	}
	
	var trade = {
		tradeId: tradeId,
		requestorCognitoSub: requestorCognitoSub,
		targetCognitoSub: targetCognitoSub,
		tradeActivityTimestamp: new Date(),
		requestorItemsOffered: [],
		targetItemsOffered: [],
		requestorAccepted: false,
		targetAccepted: false,
		acceptedTimer: maxAcceptedTimer
	};

	dataAccessFunctions.getUserOwnedItems(requestorCognitoSub, function(ownedItemsDbR){
		dataAccessFunctions.getUserOwnedItems(targetCognitoSub, function(ownedItemsDbT){
			trade.targetItemsOwned = ownedItemsDbT.result;
			trade.requestorItemsOwned = ownedItemsDbR.result;
			tradeList.push(trade);
			console.log("CURRENT TRADE LIST:");
			console.log(tradeList);
			cb(tradeId);		
		});
	});


}

var getTradeList = function(){
	return tradeList;
}

var getTradeById = function(id){
	return tradeList.find(trade => trade.tradeId == id);
}

var createTradeSocketEvents = function(socket, cognitoSub, tradeId){
	var trade = tradeList.find(singleTrade => singleTrade.tradeId == tradeId);
		if (!trade){return {error:true, msg:"Trade does not exist. Please request another trade."}}
	var isRequestor = checkIfRequestor(cognitoSub, trade);
		if (isRequestor == "error"){return {error:true, msg:"You do not seem to be a part of this trade. Please request another trade."}}
	var myOfferings = getMyOfferings(isRequestor, trade);
		if (!myOfferings){return {error:true, msg:"Trade offerings were set up incorrectly. Please request another trade."}}
	var myOwnedItems = getMyOwnedItems(isRequestor, trade);
		if (!myOwnedItems){return {error:true, msg:"Your owned items were set up incorrectly in the trade. Please request another trade."}}

	socket.on("addItemToTrade", function(tradeData){
		console.log("addItemToTrade");
		console.log(tradeData);
		if (!tradeData || tradeData.tradeId != trade.tradeId || tradeData.cognitoSub != cognitoSub || trade.locked){return;}
		trade.tradeActivityTimestamp = new Date();

		trade.requestorAccepted = false;
		trade.targetAccepted = false;
		trade.acceptedTimer = maxAcceptedTimer;

		countOfItemOwned = myOwnedItems.filter(item => item == tradeData.itemId).length;
		if (countOfItemOwned > 0){
			var foundIndex = myOwnedItems.findIndex(item => item == tradeData.itemId);
			if (foundIndex === -1){
				console.log("ERROR!!!");
				console.log("COULDNT FIND " + tradeData.itemId + " when adding to trade");
				console.log(myOfferings);
			}
			else {
				myOwnedItems.splice(foundIndex, 1);
				myOfferings.push(tradeData.itemId);
			}
		}
		sendTradeUpdate(trade);
	});

	socket.on("removeItemFromTrade", function(tradeData){
		console.log("removeItemFromTrade");
		console.log(tradeData);
		if (!tradeData || tradeData.tradeId != trade.tradeId || tradeData.cognitoSub != cognitoSub || trade.locked){return;}
		trade.tradeActivityTimestamp = new Date();
		
		trade.requestorAccepted = false;
		trade.targetAccepted = false;
		trade.acceptedTimer = maxAcceptedTimer;

		var foundIndex = myOfferings.findIndex(item => item == tradeData.itemId);
		if (foundIndex === -1){
			console.log("ERROR!!!");
			console.log("COULDNT FIND " + tradeData.itemId + " when removing from trade");
			console.log(myOfferings);
		}
		else {
			myOfferings.splice(foundIndex, 1);
			myOwnedItems.push(tradeData.itemId);
		}
		sendTradeUpdate(trade);
	});

	socket.on("acceptTrade", function(tradeData){
		console.log("acceptTrade");
		console.log(tradeData);
		if (!tradeData || tradeData.tradeId != trade.tradeId || tradeData.cognitoSub != cognitoSub || trade.locked){return;}
		trade.tradeActivityTimestamp = new Date();

		if (isRequestor){
			if (trade.requestorAccepted == true){
				trade.requestorAccepted = false;
				trade.acceptedTimer = maxAcceptedTimer;
			}
			else {
				trade.requestorAccepted = true;
			}
		}
		else { //target
			if (trade.targetAccepted == true){
				trade.targetAccepted = false;
				trade.acceptedTimer = maxAcceptedTimer;
			}
			else {
				trade.targetAccepted = true;
			}
		}

		sendTradeUpdate(trade);
	});


	return {error:false};	
}

function sendTradeUpdate(trade){
	var requestorSocket = SOCKET_LIST[getSocketIdFromCognitoSub(trade.requestorCognitoSub)];
	var targetSocket = SOCKET_LIST[getSocketIdFromCognitoSub(trade.targetCognitoSub)];
	if (requestorSocket && targetSocket){
		var requestorItemsOffered = dataAccessFunctions.getShopItems(trade.requestorItemsOffered);
		var targetItemsOffered = dataAccessFunctions.getShopItems(trade.targetItemsOffered);
		requestorSocket.emit("updateTrade", {yourItemsOffered:requestorItemsOffered, opponentItemsOffered:targetItemsOffered, yourAccepted:trade.requestorAccepted, opponentAccepted:trade.targetAccepted});
		targetSocket.emit("updateTrade", {yourItemsOffered:targetItemsOffered, opponentItemsOffered:requestorItemsOffered, opponentAccepted:trade.requestorAccepted, yourAccepted:trade.targetAccepted});
	}
	else {
		logg("ERROR - Attempting to send Trade Upate on sockets that have disconnected!");
	}
}

function sendTradeTimer(trade){
	var requestorSocket = SOCKET_LIST[getSocketIdFromCognitoSub(trade.requestorCognitoSub)];
	var targetSocket = SOCKET_LIST[getSocketIdFromCognitoSub(trade.targetCognitoSub)];
	if (requestorSocket && targetSocket){
		requestorSocket.emit("tradeTimer", trade.acceptedTimer);
		targetSocket.emit("tradeTimer", trade.acceptedTimer);
	}
	else {
		logg("ERROR - Attempting to send Trade Timer on sockets that have disconnected!");
	}
}

function sendTradeComplete(trade){
	var requestorSocket = SOCKET_LIST[getSocketIdFromCognitoSub(trade.requestorCognitoSub)];
	var targetSocket = SOCKET_LIST[getSocketIdFromCognitoSub(trade.targetCognitoSub)];
	if (requestorSocket && targetSocket){
		requestorSocket.emit("redirect", serverHomePage + "user/" + trade.requestorCognitoSub + "/");
		targetSocket.emit("redirect", serverHomePage + "user/" + trade.targetCognitoSub + "/");
	}
	else {
		logg("ERROR - Attempting to send Trade Complete on sockets that have disconnected!");
	}
}

function getMyOwnedItems(isRequestor, trade){
	if (!trade){return false;}
	if (isRequestor){
		return trade.requestorItemsOwned;
	}
	else if (isRequestor === false){
		return trade.targetItemsOwned;
	}
	return false;
}

function checkIfRequestor(cognitoSub, trade){
	if (cognitoSub == trade.requestorCognitoSub){
		return true;
	}
	else if (cognitoSub == trade.targetCognitoSub){
		return false;
	}
	else {
		return "error";
	}
}

function getMyOfferings(isRequestor, trade){
	console.log(trade);
	if (!trade){return false;}
	if (isRequestor){
		return trade.requestorItemsOffered;
	}
	else if (isRequestor === false){
		return trade.targetItemsOffered;
	}
	return false;
}

function checkIfUserHasItem(cognitoSub, itemId){

	return false;
}

// newTrade("5903ec8a-64de-4ab7-8936-706230667ca0", "0192fb49-632c-47ee-8928-0d716e05ffea", 123, function(){});

//EVERY 1 SECOND
setInterval( 
	function(){
		tradeList.forEach(function(trade){
			if (trade.targetAccepted && trade.requestorAccepted){
				trade.acceptedTimer--;
				if (trade.acceptedTimer <= 0){
					//TRADE ACCEPTED!!!!!!
					logg("TRADE ACCEPTED!!!! " + trade.tradeId + ". Updating db...");
					trade.locked = true;
					trade.requestorItemsOwned.push.apply(trade.requestorItemsOwned, trade.targetItemsOffered); 
					trade.targetItemsOwned.push.apply(trade.targetItemsOwned, trade.requestorItemsOffered); 

					dataAccessFunctions.completeTrade(trade, function(){
						sendTradeComplete(trade);
						var foundIndex = tradeList.findIndex(tradeListItem => tradeListItem.tradeId == trade.tradeId);
						if (foundIndex === -1){
							logg("ERROR - Could not delete trade from trade list" + trade.tradeId);
						}
						else {
							delete tradeList[foundIndex];
						}
					});

					trade.requestorAccepted = false;
					trade.targetAccepted = false;
				}
				sendTradeTimer(trade);
			}


			//Delete stale trades!!!
		});


    
	},
	1000/1 //Ticks per second
);

module.exports.newTrade = newTrade;
module.exports.getTradeList = getTradeList;
module.exports.getTradeById = getTradeById;
module.exports.createTradeSocketEvents = createTradeSocketEvents;