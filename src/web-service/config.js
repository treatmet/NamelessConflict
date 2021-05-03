global.express = require('express');
global.app = express();
global.serv = require('http').Server(app);


global.fs = require('fs');
global.util = require('util')

global.config = require("../settings.json");

//--------------------------------SERVER CONFIGURATION-----------------------------------------------------
global.debug = true;
global.httpOnlyCookies = false;
global.allowDuplicateUsername = false;

global.staleOnlineTimestampThreshold = 60; //Seconds
global.joinActiveGameThreshold = 0.5; //Percentage threshold for how far the game is allowed to be progressed and still accept incoming players (0.0 - 1.0) //This is needed on web server because that is where the evaluation is made

global.pcMode = 2; //1 = no, 2= yes

//----------------------SERVER GLOBAL VARIABLES---------------------------------
global.myIP = "";
global.myUrl = "";
global.port = 8080;
global.serverHomePage = "/";
global.isWebServer = false;
global.isLocal = false;

global.isTest = false; //Flip for test deployment Testy!

global.defaultShopSlotsUnlocked = 2; //Guess
global.maxShopSlotsUnlocked = 5; //Upper limit on how many shop slots can be unlocked

global.SOCKET_LIST = [];
