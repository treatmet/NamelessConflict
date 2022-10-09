//new player newPlayer
window.numPlayers = 0;
window.Player = function(id, addtoPlayerlist = true) {
	let self = {
		id:id,
		name:"",
		x:0,
		y:0,	
		height:94,
		width:94,
		reloading:0,
		triggerTapLimitTimer:0,
		healthFlashTimer:100,
		customizations: defaultCustomizations,
		settings: false,
		images:{ 1:{}, 2:{} },

        // currently these only update with the Main Player. 
        cash:1,
        kills:0,
        deaths:0,
        steals:0,
        returns:0,
        captures:0,
        reloading:0,
        pressingDown:false,
        pressingUp:false,
        pressingLeft:false,
        pressingRight:false,
        pressingW:false,
        pressingA:false,
        pressingS:false,
        pressingD:false,
        pressingShift:false
	}
    if (addtoPlayerlist) {
        window.Player.list[id] = self;
    }

    return self;
}

window.Player.list = [];
window.getPlayerById = (id) => {
    return Player.list[id];
}

var orderedPlayerList = [];
window.updateOrderedPlayerList = () => {
	var blackPlayers = [];
	var whitePlayers = [];		
	for (var a in Player.list){
		if (Player.list[a].team == 1){
			whitePlayers.push(Player.list[a]);
		}
		else if (Player.list[a].team == 2){
			blackPlayers.push(Player.list[a]);
		}
	}
	whitePlayers.sort(compare);
	blackPlayers.sort(compare);
	whitePlayers.push.apply(whitePlayers, blackPlayers);	
	orderedPlayerList = whitePlayers;
}


window.getNextOrderedPlayer = (playerId, previous) => { //previous is a bool designating if requesting previous player (true) or next player (false)
	updateOrderedPlayerList();
	if (spectatingPlayerId == "" && orderedPlayerList[0]){spectatingPlayerId = orderedPlayerList[0].id; return;}
	for (var p = 0; p < orderedPlayerList.length; p++){
		if (orderedPlayerList[p].id == playerId){
			if (previous){
				if (typeof orderedPlayerList[p-1] != 'undefined'){
					spectatingPlayerId = orderedPlayerList[p-1].id;
					return;
				}
				else if (typeof orderedPlayerList[orderedPlayerList.length-1] != 'undefined'){ //last in the player list
					spectatingPlayerId = orderedPlayerList[orderedPlayerList.length-1].id;
					return;
				}
			}
			else { ////!previous
				if (typeof orderedPlayerList[p+1] != 'undefined'){
					spectatingPlayerId = orderedPlayerList[p+1].id;
					return;
				}
				else if (typeof orderedPlayerList[0] != 'undefined'){
					spectatingPlayerId = orderedPlayerList[0].id;
					return;
				}
			}
		}
	}
	if (typeof orderedPlayerList[0] != 'undefined'){
		spectatingPlayerId = orderedPlayerList[0].id;
		return;
	}
	else {
		spectatingPlayerId = ""; //Center map
	}	
}

window.pressingArrowKey = () => {
	if (myPlayer.pressingDown || myPlayer.pressingLeft || myPlayer.pressingUp || myPlayer.pressingRight){
		return true;
	}
	return false;
};

window.pressingMovementKey = () => {
	if (myPlayer.pressingW || myPlayer.pressingA || myPlayer.pressingS || myPlayer.pressingD){
		return true;
	}
	return false;
}
