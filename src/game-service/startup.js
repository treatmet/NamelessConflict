const gameRouter = require('./controllers/gameController.js');
const userRouter = require('../shared/controllers/userController.js');
const logEngine = require('../shared/engines/logEngine.js');
const mapEngine = require('./engines/mapEngine.js');
require('../shared/engines/socketEngine.js');
var dataAccess = require('../shared/data_access/dataAccess.js');
const os = require('os');

const ifaces = os.networkInterfaces();
const cookieParser = require('cookie-parser');
const path = require('path');
const hostname = os.hostname();

//Process command line arguments
processArgs();
testDB();

serv.listen(port);
app.use(gameRouter);
app.use(userRouter);

app.use("/favicon.ico", express.static(getClientPath('favicon.ico')));
app.use("/client", express.static(getClientPath('.')));
app.use(express.urlencoded({extended: true})); //To support URL-encoded bodies
app.use(cookieParser());

logg("----------------------SERVER STARTUP-----------------------");
logg('Express server started on port ' + port + '.');

mapEngine.initializeBlocks(map);
mapEngine.initializePickups(map);



//-------------------------------------------------------------------------------------
function addGameServerToLoadBalancer(){
	log("REGISTERING GAME SERVER TO TARGET GROUP");
	var EBparams = {
		EnvironmentName:config.EBName
	};
	elasticbeanstalk.describeEnvironmentResources(EBparams, function(err, data) { //Get Loadbalancer Arn from ElasticBeanstalk environment
		if (err) console.log("AWS API ERROR -- Unable to Get Loadbalancer Arn from ElasticBeanstalk environment: " + err);
		else    {
			log("Instance Ids:");
			logObj(data.EnvironmentResources.Instances);
			log("LoadBalancer Arns:");
			logObj(data.EnvironmentResources.LoadBalancers[0].Name);

			var loadBalancerArn = data.EnvironmentResources.LoadBalancers[0].Name;

			var LBparams = {
				LoadBalancerArn: loadBalancerArn,
				PageSize: 400
			};
			elbv2.describeTargetGroups(LBparams, function(err, data) { //List all target groups in Loadbalancer
				if (err) console.log("AWS API ERROR -- Unable to List all target groups in Loadbalancer: " + err);
				else {
					log("TARGET GROUPS");
					logObj(data.TargetGroups);
					for (var l in data.TargetGroups){
						log("Name=" + data.TargetGroups[l].TargetGroupName + " TargetGroupArn=" + data.TargetGroups[l].TargetGroupArn);

						var targetParams = {
							TargetGroupArn: data.TargetGroups[l].TargetGroupArn
						};
						console.log(data.TargetGroups[l].TargetGroupName + " TARGET GROUP HAS THESE INSTANCES:");
						elbv2.describeTargetHealth(targetParams, function(err, instanceData) {
							if (err) console.log(err, err.stack); // an error occurred
							else {
								for (var i in instanceData.TargetHealthDescriptions){
									log(instanceData.TargetHealthDescriptions[i].Target.Id); //Instance Id
								}
							}
							/*
							instanceData = {
							TargetHealthDescriptions: [
								{
									Target: {
									Id: "i-0f76fade", 
									Port: 80
								}, 
								TargetHealth: {
									Description: "Given target group is not configured to receive traffic from ELB", 
									Reason: "Target.NotInUse", 
									State: "unused"
								}
								}, 
								{
									HealthCheckPort: "80", 
									Target: {
									Id: "i-0f76fade", 
									Port: 80
								}, 
								TargetHealth: {
								State: "healthy"
								}
								}
							]
							}
							*/
						});

						
						//TODO: DescribeTargetHealth
					}
				}        
			});
		}
	});

}

function createTargetGroup(name, port, cb){
	var returnData = {};

	var params = {
		Name: name, /* required */
		HealthCheckEnabled: true,
		HealthCheckIntervalSeconds: 30,
		HealthCheckPath: '/ping',
		HealthCheckProtocol: 'HTTP',
		HealthCheckTimeoutSeconds: 5,
		HealthyThresholdCount: 5,
		Matcher: {
			HttpCode: '200' /* required */
		},
		Port: port,
		Protocol: 'HTTP',
		TargetType: 'instance',
		UnhealthyThresholdCount: 2,
		VpcId: 'vpc-c15aada9'
	};
	elbv2.createTargetGroup(params, function(err, data) {
		if (err){ 
			log(err);
			returnData.error = err;
		}
		else {
			console.log(data);
			returnData = data;
		}          
	});

	return returnData;
}

