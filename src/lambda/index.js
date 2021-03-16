global.updateEB = process.env.updateEB;
global.mongoDbLocation = process.env.mongoDbLocation;
global.s3LoggingBucket = process.env.s3LoggingBucket;
global.EBName = process.env.EBName;
global.serverHealthCheckTimestampThreshold = process.env.serverHealthCheckTimestampThreshold; 
global.stalePartyRequestThreshold = process.env.stalePartyRequestThresholdDays; //30 (Days)
global.staleFriendRequestThreshold = process.env.staleFriendRequestThresholdSeconds; //300 (Seconds)
global.AWSRegion = process.env.AWSRegion;
global.minimumPlayableServers = process.env.minimumPlayableServers;

global.serversPerInstance = 4;

var runningLocally = false;
var completedTasks = [];
const taskList = [
    "removeStaleRequests",
    "removeStaleServers",
    "removeStaleTargetGroups",
    "updateInstanceCount"
];

function checkIfTasksAreComplete(){
    var uniqueCompletedTasks = completedTasks.filter(function(item, pos) {
        return completedTasks.indexOf(item) == pos;
    });

    log((taskList.length - uniqueCompletedTasks.length)  + " tasks still remain. Completed tasks:");
    logObj(uniqueCompletedTasks);
    if (uniqueCompletedTasks.length >= taskList.length){
        return true;
    }
    return false;
}


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
        minimumPlayableServers = localConfig.minimumPlayableServers;
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
var autoscaling = new AWS.AutoScaling({region:AWSRegion});

//{ params: {AutoScalingGroupName: "awseb-e-ixp3kmxivm-stack-AWSEBAutoScalingGroup-SQV61O28RETV"}

if (runningLocally){
    executeFunction({}, {}, function(nully, text){
        log(text);
        process.exit(1);
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
        if (checkIfTasksAreComplete())
            callback(null, "All tasks finished!");
    });
    removeStaleServers(function(){
        completedTasks.push("removeStaleServers");
        if (checkIfTasksAreComplete())
            callback(null, "All tasks finished!");
    });
    removeStaleTargetGroups(function(result){
        completedTasks.push("removeStaleTargetGroups");
        if (checkIfTasksAreComplete())
            callback(null, "All tasks finished!");
    });
    //Update instance count
    getEnvironmentInfo(function(EBinfo, DBres, EBConfig, ASGInfo){
        calculateTargetInstanceCount(EBinfo, DBres, EBConfig, ASGInfo, function(targetInstanceCount){
            updateInstanceCount(targetInstanceCount, function(){
                completedTasks.push("updateInstanceCount");
                if (checkIfTasksAreComplete())
                    callback(null, "All tasks finished!");                        
            });        
        });
    });

}


