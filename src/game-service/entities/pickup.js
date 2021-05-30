var player = require('./player.js');


var Pickup = function(id, x, y, type, amount, respawnTime){
	if (respawnTime > -1){
		x-=1;
		y-=1;
		x *= 75;
		y *= 75;
	}
	
	var self = {
		id:id,
		x:x,
		y:y,
		type:type,
		amount:amount,
		width:0,
		height:0,
		respawnTime: respawnTime, //Initialize this as -1 if the pickup is a non-respawning "one time drop" like from a fallen player
		respawnTimer: 0,
	}		
	if (self.type == 1){
		self.width = 41;
		self.height = 41;
	}
	else if (self.type == 2){
		self.width = 41;
		self.height = 41;
	}
	else if (self.type == 3){
		self.width = 67;
		self.height = 25;
	}
	else if (self.type == 4){
		self.width = 61;
		self.height = 32;
	}
	else if (self.type == 5){
		self.width = 41;
		self.height = 56;
	}
	else if (self.type == 6){
		self.width = 71;
		self.height = 37;
	}

	if (respawnTime > -1){
		self.x += (75/2) - self.width/2;
		self.y += (75/2) - self.height/2;
	}	
	Pickup.list[self.id] = self;
	updatePickupList.push(self);
}//End Pickup Function
Pickup.list = [];

var pickupPickup = function(playerId, pickupId){
	var playerList = player.getPlayerList();

	if (Pickup.list[pickupId].type == 1){ //MD
		if (playerList[playerId].health < 100){
			playerList[playerId].health += Pickup.list[pickupId].amount;
			if (playerList[playerId].health > 100){
				playerList[playerId].health = 100;
			}
			updatePlayerList.push({id:playerId,property:"health",value:playerList[playerId].health});											
			SOCKET_LIST[playerId].emit('sfx', "sfxHealthPackGrab");
			removePickup(pickupId);
		}
		else {
			return;
		}
	}
	else if (Pickup.list[pickupId].type == 2){ //DP
		if (playerList[playerId].holdingBag == false && playerList[playerId].weapon == 1){
			if (playerList[playerId].reloading > 0){
				playerList[playerId].reloading = 0;
				updatePlayerList.push({id:playerId,property:"reloading",value:playerList[playerId].reloading});				
			}
			playerList[playerId].weapon = 2;
			updatePlayerList.push({id:playerId,property:"weapon",value:playerList[playerId].weapon});	
		}
		else {
			SOCKET_LIST[playerId].emit('sfx', "sfxDPEquip");
		}
		if (playerList[playerId].DPClip <= 0 && playerList[playerId].DPAmmo <= 0){
			if (Pickup.list[pickupId].amount <= DPClipSize){
				playerList[playerId].DPClip += Pickup.list[pickupId].amount;				
			}
			else {
				playerList[playerId].DPClip += DPClipSize;
				playerList[playerId].DPAmmo += Pickup.list[pickupId].amount - DPClipSize;
				if (playerList[playerId].DPAmmo > maxDPAmmo){playerList[playerId].DPAmmo = maxDPAmmo;}
			}
			updatePlayerList.push({id:playerId,property:"DPClip",value:playerList[playerId].DPClip});								
			updatePlayerList.push({id:playerId,property:"DPAmmo",value:playerList[playerId].DPAmmo});								
		}
		else {
			playerList[playerId].DPAmmo += Pickup.list[pickupId].amount;
			if (playerList[playerId].DPAmmo > maxDPAmmo){playerList[playerId].DPAmmo = maxDPAmmo;}
			updatePlayerList.push({id:playerId,property:"DPAmmo",value:playerList[playerId].DPAmmo});								
		}	
		removePickup(pickupId);		
	}
	else if (Pickup.list[pickupId].type == 3){ //MG
		if (playerList[playerId].holdingBag == false && playerList[playerId].weapon == 1){
			if (playerList[playerId].reloading > 0){
				playerList[playerId].reloading = 0;
				updatePlayerList.push({id:playerId,property:"reloading",value:playerList[playerId].reloading});				
			}
			playerList[playerId].weapon = 3;
			updatePlayerList.push({id:playerId,property:"weapon",value:playerList[playerId].weapon});	
		}
		else {
			SOCKET_LIST[playerId].emit('sfx', "sfxMGEquip");
		}
		if (playerList[playerId].MGClip <= 0 && playerList[playerId].MGAmmo <= 0){
			if (Pickup.list[pickupId].amount <= MGClipSize){
				playerList[playerId].MGClip += Pickup.list[pickupId].amount;				
			}
			else {
				playerList[playerId].MGClip += MGClipSize;
				playerList[playerId].MGAmmo += Pickup.list[pickupId].amount - MGClipSize;
				if (playerList[playerId].MGAmmo > maxMGAmmo){playerList[playerId].MGAmmo = maxMGAmmo;}
			}
			updatePlayerList.push({id:playerId,property:"MGClip",value:playerList[playerId].MGClip});								
			updatePlayerList.push({id:playerId,property:"MGAmmo",value:playerList[playerId].MGAmmo});								
		}
		else {
			playerList[playerId].MGAmmo += Pickup.list[pickupId].amount;
			if (playerList[playerId].MGAmmo > maxMGAmmo){playerList[playerId].MGAmmo = maxMGAmmo;}
			updatePlayerList.push({id:playerId,property:"MGAmmo",value:playerList[playerId].MGAmmo});								
		}	
		removePickup(pickupId);		
	}
	else if (Pickup.list[pickupId].type == 4){ //SG
		if (playerList[playerId].holdingBag == false && playerList[playerId].weapon == 1){
			if (playerList[playerId].reloading > 0){
				playerList[playerId].reloading = 0;
				updatePlayerList.push({id:playerId,property:"reloading",value:playerList[playerId].reloading});				
			}
			playerList[playerId].weapon = 4;
			updatePlayerList.push({id:playerId,property:"weapon",value:playerList[playerId].weapon});	
		}
		else { //because the sfx will already trigger automatically clientside if switching weapons to SG
			SOCKET_LIST[playerId].emit('sfx', "sfxSGEquip");
		}
		if (playerList[playerId].SGClip <= 0 && playerList[playerId].SGAmmo <= 0){
			if (Pickup.list[pickupId].amount <= SGClipSize){
				playerList[playerId].SGClip += Pickup.list[pickupId].amount;				
			}
			else {
				playerList[playerId].SGClip += SGClipSize;
				playerList[playerId].SGAmmo += Pickup.list[pickupId].amount - SGClipSize;
				if (playerList[playerId].SGAmmo > maxSGAmmo){playerList[playerId].SGAmmo = maxSGAmmo;}
			}
			updatePlayerList.push({id:playerId,property:"SGClip",value:playerList[playerId].SGClip});								
			updatePlayerList.push({id:playerId,property:"SGAmmo",value:playerList[playerId].SGAmmo});								
		}
		else {
			playerList[playerId].SGAmmo += Pickup.list[pickupId].amount;
			if (playerList[playerId].SGAmmo > maxSGAmmo){playerList[playerId].SGAmmo = maxSGAmmo;}
			updatePlayerList.push({id:playerId,property:"SGAmmo",value:playerList[playerId].SGAmmo});								
		}		
		removePickup(pickupId);		
	}
	else if (Pickup.list[pickupId].type == 6){ //Laser
		if (playerList[playerId].holdingBag == false && playerList[playerId].weapon == 1){
			if (playerList[playerId].reloading > 0){
				playerList[playerId].reloading = 0;
				updatePlayerList.push({id:playerId,property:"reloading",value:playerList[playerId].reloading});				
			}
			playerList[playerId].weapon = 5;
			updatePlayerList.push({id:playerId,property:"weapon",value:playerList[playerId].weapon});	
		}
		else { //because the sfx will already trigger automatically clientside if switching weapons to SG
			SOCKET_LIST[playerId].emit('sfx', "sfxLaserEquip");
		}
		playerList[playerId].laserClip += Pickup.list[pickupId].amount;
		if (playerList[playerId].laserClip > maxLaserAmmo){playerList[playerId].laserClip = maxLaserAmmo;}
		updatePlayerList.push({id:playerId,property:"laserClip",value:playerList[playerId].laserClip});								
		removePickup(pickupId);		
	}
	else if (Pickup.list[pickupId].type == 5 && playerList[playerId].health <= 100){ //BA
		playerList[playerId].health = 100 + Pickup.list[pickupId].amount;
		if (playerList[playerId].health > playerMaxHealth){
			playerList[playerId].health = playerMaxHealth;
		}
		updatePlayerList.push({id:playerId,property:"health",value:playerList[playerId].health});											
		SOCKET_LIST[playerId].emit('sfx', "sfxBagGrab");
		removePickup(pickupId);
	}
	
	
}

