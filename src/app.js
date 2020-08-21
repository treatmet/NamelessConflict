const util = require('util');
var AWS = require("aws-sdk");
const config = require("./settings.json");
var elasticbeanstalk = new AWS.ElasticBeanstalk({region:config.AWSRegion});
var elbv2 = new AWS.ELBv2({region:config.AWSRegion});
const os = require('os');
const hostname = os.hostname();
const S3StreamLogger = require('s3-streamlogger').S3StreamLogger;
var s3stream = {};

const { spawn } = require('child_process');

const gameInstanceCount = 2;
const gameProcesses = [];

for (let i = 1; i <= gameInstanceCount; i++) {
  gameProcesses.push({
    name: `game${i}`,
    process: spawn('node', ['./game-service/app.js', `300${i}`])
  });
}

gameProcesses.map(p => {
  p.process.stdout.on('data', (data) => {
    process.stdout.write(`[${p.name}] ${data}`);
  });
  
  p.process.stderr.on('data', (data) => {
    process.stderr.write(`[${p.name}] ${data}`);
  });
  
  p.process.on('close', (code) => {
    process.stdout.write(`[${p.name}] child process exited with code ${code}\n`);
  });
});

require('./web-service/app');

if (hostname.toLowerCase().includes("compute")){
  getInstanceIdAndAddToLoadBalancer();
}
else {
  //var instanceId = "LOCAL";
  var instanceId = "i-044f8b212e3dcb70a";
  reinitStream(instanceId);
  addGameServerToLoadBalancer(instanceId);
}
//-------------------------------------------------------------------------------------
function getInstanceIdAndAddToLoadBalancer(){
	const request = require('request-promise');
	request('http://169.254.169.254/latest/meta-data/instance-id', function (error, response, body) {
		if (!error && response.statusCode === 200 && response.body) {
		  var instanceId = response.body;
      reinitStream(instanceId);
      addGameServerToLoadBalancer(instanceId);
		}
		else {
			console.log("AWS API ERROR -- Unable to Get Instance Id");
		}
	}).catch(function (err){
		console.log("AWS API ERROR -- Unable to Get Instance Id:");
		console.log(util.format(err));
	});
}



function addGameServerToLoadBalancer(instanceId){
	log("REGISTERING GAME SERVER");

  getLoadBalancerArn(config.EBName, function(loadBalancerArn){
    getLBTargetGroups(loadBalancerArn, function(targetGroupData){

      log("All Target Groups in Load Balancer:");
      logObj(targetGroupData);
      /*
        webTargetGroupArn:"arn:aws:elasticloadbalancing:us-east-2:231793983438:targetgroup/awseb-AWSEB-1RXD30P86RCRO/5404aa5233719f2d",
        gameTargetGroupArns:["arn:aws:elasticloadbalancing:us-east-2:231793983438:targetgroup/awseb-AWSEB-1RXD30P86RCRO/5404aa5233719f2d","arn:aws:elasticloadbalancing:us-east-2:231793983438:targetgroup/awseb-AWSEB-1RXD30P86RCRO/5404aa5233719f2d"]
      */

      //Web process registration
      if (!targetGroupData.webTargetGroupArn){ //Check if Web Target Group is not created
        createTargetGroup("web-server-tg", 80, function(createTargetGroupResult){
          if (!createTargetGroupResult){
            //Error logging handled in function
          }
          else {
            log("Successfully Created Web Server Target Group!");
            logObj("TargetGroupArn: " + createTargetGroupResult.TargetGroups[0].TargetGroupArn);    
            registerEC2ToTargetGroup(createTargetGroupResult.TargetGroups[0].TargetGroupArn, instanceId, function(registerResponse){
              if (!registerResponse){
                //Error logging handled inside function
              }
              else {
                log("Successfully added Web Process to newly created Web Server Target Group!");
                logObj(registerResponse);
              }
            });            
          }
        });
      }
      else { //Web Server Target Group is created, check if this instance's web process is already added
        getTargetsInTargetGroup(targetGroupData.webTargetGroupArn, function(targetGroupArn, targets){
          log("TARGETS IN WEB targetGroupArn:" + targetGroupArn);
          logObj(targets);
          var addedToWebTargetGroup = false;
          for (var t = 0; t < targets.length; t++){
            if (targets[t].Id == instanceId){
              addedToWebTargetGroup = true;
              break;
            }
          }
          if (addedToWebTargetGroup == false){
            log("ADDING INSTANCE TO WEB SERVER TARGET GROUP");
            registerEC2ToTargetGroup(targetGroupArn, instanceId, function(registerResponse){
              if (!registerResponse){
                //Error logging handled inside function
              }
              else {
                log("Successfully added Web Process to Web Server Target Group!");
                logObj(registerResponse);
              }
            });
          }
          else {
            log("Web Process already added to Web Server Target Group");
          }
        });
      }

      //Game processes registration      

      //NEXT: The process loop is going faster than the API requests. Need to introduce recursion in a function call. Function calls itself ONLY when rule creation has been completed
      var portArray = [];
      for (let p = 1; p <= gameInstanceCount; p++) {
        portArray.push(3000 + p);
      }
      //recursiveFunction(portArray);



      //ALSO NEED TO SKIP RULE CREATION IF THE TARGET GROUP ALREADY EXISTS!!!

      for (let p = 1; p <= gameInstanceCount; p++) {
        var portToCheck = 3000 + p;
        log("Checking if process on port " + portToCheck + " has been added to a game target group (Port math)");
        upsertProcessToGameServerTargetGroup(targetGroupData, instanceId, portToCheck, function(upsertResult){
          get443ListenerArn(loadBalancerArn, function(listenerArn){            
            getNextRulePriority(listenerArn, function(priority){
              if (listenerArn && upsertResult && priority){
                createRuleWithRetries(instanceId, portToCheck, listenerArn, upsertResult, priority);
              }
              else {
                log("ERROR - Didn't get enough data to create Rule (Need listenerArn:" + listenerArn + " upsertProcessToGameServerTargetGroup:" + upsertResult + " priority:" + priority + ")");
              }
            });
          });          
        });
      }


    });
  });
}


