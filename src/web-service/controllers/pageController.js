const express = require('express');
const router = express.Router();
router.use(express.urlencoded({extended: true})); //To support URL-encoded bodies
const path = require("path");
var os = require("os");
var hostname = os.hostname();

function getClientPath(filename) {
	return path.join(__dirname, "../../client", filename);
}
function getRootPath(filename) {
	return path.join(__dirname, "../..", filename);
}
function getClientFile(filename) {
	return fs.readFileSync(getClientPath(filename), 'utf8')
}

//Homepage
router.get('/', function(req, res) {
	var pageData = {};
	var pageContent = getClientFile('home.html');
	pageData["header"] = getClientFile('header.html');		
	pageContent = replaceValues(pageData, pageContent);	
	res.send(pageContent);
});

//Local Game
router.get('/localGame', function(req, res) {
	var pageData = {};
	var pageContent = getClientFile('gameLocal.html');
	pageContent = replaceValues(pageData, pageContent);	
	res.send(pageContent);
});

router.get('/ping', function(req, res) {
	res.send({
		host: hostname
	});
});

//User profile page
router.get('/user/:cognitoSub', function(req, res) {
	var pageData = {};
	var pageContent = getClientFile('profile.html');
	pageData["header"] = getClientFile('header.html');		
	pageContent = replaceValues(pageData, pageContent);	
	res.send(pageContent);
});

//Trade page
router.get('/trade', function(req, res) {
	var pageData = {};
	var pageContent = getClientFile('trade.html');
	pageData["header"] = getClientFile('header.html');		
	pageContent = replaceValues(pageData, pageContent);	
	res.send(pageContent);
});

//Player Search
router.get('/search/:searchText', function(req, res) {
	var pageData = {};
	var pageContent =  getClientFile('playerSearch.html');
	pageData["header"] =  getClientFile('header.html');		
	pageContent = replaceValues(pageData, pageContent);	
	res.send(pageContent);
});

module.exports = router;