var removePickup = function(pickupId){
	if (Pickup.list[pickupId].respawnTime == -1){
		delete Pickup.list[pickupId];
	}
	else {
		Pickup.list[pickupId].respawnTimer = Pickup.list[pickupId].respawnTime;
	}
	updatePickupList.push(pickupId);
}

var getPickupList = function(){
	var pickupList = [];
	for (var p in Pickup.list){
		pickupList.push(Pickup.list[p]);
	}
    return pickupList;
}

var getPickupById = function(id){
    return Pickup.list[id];
}

var createPickup = function(id, x, y, type, amount, respawn){
	Pickup(id, x, y, type, amount, respawn);
}

var clearPickupList = function(){
	for (var p in Pickup.list){
		updatePickupList.push(Pickup.list[p].id);
	}
	Pickup.list = [];
}

var clockTick = function(){
	for (var i in Pickup.list){
		if (Pickup.list[i].respawnTime > -1 && gameOver == false){				
			if (Pickup.list[i].respawnTimer > 0){
				Pickup.list[i].respawnTimer--;
				updatePickupList.push(Pickup.list[i]);
			} else if (Pickup.list[i].respawnTimer < 0){Pickup.list[i].respawnTimer = 0;} //Ignore this. This should never be triggered.
		}
	}	
}

var checkForPickup = function(player){
	for (var i in Pickup.list){
		if (player.health > 0 && player.x > Pickup.list[i].x - 30 && player.x < Pickup.list[i].x + Pickup.list[i].width + 30 && player.y > Pickup.list[i].y - 30 && player.y < Pickup.list[i].y + Pickup.list[i].height + 30 && Pickup.list[i].respawnTimer == 0){
			pickupPickup(player.id, Pickup.list[i].id);
		}
	}			
}

module.exports.pickupPickup = pickupPickup;
module.exports.getPickupList = getPickupList;
module.exports.getPickupById = getPickupById;
module.exports.createPickup = createPickup;
module.exports.clearPickupList = clearPickupList;
module.exports.clockTick = clockTick;
module.exports.checkForPickup = checkForPickup;