function registerEC2ToTargetGroup(targetGroupArn, instanceId, cb){
	var returnData = {};
	var params = {
		TargetGroupArn: targetGroupArn, //"arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/my-targets/73e2d6bc24d8a067"
		Targets: [{	Id: instanceId }] //"i-80c8dd94"
	};
	elbv2.registerTargets(params, function(err, data) {
		if (err) {
			logg("AWS API ERROR -- Unable to Register EC2 to Target Group");
			console.log(err);
			cb({error:err});
		}
		else {
			console.log(data);
			cb(data);
		}
	});	
}


function describeListeners(){
	var EBparams = {
		EnvironmentName:config.EBName
	};
	elasticbeanstalk.describeEnvironmentResources(EBparams, function(err, data) {
		if (err) log(err, err.stack); // an error occurred
		else    {
			log("Instance Ids:");
			logObj(data.EnvironmentResources.Instances);
			log("LoadBalancer Arns:");
			logObj(data.EnvironmentResources.LoadBalancers[0].Name);

			var loadBalancerArn = data.EnvironmentResources.LoadBalancers[0].Name;

			var LBparams = {
				LoadBalancerArn: loadBalancerArn,
				PageSize: 100
			};
			elbv2.describeListeners(LBparams, function(err, data) {
				if (err) console.log(err, err.stack); // an error occurred
				else     {
					log("LISTENERS");
					logObj(data.Listeners);
					for (var l in data.Listeners){
						log("Listener on Port " + data.Listeners[l].Port + ". Default Action:");
						logObj(data.Listeners[l].DefaultActions)
						if (data.Listeners[l].Port == 443){
							log("Port 443's TargetGroups:");
							logObj(data.Listeners[l].DefaultActions[0].ForwardConfig.TargetGroups);
						}
					}
				}        
			});
		}
	});
}

function describeAllTargetGroupsInLoadBalancer(){
	var EBparams = {
		EnvironmentName:config.EBName
	};
	elasticbeanstalk.describeEnvironmentResources(EBparams, function(err, data) {
		if (err) log(err, err.stack); // an error occurred
		else    {
			log("Instance Ids:");
			logObj(data.EnvironmentResources.Instances);
			log("LoadBalancer Arns:");
			logObj(data.EnvironmentResources.LoadBalancers[0].Name);

			var loadBalancerArn = data.EnvironmentResources.LoadBalancers[0].Name;

			var LBparams = {
				LoadBalancerArn: loadBalancerArn,
				PageSize: 1000
			};
			elbv2.describeTargetGroups(LBparams, function(err, data) {
				if (err) console.log(err, err.stack); // an error occurred
				else {
					log("TARGET GROUPS");
					logObj(data.TargetGroups);
					for (var l in data.TargetGroups){
						log("Name=" + data.TargetGroups[l].TargetGroupName + " TargetGroupArn=" + data.TargetGroups[l].TargetGroupArn);
					}
				}        
			});
		}
	});
}

function getClientPath(relativePath) {
	return path.join(__dirname, "../client", relativePath);
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
		
	if (isLocal){
		logg("Updating app to run locally");
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
	const request = require('request-promise');
	request('http://169.254.169.254/latest/meta-data/local-ipv4', function (error, response, body) {
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

global.instanceId = "";
function getInstanceIdAndAddToLoadBlanacer(){
	const request = require('request-promise');
	request('http://169.254.169.254/latest/meta-data/instance-id', function (error, response, body) {
		if (!error && response.statusCode === 200 && response.body) {
			instanceId = response.body;
		}
		else {
			logg("AWS API ERROR -- Unable to Get Instance Id");
		}
	}).catch(function (err){
		logg("AWS API ERROR -- Unable to Get Instance Id:");
		logg(util.format(err));
	});
}