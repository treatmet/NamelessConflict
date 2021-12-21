const io = require('socket.io')(serv,{});
const dataAccess = require('../data_access/dataAccess.js');
const dataAccessFunctions = require('../data_access/dataAccessFunctions.js');

io.sockets.on('connection', function(socket){
	socket.id = Math.random();
	var socketBak = socket; //Look into why the hell this is needed!!! Happened after Player init, respawn and restartGame methods were combined/cleaned up
	SOCKET_LIST[socket.id] = socket;
	logg('Client has connected (ID:' + socket.id + ')');	
	
	socket.on('updateSocketInfo', function(cognitoSub){
		for (var s in SOCKET_LIST){ //Kill any existing duplicate logins with this user on this server
			if (SOCKET_LIST[s].cognitoSub == cognitoSub && SOCKET_LIST[s].id != socket.id){
				console.log("Disconnecting existing socket with duplicate cognito sub");
				SOCKET_LIST[s].disconnect();
			}
		}
		socket.cognitoSub = cognitoSub;
		logg("updateSocketInfo for cognitoSub: " + SOCKET_LIST[socket.id].cognitoSub + " url=" + myUrl);
		
		dataAccessFunctions.getUser(cognitoSub, function(userData){
			if (userData){
				socket.partyId = userData.partyId;
				socket.rating = userData.rating;
				socket.experience = userData.experience;
				socket.username = userData.USERNAME;	
				socket.emit('socketInfoUpdated', {url:myUrl, isWebServer:isWebServer});
				dataAccessFunctions.updateServerUrlForUser(cognitoSub);
			}
			else {
				socket.emit('socketInfoUpdated', {url:myUrl, isWebServer:isWebServer});
			}
		});	
	});

	socket.on('error', function(error){
		logg("!!!UNHANDLED SOCKET ERROR");
		logg(util.format(error));
		logg("!!!SOCKET DISCONNECTED!");
	});
	
	socket.on('test', function(data){
		if (data == "0192fb49-632c-47ee-8928-0d716e05ffea" && isLocal){dataAccessFunctions.giveUsersItemsByTimestamp();}
	});
	
	socket.on('updateTrade', function(tradeData){
		
	});


	socket.on('disconnect', function(){
		var socketCognitoSub = "";
		var socketId = "";
		if (SOCKET_LIST[socket.id] && SOCKET_LIST[socket.id].cognitoSub){
			socketCognitoSub = SOCKET_LIST[socket.id].cognitoSub;
			logg("Socket " + socket.id + " disconnected. cognitoSub=" + socketCognitoSub);
			delete SOCKET_LIST[socket.id];		
		}
		else {
			if (socket && socket.id)
				socketId = socket.id;
			logg("Socket disconnected:" + socketId);
		}
	});
}); //END socket.on(connection)


