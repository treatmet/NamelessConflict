var Player = require(absAppDir + '/app_code/entities/player.js');


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
		self.width = 0;
		self.height = 0;
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
	if (Pickup.list[pickupId].type == 1){ //MD
		if (Player.list[playerId].health < 100){
			Player.list[playerId].health += Pickup.list[pickupId].amount;
			if (Player.list[playerId].health > 100){
				Player.list[playerId].health = 100;
			}
			updatePlayerList.push({id:playerId,property:"health",value:Player.list[playerId].health});											
			SOCKET_LIST[playerId].emit('sfx', "sfxHealthPackGrab");
			removePickup(pickupId);
		}
		else {
			return;
		}
	}
	else if (Pickup.list[pickupId].type == 2){ //DP
		if (Player.list[playerId].holdingBag == false && Player.list[playerId].weapon == 1){
			if (Player.list[playerId].reloading > 0){
				Player.list[playerId].reloading = 0;
				updatePlayerList.push({id:playerId,property:"reloading",value:Player.list[playerId].reloading});				
			}
			Player.list[playerId].weapon = 2;
			updatePlayerList.push({id:playerId,property:"weapon",value:Player.list[playerId].weapon});	
		}
		else {
			SOCKET_LIST[playerId].emit('sfx', "sfxDPEquip");
		}
		if (Player.list[playerId].DPClip <= 0 && Player.list[playerId].DPAmmo <= 0){
			if (Pickup.list[pickupId].amount <= DPClipSize){
				Player.list[playerId].DPClip += Pickup.list[pickupId].amount;				
			}
			else {
				Player.list[playerId].DPClip += DPClipSize;
				Player.list[playerId].DPAmmo += Pickup.list[pickupId].amount - DPClipSize;
				if (Player.list[playerId].DPAmmo > maxDPAmmo){Player.list[playerId].DPAmmo = maxDPAmmo;}
			}
			updatePlayerList.push({id:playerId,property:"DPClip",value:Player.list[playerId].DPClip});								
			updatePlayerList.push({id:playerId,property:"DPAmmo",value:Player.list[playerId].DPAmmo});								
		}
		else {
			Player.list[playerId].DPAmmo += Pickup.list[pickupId].amount;
			if (Player.list[playerId].DPAmmo > maxDPAmmo){Player.list[playerId].DPAmmo = maxDPAmmo;}
			updatePlayerList.push({id:playerId,property:"DPAmmo",value:Player.list[playerId].DPAmmo});								
		}	
		removePickup(pickupId);		
	}
	else if (Pickup.list[pickupId].type == 3){ //MG
		if (Player.list[playerId].holdingBag == false && Player.list[playerId].weapon == 1){
			if (Player.list[playerId].reloading > 0){
				Player.list[playerId].reloading = 0;
				updatePlayerList.push({id:playerId,property:"reloading",value:Player.list[playerId].reloading});				
			}
			Player.list[playerId].weapon = 3;
			updatePlayerList.push({id:playerId,property:"weapon",value:Player.list[playerId].weapon});	
		}
		else {
			SOCKET_LIST[playerId].emit('sfx', "sfxMGEquip");
		}
		if (Player.list[playerId].MGClip <= 0 && Player.list[playerId].MGAmmo <= 0){
			if (Pickup.list[pickupId].amount <= MGClipSize){
				Player.list[playerId].MGClip += Pickup.list[pickupId].amount;				
			}
			else {
				Player.list[playerId].MGClip += MGClipSize;
				Player.list[playerId].MGAmmo += Pickup.list[pickupId].amount - MGClipSize;
				if (Player.list[playerId].MGAmmo > maxMGAmmo){Player.list[playerId].MGAmmo = maxMGAmmo;}
			}
			updatePlayerList.push({id:playerId,property:"MGClip",value:Player.list[playerId].MGClip});								
			updatePlayerList.push({id:playerId,property:"MGAmmo",value:Player.list[playerId].MGAmmo});								
		}
		else {
			Player.list[playerId].MGAmmo += Pickup.list[pickupId].amount;
			if (Player.list[playerId].MGAmmo > maxMGAmmo){Player.list[playerId].MGAmmo = maxMGAmmo;}
			updatePlayerList.push({id:playerId,property:"MGAmmo",value:Player.list[playerId].MGAmmo});								
		}	
		removePickup(pickupId);		
	}
	else if (Pickup.list[pickupId].type == 4){ //SG
		if (Player.list[playerId].holdingBag == false && Player.list[playerId].weapon == 1){
			if (Player.list[playerId].reloading > 0){
				Player.list[playerId].reloading = 0;
				updatePlayerList.push({id:playerId,property:"reloading",value:Player.list[playerId].reloading});				
			}
			Player.list[playerId].weapon = 4;
			updatePlayerList.push({id:playerId,property:"weapon",value:Player.list[playerId].weapon});	
		}
		else { //because the sfx will already trigger automatically clientside if switching weapons to SG
			SOCKET_LIST[playerId].emit('sfx', "sfxSGEquip");
		}
		if (Player.list[playerId].SGClip <= 0 && Player.list[playerId].SGAmmo <= 0){
			if (Pickup.list[pickupId].amount <= SGClipSize){
				Player.list[playerId].SGClip += Pickup.list[pickupId].amount;				
			}
			else {
				Player.list[playerId].SGClip += SGClipSize;
				Player.list[playerId].SGAmmo += Pickup.list[pickupId].amount - SGClipSize;
				if (Player.list[playerId].SGAmmo > maxSGAmmo){Player.list[playerId].SGAmmo = maxSGAmmo;}
			}
			updatePlayerList.push({id:playerId,property:"SGClip",value:Player.list[playerId].SGClip});								
			updatePlayerList.push({id:playerId,property:"SGAmmo",value:Player.list[playerId].SGAmmo});								
		}
		else {
			Player.list[playerId].SGAmmo += Pickup.list[pickupId].amount;
			if (Player.list[playerId].SGAmmo > maxSGAmmo){Player.list[playerId].SGAmmo = maxSGAmmo;}
			updatePlayerList.push({id:playerId,property:"SGAmmo",value:Player.list[playerId].SGAmmo});								
		}		
		removePickup(pickupId);		
	}
	else if (Pickup.list[pickupId].type == 5 && Player.list[playerId].health <= 100){ //BA
		Player.list[playerId].health = 100 + Pickup.list[pickupId].amount;
		if (Player.list[playerId].health > playerMaxHealth){
			Player.list[playerId].health = playerMaxHealth;
		}
		updatePlayerList.push({id:playerId,property:"health",value:Player.list[playerId].health});											
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

module.exports = Pickup;
module.exports.pickupPickup = pickupPickup;
