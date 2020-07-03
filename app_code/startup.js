var appDir = ""; var searchingDir = __dirname + "/";
for (var x = 0; x < 9; x++){
	if (fs.existsSync(searchingDir + "app.js")) { break; }
	else { appDir += "../"; searchingDir += "../"; }}

const userRouter = require(appDir + 'app_code/routes/userController.js');
const serverRouter = require(appDir + 'app_code/routes/serverController.js');
const pageRouter = require(appDir + 'app_code/routes/pageController.js');
const logEngine = require(appDir + 'app_code/engines/logEngine.js');
var dataAccess = require(appDir + 'app_code/data_access/dataAccess.js');

const os = require('os');
const ifaces = os.networkInterfaces();
const cookieParser = require('cookie-parser');

//Process command line arguments
processArgs();
testDB();

serv.listen(port);
app.use(userRouter);
app.use(serverRouter);
app.use(pageRouter);
app.use('/client',express.static(absAppDir + '/client'));
app.use('/',express.static(absAppDir + '/')); //To allow for favicon.ico
app.use(express.urlencoded({extended: true})); //To support URL-encoded bodies
app.use(cookieParser());

logg("----------------------SERVER STARTUP-----------------------");
logg('Express server started on port ' + port + '.');

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
	logg("Command line arguments:");
	for (let j = 0; j < process.argv.length; j++) {
		if (j >= 2){
			logg(j + ' -> ' + (process.argv[j]));
			if (j == 2){
				logg("Updating port based on cmd argument: " + process.argv[j]);
				port = process.argv[j];
			}
			else if (j == 3 && process.argv[j] == "true"){
				logg("Updating app to run as an admin webserver: " + process.argv[j]);
				isWebServer = true;
			}
			else if (j == 4 && process.argv[j] == "true"){
				logg("Updating app to run locally: " + process.argv[j]);
				isLocal = true;
			}
		}
	}
		
	if (isLocal){
		getIP();
	}
	else {
		getAwsIp();
		serverHomePage = "https://rw.treatmetcalf.com/";
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
	request('http://169.254.169.254/latest/meta-data/public-ipv4', function (error, response, body) {
		if (!error && response.statusCode === 200 && response.body) {
			myIP = response.body;
			logEngine.reinitStream();
			myUrl = myIP + ":" + port;
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