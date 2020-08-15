var dataAccess = require('../../shared/data_access/dataAccess.js');
var authenticationEngine = require('../../shared/engines/authenticationEngine.js');

var gameEngine = require('../engines/gameEngine.js');

const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
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
router.use(cookieParser());

router.get('/', function(req, res) {
	var pageData = {};
	var pageContent = getClientFile('game.html');
	pageContent = replaceValues(pageData, pageContent);	
	res.send(pageContent);
});

router.get('/s/:server/:port/ping', function(req, res) {
	res.send({
		host: hostname,
		ip: myUrl
	});
});

router.post('/playNow', async function (req, res) {
	if (myUrl == ""){
		logg("res.send: " + "Url for current server not set");
		res.send({autoJoin:false, error:"Url for current server not set"});
		return;
    }
    	
	var authorizedUser = await authenticationEngine.getAuthorizedUser(req.cookies); //Get authorized user Get authenticated User
	
	//Check if server is expecting this incoming user
	var params = {url:myUrl, privateServer:false};
	var approvedToJoinServer = false;
	
	dataAccess.dbFindOptionsAwait("RW_SERV", params, {sort:{serverNumber: 1}}, async function(err, serv){	
		if (serv && serv[0]){
			var incomingUsers = serv[0].incomingUsers || "[]";
			for (var u = 0; u < incomingUsers.length; u++){
				if (incomingUsers[u].cognitoSub == authorizedUser.cognitoSub){
					approvedToJoinServer = true;
					
					res.status(200);
					logg("res.send: " + "Server " + myUrl + " welcomes you!");
					res.send({msg:"Server " + myUrl + " welcomes you!", success:true});					
					gameEngine.joinGame(authorizedUser.cognitoSub, incomingUsers[u].username, incomingUsers[u].team, incomingUsers[u].partyId); //Join game
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

module.exports = router;