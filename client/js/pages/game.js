page = "game";
initializePage();
function initializePage(){
	getTokenFromUrlParameterAndLogin(); 	
}

function voteCTF(){
	socket.emit("voteEndgame", myPlayer.id, "gametype", "ctf");
	document.getElementById("voteCTF").disabled = true;
	document.getElementById("voteDeathmatch").disabled = true;	
}

function voteDeathmatch(){
	socket.emit("voteEndgame", myPlayer.id, "gametype", "slayer");
	document.getElementById("voteCTF").disabled = true;
	document.getElementById("voteDeathmatch").disabled = true;	
}

function voteLongest(){
	socket.emit("voteEndgame", myPlayer.id, "map", "longest");
	document.getElementById("voteLongest").disabled = true;
	document.getElementById("voteCrik").disabled = true;
	document.getElementById("voteThePit").disabled = true;	
}

function voteThePit(){
	socket.emit("voteEndgame", myPlayer.id, "map", "thepit");
	document.getElementById("voteLongest").disabled = true;
	document.getElementById("voteCrik").disabled = true;
	document.getElementById("voteThePit").disabled = true;	
}
				
function voteCrik(){
	socket.emit("voteEndgame", myPlayer.id, "map", "crik");
	document.getElementById("voteLongest").disabled = true;
	document.getElementById("voteCrik").disabled = true;
	document.getElementById("voteThePit").disabled = true;	
}

socket.on('votesUpdate', function(votesData){
	document.getElementById("voteCTF").innerHTML = "CTF - [" + votesData.ctfVotes + "]";
	document.getElementById("voteDeathmatch").innerHTML = "Deathmatch - [" + votesData.slayerVotes + "]";	
	document.getElementById("voteLongest").innerHTML = "Longest - [" + votesData.longestVotes + "]";
	document.getElementById("voteThePit").innerHTML = "The Pit - [" + votesData.thePitVotes + "]";	
	document.getElementById("voteCrik").innerHTML = "Battle Creek - [" + votesData.crikVotes + "]";
});