function getNextRulePriority(listenerArn, cb){
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
      logg("443 Listeners:");
      logObj(data);
      for (var x = 1; x < 999; x++){ //Starting at 1...
        var availablePriority = true;
        for (var r in data.Rules){
          if (parseInt(data.Rules[r].Priority) == x){
            availablePriority = false;
            break;
          }
        }
        if (availablePriority == false){
          continue;
        }
        else { //Found the lowest number that after looping through all rules, this number does not appear as a priority 
          cb(x); 
          break;
        }
      }
    }
  });  
}


function upsertProcessToGameServerTargetGroup(targetGroupData, instanceId, portToCheck, cb){
  portToCheck = parseInt(portToCheck);
  var targetGroupsChecked = 0;
  var presentInGameTargetGroup = false;
  for (var tg = 0; tg < targetGroupData.gameTargetGroupArns.length; tg++){
    getTargetsInTargetGroup(targetGroupData.gameTargetGroupArns[tg], function(targetGroupArn, targets){
      log("TARGETS IN GAME SERVER targetGroupArn:" + targetGroupArn);
      logObj(targets);
      for (var t = 0; t < targets.length; t++){
        if (targets[t].Id == instanceId && parseInt(targets[t].Port) == portToCheck){
          presentInGameTargetGroup = true;
          log("Verified process " + portToCheck + " for instance " + instanceId + " has already been added to targetGroup " + targetGroupArn);
          cb({targetGroupArn:targetGroupArn});
          break;
        }
        targetGroupsChecked++;
        if (targetGroupsChecked >= targetGroupData.gameTargetGroupArns.length && !presentInGameTargetGroup){
          //Create Target Group, and add Process
          log("Adding process on port " + portToCheck + " for instance " + instanceId + " to new Target Group");
          createTargetGroup("game-" + instanceId.substring(2) + "-" + portToCheck.toString().substring(2), portToCheck, function(createTargetGroupResult){
            if (!createTargetGroupResult){
              //Error logging handled in function
            }
            else {
              log("Successfully Created Web Server Target Group!");
              logObj("TargetGroupArn: " + createTargetGroupResult.TargetGroups[0].TargetGroupArn);    
              registerEC2ToTargetGroup(createTargetGroupResult.TargetGroups[0].TargetGroupArn, instanceId, function(registerResponse){
                if (!registerResponse){
                  cb(false);
                }
                else {
                  log("Successfully added Game Process to newly created Game Server Target Group!");
                  logObj(registerResponse);
                  cb({targetGroupArn:createTargetGroupResult.TargetGroups[0].TargetGroupArn});
                  presentInGameTargetGroup = true;
                }
              });            
            }
          });          
        }
      }
    });
  }    
  if (!presentInGameTargetGroup){ //Target group containing this server+process does not exist, create one
    log("Adding process on port " + portToCheck + " for instance " + instanceId + " to new Target Group");
    createTargetGroup("game-" + instanceId.substring(2) + "-" + portToCheck.toString().substring(2), portToCheck, function(createTargetGroupResult){
      if (!createTargetGroupResult){
        //Error logging handled in function
      }
      else {
        log("Successfully Created Web Server Target Group!");
        logObj("TargetGroupArn: " + createTargetGroupResult.TargetGroups[0].TargetGroupArn);    
        registerEC2ToTargetGroup(createTargetGroupResult.TargetGroups[0].TargetGroupArn, instanceId, function(registerResponse){
          if (!registerResponse){
            cb(false);
          }
          else {
            log("Successfully added Game Process to newly created Game Server Target Group!");
            logObj(registerResponse);
            cb({targetGroupArn:createTargetGroupResult.TargetGroups[0].TargetGroupArn});
            presentInGameTargetGroup = true;
          }
        });            
      }
    });          
  }
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
		else    {
			//log("Instance Ids:");
			//logObj(data.EnvironmentResources.Instances);
			log("Got LoadBalancer Arns:");
			logObj(data.EnvironmentResources.LoadBalancers[0].Name);
			cb(data.EnvironmentResources.LoadBalancers[0].Name);
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
      var targetGroupData = {gameTargetGroupArns:[]};
      for (var l in data.TargetGroups){
        log("Name=" + data.TargetGroups[l].TargetGroupName + " TargetGroupArn=" + data.TargetGroups[l].TargetGroupArn);

        if (data.TargetGroups[l].Port == 80){
          targetGroupData.webTargetGroupArn = data.TargetGroups[l].TargetGroupArn;
        }
        else {
          targetGroupData.gameTargetGroupArns.push(data.TargetGroups[l].TargetGroupArn);
        }
      }
      cb(targetGroupData);
    }        
  });
}


