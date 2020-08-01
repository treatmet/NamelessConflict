global.express = require('express');
global.app = express();
global.serv = require('http').Server(app);


global.fs = require('fs');
global.util = require('util')

global.config = parseINIString(fs.readFileSync('../shared/config.ini', 'utf8'));

//--------------------------------SERVER CONFIGURATION-----------------------------------------------------
global.debug = true;
global.httpOnlyCookies = false;
global.allowDuplicateUsername = false;

global.syncServerWithDbInterval = 15; //Seconds //Both sync and check for stale thresholds
global.serverHealthCheckTimestampThreshold = 90; //Seconds

global.updateOnlineTimestampInterval = 15; //Seconds
global.staleOnlineTimestampThreshold = 60; //Seconds

global.staleRequestCheckInterval = 60; //Seconds
global.staleFriendRequestThreshold = 30; //Days
global.stalePartyRequestThreshold = 300; //Seconds

global.joinActiveGameThreshold = 0.5; //Percentage threshold for how far the game is allowed to be progressed and still accept incoming players

global.pcMode = 2; //1 = no, 2= yes

//----------------------SERVER GLOBAL VARIABLES---------------------------------
global.myIP = "";
global.myUrl = "";
global.port = 3000;
global.serverHomePage = "/";
global.isWebServer = false;
global.isLocal = false;

global.SOCKET_LIST = [];
