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
	var playerPickingUp = player.getPlayerList()[playerId];
	var socket = SOCKET_LIST[playerId];
	if (!playerPickingUp || !socket){return;}

	var sfx = "";

	if (Pickup.list[pickupId].type == 1){ //MD
		if (playerPickingUp.health < 100){
			playerPickingUp.health += Pickup.list[pickupId].amount;
			if (playerPickingUp.health > 100){
				playerPickingUp.health = 100;
			}
			updatePlayerList.push({id:playerId,property:"health",value:playerPickingUp.health});											
			sfx = "sfxHealthPackGrab";
			removePickup(pickupId);
		}
		else {
			return;
		}
	}
	else if (Pickup.list[pickupId].type == 2){ //DP
		if (playerPickingUp.holdingBag == false && playerPickingUp.weapon == 1){
			if (playerPickingUp.reloading > 0){
				playerPickingUp.reloading = 0;
				updatePlayerList.push({id:playerId,property:"reloading",value:playerPickingUp.reloading});				
			}
			playerPickingUp.weapon = 2;
			updatePlayerList.push({id:playerId,property:"weapon",value:playerPickingUp.weapon});	
		}
		else {
			sfx = "sfxDPEquip";
		}
		if (playerPickingUp.DPClip <= 0 && playerPickingUp.DPAmmo <= 0){
			if (Pickup.list[pickupId].amount <= DPClipSize){
				playerPickingUp.DPClip += Pickup.list[pickupId].amount;				
			}
			else {
				playerPickingUp.DPClip += DPClipSize;
				playerPickingUp.DPAmmo += Pickup.list[pickupId].amount - DPClipSize;
				if (playerPickingUp.DPAmmo > maxDPAmmo){playerPickingUp.DPAmmo = maxDPAmmo;}
			}
			updatePlayerList.push({id:playerId,property:"DPClip",value:playerPickingUp.DPClip});								
			updatePlayerList.push({id:playerId,property:"DPAmmo",value:playerPickingUp.DPAmmo});								
		}
		else {
			playerPickingUp.DPAmmo += Pickup.list[pickupId].amount;
			if (playerPickingUp.DPAmmo > maxDPAmmo){playerPickingUp.DPAmmo = maxDPAmmo;}
			updatePlayerList.push({id:playerId,property:"DPAmmo",value:playerPickingUp.DPAmmo});								
		}	
		removePickup(pickupId);		
	}
	else if (Pickup.list[pickupId].type == 3){ //MG
		if (playerPickingUp.holdingBag == false && playerPickingUp.weapon == 1){
			if (playerPickingUp.reloading > 0){
				playerPickingUp.reloading = 0;
				updatePlayerList.push({id:playerId,property:"reloading",value:playerPickingUp.reloading});				
			}
			playerPickingUp.weapon = 3;
			updatePlayerList.push({id:playerId,property:"weapon",value:playerPickingUp.weapon});	
		}
		else {
			sfx = "sfxMGEquip";
		}
		if (playerPickingUp.MGClip <= 0 && playerPickingUp.MGAmmo <= 0){
			if (Pickup.list[pickupId].amount <= MGClipSize){
				playerPickingUp.MGClip += Pickup.list[pickupId].amount;				
			}
			else {
				playerPickingUp.MGClip += MGClipSize;
				playerPickingUp.MGAmmo += Pickup.list[pickupId].amount - MGClipSize;
				if (playerPickingUp.MGAmmo > maxMGAmmo){playerPickingUp.MGAmmo = maxMGAmmo;}
			}
			updatePlayerList.push({id:playerId,property:"MGClip",value:playerPickingUp.MGClip});								
			updatePlayerList.push({id:playerId,property:"MGAmmo",value:playerPickingUp.MGAmmo});								
		}
		else {
			playerPickingUp.MGAmmo += Pickup.list[pickupId].amount;
			if (playerPickingUp.MGAmmo > maxMGAmmo){playerPickingUp.MGAmmo = maxMGAmmo;}
			updatePlayerList.push({id:playerId,property:"MGAmmo",value:playerPickingUp.MGAmmo});								
		}	
		removePickup(pickupId);		
	}
	else if (Pickup.list[pickupId].type == 4){ //SG
		if (playerPickingUp.holdingBag == false && playerPickingUp.weapon == 1){
			if (playerPickingUp.reloading > 0){
				playerPickingUp.reloading = 0;
				updatePlayerList.push({id:playerId,property:"reloading",value:playerPickingUp.reloading});				
			}
			playerPickingUp.weapon = 4;
			updatePlayerList.push({id:playerId,property:"weapon",value:playerPickingUp.weapon});	
		}
		else { //because the sfx will already trigger automatically clientside if switching weapons to SG
			sfx = "sfxSGEquip";
		}
		if (playerPickingUp.SGClip <= 0 && playerPickingUp.SGAmmo <= 0){
			if (Pickup.list[pickupId].amount <= SGClipSize){
				playerPickingUp.SGClip += Pickup.list[pickupId].amount;				
			}
			else {
				playerPickingUp.SGClip += SGClipSize;
				playerPickingUp.SGAmmo += Pickup.list[pickupId].amount - SGClipSize;
				if (playerPickingUp.SGAmmo > maxSGAmmo){playerPickingUp.SGAmmo = maxSGAmmo;}
			}
			updatePlayerList.push({id:playerId,property:"SGClip",value:playerPickingUp.SGClip});								
			updatePlayerList.push({id:playerId,property:"SGAmmo",value:playerPickingUp.SGAmmo});								
		}
		else {
			playerPickingUp.SGAmmo += Pickup.list[pickupId].amount;
			if (playerPickingUp.SGAmmo > maxSGAmmo){playerPickingUp.SGAmmo = maxSGAmmo;}
			updatePlayerList.push({id:playerId,property:"SGAmmo",value:playerPickingUp.SGAmmo});								
		}		
		removePickup(pickupId);		
	}
	else if (Pickup.list[pickupId].type == 6){ //Laser
		if (playerPickingUp.holdingBag == false && playerPickingUp.weapon == 1){
			if (playerPickingUp.reloading > 0){
				playerPickingUp.reloading = 0;
				updatePlayerList.push({id:playerId,property:"reloading",value:playerPickingUp.reloading});				
			}
			playerPickingUp.weapon = 5;
			updatePlayerList.push({id:playerId,property:"weapon",value:playerPickingUp.weapon});	
		}
		else { //because the sfx will already trigger automatically clientside if switching weapons to SG
			sfx = "sfxLaserEquip";
		}
		playerPickingUp.laserClip += Pickup.list[pickupId].amount;
		if (playerPickingUp.laserClip > maxLaserAmmo){playerPickingUp.laserClip = maxLaserAmmo;}
		updatePlayerList.push({id:playerId,property:"laserClip",value:playerPickingUp.laserClip});								
		removePickup(pickupId);		
	}
	else if (Pickup.list[pickupId].type == 5 && playerPickingUp.health <= 100){ //BA
		playerPickingUp.health = 100 + Pickup.list[pickupId].amount;
		if (playerPickingUp.health > playerMaxHealth){
			playerPickingUp.health = playerMaxHealth;
		}
		updatePlayerList.push({id:playerId,property:"health",value:playerPickingUp.health});											
		
		removePickup(pickupId);
	}
	
	if (sfx)
		SOCKET_LIST[playerId].emit('sfx', sfx);
	
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

var getPickupListLength = function(){
	var pickupListCount = 0;
	for (var p in Pickup.list){
		pickupListCount++;
	}
    return pickupListCount;
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
module.exports.getPickupListLength = getPickupListLength;
module.exports.getPickupById = getPickupById;
module.exports.createPickup = createPickup;
module.exports.clearPickupList = clearPickupList;
module.exports.clockTick = clockTick;
module.exports.checkForPickup = checkForPickup;
