//
var tradeList = [];
var newTrade = function(requestorSocketId, targetSocketId){
  var trade = {
    requestorSocketId: requestorSocketId,
    targetSocketId: targetSocketId,
    tradeStartDateTime: new Date(),
    requestorItemsOffered: [],
    targetItemsOffered: [],
    requestorAccepted: false,
    targetAccepted: false
  };

  tradeList.push(trade);
}



//EVERY 1 SECOND
setInterval( 
	function(){
    
	},
	1000/1 //Ticks per second
);