const io = require('socket.io')(serv,{});
var player = require(absAppDir + '/app_code/entities/player.js');
const dataAccess = require(absAppDir + '/app_code/data_access/dataAccess.js');
const dataAccessFunctions = require(absAppDir + '/app_code/data_access/dataAccessFunctions.js');
const gameEngine = require(absAppDir + '/app_code/engines/gameEngine.js');
const mapEngine = require(absAppDir + '/app_code/engines/mapEngine.js');

io.sockets.on('connection', function(socket){
	socket.id = Math.random();
	var socketBak = socket; //Look into why the hell this is needed!!! Happened after Player init, respawn and restartGame methods were combined/cleaned up
	SOCKET_LIST[socket.id] = socket;
	logg('Client has connected (ID:' + socket.id + ')');	
	populateLoginPage(socket);
	
	socket.on('voteEndgame', function(socketId, voteType, vote){
		console.log("GOT VOTE: " + socketId + " " + voteType + " " + vote);
		if (voteType == "gametype"){
			for (var i = 0; i < voteGametypeIds.length; i++){
				if (voteGametypeIds[i] == socketId){ //Player has already voted
					return;
				}				
			}			
			if (vote == "ctf"){
				ctfVotes++;
				voteGametypeIds.push(socketId);
			}
			else if (vote == "slayer"){
				slayerVotes++;
				voteGametypeIds.push(socketId);
			}
		}
		else if (voteType == "map"){
			for (var i = 0; i < voteMapIds.length; i++){
				if (voteMapIds[i] == socketId){ //Player has already voted
					return;
				}				
			}			
			if (vote == "thepit"){
				thePitVotes++;
				voteMapIds.push(socketId);
			}
			else if (vote == "longest"){
				longestVotes++;
				voteMapIds.push(socketId);
			}
			else if (vote == "crik"){
				crikVotes++;
				voteMapIds.push(socketId);
			}
		}	
	});

	
	socket.on('updateSocketInfo', function(cognitoSub){
		for (var s in SOCKET_LIST){ //Kill any existing duplicate logins with this user on this server
			if (SOCKET_LIST[s].cognitoSub == cognitoSub && SOCKET_LIST[s].id != socket.id){
				SOCKET_LIST[s].disconnect();
			}
		}
		socket.cognitoSub = cognitoSub;
		logg("updateSocketInfo for cognitoSub: " + SOCKET_LIST[socket.id].cognitoSub);
		
		dataAccessFunctions.getUserFromDB(cognitoSub, function(userData){
			if (userData){
				socket.partyId = userData.partyId;
				socket.rating = userData.rating;
				socket.experience = userData.experience;
				socket.username = userData.USERNAME;	

				if (!isWebServer)
					dataAccessFunctions.dbGameServerUpdate();
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
		dataAccessFunctions.searchUserFromDB("test", function(mongoRes){});
	});

	socket.on('validateToken', function(token){
		if (token != null){
			authenticationEngine.validateToken(token, socket);
		}
		else {
			socket.emit('authenticationFail');
		}
	});

	socket.on('disconnect', function(){
		logg("Socket " + socket.id + " disconnected.");
		if (gameOver == false && pregame == false && player.getPlayerById(socket.id) && player.getPlayerById(socket.id).rating > matchWinLossRatingBonus){
			
		}
		player.playerDisconnect(socket.id); //Deletes from playerList
		delete SOCKET_LIST[socket.id];		
	});

	socket.on('chat', function(data){
		if (player.getPlayerById(data[0])){
			for(var i in SOCKET_LIST){
				SOCKET_LIST[i].emit('addToChat',player.getPlayerById(data[0]).name + ': ' + data[1].substring(0,50), player.getPlayerById(data[0]).id);
				updateEffectList.push({type:7, playerId:data[0], text:data[1].substring(0,50)});
			}
		}
	});

	//Server commands
	socket.on('evalServer', function(data){
		//socket = socketBak;
		if (!player.getPlayerById(socket.id)){return;}

		if(!allowServerCommands){
			if (data == "stopcmd" || data == "servercmd" || data == "servercommands"){
				allowServerCommands = true;
			}			
			return;
		}
		
		
		logg("SERVER COMMAND:" + data);
		log(data.substring(4));
		if (data == "stopcmd" || data == "servercmd" || data == "servercommands"){
			allowServerCommands = false;
		}
		else if (data == "startt" || data == "restartt"){
			gameEngine.restartGame();
		}
		else if (data == "team1" || data == "teamsize1"){
			maxPlayers = 2;
		}
		else if (data == "team2" || data == "teamsize2"){
			maxPlayers = 4;
		}
		else if (data == "team3" || data == "teamsize3"){
			maxPlayers = 6;
		}
		else if (data == "team4" || data == "teamsize4"){
			maxPlayers = 8;
		}
		else if (data == "team5" || data == "teamsize5"){
			maxPlayers = 10;
		}
		else if (data == "team6" || data == "teamsize6"){
			maxPlayers = 12;
		}
		else if (data == "team7" || data == "teamsize7"){
			maxPlayers = 14;
		}
		else if (data == "team8" || data == "teamsize8"){
			maxPlayers = 16;
		}
		else if (data == "respawn3" || data == "spawn3"){
			respawnTimeLimit = 3 * 60;
		}
		else if (data == "respawn5" || data == "spawn5"){
			respawnTimeLimit = 5 * 60;
		}
		else if (data == "respawn7" || data == "spawn7"){
			respawnTimeLimit = 7 * 60;
		}
		else if (data == "respawn9" || data == "spawn9"){
			respawnTimeLimit = 9 * 60;
		}
		else if (data.substring(0,4) == "kick"){
			var playerList = player.getPlayerList();
			for (var p in playerList){
				if (playerList[p].name == data.substring(4)){
					var id = playerList[p].id;
					var name = playerList[p].name;
					player.playerDisconnect(id);
					delete SOCKET_LIST[id];
					socket.emit('addToChat', 'Kicked ' + name + ' from game.');
					break;
				}
			}
		}
		else if (data == "speed6" || data == "run6"){
			globalSpeed = 6;
			maxSpeed = 6;
			speedMin = 6;
		}
		else if (data == "speed7" || data == "run7"){
			globalSpeed = 7;
			maxSpeed = 7;
			speedMin = 7;
		}
		else if (data == "speed8" || data == "run8"){
			globalSpeed = 8;
			maxSpeed = 8;
			speedMin = 8;
		}
		else if (data == "speed9" || data == "run9"){
			globalSpeed = 9;
			maxSpeed = 9;
			speedMin = 9;
		}
		else if (data == "speed10" || data == "run10"){
			globalSpeed = 10;
			maxSpeed = 10;
			speedMin = 10;
		}
		else if (data == "pc" || data == "pcmode"){
			if (pcMode == 2){
				pcMode = 1;
			}
			else {
				pcMode = 2;
			}		
			updateMisc.pcMode = pcMode;
		}
		else if (data == "dam1" || data == "damage1"){
			damageScale = 1;
		}
		else if (data == "dam.9" || data == "damage.9"){
			damageScale = 0.9;
		}
		else if (data == "dam.8" || data == "damage.8"){
			damageScale = 0.8;
		}
		else if (data == "dam.7" || data == "damage.7"){
			damageScale = 0.7;
		}
		else if (data == "dam.6" || data == "damage.6"){
			damageScale = 0.6;
		}
		else if (data == "dam.5" || data == "damage.5"){
			damageScale = 0.5;
		}
		//gametypes
		else if (data == "slayert" || data == "deathmatcht"){
			gametype = "slayer";
			gameEngine.restartGame();
		}
		else if (data == "slayer1"){
			gametype = "slayer";
			gameMinutesLength = 0;
			gameSecondsLength = 0;
			scoreToWin = 25;			
			gameEngine.restartGame();
		}
		else if (data == "slayer2"){
			gametype = "slayer";
			gameMinutesLength = 9;
			gameSecondsLength = 59;
			scoreToWin = 50;			
			gameEngine.restartGame();
		}
		else if (data == "ctf1"){
			gametype = "ctf";
			gameMinutesLength = 5;
			gameSecondsLength = 0;
			scoreToWin = 0;			
			gameEngine.restartGame();
		}
		else if (data == "ctf2"){
			gametype = "ctf";
			gameMinutesLength = 10;
			gameSecondsLength = 0;
			scoreToWin = 3;			
			gameEngine.restartGame();
		}
		else if (data == "ctft"){
			gametype = "ctf";
			gameEngine.restartGame();
		}
		else if (data == "timet" || data == "timelimit" || data == "notime"){
			if (gameMinutesLength == 0 && gameSecondsLength == 0){
				gameMinutesLength = 5;
				gameSecondsLength = 0;
			}
			else {
				gameMinutesLength = 0;
				gameSecondsLength = 0;
			}
			gameEngine.restartGame();
		}
		else if (data == "time1"){
			gameMinutesLength = 1;
			gameSecondsLength = 0;
			gameEngine.restartGame();
		}
		else if (data == "time3"){
			gameMinutesLength = 3;
			gameSecondsLength = 0;
			gameEngine.restartGame();
		}
		else if (data == "time5" || data ==  "5min"){
			gameMinutesLength = 5;
			gameSecondsLength = 0;
			gameEngine.restartGame();
		}
		else if (data == "time7"){
			gameMinutesLength = 7;
			gameSecondsLength = 0;
			gameEngine.restartGame();
		}
		else if (data == "time10"){
			gameMinutesLength = 10;
			gameSecondsLength = 0;
			gameEngine.restartGame();
		}
		else if (data == "score0" || data == "to0" || data == "noscore"){
			scoreToWin = 0;
			gameEngine.restartGame();
		}
		else if (data == "score1" || data == "to1"){
			scoreToWin = 1;
			gameEngine.restartGame();
		}
		else if (data == "score3" || data == "to3"){
			scoreToWin = 3;
			gameEngine.restartGame();
		}
		else if (data == "score5" || data == "to5"){
			scoreToWin = 5;
			gameEngine.restartGame();
		}
		else if (data == "score7" || data == "to7"){
			scoreToWin = 7;
			gameEngine.restartGame();
		}
		else if (data == "score10" || data == "to10"){
			scoreToWin = 10;
			gameEngine.restartGame();
		}
		else if (data == "score15" || data == "to15"){
			scoreToWin = 15;
			gameEngine.restartGame();
		}
		else if (data == "score20" || data == "to20"){
			scoreToWin = 20;
			gameEngine.restartGame();
		}
		else if (data == "score25" || data == "to25"){
			scoreToWin = 25;
			gameEngine.restartGame();
		}
		else if (data == "score30" || data == "to30"){
			scoreToWin = 30;
			gameEngine.restartGame();
		}
		else if (data == "score50" || data == "to50"){
			scoreToWin = 50;
			gameEngine.restartGame();
		}
		else if (data == "score75" || data == "to75"){
			scoreToWin = 75;
			gameEngine.restartGame();
		}
		else if (data == "score100" || data == "to100"){
			scoreToWin = 100;
			gameEngine.restartGame();
		}
		
		//maps
		else if (data == "longest"){
			map = "longest";
			gameEngine.restartGame();
		}
		else if (data == "thepit" || data == "pit" || data == "the pit"){
			map = "thepit";
			gameEngine.restartGame();
		}
		else if (data == "crik" || data == "creek"){
			map = "crik";
			gameEngine.restartGame();
		}
		else if (data == "map2"){
			map = "map2";
			gameEngine.restartGame();
		}
		else if (data == "stats" || data == "stat"){
			dataAccess.dbFindAwait("RW_USER", {cognitoSub:player.getPlayerById(socket.id).cognitoSub}, async function(err, res){
				if (res && res[0]){
					socket.emit('addToChat', 'Cash Earned:' + res[0].experience + ' Kills:' + res[0].kills + ' Deaths:' + res[0].deaths + ' Benedicts:' + res[0].benedicts + ' Captures:' + res[0].captures + ' Steals:' + res[0].steals + ' Returns:' + res[0].returns + ' Games Played:' + res[0].gamesPlayed + ' Wins:' + res[0].gamesWon + ' Losses:' + res[0].gamesLost + ' TPM Rating:' + res[0].rating);	
				}
				else {
					socket.emit('addToChat', 'ERROR looking you up in database.');
				}
			});
		}
		else if (data == "thugs"){		
			if (spawnOpposingThug){
				logg("Server command: Thugs Disabled");
				socket.emit('addToChat', "Server command: Thugs Disabled");
				spawnOpposingThug = false;
			}
			else {
				logg("Server command: Thugs Enabled");
				socket.emit('addToChat', "Server command: Thugs Enabled");
				spawnOpposingThug = true;
			}
			gameEngine.ensureCorrectThugCount();
		}
		else if (data == "shop"){		
			if (shopEnabled){
				logg("Server command: Shop Disabled");
				socket.emit('addToChat', "Server command: Shop Disabled");
				shopEnabled = false;
			}
			else {
				logg("Server command: Shop Enabled");
				socket.emit('addToChat', "Server command: Shop Enabled");
				shopEnabled = true;
			}
		}
		else if (data == "sThugWhite"){		
			logg("Server command: Spawn Thug (White)");
			var coords = gameEngine.getSafeCoordinates("white");
			Thug(Math.random(), "white", coords.x, coords.y);
			socket.emit('addToChat', 'White thug spawned.');	
		}
		else if (data == "sThugBlack"){
			logg("Server command: Spawn Thug (Black)");
			var coords = gameEngine.getSafeCoordinates("black");
			Thug(Math.random(), "black", coords.x, coords.y);
			socket.emit('addToChat', 'Black thug spawned.');	
		}
		else if (data == "5sec"){
			minutesLeft = 0;
			secondsLeft = 5;
		}
		else if (data == "1min"){
			minutesLeft = 1;
			secondsLeft = 0;
		}
		else if (data == "30sec"){
			minutesLeft = 0;
			secondsLeft = 30;
		}
		else if (data == "1min1sec"){
			minutesLeft = 1;
			secondsLeft = 1;
		}
		else if (data == "1min3sec"){
			minutesLeft = 1;
			secondsLeft = 3;
		}				
		else if (data == "team" || data == "teams" || data == "change" || data == "switch" || data == "changeTeams" || data == "changeTeam"){
			gameEngine.changeTeams(socket.id);
		}
		else if (data == "capturet" || data == "scoret"){
			if (player.getPlayerById(socket.id).team == "white"){
				gameEngine.capture("white");
			}
			else if (player.getPlayerById(socket.id).team == "black"){
				gameEngine.capture("black");
			}
		}
		else if (data == "kill" || data == "die"){
			player.getPlayerById(socket.id).health = 0
			updatePlayerList.push({id:player.getPlayerById(socket.id).id,property:"health",value:player.getPlayerById(socket.id).health})
			player.getPlayerById(socket.id).kill({id:0, shootingDir:1});
		}
		else if (data == "end"){
			minutesLeft = 0;
			secondsLeft = 0;
		}
		else if (data == "pause"){
			if (pause == true)
				pause = false;
			else if (pause == false)
				pause = true;
		}
		else if (data == "wint"){
			whiteScore = 0;
			blackScore = 0;
			gameOver = false;

			for (var i in SOCKET_LIST){
				var sock = SOCKET_LIST[i];	
				gameEngine.sendCapturesToClient(sock);
			}
			gameEngine.restartGame();

			if (player.getPlayerById(socket.id) && player.getPlayerById(socket.id).team == "white"){
				if (gametype == "ctf"){
					gameEngine.capture("white");
				}
				else if (gametype == "slayer"){
					whiteScore += 100;
				}
			}
			else if (player.getPlayerById(socket.id) && player.getPlayerById(socket.id).team == "black"){
				if (gametype == "ctf"){
					gameEngine.capture("black");
				}
				else if (gametype == "slayer"){
					blackScore += 100;
				}
			}
			minutesLeft = 0;
			secondsLeft = 0;
			
		}
		else if (data == "loset"){
			whiteScore = 0;
			blackScore = 0;
			gameOver = false;

			for (var i in SOCKET_LIST){
				var sock = SOCKET_LIST[i];	
				gameEngine.sendCapturesToClient(sock);
			}
			gameEngine.restartGame();

			if (player.getPlayerById(socket.id) && player.getPlayerById(socket.id).team == "white"){
				if (gametype == "ctf")
					gameEngine.capture("black");
			}
			else if (player.getPlayerById(socket.id) && player.getPlayerById(socket.id).team == "black"){
				if (gametype == "ctf")
					gameEngine.capture("white");
			}
			minutesLeft = 0;
			secondsLeft = 0;
		}
		else if (data == "crasht"){
			crash();
		}
		else if (data == "godt" || data == "haxt"){
			player.getPlayerById(socket.id).SGClip = 99;
			player.getPlayerById(socket.id).MGClip = 999;
			player.getPlayerById(socket.id).DPClip = 99;
			player.getPlayerById(socket.id).health = 99;
			player.getPlayerById(socket.id).hasBattery = 2;
			updatePlayerList.push({id:socket.id,property:"hasBattery",value:player.getPlayerById(socket.id).hasBattery});
			updatePlayerList.push({id:socket.id,property:"health",value:player.getPlayerById(socket.id).health});
			updatePlayerList.push({id:socket.id,property:"weapon",value:player.getPlayerById(socket.id).weapon});
			updatePlayerList.push({id:socket.id,property:"DPClip",value:player.getPlayerById(socket.id).DPClip});
			updatePlayerList.push({id:socket.id,property:"MGClip",value:player.getPlayerById(socket.id).MGClip});
			updatePlayerList.push({id:socket.id,property:"SGClip",value:player.getPlayerById(socket.id).SGClip});
			socket.emit('addToChat', 'INITIATE HAX');
		}

		else {
			try {
				var res = eval(data);
			}
			catch(e) {
				socket.emit('addToChat', 'Invalid Command.');
				res = "invalid command";
			}
			finally {
				socket.emit('evalAnswer', res);
			}
		}
		
	});	
}); //END socket.on(connection)