function getTargetsInTargetGroup(targetGroupArn, cb){
  var targets = [];
  var targetParams = {
    TargetGroupArn: targetGroupArn
  };
  elbv2.describeTargetHealth(targetParams, function(err, instanceData) {
    if (err) {
      logg("AWS API ERROR -- Unable to Get Instances in target group: ");
      logg(util.format(err));
    }
    else {
      for (var i in instanceData.TargetHealthDescriptions){
        log("InstanceId:" + instanceData.TargetHealthDescriptions[i].Target.Id + " Port:" + instanceData.TargetHealthDescriptions[i].Target.Port);
        /*var pushable = data.TargetGroups.filter(function (targetGroup) {
          return targetGroup.TargetGroupArn == targetParams.TargetGroupArn;
        });*/
        targets.push({Id:instanceData.TargetHealthDescriptions[i].Target.Id, Port:instanceData.TargetHealthDescriptions[i].Target.Port});
      }
      cb(targetGroupArn, targets);
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
			HttpCode: '200'
		},
		Port: port,
		Protocol: 'HTTP',
		TargetType: 'instance',
		UnhealthyThresholdCount: 2,
		VpcId: config.targetGroupVpcId
	};
	elbv2.createTargetGroup(params, function(err, data) {
		if (err){ 
			logg("AWS API ERROR -- Unable to createTargetGroup[" + name + "] for port[" + port + "]");
			logObj(err);
			cb(false);
		}
		else {
			console.log(data);
			cb(data);
		}          
	});
}

function registerEC2ToTargetGroup(targetGroupArn, instanceId, cb){
	var returnData = {};
	var params = {
		TargetGroupArn: targetGroupArn, //"arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/my-targets/73e2d6bc24d8a067"
		Targets: [{	Id: instanceId }] //"i-80c8dd94"
	};
	elbv2.registerTargets(params, function(err, data) {
		if (err) {
			logg("AWS API ERROR -- Unable to Register EC2[" + instanceId + "] to Target Group[" + targetGroupArn + "]");
			logObj(err);
			cb(false);
		}
		else {
			logObj(data);
			cb(data);
		}
	});	
}




function createRuleWithRetries(instanceId, portToCheck, listenerArn, upsertResult, priority){
  createRule(instanceId.substring(2), portToCheck.toString().substring(2), listenerArn, upsertResult.targetGroupArn, priority, function(createRuleResult){
    if (createRuleResult){
      log("FIRST TRY - Successfully created rule");
    }
    else {
      createRule(instanceId.substring(2), portToCheck.toString().substring(2), listenerArn, upsertResult.targetGroupArn, priority+1, function(createRuleResult){
        if (createRuleResult){
          log("SECOND TRY - Successfully created rule");
        }
        else {
          createRule(instanceId.substring(2), portToCheck.toString().substring(2), listenerArn, upsertResult.targetGroupArn, priority+2, function(createRuleResult){
            if (createRuleResult){
              log("THIRD TRY - Successfully created rule");
            }
            else {
              createRule(instanceId.substring(2), portToCheck.toString().substring(2), listenerArn, upsertResult.targetGroupArn, priority+3, function(createRuleResult){
                if (createRuleResult){
                  log("FOURTH TRY - Successfully created rule on second try");
                }
                else {
                  createRule(instanceId.substring(2), portToCheck.toString().substring(2), listenerArn, upsertResult.targetGroupArn, priority+4, function(createRuleResult){
                    if (createRuleResult){
                      log("FIFTH TRY - Successfully created rule");
                    }
                    else {
                      createRule(instanceId.substring(2), portToCheck.toString().substring(2), listenerArn, upsertResult.targetGroupArn, priority+5, function(createRuleResult){
                        if (createRuleResult){
                          log("SIXTH TRY - Successfully created rule on second try");
                        }
                        else {
                          log("ERROR -- RULE CREATION FAILED AFTER 6 retries");
                        }
                      });                  
                    }
                  });
                }
              });                  
            }
          });
        }
      });                  
    }
  });  
}

function createRule(serverParam, processParam, listenerArn, targetGroupArn, priority, cb){
  var params = {
    Actions: [
      {
        TargetGroupArn: targetGroupArn, 
        Type: "forward"
      }
    ], 
    Conditions: [
      {
        Field: "query-string",
        QueryStringConfig: {
          Values: [
            {
              Key: 'server',
              Value: serverParam
            }
          ]
        }
      },
      {
        Field: "query-string",
        QueryStringConfig: {
          Values: [
            {
              Key: 'process',
              Value: processParam
            }
          ]
        }
      }      
    ], 
    ListenerArn: listenerArn, 
    Priority: priority
  };
  elbv2.createRule(params, function(err, data) {
    if (err) {
      logg("AWS API ERROR -- Unable to Create Rule server=" + serverParam + "&process=" + processParam + " pointing to targetGroup " + targetGroupArn);
      logObj(err);
      cb(false);
    }
    else {
      logg("Successfully created Rule: " + data.Rules[0].RuleArn + " for query: server=" + serverParam + "&process=" + processParam + " priority:" + priority + " pointing to targetGroup " + targetGroupArn);
      cb(data); //RuleArn = data.Rules[0].RuleArn
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



//------------------------------------------PARENT PROCESS LOGGING------------------------------------------------------
function reinitStream(instanceId){
	var name_format = "PARENT_" + instanceId + ".txt";

	var reinitYear = (new Date().getUTCFullYear()).toString();
	var reinitMonth = (new Date().getUTCMonth()+1).toString();
	if (reinitMonth.length === 1) {
		reinitMonth = "0" + reinitMonth;
	}
	var reinitDate = (new Date().getUTCDate()).toString();
	if (reinitDate.length === 1) {
		reinitDate = "0" + reinitDate;
	}
	
	s3stream = new S3StreamLogger({
	  bucket: config.s3LoggingBucket,
	  access_key_id: config.awsAccessKeyId,
	  secret_access_key: config.awsSecretAccessKey,
	  folder: reinitYear + '_' + reinitMonth + '_' + reinitDate,
	  name_format: name_format,
	  max_file_size: 500000000,
	  rotate_every: 86405000
	});
	s3stream.write("\r\n");
	logg("----------STREAMWRITER INITIALIZED---------FOLDER: " + reinitYear + "_" + reinitMonth + "_" + reinitDate + "------------\r\n");		
}

log = function(msg) {	
	if (debug){
		logg(msg);
	}
}

logObj = function(obj){
	if (debug){
		logg(util.format(obj));
	}
}

logg = function(msg) {
	msg = msg.toString(); //ToString
	var d = new Date();
	var hours = d.getUTCHours();
	if (hours <= 9){hours = "0" + hours;}
	var minutes = d.getUTCMinutes();
	if (minutes <= 9){minutes = "0" + minutes;}
	var seconds = d.getUTCSeconds();
	if (seconds <= 9){seconds = "0" + seconds;}
	
	var logMsgText = hours + ':' + minutes + '.' + seconds + '> ' + msg;
	console.log(logMsgText);	
	if (s3stream){
		s3stream.write(logMsgText+'\r\n');
	}
}