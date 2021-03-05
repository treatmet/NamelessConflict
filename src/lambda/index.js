global.updateEB = process.env.updateEB;
global.mongoDbLocation = process.env.mongoDbLocation;
global.s3LoggingBucket = process.env.s3LoggingBucket;
global.EBName = process.env.EBName;
global.serverHealthCheckTimestampThreshold = process.env.serverHealthCheckTimestampThreshold; 
global.stalePartyRequestThreshold = process.env.stalePartyRequestThresholdDays; //30 (Days)
global.staleFriendRequestThreshold = process.env.staleFriendRequestThresholdSeconds; //300 (Seconds)
global.AWSRegion = process.env.AWSRegion; //300 (Seconds)

var runningLocally = false;
var completedTasks = [];
const taskList = [
    "removeStaleRequests",
    "removeStaleServers",
    "removeStaleTargetGroups",
    "updateInstanceCount"
];

//Running locally
if (!EBName){
    var localConfig = require("./config.json");
    if (localConfig){
        console.log("Running locally...");
        runningLocally = true;
        updateEB = localConfig.updateEB;
        mongoDbLocation = localConfig.mongoDbLocation;
        s3LoggingBucket = localConfig.s3LoggingBucket;
        EBName = localConfig.EBName;
        serverHealthCheckTimestampThreshold = localConfig.serverHealthCheckTimestampThreshold; 
        stalePartyRequestThreshold = localConfig.stalePartyRequestThresholdDays; //30 (Days)
        staleFriendRequestThreshold = localConfig.staleFriendRequestThresholdSeconds; //300 (Seconds)
        AWSRegion = localConfig.AWSRegion;
    }
    else {
        console.log("ERROR - NO ENVIRONMENT VARIABLES OR config.json FOUND!!!");
    }
}

require('./code/logEngine.js');
const dataAccess = require('./code/dataAccess.js');

var AWS = require("aws-sdk");
var elasticbeanstalk = new AWS.ElasticBeanstalk({region:AWSRegion});
var elbv2 = new AWS.ELBv2({region:AWSRegion});

if (runningLocally){
    executeFunction({}, {}, function(nully, text){
        console.log("Execution finished. Terminating app.");
        //process.exit(1);
    });
}

//Lambda entry point
exports.handler = (event, context, callback) => {
    executeFunction(event, context, callback);
};

function executeFunction(event, context, callback){
    context.callbackWaitsForEmptyEventLoop = false;


    removeStaleRequests(function(){
        completedTasks.push("removeStaleRequests");
    });
    removeStaleServers(function(){
        completedTasks.push("removeStaleServers");
    });
    removeStaleTargetGroups(function(result){
        if (result){
            completedTasks.push("removeStaleTargetGroups");
            callback(null, "fullServers: " + count.fullServers); //!!! Need to check that ALL jobs are done before terminating
        }
    });

    getPublicServersFromDB(function(res){
        var count = getServerCount(res);
        retrieveEnvironmentInfo(function(info){
            if (info){
                logData(count, info);

                var currentInstances = info.InstanceHealthList.length;
                log("currentInstances: " + currentInstances);

                //calculateTargetInstanceCount();

                var targetInstanceCount = 2;
                updateInstanceCount(targetInstanceCount, function(){
                    log("FINISHED ALL TASKS. Terminating app.");
                    
                });    

            }
            else {
                log("ERROR retrieving instance info!!!! Unable to update Beanstalk");
            }
        });
    });	
}

///-------------------------------------------------------------------------------------
function removeStaleTargetGroups(cb){

    //Find which Target Groups have 0 registered Targets

    getLoadBalancerArn(EBName, function(loadBalancerArn){
        if (!loadBalancerArn){log("ERROR - Didn't get loadBalancerArn"); cb(false); return;}        
        get443ListenerArn(loadBalancerArn, function(listenerArn){
            if (!listenerArn){log("ERROR - Didn't get listenerArn"); cb(false); return;}        
            getListenerRules(listenerArn, function(listenerRules){
                if (!listenerRules){log("ERROR - Didn't get listenerRules"); cb(false); return;}        
                getLBTargetGroups(loadBalancerArn, function(targetGroupData){
                    log("FOUND " + targetGroupData.length + " TARGET GROUPS");
                    if (!targetGroupData){log("ERROR - Didn't get targetGroups"); cb(false); return;}   
                    for (var t = 0; t < targetGroupData.length; t++){
                        getTargetsInTargetGroup(targetGroupData[t], function(targetGroupArn, targets){
                            if (!targets){log("ERROR - Didn't get targets in target group " + targetGroupArn); cb(false); return;}                               
                            if (targets.length < 1){
                                log("Found Target Group with zero targets: " + targetGroupArn + ". Deleting...");

                                var ruleToDelete = listenerRules.find(rule => rule.Actions[0].TargetGroupArn == targetGroupArn);
                                if (ruleToDelete){
                                    deleteRule(ruleToDelete.RuleArn, function(result){
                                        if (result){
                                            deleteTargetGroup(targetGroupArn, function(result2){});
                                        }
                                    });
                                }
                                else {
                                    deleteTargetGroup(targetGroupArn, function(result2){});
                                }        
                            }
                        });                
                    }
                });
            });
        });      
    });
}


