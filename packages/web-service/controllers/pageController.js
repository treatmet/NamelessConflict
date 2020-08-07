const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
router.use(express.urlencoded({extended: true})); //To support URL-encoded bodies
router.use(cookieParser());

//Homepage
router.get('/', function(req, res) {
	var pageData = {};
	var pageContent = fs.readFileSync('./client/home.html', 'utf8');
	pageData["header"] = fs.readFileSync('./client/header.html', 'utf8');		
	pageContent = replaceValues(pageData, pageContent);	
	res.send(pageContent);
});

//User profile page
router.get('/user/:cognitoSub', function(req, res) {
	var pageData = {};
	var pageContent = fs.readFileSync('./client/profile.html', 'utf8');
	pageData["header"] = fs.readFileSync('./client/header.html', 'utf8');		
	pageContent = replaceValues(pageData, pageContent);	
	res.send(pageContent);
});

//Player Search
router.get('/search/:searchText', function(req, res) {
	var pageData = {};
	var pageContent = fs.readFileSync('./client/playerSearch.html', 'utf8');
	pageData["header"] = fs.readFileSync('./client/header.html', 'utf8');		
	pageContent = replaceValues(pageData, pageContent);	
	res.send(pageContent);
});

module.exports = router;
