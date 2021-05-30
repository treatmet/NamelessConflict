global.updateEB = process.env.updateEB;
global.mongoDbLocation = process.env.mongoDbLocation;
global.s3LoggingBucket = process.env.s3LoggingBucket;
global.EBName = process.env.EBName;
global.serverHealthCheckTimestampThreshold = process.env.serverHealthCheckTimestampThreshold; 
global.stalePartyRequestThreshold = parseInt(process.env.stalePartyRequestThresholdDays); //30 (Days)
global.staleFriendRequestThreshold = parseInt(process.env.staleFriendRequestThresholdSeconds); //300 (Seconds)
global.AWSRegion = process.env.AWSRegion;
global.minimumPlayableServers = parseInt(process.env.minimumPlayableServers);
global.serversPerInstance = 4;
global.logID = ""; //No need due to cloudwatch RequestId

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

    log(logID + " " + (taskList.length - uniqueCompletedTasks.length)  + " tasks still remain. Completed tasks:");
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
        console.log(logID + " " + "Running locally...");
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
        console.log(logID + " " + "ERROR - NO ENVIRONMENT VARIABLES OR config.json FOUND!!!");
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
        log(logID + " " + text);
        process.exit(1);
    });
}

//Lambda entry point
exports.handler = (event, context, callback) => {
    executeFunction(event, context, callback);
};

