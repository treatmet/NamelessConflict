const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
router.use(express.urlencoded({extended: true})); //To support URL-encoded bodies
router.use(cookieParser());
const path = require("path");
var os = require("os");
var hostname = os.hostname();

function getClientPath(relativePath) {
	return path.join(__dirname, "../../client", relativePath);
}
function getClientFile(relativePath) {
	return fs.readFileSync(getClientPath(relativePath), 'utf8')
}

//Homepage
router.get('/', function(req, res) {
	var pageData = {};
	var pageContent = getClientFile('home.html');
	pageData["header"] = getClientFile('header.html');		
	pageContent = replaceValues(pageData, pageContent);	
	res.send(pageContent);
});

router.get('/s/:server/:port/ping', function(req, res) {
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

//Player Search
router.get('/search/:searchText', function(req, res) {
	var pageData = {};
	var pageContent =  getClientFile('playerSearch.html');
	pageData["header"] =  getClientFile('header.html');		
	pageContent = replaceValues(pageData, pageContent);	
	res.send(pageContent);
});

module.exports = router;
