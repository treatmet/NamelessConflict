global.mongoDbLocation = process.env.mongoDbLocation;
global.s3LoggingBucket = process.env.s3LoggingBucket;
global.EBName = process.env.EBName;

var AWS = require("aws-sdk");
var elasticbeanstalk = new AWS.ElasticBeanstalk();

require('./code/logEngine.js');
const dataAccess = require('./code/dataAccess.js');



exports.handler = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    var fullServers = 0;
    var emptyServers = 0;
    var playableServers = 0;

    getPublicServersFromDB(function(servers){

        for (var s = 0; s < servers.length; s++){
            var players = getCurrentNumPlayers(servers[s]);
            if (players >= servers[s].maxPlayers){
                fullServers++;
            }
            else {
                playableServers++;
            }
            if (players == 0){
                emptyServers++;
            }
        }	

        console.log("fullServers: " + fullServers);
        console.log("emptyServers: " + emptyServers);
        console.log("playableServers: " + playableServers);
        updateInstanceCount(3, function(){
            console.log("updateInstnceCount callback");
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

function getCurrentNumPlayers(server){
    var players = 0;
    for (var u = 0; u < server.currentUsers.length; u++){
        if (server.currentUsers[u].team == "none" || server.currentUsers[u].team == "white" || server.currentUsers[u].team == "black")
            players++;
    }
    return players;
}
