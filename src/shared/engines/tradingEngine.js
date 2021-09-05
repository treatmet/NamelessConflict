//
var tradeList = [];

var newTrade = function(requestorCognitoSub, targetCognitoSub, tradeId = Math.random()){
	console.log("CREATING NEW TRADE: " + tradeId);
	//Check for existing trade
	var existingTrade = tradeList.filter((filteredTrade) => { //SELECT //WHERE //LINQ
		if (filteredTrade.requestorCognitoSub == requestorCognitoSub && filteredTrade.targetCognitoSub == targetCognitoSub){
			return true;
		}
	});		
	if (existingTrade.length > 0){
		tradeId = existingTrade[0].tradeId;
		return tradeId;
	}
	
	var trade = {
		tradeId: tradeId,
		requestorCognitoSub: requestorCognitoSub,
		targetCognitoSub: targetCognitoSub,
		tradeStartDateTime: new Date(),
		requestorItemsOffered: [],
		targetItemsOffered: [],
		requestorAccepted: false,
		targetAccepted: false
	};

	tradeList.push(trade);

	console.log("CURRENT TRADE LIST:");
	console.log(tradeList);

	return tradeId;
}

var getTradeList = function(){
	return tradeList;
}

var getTradeById = function(id){
	return tradeList.filter(trade => trade.tradeId == id);
}


newTrade("5903ec8a-64de-4ab7-8936-706230667ca0", "0192fb49-632c-47ee-8928-0d716e05ffea", 123);

//EVERY 1 SECOND
setInterval( 
	function(){
    
	},
	1000/1 //Ticks per second
);

module.exports.newTrade = newTrade;
module.exports.getTradeList = getTradeList;
module.exports.getTradeById = getTradeById;