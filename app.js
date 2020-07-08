//2017-2020 Treat Metcalf
//Alpha Version

'use strict';
global.absAppDir = __dirname;
const helpers = require('./app_code/helperFunctions.js'); //Global helper functions

//-------------------------------MODULE REQUIRES----------------------------------------------
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const AWS = require('aws-sdk');
global.fs = require('fs');
const fetch = require('node-fetch');

global.express = require('express');
global.app = express();
global.serv = require('http').Server(app);


global.util = require('util')

global.config = parseINIString(fs.readFileSync(absAppDir + '/config.ini', 'utf8'));


//-------------------------------FILE REQUIRES----------------------------------------------
var serverConfig = require('./app_code/config.js');

const dataAccess = require('./app_code/data_access/dataAccess.js');
const dataAccessFunctions = require('./app_code/data_access/dataAccessFunctions.js');

const logEngine = require('./app_code/engines/logEngine.js');
const gameEngine = require('./app_code/engines/gameEngine.js');
const mapEngine = require('./app_code/engines/mapEngine.js');
const authenticationEngine = require('./app_code/engines/authenticationEngine.js');
const entityHelpers = require('./app_code/entities/_entityHelpers.js');

var Pickup = require('./app_code/entities/pickup.js');
var Block = require('./app_code/entities/block.js');
var Thug = require('./app_code/entities/thug.js');
var player = require('./app_code/entities/player.js');

//------------------------------------------------------------------------

//Crash handling
process
  .on('unhandledRejection', (reason, p) => {
	logg("--SERVER CRASH:Unhandled Rejection at Promise");
    logg("--" + reason);
	logObj(p);
  })
  .on('uncaughtException', err => {
	logg("--SERVER CRASH:Uncaught Exception thrown");
    logg(util.format(err));
    process.exit(1);
  });

//---------------------------------STARTUP---------------------------------------

require('./app_code/startup.js');
require('./app_code/engines/socketEngine.js');





global.populateLoginPage = function(socket){	

	//Populate Leaderboard Table
	var leaderboard= "<table class='leaderboard'><tr><th>Rank</th><th style='width: 900px;'>Username</th><th>Rating</th><th>Kills</th><th>Capts</th><th>Wins</th><th>Exp</th></tr>";
	
	dataAccess.dbFindOptionsAwait("RW_USER", {$and:[{"USERNAME":{$exists:true}}, {"USERNAME":{$not:/^testuser.*/}}]}, {sort:{experience: -1},limit:100}, async function(err, res){
		if (res && res[0]){
			for (var i = 0; i < res.length; i++){
				if (res[i].USERNAME){
					leaderboard+="<tr><td style='background-color: #728498; text-align: center; font-weight: bold;'>" + (i + 1) + "</td><td><a href='{{serverHomePage}}user/"+res[i].cognitoSub+"'>" + res[i].USERNAME.substring(0, 15) + "</td><td>" + res[i].rating + "</td><td>" + res[i].kills + "</td><td>" + res[i].captures + "</td><td>" + res[i].gamesWon + "</td><td>" + res[i].experience + "</td></tr>";
				}
				else {
					logg("ERROR ACQUIRING USERNAME:");
					console.log(res[i]);
				}
			}		
			leaderboard+="</table>";
			socket.emit('populateLoginPage', leaderboard, pcMode);
		}
		else {
			logg('ERROR finding players in database.');
			leaderboard+="</table>";
			socket.emit('populateLoginPage', leaderboard, pcMode);		}
	});	
}

global.sendChatToAll = function(text){
	for(var i in SOCKET_LIST){
		SOCKET_LIST[i].emit('addMessageToChat',text);
	}
}







//////////INITIALIZE MAP///////////////////// Create Blocks new block Create Pickups new pickups
mapEngine.initializeBlocks(map);
mapEngine.initializePickups(map);



