var dataAccessFunctions = require('../data_access/dataAccessFunctions.js');

var tradeList = [];

//Config
var maxAcceptedTimer = 5;
var staleTraderThreshold = 2000;
var autoSendTradeUpdateInterval = 2000;

var newTrade = function(requestorCognitoSub, targetCognitoSub, tradeId, cb){
	console.log("CREATING NEW TRADE: " + tradeId);
	//Check for existing trade
	var existingTrade = tradeList.find(function(trade){
		if (trade && trade.tradeId == tradeId){
			return true;
		}
	});
	if (existingTrade){
		cb(tradeId);
	}
	
	var trade = {
		tradeId: tradeId,
		requestorCognitoSub: requestorCognitoSub,
		targetCognitoSub: targetCognitoSub,
		tradeActivityTimestamp: new Date().getTime(),
		requestorItemsOffered: [],
		targetItemsOffered: [],
		requestorAccepted: false,
		targetAccepted: false,
		requestorPingTimestamp: new Date().getTime(),
		targetPingTimestamp: new Date().getTime(),
		acceptedTimer: maxAcceptedTimer
	};

	dataAccessFunctions.getUser(requestorCognitoSub, function(dbR){
		dataAccessFunctions.getUser(targetCognitoSub, function(dbT){
			trade.targetItemsOwned = dbT.customizationOptions;
			trade.requestorItemsOwned = dbR.customizationOptions;
			trade.requestorUsername = dbR.username;
			trade.targetUsername = dbT.username;

			trade.targetCash = dbT.cash;
			trade.requestorCash = dbR.cash;
			trade.requestorCashOffered = 0;
			trade.targetCashOffered = 0;

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

function isNotDefaultItem(itemId){
	if (dataAccessFunctions.defaultCustomizationOptions.indexOf(itemId) == -1){
		return true;
	}
	return false;
	
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
	var myCash = getMyCash(isRequestor, trade);

	socket.on("addItemToTrade", function(tradeData){
		console.log("addItemToTrade");
		console.log(tradeData);
		if (!tradeData || tradeData.tradeId != trade.tradeId || tradeData.cognitoSub != cognitoSub || trade.locked){return;}
		trade.tradeActivityTimestamp = new Date().getTime();

		trade.requestorAccepted = false;
		trade.targetAccepted = false;
		trade.acceptedTimer = maxAcceptedTimer;

		if (tradeData.itemId){
			countOfItemOwned = myOwnedItems.filter(item => item == tradeData.itemId).length;
			if (isNotDefaultItem(tradeData.itemId) && countOfItemOwned > 0){
				var foundIndex = myOwnedItems.findIndex(item => item == tradeData.itemId);
				if (foundIndex === -1){
					console.log("ERROR!!!");
					console.log("COULDNT FIND " + tradeData.itemId + " when adding to trade");
					console.log(myOfferings);
				}
				else { //Add the item
					myOwnedItems.splice(foundIndex, 1);
					myOfferings.push(tradeData.itemId);
				}
			}
		}
		else if (tradeData.money && tradeData.money <= myCash){
			if (!isRequestor){trade.targetCashOffered = tradeData.money;}
			if (isRequestor){trade.requestorCashOffered = tradeData.money;}
		}
		sendTradeUpdate(trade);
	});

	socket.on("removeItemFromTrade", function(tradeData){
		console.log("removeItemFromTrade");
		console.log(tradeData);
		if (!tradeData || tradeData.tradeId != trade.tradeId || tradeData.cognitoSub != cognitoSub || trade.locked){return;}
		trade.tradeActivityTimestamp = new Date().getTime();
		
		trade.requestorAccepted = false;
		trade.targetAccepted = false;
		trade.acceptedTimer = maxAcceptedTimer;

		if (tradeData.itemId == "cash"){
			if (isRequestor){trade.requestorCashOffered = 0;}
			else if (!isRequestor){trade.targetCashOffered = 0;}
		}
		else {
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

	socket.on("chat", function(obj){
		trade.tradeActivityTimestamp = new Date().getTime();
		var text = obj.username + ": " + obj.text;

		var requestorSocket = SOCKET_LIST[getSocketIdFromCognitoSub(trade.requestorCognitoSub)];
		var targetSocket = SOCKET_LIST[getSocketIdFromCognitoSub(trade.targetCognitoSub)];

		if (requestorSocket){
			var color = "#FFFFFF";
			if (!isRequestor){color = "#93b3d8";}
			requestorSocket.emit('addMessageToChat', text, color);
		}
		if (targetSocket){
			var color = "#FFFFFF";
			if (isRequestor){color = "#93b3d8";}
			targetSocket.emit('addMessageToChat', text, color);
		}

	});

	socket.on("tradePingResponse", function(){
		if (isRequestor){
			trade.requestorPingTimestamp = new Date().getTime();
		}
		else if (!isRequestor){
			trade.targetPingTimestamp = new Date().getTime();
		}
	});


	//-------------------------------------------------------------------------------------
	if (isRequestor){
		trade.requestorPingTimestamp = new Date().getTime();
	}
	else if (!isRequestor){
		trade.targetPingTimestamp = new Date().getTime();
	}
	if (trade.requestorItemsOffered.length > 0 || trade.targetItemsOffered.length > 0){
		sendTradeUpdate(trade);
	}
	return {error:false};	
}

function sendTradePing(trade){
	var requestorSocket = SOCKET_LIST[getSocketIdFromCognitoSub(trade.requestorCognitoSub)];
	var targetSocket = SOCKET_LIST[getSocketIdFromCognitoSub(trade.targetCognitoSub)];

	if (requestorSocket){
		requestorSocket.emit('tradePing');
	}
	if (targetSocket){
		targetSocket.emit('tradePing');
	}
}

function sendStaleTradersToClients(trade){
	var staleTraders = getStaleTraders(trade);
	var requestorSocket = SOCKET_LIST[getSocketIdFromCognitoSub(trade.requestorCognitoSub)];
	var targetSocket = SOCKET_LIST[getSocketIdFromCognitoSub(trade.targetCognitoSub)];

	if (requestorSocket){
		requestorSocket.emit("staleOpponent", staleTraders.targetStale);
	}

	if (targetSocket){
		targetSocket.emit("staleOpponent", staleTraders.requestorStale);
	}

}

function getStaleTraders(trade){
	var requestorStale = false;
	var targetStale = false;
	if (trade.requestorPingTimestamp < new Date().getTime() - staleTraderThreshold){
		requestorStale = true;
	}
	if (trade.targetPingTimestamp < new Date().getTime() - staleTraderThreshold){
		targetStale = true;
	}

	return {requestorStale:requestorStale, targetStale:targetStale};
}


function sendTradeUpdate(trade){
	var requestorSocket = SOCKET_LIST[getSocketIdFromCognitoSub(trade.requestorCognitoSub)];
	var targetSocket = SOCKET_LIST[getSocketIdFromCognitoSub(trade.targetCognitoSub)];
	var requestorItemsOffered = dataAccessFunctions.getShopItems(trade.requestorItemsOffered);
	var targetItemsOffered = dataAccessFunctions.getShopItems(trade.targetItemsOffered);

	var staleTraders = getStaleTraders(trade);

	if (requestorSocket){
		requestorSocket.emit("updateTrade", {
			yourItemsOffered:requestorItemsOffered,
			opponentItemsOffered:targetItemsOffered, 
			yourCashOffered:trade.requestorCashOffered, 
			opponentCashOffered:trade.targetCashOffered, 
			yourAccepted:trade.requestorAccepted, 
			opponentAccepted:trade.targetAccepted,
			opponentStale:staleTraders.targetStale});
	}
	else {
		logg("ERROR - Attempting to send Trade Upate on sockets that have disconnected!");
	}

	if (targetSocket){
		targetSocket.emit("updateTrade", {
			yourItemsOffered:targetItemsOffered, 
			opponentItemsOffered:requestorItemsOffered, 
			yourCashOffered:trade.targetCashOffered, 
			opponentCashOffered:trade.requestorCashOffered, 
			opponentAccepted:trade.requestorAccepted, 
			yourAccepted:trade.targetAccepted,
			opponentStale:staleTraders.requestorStale});
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
		logg("ERROR - Attempting to send Trade Timer on sockets that have apparently disconnected!");
	}
}

function sendTradeComplete(trade){
	bootSockets(trade);
}

function bootSockets(trade){
	var requestorSocket = SOCKET_LIST[getSocketIdFromCognitoSub(trade.requestorCognitoSub)];
	var targetSocket = SOCKET_LIST[getSocketIdFromCognitoSub(trade.targetCognitoSub)];
	if (requestorSocket){
		requestorSocket.emit("redirect", serverHomePage + "user/" + trade.requestorCognitoSub + "/");
	}
	else {
		logg("ERROR - Attempting to redirect sockets that have apparently disconnected!" + trade.requestorCognitoSub);
	}
	if (targetSocket){
		targetSocket.emit("redirect", serverHomePage + "user/" + trade.targetCognitoSub + "/");
	}
	else {
		logg("ERROR - Attempting to redirect sockets that have apparently disconnected!" + trade.targetCognitoSub);
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

function getMyCash(isRequestor, trade){
	if (!trade){return false;}
	if (isRequestor){
		return trade.requestorCash;
	}
	else if (isRequestor === false){
		return trade.targetCash;
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

// newTrade("5903ec8a-64de-4ab7-8936-706230667ca0", "0192fb49-632c-47ee-8928-0d716e05ffea", 123, function(){});



//EVERY 1 SECOND
setInterval( 
	function(){
		var foundIndexToDelete = -1;
		for (var i = tradeList.length-1; i >= 0; i--){
			var trade = tradeList[i];
			if (trade.targetAccepted && trade.requestorAccepted){
				trade.acceptedTimer--;
				log("acceptedTimer:" + trade.acceptedTimer);
				if (trade.acceptedTimer <= 0){
					//TRADE ACCEPTED!!!!!!
					logg("TRADE ACCEPTED!!!! " + trade.tradeId + ". Updating db...");
					trade.locked = true;
					trade.requestorItemsOwned.push.apply(trade.requestorItemsOwned, trade.targetItemsOffered); 
					trade.targetItemsOwned.push.apply(trade.targetItemsOwned, trade.requestorItemsOffered); 

					dataAccessFunctions.completeTrade(trade, function(tradeId){
						foundIndexToDelete = tradeList.findIndex(tradeListItem => tradeListItem.tradeId == trade.tradeId);
						if (foundIndexToDelete === -1){
							logg("ERROR - Could not delete trade from trade list" + trade.tradeId);
						}
						else {
							dataAccessFunctions.removeRequestById(tradeId);
							tradeList.splice(foundIndexToDelete, 1);
						}
						sendTradeComplete(trade);
					});

					trade.requestorAccepted = false;
					trade.targetAccepted = false;
				}
				sendTradeTimer(trade);
			}

			//Delete stale trades
			var milisecondThresh = 120000;
			if (new Date().getTime() - trade.tradeActivityTimestamp > milisecondThresh){
				console.log("DELETING STALE TRADE" + tradeList[i].tradeId);
				bootSockets(trade);
				tradeList.splice(i, 1);
			}

			sendTradePing(trade);
			sendStaleTradersToClients(trade);
		}
	},
	1000/1 //Ticks per second
);

module.exports.newTrade = newTrade;
module.exports.getTradeList = getTradeList;
module.exports.getTradeById = getTradeById;
module.exports.createTradeSocketEvents = createTradeSocketEvents;