function calculateTargetInstanceCount(EBinfo, DBres, EBConfig, ASGInfo, cb){
    //return 3; //For testing
    log("CALCULATING TARGET INSTANCE COUNT");

    if (!EBinfo || !DBres || !EBConfig || !ASGInfo){
        log("ERROR RETRIEVING NECESSARY DATA FOR EB SCALING. CHECK LOGS ABOVE FOR ERRORS!");
        cb(false);
        return;
    }

    var OkInstances = EBinfo.InstanceHealthList.filter(instance => instance.Color == 'Green' || instance.Color == 'Yellow').length;
    var instanceMin = ASGInfo.MinSize;
    var dbServerCount = getServerCount(DBres);

    log("OkInstances:" + OkInstances + " InstanceMin:" + instanceMin + " | playableServers:" + dbServerCount.playableServers + " minimumPlayableServers:" + minimumPlayableServers + " | emptyServers:" + dbServerCount.emptyServers + "");
    if (instanceMin > OkInstances){ //There are currently pending instances, wait until Beanstalk finishes increasing instance count 
        log("There are currently pending instances, wait until Beanstalk finishes increasing instance count before scaling...");
        cb(false);
        return;
    }    
    else if (dbServerCount.playableServers < minimumPlayableServers){ //scale up
        log("THERE ARE LESS THAN " + minimumPlayableServers + " PLAYABLE SERVERS[" + dbServerCount.playableServers + "]. INCREASING INSTANCE COUNT BY 1 (from " + instanceMin + " to " + (instanceMin+1) + ")");
        cb((instanceMin + 1));
        return;
    }    
    else if (dbServerCount.emptyServers >= serversPerInstance + minimumPlayableServers){ //scale down
        log("There are " + dbServerCount.emptyServers + " empty servers. Checking if an instance is empty to scale down.");
        var instanceIds = [];
        for (var s = 0; s < DBres.length; s++){
            if (DBres[s].instanceId != "local" && DBres[s].instanceId.length > 0){
                instanceIds = addToArrayIfNotAlreadyPresent(instanceIds, DBres[s].instanceId)
            }
        }
    
        //Check for vacant servers
        if (instanceIds.length){
            var cbAtEndOfLoop = true;
            for (var i = 0; i < instanceIds.length; i++){
                var instanceGameServers = DBres.filter(server => server.instanceId == instanceIds[i]); 
                var instanceVacant = true;

                for (var g = 0; g < instanceGameServers.length; g++){
                    var players = getCurrentNumPlayers(instanceGameServers[g].currentUsers) + instanceGameServers[g].incomingUsers.length;                 
                    if (players > 1){
                        instanceVacant = false;
                        break;
                    }
                }
                if (instanceVacant){
                    cbAtEndOfLoop = false;
                    log("!!!!!!!!!!!!!!!!!!!!!!I want to remove instance: " + instanceIds[i] + "!!!");

                    //Remove instance
                    terminateInstanceInASG(instanceIds[i], function(result){
                        if (result){
                            cb((instanceMin - 1));
                            return;
                        }
                        else {
                            cb(false);
                            return;
                        }
                    });
                    break;
                } 
            }
            if (cbAtEndOfLoop){
                cb(false);
            }
        }
        else {
            cb(false);
        }
    }
    else {
        cb(false);
    }
}




///-------------------------------------------------------------------------------------
function getEnvironmentInfo(cb){
    getPublicServersFromDB(function(DBres){
        retrieveBeanstalkInfo(function(EBinfo){
            getEBConfiguration(function(EBConfig){
                getASGInfo(function(ASGInfo){
                    cb(EBinfo, DBres, EBConfig, ASGInfo);                    
                });
             });
         });
     });	 
}


function getASGInfo(cb){
    getEBData(EBName, function(EBdata){
        var asg = EBdata.EnvironmentResources.LoadBalancers[0];
        if (asg){
            var params = {
                AutoScalingGroupNames: [asg.name]
            };
            autoscaling.describeAutoScalingGroups(params, function(err, data) {
                if (err) {
                    logg("AWS API ERROR -- Unable to describeAutoScalingGroups:");
                    logg(util.format(err));
                    cb(false);
                }
                else {
                    //log("describeAutoScalingGroups result:");
                    //console.log(data.AutoScalingGroups[0]);
                    cb(data.AutoScalingGroups[0]);
                }
            });
        }
        else {
            logg("ERROR -- No ASG associated with:" + EBName);            
            cb(false);
        }
    
    });
}

function terminateInstanceInASG(instanceId, cb){
    logg("TERMINATING INSTANCE: " + instanceId);
    var params = {
        InstanceId: instanceId, 
        ShouldDecrementDesiredCapacity: false
    };
    autoscaling.terminateInstanceInAutoScalingGroup(params, function(err, data) {
        if (err) {
            logg("AWS API ERROR -- Unable to terminateInstanceInAutoScalingGroup:");
            logg(util.format(err));
            cb(false);
        }
        else {
            logg("Successfully removed instance from ASG: " + instanceId);
            // log("Got EBConfiguration:");
            // logObj(data.ConfigurationSettings[0].OptionSettings);
            cb(true);
        }
    });
}


