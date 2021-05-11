const gameRouter = require('./controllers/gameController.js');
const userRouter = require('../shared/controllers/userController.js');
const logEngine = require('../shared/engines/logEngine.js');
const mapEngine = require('./engines/mapEngine.js');
require('../shared/engines/socketEngine.js');
require('../shared/engines/sharedTimerEngine.js');
var dataAccess = require('../shared/data_access/dataAccess.js');
const os = require('os');

const ifaces = os.networkInterfaces();
const cookieParser = require('cookie-parser');
const path = require('path');
const hostname = os.hostname();

//Process command line arguments
processArgs();
testDB();

app.use(cookieParser());


serv.listen(port);
app.use(gameRouter);
app.use(userRouter);

app.use("/favicon.ico", express.static(getClientPath('favicon.ico')));
console.log("getRootPath('.')");
console.log(getRootPath('.'));
console.log("getClientPath('.')");
console.log(getClientPath('.'));
app.use("/src", express.static(getRootPath('.')));
app.use(express.urlencoded({extended: true})); //To support URL-encoded bodies


logg("----------------------GAME SERVER STARTUP-----------------------");
logg('Express server started on port ' + port + '.');
logg("Environment: " + process.env.Environment);

if (process.env.Environment == "Test"){
	isTest = true;
}
else if (process.env.Environment == "Prod"){
	isTest = false;
}

mapEngine.initializeBlocks(map);
mapEngine.initializePickups(map);



//-------------------------------------------------------------------------------------


function getClientPath(filename) {
	return path.join(__dirname, "../client", filename);
}
function getRootPath(filename) {
	return path.join(__dirname, "../", filename);
}

function testDB(){
	logg('Initializing...');
	logg("testing db");
	dataAccess.dbFindAwait("RW_USER", {USERNAME:"testuser"}, async function(err, res){
		if (res && res[0]){
			logg("DB SUCCESS! found testuser");
		}
		else {
			logg("ERROR! DB CONNECT FAIL: unable to find testuser");
		}
	});
}

function processArgs(){
	logg("Running on machine: " + hostname);

	isWebServer = false;
	logg("Command line arguments:");
	for (let j = 0; j < process.argv.length; j++) {
		if (j >= 2){
			logg(j + ' -> ' + (process.argv[j]));
			if (j == 2){
				logg("Updating port based on cmd argument: " + process.argv[j]);
				port = process.argv[j];
			}
		}
	}

	isLocal = !hostname.toLowerCase().includes("compute");
	if (isTest)
    	config.EBName = "SocketShot-Test";

	if (isLocal){
		logg("Updating app to run locally");
		getIP();
	}
	else {
		getAwsIp();
		if (!isTest){
			serverHomePage = "https://ss.treatmetcalf.com/";
		}
		else {
			serverHomePage = "https://sstest.treatmetcalf.com/";
		}
	}

	if (port == "3001"){
		gametype = "ctf";
		maxPlayers = 14;
	}
	else if (port == "3002"){
		gametype = "ctf";
		maxPlayers = 8;
	}
	else if (port == "3003"){
		gametype = "slayer";
		maxPlayers = 14;
	}
	else if (port == "3004"){
		gametype = "slayer";
		maxPlayers = 8;
	}
}

//Get IP Address for RW_SERV (localhost)
function getIP(){
	Object.keys(ifaces).forEach(function (ifname) {
	  var alias = 0;

	  ifaces[ifname].forEach(function (iface) {
		if ('IPv4' !== iface.family || iface.internal !== false) {
		  // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
		  return;
		}

		if (alias >= 1) {
		  // this single interface has multiple ipv4 addresses
		  logg(ifname + ':' + alias, iface.address);
		} else {
		  // this interface has only one ipv4 adress
		  logg("Server hosting outside AWS on: " + iface.address);
		}
		myIP = iface.address;
		logEngine.reinitStream();
		++alias;
	  });
	});
	myUrl = myIP + ":" + port;
}

//Get IP Address for RW_SERV (AWS)
function getAwsIp() {
	const request = require('request-promise');
	request('http://169.254.169.254/latest/meta-data/local-ipv4', function (error, response, body) {
		if (!error && response.statusCode === 200 && response.body) {
			myIP = response.body;
			myUrl = myIP + ":" + port;
			logEngine.reinitStream();
			request('http://169.254.169.254/latest/meta-data/instance-id', function (errorInst, responseInst, bodyInst) {
				if (!errorInst && responseInst.statusCode === 200 && responseInst.body) {
					instanceId = responseInst.body;					
					logg("Got AWS instanceId: " + instanceId);
					myQueryString = "?server=" + instanceId.substring(2) + "&process=" + port.toString().substring(2);
				}
				else {
					log("AWS API ERROR -- Unable to Get Instance Id");
				}
			}).catch(function (err){
				log("AWS API ERROR -- Unable to Get Instance Id:");
				log(util.format(err));
			});
		}
	}).catch(function (err){
		logg("ERROR: FAILED TO GET AWS IPV4 ADDRESS (ignore this if hosting outside AWS)");
		logg(util.format(err));
		//getIP(); //If the previous command fails, we arent in AWS, so try the local method
	});
}

function crash(){
	var newVar = alskdjf.thisIsUndefined;
}