function getLoadBalancerArn(EBName, cb){
    log("Getting LoadBalancer Arn...");
    var EBparams = {
        EnvironmentName:EBName
    };
    elasticbeanstalk.describeEnvironmentResources(EBparams, function(err, data) { //Get Loadbalancer Arn from ElasticBeanstalk environment
        if (err) {
            logg("AWS API ERROR -- Unable to Get Loadbalancer Arn from ElasticBeanstalk environment:");
            logg(util.format(err));
            cb(false);
        }
        else {
            //log("Instance Ids:");
            //logObj(data.EnvironmentResources.Instances);
            log("Got LoadBalancer Arns:");
            logObj(data.EnvironmentResources.LoadBalancers[0].Name);
            cb(data.EnvironmentResources.LoadBalancers[0].Name);
        }
    });
}

function get443ListenerArn(loadBalancerArn, cb){
    var LBparams = {
        LoadBalancerArn: loadBalancerArn,
        PageSize: 100
    };
    elbv2.describeListeners(LBparams, function(err, data) {
        if (err) {
        logg("AWS API ERROR -- Unable to Get Listener on Port 443 for LoadBalancer: " + loadBalancerArn);
        logObj(err);
        cb(false);
        }
        else {
        for (var l in data.Listeners){
            if (data.Listeners[l].Port == 443){
            cb(data.Listeners[l].ListenerArn);
            break;
            }
        }
        }        
    });  
}


function getListenerRules(listenerArn, cb){
    logg("Getting Rules for listenerArn:" + listenerArn);
    var params = {
      ListenerArn: listenerArn
    };
    elbv2.describeRules(params, function(err, data) {
        if (err) {
            logg("AWS API ERROR -- Unable to Describe Rules for Listener: " + listenerArn);
            logg(util.format(err));
            cb(false);
        }
        else {
            for (var r in data.Rules){
                logg("Rule: " + data.Rules[r].RuleArn + " conditions:");
                logObj("Forward to:" + data.Rules[r].Actions[0].TargetGroupArn);
            }  
            cb(data.Rules);
        }
    });  
}

function deleteRule(ruleArn, cb){
    logg("Attempting to delete rule: " + ruleArn);
    var params = {
        RuleArn: ruleArn
    };
    elbv2.deleteRule(params, function(err, data) {
        if (err){
            logg("AWS API ERROR -- Unable to delete Rule! ARN:" + ruleArn);
            logg(util.format(err));
            cb(false);
        }
        else {
            logg("Successfully deleted Rule: " + ruleArn);
            cb(true);
        }
    });
}

function deleteTargetGroup(tgArn, cb){
    logg("Attempting to delete Target Group: " + tgArn);
    var params = {
        TargetGroupArn: tgArn
    };
    elbv2.deleteTargetGroup(params, function(err, data) {
        if (err){
            logg("AWS API ERROR -- Unable to delete Target Group! ARN:" + tgArn);
            logg(util.format(err));
            cb(false);
        }
        else {
            logg("Successfully deleted Target Group: " + tgArn);
            cb(true);
        }
    });
}
  

function getLBTargetGroups(loadBalancerArn, cb){
    log("Getting LoadBalancer Target Groups...");
    var LBparams = {
        LoadBalancerArn: loadBalancerArn,
        PageSize: 400
    };
    elbv2.describeTargetGroups(LBparams, function(err, data) { //List all target groups in Loadbalancer
        if (err) {
            logg("AWS API ERROR -- Unable to List all target groups in Loadbalancer:");
            logg(util.format(err));
            cb(false);
        }
        else {
            log("Got LoadBalancer Target Groups:");
            logObj(data.TargetGroups);
            var targetGroupData = [];
            for (var l in data.TargetGroups){
                log("Name=" + data.TargetGroups[l].TargetGroupName + " TargetGroupArn=" + data.TargetGroups[l].TargetGroupArn);
                targetGroupData.push(data.TargetGroups[l].TargetGroupArn);
            }
            cb(targetGroupData);
        }        
    });
}  