function removeStaleTargetGroups(cb){

    //Find which Target Groups have 0 registered Targets

    getLoadBalancerArn(EBName, function(loadBalancerArn){
        if (!loadBalancerArn){log("ERROR - Didn't get loadBalancerArn"); cb(true); return;}        
        get443ListenerArn(loadBalancerArn, function(listenerArn){
            if (!listenerArn){log("ERROR - Didn't get listenerArn"); cb(true); return;}        
            getListenerRules(listenerArn, function(listenerRules){
                if (!listenerRules){log("ERROR - Didn't get listenerRules"); cb(true); return;}        
                getLBGameServerTargetGroups(loadBalancerArn, async function(targetGroupData){
                    log("FOUND " + targetGroupData.length + " TARGET GROUPS");
                    if (!targetGroupData){log("ERROR - Didn't get targetGroups"); cb(true); return;}   
                    var analyzedTargetGroups = 0;
                    if (targetGroupData.length <= 0){log("WARNING -- DID NOT FIND ANY TARGET GROUPS ON LOADBALANCER"); cb(true); return;}
                    for (var t = 0; t < targetGroupData.length; t++){
                        log("Sleeping 2000 to avoid AWS throttling... [" + t +"]");
                        await sleep(2000);
                        log("Done sleeping [" + t +"]");
                        getTargetsInTargetGroup(targetGroupData[t], function(targetGroupArn, targets){
                            if (!targets){log("ERROR - Didn't get targets in target group " + targetGroupArn); cb(true); return;}                               
                            if (targets.length < 1){
                                log("Found Target Group with zero targets: " + targetGroupArn + ". Deleting if not associated with default rule...");

                                var ruleToDelete = listenerRules.find(rule => rule.Actions[0].TargetGroupArn == targetGroupArn);
                                if (ruleToDelete){
                                    if (!ruleToDelete.IsDefault){
                                        deleteRule(ruleToDelete.RuleArn, function(result){
                                            if (result){
                                                deleteTargetGroup(targetGroupArn, function(result2){
                                                    analyzedTargetGroups++; log("analyzedTargetGroups: " + analyzedTargetGroups + "/" + targetGroupData.length);
                                                    if (analyzedTargetGroups >= targetGroupData.length){cb(true);}                
                                                });
                                            }
                                            else {
                                                analyzedTargetGroups++; log("analyzedTargetGroups: " + analyzedTargetGroups + "/" + targetGroupData.length);
                                                if (analyzedTargetGroups >= targetGroupData.length){cb(true);}                
                                            }
                                        });
                                    }
                                    else {
                                        analyzedTargetGroups++; log("analyzedTargetGroups: " + analyzedTargetGroups + "/" + targetGroupData.length);
                                        if (analyzedTargetGroups >= targetGroupData.length){cb(true);}                
                                    }        
                                }
                                else {
                                    deleteTargetGroup(targetGroupArn, function(result2){
                                        analyzedTargetGroups++; log("analyzedTargetGroups: " + analyzedTargetGroups + "/" + targetGroupData.length);
                                        if (analyzedTargetGroups >= targetGroupData.length){cb(true);}
                                    });
                                }
                            }
                            else { //TargetGroup in use, passover
                                analyzedTargetGroups++; log("analyzedTargetGroups: " + analyzedTargetGroups + "/" + targetGroupData.length);
                                if (analyzedTargetGroups >= targetGroupData.length){cb(true);}
                            }
                        });                
                    }
                });
            });
        });      
    });
}

