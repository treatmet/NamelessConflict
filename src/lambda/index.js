global.mongoDbLocation = process.env.mongoDbLocation;
global.s3LoggingBucket = process.env.s3LoggingBucket;

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

        callback(null, "fullServers: " + fullServers);

    });	
    


};

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
