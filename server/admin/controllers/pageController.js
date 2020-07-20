
const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
router.use(express.urlencoded({extended: true})); //To support URL-encoded bodies
router.use(cookieParser());

var dataAccessFunctions = require(absAppDir + '/app_code/data_access/dataAccessFunctions.js');
var gameEngine = require(absAppDir + '/app_code/engines/gameEngine.js');

//Homepage
router.get('/', function(req, res) {
	var pageData = {};
	var pageContent = fs.readFileSync(absAppDir + '/client/home.html', 'utf8');
	pageData["header"] = fs.readFileSync(absAppDir + '/client/header.html', 'utf8');		
	pageContent = replaceValues(pageData, pageContent);	
	res.send(pageContent);
});

//User profile page
router.get('/user/:cognitoSub', function(req, res) {
	var pageData = {};
	var pageContent = fs.readFileSync(absAppDir + '/client/profile.html', 'utf8');
	pageData["header"] = fs.readFileSync(absAppDir + '/client/header.html', 'utf8');		
	pageContent = replaceValues(pageData, pageContent);	
	res.send(pageContent);
});

//Player Search
router.get('/search/:searchText', function(req, res) {
	var pageData = {};
	var pageContent = fs.readFileSync(absAppDir + '/client/playerSearch.html', 'utf8');
	pageData["header"] = fs.readFileSync(absAppDir + '/client/header.html', 'utf8');		
	pageContent = replaceValues(pageData, pageContent);	
	res.send(pageContent);
});

module.exports = router;
