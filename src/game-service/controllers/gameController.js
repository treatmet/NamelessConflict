var dataAccess = require('../../shared/data_access/dataAccess.js');
var authenticationEngine = require('../../shared/engines/authenticationEngine.js');

var gameEngine = require('../engines/gameEngine.js');

const express = require('express');
const router = express.Router();
const request = require('request-promise');
const path = require("path");
const os = require("os");
const hostname = os.hostname();

function getClientPath(relativePath) {
	return path.join(__dirname, "../../client", relativePath);
}
function getClientFile(relativePath) {
	return fs.readFileSync(getClientPath(relativePath), 'utf8')
}

router.use(express.urlencoded({extended: true})); //To support URL-encoded bodies

router.get('/game', function(req, res) {
	var pageData = {};
	var pageContent = getClientFile('game.html');
	pageContent = replaceValues(pageData, pageContent);	
	res.send(pageContent);
});

router.get('/ping', function(req, res) {
	res.send({
		host: hostname,
		ip: myUrl
	});
});


router.post('/playNow', async function (req, res) {
	log("playNow endpoint");
	if (myUrl == ""){
		logg("res.send: " + "Url for current server not set");
		res.send({msg:"Url for current server not set", success:false});
		return;
    }
    	
	let authorizedUser; 
	if (!req.body.tempCognito){
		logg("/playNow: NOT TEMP, Getting authorized user");
		authorizedUser = await authenticationEngine.getAuthorizedUser(req.cookies); //Get authorized user Get authenticated User
	}
	console.log("REQ BODY: ");
	console.log(req.body);

	if ((authorizedUser && bannedCognitoSubs.find(sub => sub == authorizedUser.cognitoSub)) || bannedCognitoSubs.find(sub => sub == req.body.tempCognito)){
		logg("res.send: " + "You are banned from the current game for betraying. Please try again in a few minutes.");
		res.send({msg:"You are banned from the current game for betraying. Please try again in a few minutes.", success:false});
		return;
    }

	//Check if server is expecting this incoming user
	var params = {url:myUrl, privateServer:false};
	var approvedToJoinServer = false;
	
	dataAccess.dbFindOptionsAwait("RW_SERV", params, {sort:{serverNumber: 1}}, async function(err, serv){	
		if (serv && serv[0]){
			var incomingUsers = serv[0].incomingUsers || "[]";
			for (var u = 0; u < incomingUsers.length; u++){
				if ((authorizedUser && incomingUsers[u].cognitoSub == authorizedUser.cognitoSub) || incomingUsers[u].cognitoSub == req.body.tempCognito){
					approvedToJoinServer = true;
					
					res.status(200);
					logg("res.send: " + "Server " + myUrl + " welcomes you!");
					res.send({msg:"Server " + myUrl + " welcomes you!", success:true});
					var cognitoSub = req.body.tempCognito ? req.body.tempCognito : authorizedUser.cognitoSub;
					gameEngine.joinGame(cognitoSub, incomingUsers[u].username, incomingUsers[u].team, incomingUsers[u].partyId); //Join game
					break;
				}
			}
		}
		if (!approvedToJoinServer){
			logg("res.send: " + "Error: The server was not expecting you");
			res.send({msg:"Error: The server was not expecting you", success:false}); //Error
		}
	});
});


router.post('/updateGameServer', async function (req, res) {
	log("updateGameServer endpoint");
	console.log(req.body);
	if (myUrl == ""){
		logg("res.send: " + "Url for current server not set");
		res.send({msg:"Url for current server not set", success:false});
		return;
	}	
	gameEngine.updateRequestedSettings(req.body.settings, function(result){
		res.send({result:result});
	});    	
});



module.exports = router;