function getEBConfiguration(cb){
    var params = {
        EnvironmentName: EBName,
        ApplicationName: "GameService"
    };
    elasticbeanstalk.describeConfigurationSettings(params, function(err, data) {
        if (err) {
            logg("AWS API ERROR -- Unable to Get EBConfiguration from ElasticBeanstalk environment:");
            logg(util.format(err));
            cb(false);
        }
        else {
            // log("Got EBConfiguration:");
            // logObj(data.ConfigurationSettings[0].OptionSettings);
            cb(data.ConfigurationSettings[0].OptionSettings);
        }
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

function getEBData(EBName, cb){
    log("Getting LoadBalancer Data...");
    var EBparams = {
        EnvironmentName:EBName
    };
    elasticbeanstalk.describeEnvironmentResources(EBparams, function(err, data) { //Get Loadbalancer Arn from ElasticBeanstalk environment
        if (err) {
            logg("AWS API ERROR -- Unable to getEBData from ElasticBeanstalk environment:");
            logg(util.format(err));
            cb(false);
        }
        else {
            //log("Instance Ids:");
            //logObj(data.EnvironmentResources.Instances);
            log("gotEBData:");
            logObj(data);
            cb(data);
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
                //logObj(data.Rules[r]);
                logg("Forward to:" + data.Rules[r].Actions[0].TargetGroupArn);
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
  

function getLBGameServerTargetGroups(loadBalancerArn, cb){
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
            //logObj(data.TargetGroups);
            var targetGroupData = [];
            for (var l in data.TargetGroups){
                log("Name=" + data.TargetGroups[l].TargetGroupName + " TargetGroupArn=" + data.TargetGroups[l].TargetGroupArn);
                if (data.TargetGroups[l].Port != 80){ //Skip the unchanging WebServer Target Group
                    targetGroupData.push(data.TargetGroups[l].TargetGroupArn);
                }
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
                targets.push({Id:instanceData.TargetHealthDescriptions[i].Target.Id, Port:instanceData.TargetHealthDescriptions[i].Target.Port});
            }
            log("TARGETS IN targetGroupArn:" + targetGroupArn);
            logObj(targets);

            cb(targetGroupArn, targets);
        }          
    });
}

///-------------------------------------------------------------------------------------




function retrieveBeanstalkInfo(cb){
    //Get curent EB instance count
    log("Inside retrieve env info");
    
    var params = {
        EnvironmentName: EBName, 
        AttributeNames: [
            "All"
         ]
       };

    elasticbeanstalk.describeInstancesHealth(params, function(err, EBinfo) {
        if (err) {
            log(err, err.stack);
            cb(false);
        }
        else { //Success
            log("EB INSTANCE DESCRIPTIONS:");
            logObj(EBinfo); 
            cb(EBinfo);
        }
    });
}

function logData(count, info){
    log("fullServers: " + count.fullServers);
    log("emptyServers: " + count.emptyServers);
    log("playableServers: " + count.playableServers);
    log("TOTALServers: " + count.totalServers);
}

function getServerCount(res){
    var count = {
        fullServers:0,
        emptyServers:0,
        playableServers:0,
        totalServers:0,
    };
    
    for (var s = 0; s < res.length; s++){
        if (res[s].instanceId != "local" && res[s].instanceId.length > 0){
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
            count.totalServers++;
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
    else if (targetCount === false){
        log("No need to scale EB at this time...");
        cb();
        return;        
    }
    
    log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    log("UPDATING EB INSTANCE COUNT TO " + targetCount + "...");
    log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

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
            log(err, err.stack); 
        }
        else {
            log("BEANSTALK UPDATE SUCCESS!!!");
            //log(data);
        }
        cb();        
      });

}

function getPublicServersFromDB(cb){
	var servers = [];
	dataAccess.dbFindAwait("RW_SERV", {privateServer:false}, function(err,res){
        if (err){
            log("ERROR GETTING SERVERS FROM DB");
            cb(false);
        }
		else if (res && res[0]){				
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


function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function addToArrayIfNotAlreadyPresent(incomingArray, valueToAdd){
    for (var x = 0; x < incomingArray.length; x++){
        if (incomingArray[x] == valueToAdd){
            return incomingArray;
            break;
        }
    }

    incomingArray.push(valueToAdd);

    return incomingArray;
}