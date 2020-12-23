const logEngine = require('./logEngine.js');
const dataAccessFunctions = require('../data_access/dataAccessFunctions.js');

var updateOnlineTimestampInterval = 15; //Seconds
var secondsSinceOnlineTimestampUpdate = 0;
var currentStreamingDay = new Date().getUTCDate();

//EVERY 1 SECOND
setInterval( 
	function(){

		//Set Player onlineTimestamp
		secondsSinceOnlineTimestampUpdate++;
		if (secondsSinceOnlineTimestampUpdate > updateOnlineTimestampInterval){
			dataAccessFunctions.updateOnlineTimestampForUsers();
			secondsSinceOnlineTimestampUpdate = 0;
		}
	},
	1000/1 //Ticks per second
);