function executeFunction(event, context, callback){
    context.callbackWaitsForEmptyEventLoop = false;
    logID = "";
    completedTasks = [];
    log(logID + " ----BEGIN FUNCTION EXECUTION----");


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
        log("Got EnvironmentInfo! (6) About to calculateTargetInstanceCount");
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
    log(logID + " " + "CALCULATING TARGET INSTANCE COUNT");

    if (!EBinfo || !DBres || !EBConfig || !ASGInfo){
        log(logID + " " + "ERROR RETRIEVING NECESSARY DATA FOR EB SCALING. CHECK LOGS ABOVE FOR ERRORS!");
        cb(false);
        return;
    }

    var OkInstances = EBinfo.InstanceHealthList.filter(instance => instance.Color == 'Green' || instance.Color == 'Yellow').length;
    var SevereInstances = EBinfo.InstanceHealthList.filter(instance => instance.Color == 'Red').length;
    var instanceMin = ASGInfo.MinSize;
    var dbServerCount = getServerCount(DBres);

    log(logID + " " + "OkInstances:" + OkInstances + "SevereInstances:" + SevereInstances + " InstanceMin:" + instanceMin + " | playableServers:" + dbServerCount.playableServers + " minimumPlayableServers:" + minimumPlayableServers + " | emptyServers:" + dbServerCount.emptyServers + "");
    
    if ((instanceMin - SevereInstances) > OkInstances){ //There are currently pending instances, wait until Beanstalk finishes increasing instance count 
        log(logID + " " + "There are currently gray(pending) instances, wait until Beanstalk finishes increasing instance count before scaling...");
        cb(false);
        return;
    }    
    else if (dbServerCount.playableServers < minimumPlayableServers || dbServerCount.emptyServers <= 0){ //scale up
        if (dbServerCount.emptyServers <= 0){
            log(logID + " " + "THERE ARE LESS THAN " + minimumPlayableServers + " PLAYABLE SERVERS[" + dbServerCount.playableServers + "]. INCREASING INSTANCE COUNT BY 1 (from " + instanceMin + " to " + (instanceMin+1) + ")");
        }
        else {
            log(logID + " " + "THERE ARE ZERO emptyServers available for custom games. Scaling up 1");
        }
        cb((instanceMin + 1));
        return;
    }    
    else if (instanceMin > 1){ //Check for vacant instances, and scale down
        log(logID + " " + "There are " + dbServerCount.emptyServers + " empty servers. Checking if an instance is empty to scale down.");
        var instanceIds = [];
        for (var s = 0; s < DBres.length; s++){
            if (DBres[s].instanceId != "local" && DBres[s].instanceId.length > 0){
                instanceIds = addToArrayIfNotAlreadyPresent(instanceIds, DBres[s].instanceId)
            }
        }
    
        //Check for vacant instances
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
                    log(logID + " " + "!!!!!!!!!!!!!!!!!!!!!!I want to remove instance: " + instanceIds[i] + "!!!");

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
    log("Getting Environment Info (1). About to getPublicServersFromDB...");
    getPublicServersFromDB(function(DBres){
        log("Got Public Servers From DB (2). About to retrieveBeanstalkInfo");
        retrieveBeanstalkInfo(function(EBinfo){
            log("Got Beanstalk info (3). About to getEBConfiguration");
            getEBConfiguration(function(EBConfig){
                log("Got EBConfig (4). About to getASGInfo");
                getASGInfo(function(ASGInfo){
                    log("Got ASGinfo (5). About to hit Callback");
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
                    log(logID + " " + "AWS API ERROR -- Unable to describeAutoScalingGroups:");
                    log(logID + " " + util.format(err));
                    cb(false);
                }
                else {
                    //log(logID + " " + "describeAutoScalingGroups result:");
                    //console.log(logID + " " + data.AutoScalingGroups[0]);
                    cb(data.AutoScalingGroups[0]);
                }
            });
        }
        else {
            log(logID + " " + "ERROR -- No ASG associated with:" + EBName);            
            cb(false);
        }
    
    });
}

function terminateInstanceInASG(instanceId, cb){
    log(logID + " " + "TERMINATING INSTANCE: " + instanceId);
    var params = {
        InstanceId: instanceId, 
        ShouldDecrementDesiredCapacity: false
    };
    autoscaling.terminateInstanceInAutoScalingGroup(params, function(err, data) {
        if (err) {
            log(logID + " " + "AWS API ERROR -- Unable to terminateInstanceInAutoScalingGroup:");
            log(logID + " " + util.format(err));
            cb(false);
        }
        else {
            log(logID + " " + "Successfully removed instance from ASG: " + instanceId);
            // log(logID + " " + "Got EBConfiguration:");
            // logObj(data.ConfigurationSettings[0].OptionSettings);
            cb(true);
        }
    });
}


function removeStaleTargetGroups(cb){

    //Find which Target Groups have 0 registered Targets

    getLoadBalancerArn(EBName, function(loadBalancerArn){
        if (!loadBalancerArn){log(logID + " " + "ERROR - Didn't get loadBalancerArn"); cb(true); return;}        
        get443ListenerArn(loadBalancerArn, function(listenerArn){
            if (!listenerArn){log(logID + " " + "ERROR - Didn't get listenerArn"); cb(true); return;}        
            getListenerRules(listenerArn, function(listenerRules){
                if (!listenerRules){log(logID + " " + "ERROR - Didn't get listenerRules"); cb(true); return;}        
                getLBGameServerTargetGroups(loadBalancerArn, async function(targetGroupData){
                    log(logID + " " + "FOUND " + targetGroupData.length + " TARGET GROUPS");
                    if (!targetGroupData){log(logID + " " + "ERROR - Didn't get targetGroups"); cb(true); return;}   
                    var analyzedTargetGroups = 0;
                    if (targetGroupData.length <= 0){log(logID + " " + "WARNING -- DID NOT FIND ANY TARGET GROUPS ON LOADBALANCER"); cb(true); return;}
                    for (var t = 0; t < targetGroupData.length; t++){
                        log(logID + " " + "Sleeping 2000 to avoid AWS throttling... [" + t +"]");
                        await sleep(2000);
                        log(logID + " " + "Done sleeping [" + t +"]");
                        getTargetsInTargetGroup(targetGroupData[t], function(targetGroupArn, targets){
                            if (!targets){log(logID + " " + "ERROR - Didn't get targets in target group " + targetGroupArn); cb(true); return;}                               
                            if (targets.length < 1){
                                log(logID + " " + "Found Target Group with zero targets: " + targetGroupArn + ". Deleting if not associated with default rule...");

                                var ruleToDelete = listenerRules.find(rule => rule.Actions[0].TargetGroupArn == targetGroupArn);
                                if (ruleToDelete){
                                    if (!ruleToDelete.IsDefault){
                                        deleteRule(ruleToDelete.RuleArn, function(result){
                                            if (result){
                                                deleteTargetGroup(targetGroupArn, function(result2){
                                                    analyzedTargetGroups++; log(logID + " " + "analyzedTargetGroups: " + analyzedTargetGroups + "/" + targetGroupData.length);
                                                    if (analyzedTargetGroups >= targetGroupData.length){cb(true);}                
                                                });
                                            }
                                            else {
                                                analyzedTargetGroups++; log(logID + " " + "analyzedTargetGroups: " + analyzedTargetGroups + "/" + targetGroupData.length);
                                                if (analyzedTargetGroups >= targetGroupData.length){cb(true);}                
                                            }
                                        });
                                    }
                                    else {
                                        analyzedTargetGroups++; log(logID + " " + "analyzedTargetGroups: " + analyzedTargetGroups + "/" + targetGroupData.length);
                                        if (analyzedTargetGroups >= targetGroupData.length){cb(true);}                
                                    }        
                                }
                                else {
                                    deleteTargetGroup(targetGroupArn, function(result2){
                                        analyzedTargetGroups++; log(logID + " " + "analyzedTargetGroups: " + analyzedTargetGroups + "/" + targetGroupData.length);
                                        if (analyzedTargetGroups >= targetGroupData.length){cb(true);}
                                    });
                                }
                            }
                            else { //TargetGroup in use, passover
                                analyzedTargetGroups++; log(logID + " " + "analyzedTargetGroups: " + analyzedTargetGroups + "/" + targetGroupData.length);
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
            log(logID + " " + "AWS API ERROR -- Unable to Get EBConfiguration from ElasticBeanstalk environment:");
            log(logID + " " + util.format(err));
            cb(false);
        }
        else {
            // log(logID + " " + "Got EBConfiguration:");
            // logObj(data.ConfigurationSettings[0].OptionSettings);
            cb(data.ConfigurationSettings[0].OptionSettings);
        }
    });
}

function getLoadBalancerArn(EBName, cb){
    log(logID + " " + "Getting LoadBalancer Arn...");
    var EBparams = {
        EnvironmentName:EBName
    };
    elasticbeanstalk.describeEnvironmentResources(EBparams, function(err, data) { //Get Loadbalancer Arn from ElasticBeanstalk environment
        if (err) {
            log(logID + " " + "AWS API ERROR -- Unable to Get Loadbalancer Arn from ElasticBeanstalk environment:");
            log(logID + " " + util.format(err));
            cb(false);
        }
        else {
            //log(logID + " " + "Instance Ids:");
            //logObj(data.EnvironmentResources.Instances);
            log(logID + " " + "Got LoadBalancer Arns:");
            logObj(data.EnvironmentResources.LoadBalancers[0].Name);
            cb(data.EnvironmentResources.LoadBalancers[0].Name);
        }
    });
}

function getEBData(EBName, cb){
    log(logID + " " + "Getting LoadBalancer Data...");
    var EBparams = {
        EnvironmentName:EBName
    };
    elasticbeanstalk.describeEnvironmentResources(EBparams, function(err, data) { //Get Loadbalancer Arn from ElasticBeanstalk environment
        if (err) {
            log(logID + " " + "AWS API ERROR -- Unable to getEBData from ElasticBeanstalk environment:");
            log(logID + " " + util.format(err));
            cb(false);
        }
        else {
            //log(logID + " " + "Instance Ids:");
            //logObj(data.EnvironmentResources.Instances);
            log(logID + " " + "gotEBData:");
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
            log(logID + " " + "AWS API ERROR -- Unable to Get Listener on Port 443 for LoadBalancer: " + loadBalancerArn);
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
    log(logID + " " + "Getting Rules for listenerArn:" + listenerArn);
    var params = {
      ListenerArn: listenerArn
    };
    elbv2.describeRules(params, function(err, data) {
        if (err) {
            log(logID + " " + "AWS API ERROR -- Unable to Describe Rules for Listener: " + listenerArn);
            log(logID + " " + util.format(err));
            cb(false);
        }
        else {
            for (var r in data.Rules){
                log(logID + " " + "Rule: " + data.Rules[r].RuleArn + " conditions:");
                //logObj(data.Rules[r]);
                log(logID + " " + "Forward to:" + data.Rules[r].Actions[0].TargetGroupArn);
            }  
            cb(data.Rules);
        }
    });  
}

function deleteRule(ruleArn, cb){
    log(logID + " " + "Attempting to delete rule: " + ruleArn);
    var params = {
        RuleArn: ruleArn
    };
    elbv2.deleteRule(params, function(err, data) {
        if (err){
            log(logID + " " + "AWS API ERROR -- Unable to delete Rule! ARN:" + ruleArn);
            log(logID + " " + util.format(err));
            cb(false);
        }
        else {
            log(logID + " " + "Successfully deleted Rule: " + ruleArn);
            cb(true);
        }
    });
}

function deleteTargetGroup(tgArn, cb){
    log(logID + " " + "Attempting to delete Target Group: " + tgArn);
    var params = {
        TargetGroupArn: tgArn
    };
    elbv2.deleteTargetGroup(params, function(err, data) {
        if (err){
            log(logID + " " + "AWS API ERROR -- Unable to delete Target Group! ARN:" + tgArn);
            log(logID + " " + util.format(err));
            cb(false);
        }
        else {
            log(logID + " " + "Successfully deleted Target Group: " + tgArn);
            cb(true);
        }
    });
}
  

function getLBGameServerTargetGroups(loadBalancerArn, cb){
    log(logID + " " + "Getting LoadBalancer Target Groups...");
    var LBparams = {
        LoadBalancerArn: loadBalancerArn,
        PageSize: 400
    };
    elbv2.describeTargetGroups(LBparams, function(err, data) { //List all target groups in Loadbalancer
        if (err) {
            log(logID + " " + "AWS API ERROR -- Unable to List all target groups in Loadbalancer:");
            log(logID + " " + util.format(err));
            cb(false);
        }
        else {
            log(logID + " " + "Got LoadBalancer Target Groups:");
            //logObj(data.TargetGroups);
            var targetGroupData = [];
            for (var l in data.TargetGroups){
                log(logID + " " + "Name=" + data.TargetGroups[l].TargetGroupName + " TargetGroupArn=" + data.TargetGroups[l].TargetGroupArn);
                if (data.TargetGroups[l].Port != 80){ //Skip the unchanging WebServer Target Group
                    targetGroupData.push(data.TargetGroups[l].TargetGroupArn);
                }
            }
            cb(targetGroupData);
        }        
    });
}  

function getTargetsInTargetGroup(targetGroupArn, cb){
    log(logID + " " + "Getting Targets in Target Group " + targetGroupArn);
    var targets = [];
    var targetParams = {
        TargetGroupArn: targetGroupArn
    };
    elbv2.describeTargetHealth(targetParams, function(err, instanceData) {
        if (err) {
            log(logID + " " + "AWS API ERROR -- Unable to Get Instances in target group: ");
            log(logID + " " + util.format(err));
            cb(targetGroupArn, false);
        }
        else {
            for (var i in instanceData.TargetHealthDescriptions){
                targets.push({Id:instanceData.TargetHealthDescriptions[i].Target.Id, Port:instanceData.TargetHealthDescriptions[i].Target.Port});
            }
            log(logID + " " + "TARGETS IN targetGroupArn:" + targetGroupArn);
            logObj(targets);

            cb(targetGroupArn, targets);
        }          
    });
}

///-------------------------------------------------------------------------------------




function retrieveBeanstalkInfo(cb){
    //Get curent EB instance count
    log(logID + " " + "Inside retrieve env info");
    
    var params = {
        EnvironmentName: EBName, 
        AttributeNames: [
            "All"
         ]
       };

    elasticbeanstalk.describeInstancesHealth(params, function(err, EBinfo) {
        if (err) {
            log(logID + " " + err, err.stack);
            cb(false);
        }
        else { //Success
            log(logID + " " + "EB INSTANCE DESCRIPTIONS:");
            logObj(EBinfo); 
            cb(EBinfo);
        }
    });
}

function logData(count, info){
    log(logID + " " + "fullServers: " + count.fullServers);
    log(logID + " " + "emptyServers: " + count.emptyServers);
    log(logID + " " + "playableServers: " + count.playableServers);
    log(logID + " " + "TOTALServers: " + count.totalServers);
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
    log(logID + " " + "removing stale friend requests and party requets...");
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
			log(logID + " " + "DB ERROR - removeStaleFriendRequests() - RW_REQUEST.remove: " + err);
            cb(false);
		}
        else {
            log(logID + " " + "removed " + res + " stale friend requests");
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
			log(logID + " " + "DB ERROR - removeStalePartyRequests() - RW_REQUEST.remove: " + err);
            cb(false);
		}
        else {
            log(logID + " " + "removed " + res + " stale party requests");
            cb(true);
        }
	});
}

function removeStaleServers(cb){
    log(logID + " " + "Removing stale servers from DB...");
    var acceptableLastHealthCheckTime = new Date();
    acceptableLastHealthCheckTime.setSeconds(acceptableLastHealthCheckTime.getUTCSeconds() - serverHealthCheckTimestampThreshold);
    var searchParams = { healthCheckTimestamp:{ $lt: acceptableLastHealthCheckTime } };
    dataAccess.dbUpdateAwait("RW_SERV", "rem", searchParams, {}, async function(err2, obj){
        if (!err2){
            log(logID + " " + "Unhealthy Servers successfully removed from database.");
        }
        cb();
    });	
}

function updateInstanceCount(targetCount, cb){
    if (updateEB == 0){
        log(logID + " " + "WARNING! CURRENTLY CONFIGURED TO SKIP BEANSTALK UPDATE. Would have updated to " + targetCount);
        cb();
        return;        
    }
    else if (targetCount === false){
        log(logID + " " + "No need to scale EB at this time...");
        cb();
        return;        
    }
    
    log(logID + " " + "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    log(logID + " " + "UPDATING EB INSTANCE COUNT TO " + targetCount + "...");
    log(logID + " " + "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

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
            log(logID + " " + "ERROR FAILED BEANSTALK UPDATE");
            log(logID + " " + err, err.stack); 
        }
        else {
            log(logID + " " + "BEANSTALK UPDATE SUCCESS!!!");
            //log(logID + " " + data);
        }
        cb();        
      });

}

function getPublicServersFromDB(cb){
	var servers = [];
	dataAccess.dbFindAwait("RW_SERV", {privateServer:false}, function(err,res){
        if (err){
            log(logID + " " + "ERROR GETTING SERVERS FROM DB");
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