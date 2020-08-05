global.mongoDbLocation = process.env.mongoDbLocation;
global.s3LoggingBucket = process.env.s3LoggingBucket;
global.EBName = process.env.EBName;
global.serverHealthCheckTimestampThreshold = process.env.serverHealthCheckTimestampThreshold;

var AWS = require("aws-sdk");
var elasticbeanstalk = new AWS.ElasticBeanstalk();

require('./code/logEngine.js');
const dataAccess = require('./code/dataAccess.js');

exports.handler = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    var fullServers = 0;
    var emptyServers = 0;
    var playableServers = 0;

    getPublicServersFromDB(function(res){

        for (var s = 0; s < res.length; s++){
            console.log
            var players = getCurrentNumPlayers(res[s].currentUsers);
            if (players >= res[s].maxPlayers){
                fullServers++;
            }
            else {
                playableServers++;
            }
            if (players == 0){
                emptyServers++;
            }

            var serverLastHealthCheck = new Date(res[s].healthCheckTimestamp);                                    
            var acceptableLastHealthCheckTime = new Date();
            acceptableLastHealthCheckTime.setSeconds(acceptableLastHealthCheckTime.getUTCSeconds() - serverHealthCheckTimestampThreshold);
            if (serverLastHealthCheck < acceptableLastHealthCheckTime || typeof res[s].healthCheckTimestamp === 'undefined'){
                if (typeof res[s].healthCheckTimestamp === 'undefined'){
                    console.log("DEAD SERVER FOUND: " + res[s].url + ". [No set healthCheckTimestamp] Removing...");					
                }
                else {
                    console.log("DEAD SERVER FOUND: " + res[s].url + ". [" + serverLastHealthCheck.toISOString() + " is less than " + acceptableLastHealthCheckTime.toISOString() + ". Current time is " + new Date().toISOString() + "] Removing...");
                }					
                dataAccess.dbUpdateAwait("RW_SERV", "rem", { url: res[s].url }, {}, async function(err2, obj){
                    if (!err2){
                        console.log("Unhealthy Server successfully removed from database. (" + res[s].url + ")");
                    }
                });										
            }


        }	

        console.log("fullServers: " + fullServers);
        console.log("emptyServers: " + emptyServers);
        console.log("playableServers: " + playableServers);


        console.log("Updating EB instance count...");
        updateInstanceCount(3, function(){
            console.log("EB updateInstnceCount callback");
            callback(null, "fullServers: " + fullServers);
        });

    });	
};

function updateInstanceCount(targetCount, cb){
    var params = {
        EnvironmentName: EBName, 
        OptionSettings: [
            {
                Namespace: "aws:autoscaling:asg", 
                OptionName: "MinSize", 
                Value: targetCount.toString()
            }, 
            {
                Namespace: "aws:autoscaling:asg", 
                OptionName: "MaxSize", 
                Value: targetCount.toString()
            } 
        ]
    };

    elasticbeanstalk.updateEnvironment(params, function(err, data) {
        if (err){ 
            console.log("ERROR FAILED BEANSTALK UPDATE");
            console.log(err, err.stack); // an error occurred
        }
        else {
            console.log("BEANSTALK UPDATE SUCCESS!!!");
            console.log(data);           // successful response
        }
        cb();

        /*
        "OptionName": "MinSize",
        "OptionName": "MaxSize"

        data = {
         ApplicationName: "my-app", 
         CNAME: "my-env.elasticbeanstalk.com", 
         DateCreated: <Date Representation>, 
         DateUpdated: <Date Representation>, 
         EndpointURL: "awseb-e-i-AWSEBLoa-1RDLX6TC9VUAO-0123456789.us-west-2.elb.amazonaws.com", 
         EnvironmentId: "e-szqipays4h", 
         EnvironmentName: "my-env", 
         Health: "Grey", 
         SolutionStackName: "64bit Amazon Linux running Tomcat 7", 
         Status: "Updating", 
         Tier: {
          Name: "WebServer", 
          Type: "Standard", 
          Version: " "
         }, 
         VersionLabel: "v2"
        }
        */
        
      });

}

function getPublicServersFromDB(cb){
	var servers = [];
	dataAccess.dbFindAwait("RW_SERV", {privateServer:false}, function(err,res){
		if (res && res[0]){
				
			for (var i = 0; i < res.length; i++){

				if (res[i].gametype == "ctf"){
					res[i].gametype = "CTF";
				}

				servers.push(res[i]);
			}					
        }
        cb(servers);
	});
}

function getCurrentNumPlayers(currentUsers){
    var players = 0;
    for (var u = 0; u < currentUsers.length; u++){
        if (currentUsers[u].team == "none" || currentUsers[u].team == "white" || currentUsers[u].team == "black")
            players++;
    }
    return players;
}
