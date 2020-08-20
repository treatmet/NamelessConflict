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
				SOCKET_LIST[s].disconnect();
			}
		}
		socket.cognitoSub = cognitoSub;
		logg("updateSocketInfo for cognitoSub: " + SOCKET_LIST[socket.id].cognitoSub + " url=" + myUrl);
		
		dataAccessFunctions.getUserFromDB(cognitoSub, function(userData){
			if (userData){
				socket.partyId = userData.partyId;
				socket.rating = userData.rating;
				socket.experience = userData.experience;
				socket.username = userData.USERNAME;	
				socket.emit('socketInfoUpdated', {url:myUrl, isWebServer:isWebServer});
			}
		});	
	});

	socket.on('error', function(error){
		logg("!!!UNHANDLED SOCKET ERROR");
		logg(util.format(error));
		logg("!!!SOCKET DISCONNECTED!");
		dataAccessFunctions.dbGameServerUpdate();
	});
	
	socket.on('test', function(data){
	});

	socket.on('disconnect', function(){
		logg("Socket " + socket.id + " disconnected. cognitoSub=" + SOCKET_LIST[socket.id].cognitoSub);
		delete SOCKET_LIST[socket.id];		
	});
}); //END socket.on(connection)