function getTargetsInTargetGroup(targetGroupArn, cb){
    log("Getting Targets in Target Group " + targetGroupArn);
    var targets = [];
    var targetParams = {
        TargetGroupArn: targetGroupArn
    };
    elbv2.describeTargetHealth(targetParams, function(err, instanceData) {
        if (err) {
            logg("AWS API ERROR -- Unable to Get Instances in target group: ");
            logg(util.format(err));
            cb(targetGroupArn, false);
        }
        else {
            for (var i in instanceData.TargetHealthDescriptions){
                //log("InstanceId:" + instanceData.TargetHealthDescriptions[i].Target.Id + " Port:" + instanceData.TargetHealthDescriptions[i].Target.Port);
                //var pushable = data.TargetGroups.filter(function (targetGroup) {
                //return targetGroup.TargetGroupArn == targetParams.TargetGroupArn;
                //});
                targets.push({Id:instanceData.TargetHealthDescriptions[i].Target.Id, Port:instanceData.TargetHealthDescriptions[i].Target.Port});
            }
            log("TARGETS IN targetGroupArn:" + targetGroupArn);
            logObj(targets);

            cb(targetGroupArn, targets);
        }          
    });
}

///-------------------------------------------------------------------------------------




function retrieveEnvironmentInfo(cb){
    //Get curent EB instance count
    log("Inside retrieve env info");
    
    var params = {
        EnvironmentName: EBName, 
        AttributeNames: [
            "All"
         ]
       };

    elasticbeanstalk.describeInstancesHealth(params, function(err, data) {
        if (err) {
            log(err, err.stack);
            cb(null);
        }
        else { //Success
            logObj(data); 
            cb(data);
        }
    });
}

function logData(count, info){
    log("fullServers: " + count.fullServers);
    log("emptyServers: " + count.emptyServers);
    log("playableServers: " + count.playableServers);
}

function getServerCount(res){
    var count = {
        fullServers:0,
        emptyServers:0,
        playableServers:0
    };
    
    for (var s = 0; s < res.length; s++){
        var players = getCurrentNumPlayers(res[s].currentUsers);
        if (players >= res[s].maxPlayers){
            count.fullServers++;
        }
        else {
            count.playableServers++;
        }
        if (players == 0){
            count.emptyServers++;
        }
    }	
    return count;
}


function removeStaleRequests(cb){
    logg("removing stale friend requests and party requets...");
	removeStaleFriendRequests(function(fsuccess){
        removeStalePartyRequests(function(psuccess){
            cb();
        });
    });
}

function removeStaleFriendRequests(cb){
    var miliInterval = (staleFriendRequestThreshold * 1000 * 60 * 60 * 24);
	var thresholdDate = new Date(Date.now() - miliInterval);
	var searchParams = { type:"friend", timestamp:{ $lt: thresholdDate } };

	dataAccess.dbUpdateAwait("RW_REQUEST", "rem", searchParams, {}, async function(err, res){
		if (err){
			logg("DB ERROR - removeStaleFriendRequests() - RW_REQUEST.remove: " + err);
            cb(false);
		}
        else {
            logg("removed " + res + " stale friend requests");
            cb(true);
        }
	});
}

function removeStalePartyRequests(cb){
	var miliInterval = (stalePartyRequestThreshold * 1000);
	var thresholdDate = new Date(Date.now() - miliInterval);
	var searchParams = { type:"party", timestamp:{ $lt: thresholdDate } };
	
	dataAccess.dbUpdateAwait("RW_REQUEST", "rem", searchParams, {}, async function(err, res){
		if (err){
			logg("DB ERROR - removeStalePartyRequests() - RW_REQUEST.remove: " + err);
            cb(false);
		}
        else {
            logg("removed " + res + " stale party requests");
            cb(true);
        }
	});
}

function removeStaleServers(cb){
    logg("Removing stale servers from DB...");
    var acceptableLastHealthCheckTime = new Date();
    acceptableLastHealthCheckTime.setSeconds(acceptableLastHealthCheckTime.getUTCSeconds() - serverHealthCheckTimestampThreshold);
    var searchParams = { healthCheckTimestamp:{ $lt: acceptableLastHealthCheckTime } };
    dataAccess.dbUpdateAwait("RW_SERV", "rem", searchParams, {}, async function(err2, obj){
        if (!err2){
            logg("Unhealthy Servers successfully removed from database.");
        }
        cb();
    });	
}

function updateInstanceCount(targetCount, cb){
    if (updateEB == 0){
        log("WARNING! CURRENTLY CONFIGURED TO SKIP BEANSTALK UPDATE. Would have updated to " + targetCount);
        cb();
        return;
        
    }
    
    log("Updating EB instance count to " + targetCount + "...");

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
            log("ERROR FAILED BEANSTALK UPDATE");
            log(err, err.stack); // an error occurred
        }
        else {
            log("BEANSTALK UPDATE SUCCESS!!!");
            log(data);           // successful response
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
        if (currentUsers[u].team == 0 || currentUsers[u].team == 1 || currentUsers[u].team == 2)
            players++;
    }
    return players;
}
