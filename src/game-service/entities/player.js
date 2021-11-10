var gameEngine = require('../engines/gameEngine.js');
var thug = require('./thug.js');
var block = require('./block.js');
var grenade = require('./grenade.js');
var pickup = require('./pickup.js');
var entityHelpers = require('./_entityHelpers.js');
var dataAccessFunctions = require('../../shared/data_access/dataAccessFunctions.js');

var profanityImport = require('@2toad/profanity');
const options = new profanityImport.ProfanityOptions();
options.wholeWord = false;
const profanity = new profanityImport.Profanity(options);
profanity.removeWords([
	'4r5e','5h1t','5hit','a55','anal','anus','ar5e','arrse','arse','arses','ass','ass-fucker','asses','assfucker','assfukka','asshole','assholes','asswhole','a_s_s','a$$','as$','a$s','b!tch','b00bs','b17ch','b1tch','ballbag','balls','ballsack','bastard','beastial','beastiality','bellend','bestial','bestiality','bi+ch','biatch','bitch','bitchboy','bitcher','bitchers','bitches','bitchin','bitching','bloody','blow job','blowjob','blowjobs','boiolas','bollock','bollok','boner','boob','boobs','booobs','boooobs','booooobs','booooooobs','breasts','buceta','bugger','bullshit','bum','butt','butts','butthole','buttmuch','buttplug','c0ck','c0cksucker','carpet muncher','cawk','chink','cipa','cl1t','clit','clitoris','clits','cnut','cock','cock-sucker','cockface','cockhead','cockmunch','cockmuncher','cocks','cocksuck','cocksucked','cocksucker','cocksucking','cocksucks','cocksuka','cocksukka','cok','cokmuncher','coksucka','coon','cox','crap','cum','cummer','cumming','cums','cumshot','cunilingus','cunillingus','cunnilingus','cunt','cuntlick','cuntlicker','cuntlicking','cunts','cyalis','cyberfuc','cyberfuck','cyberfucked','cyberfucker','cyberfuckers','cyberfucking','d1ck','damn','dick','dickhead','dildo','dildos','dink','dinks','dirsa','dlck','dog-fucker','doggin','dogging','donkeyribber','doosh','duche','dyke','ejaculate','ejaculated','ejaculates','ejaculating','ejaculatings','ejaculation','ejakulate','f u c k','f u c k e r','f4nny','fag','fagging','faggitt','faggot','faggs','fagot','fagots','fags','fanny','fannyflaps','fannyfucker','fanyy','fatass','fcuk','fcuker','fcuking','feck','fecker','felching','fellate','fellatio','fingerfuck','fingerfucked','fingerfucker','fingerfuckers','fingerfucking','fingerfucks','fistfuck','fistfucked','fistfucker','fistfuckers','fistfucking','fistfuckings','fistfucks','flange','fook','fooker','fuck','fucka','fucked','fucker','fuckers','fuckhead','fuckheads','fuckin','fucking','fuckings','fuckingshitmotherfucker','fuckme','fucks','fuckwhit','fuckwit','fudge packer','fudgepacker','fuk','fuker','fukker','fukkin','fuks','fukwhit','fukwit','fux','fux0r','f_u_c_k','gangbang','gangbanged','gangbangs','gaylord','gaysex','goatse','god-dam','god-damned','goddamn','goddamned','hardcoresex','headass','hoar','hoare','hoer','hoes','homo','hore','horniest','horny','hotsex','jack-off','jackoff','jap','jerk-off','jism','jiz','jizm','jizz','kawk','knobead','knobed','knobend','knobhead','knobjocky','knobjokey','kock','kondum','kondums','kum','kummer','kumming','kums','kunilingus','l3i+ch','l3itch','labia','lust','lusting','m0f0','m0fo','m45terbate','ma5terb8','ma5terbate','masochist','master-bate','masterb8','masterbat*','masterbat3','masterbate','masterbation','masterbations','masturbate','mo-fo','mof0','mofo','mothafuck','mothafucka','mothafuckas','mothafuckaz','mothafucked','mothafucker','mothafuckers','mothafuckin','mothafucking','mothafuckings','mothafucks','motherfuck','motherfucked','motherfucker','motherfuckers','motherfuckin','motherfucking','motherfuckings','motherfuckka','motherfucks','muff','muthafecker','muthafuckker','mutherfucker','n1gga','n1gger','nazi','nigg3r','nigg4h','nigga','niggah','niggas','niggaz','nigger','niggers','nob','nob jokey','nobhead','nobjocky','nobjokey','numbnuts','nutsack','orgasim','orgasims','orgasm','orgasms','p0rn','pawn','pecker','penis','penisfucker','phonesex','phuck','phuk','phuked','phuking','phukked','phukking','phuks','phuq','pigfucker','pimpis','piss','pissed','pisser','pissers','pisses','pissflaps','pissin','pissing','pissoff','poop','porn','porno','pornography','pornos','prick','pricks','pron','pube','pusse','pussi','pussies','pussy','pussys','rectum','retard','rimjaw','rimming','s hit','s.o.b.','sadist','schlong','screwing','scroat','scrote','scrotum','semen','sex','sh!+','sh!t','sh1t','shag','shagger','shaggin','shagging','shemale','shi+','shit','shitdick','shite','shited','shitey','shitfuck','shitfull','shithead','shiting','shitings','shits','shitted','shitter','shitters','shitting','shittings','shitty','skank','slut','sluts','smegma','smut','snatch','son-of-a-bitch','spac','spunk','s_h_i_t','t1tt1e5','t1tties','teets','teez','testical','testicle','tit','titfuck','tits','titt','tittie5','tittiefucker','titties','tittyfuck','tittywank','titwank','tosser','turd','tw4t','twat','twathead','twatty','twunt','twunter','v14gra','v1gra','vagina','viagra','vulva','w00se','wang','wank','wanker','wanky','whoar','whore','willies','willy'
]);
profanity.addWords([
	'5h1t','d1ck','dick','5hit','a55','ass-fucker','assfucker','assfukka','asshole','assholes','asswhole','beastiality','bestiality','bullshit','c0ck','c0cksucker','cawk','chink','clit','clitoris','clits','cock','cock-sucker','cockface','cockhead','cockmunch','cockmuncher','cocks','cocksuck','cocksucked','cocksucker','cocksucking','cocksucks','cocksuka','cocksukka','cok','cokmuncher','coksucka','coon','cox','cum','cummer','cumming','cums','cumshot','cunilingus','cunillingus','cunnilingus','cunt','cuntlick','cuntlicker','cuntlicking','cunts','dog-fucker','dyke','f u c k','f u c k e r','fag','fagging','faggitt','faggot','faggs','fagot','fagots','fags','fannyfucker','fcuk','fcuker','fcuking','felching','fellate','fellatio','fingerfuck','fingerfucked','fingerfucker','fingerfuckers','fingerfucking','fingerfucks','fistfuck','fistfucked','fistfucker','fistfuckers','fistfucking','fistfuckings','fistfucks','fuck','fucka','fucked','fucker','fuckers','fuckhead','fuckheads','fuckin','fucking','fuckings','fuckingshitmotherfucker','fuckme','fucks','fuckwhit','fuckwit','fudge packer','fudgepacker','fuk','fuker','fukker','fukkin','fuks','fukwhit','fukwit','fux','fux0r','f_u_c_k','gangbang','gangbanged','gangbangs','gaysex','goatse','hardcoresex','homo','hore','jack-off','jackoff','jap','jerk-off','jism','jiz','jizm','jizz','kawk','kock','kum','kummer','kumming','kums','kunilingus','labia','m45terbate','ma5terb8','ma5terbate','masochist','master-bate','masterb8','masterbat*','masterbat3','masterbate','masterbation','masterbations','masturbate','mo-fo','mof0','mofo','mothafuck','mothafucka','mothafuckas','mothafuckaz','mothafucked','mothafucker','mothafuckers','mothafuckin','mothafucking','mothafuckings','mothafucks','motherfuck','motherfucked','motherfucker','motherfuckers','motherfuckin','motherfucking','motherfuckings','motherfuckka','motherfucks','muthafecker','muthafuckker','mutherfucker','n1gga','n1gger','nigg3r','nigg4h','nigga','niggah','niggas','niggaz','nigger','niggers','penis','penisfucker','phuck','phuk','phuked','phuking','phukked','phukking','phuks','phuq','pigfucker','pussies','pussy','pussys','retard','rimjaw','rimming','s hit','sh!+','sh!t','sh1t','shi+','shit','shitdick','shite','shited','shitey','shitfuck','shitfull','shithead','shiting','shitings','shits','shitted','shitter','shitters','shitting','shittings','shitty','slut','sluts','smegma','s_h_i_t','titfuck','tittiefucker','titties','tittyfuck','tittywank','titwank','tw4t','twat','twathead','twatty','twunt','twunter','vagina','vulva','whore'
])
	
var Player = function(id, cognitoSub, name, team, customizations, settings, partyId){
	log("Player initializing... cognitoSub=" + cognitoSub + " id:" + id);
	var self = {
		id:id,
		cognitoSub:cognitoSub,
		team:team,
		name:name,
		partyId:partyId,
		height:94,
		width:94,
		pressingUp:false,
		pressingRight:false,
		pressingDown:false,
		pressingLeft:false,
		pressingW:false,
		pressingD:false,
		pressingS:false,		
		pressingA:false,
		pressingShift:false,
		chargingLaser:0,
		speedX:0,
		speedY:0,
		lastReturnCooldown:0,
		shootingDir:1,
		customizations: customizations,
		settings: settings,
		throwingObject:0,

		cash:(gametype == "elim" ? startingCash : 0),
		cashEarnedThisGame:0,
		kills:0,
		assists:0,
		benedicts:0,
		deaths:0,
		steals:0,
		returns:0,
		captures:0,	
		rating:0,
		experience:0,
		ticksSinceLastPing:0,
		cumulativeAllyDamage:0
	}
		
	//Initialize Player
	updatePlayerList.push({id:self.id,property:"team",value:self.team, single:2});
	updatePlayerList.push({id:self.id,property:"cash",value:self.cash});
	updatePlayerList.push({id:self.id,property:"cashEarnedThisGame",value:self.cashEarnedThisGame});
	updatePlayerList.push({id:self.id,property:"kills",value:self.kills});
	updatePlayerList.push({id:self.id,property:"assists",value:self.assists});
	updatePlayerList.push({id:self.id,property:"deaths",value:self.deaths});
	updatePlayerList.push({id:self.id,property:"steals",value:self.steals});
	updatePlayerList.push({id:self.id,property:"returns",value:self.returns});
	updatePlayerList.push({id:self.id,property:"captures",value:self.captures});
	updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
	updatePlayerList.push({id:self.id,property:"customizations",value:customizations, single:2});



	var socket = SOCKET_LIST[id];
	if (!socket){return;}

	self.shotList = [];

	//Player Update (Timer1 for player - Happens every frame)	
	self.engine = function(){	
		self.processChargingLaser();
		self.processGrapple();

		//PING
		self.ticksSinceLastPing++;


		/////////////////////////// DEATH /////////////////////		
		//Drop bag
		if (self.health <= 0 && self.holdingBag == true){
			if (self.team == 1){
				bagBlue.captured = false;
				updateMisc.bagBlue = bagBlue;
			}
			else if (self.team == 2){
				bagRed.captured = false;
				updateMisc.bagRed = bagRed;
			}
			self.holdingBag = false;
			updatePlayerList.push({id:self.id,property:"holdingBag",value:self.holdingBag});
		}

		//if (self.cognitoSub.substring(0,2) == "0."){console.log("health:" + self.health + " respawn:" + self.respawnTimer);}
		if (self.health <= 0 && self.respawnTimer < respawnTimeLimit){self.respawnTimer++;}
		if (!(gametype == "horde" || (pregame && pregameIsHorde))){
			if (self.respawnTimer == respawnTimeLimit && self.health <= 0){
				if (gametype == "elim"){ //Elim specate and show shop
					self.respawnTimer = respawnTimeLimit + 1;
					socket.emit("showShop");
				}
				else {
					self.respawn();
				}
			}
		}
		
		if (self.health <= 0){return false;}


		//THROWING
		if (self.throwingObject > 0){
			if (self.throwingObject === 1){
				self.updatePropAndSend("throwingObject", 0);
			}
			else {
				self.throwingObject--;
			}
		}
		else if (self.throwingObject === 0 && self.pressingShift){
			self.firing = 0;
			self.aiming = 0;
			self.pullGrenade();
		}

		
		////////////SHOOTING///////////////////
	
		//If currently holding an arrow key, be aiming in that direction 
			var discharge = false;
			if (self.pressingUp === true && self.pressingRight === false && self.pressingDown === false && self.pressingLeft === false){				
				if (self.shootingDir != 1){
					if (!self.pressingShift && self.throwingObject === 0 && (self.weapon == 1 || self.weapon == 2 || self.weapon == 3 || self.weapon == 4)){
						if (!self.firing)
							discharge = true;
					}
					self.shootingDir = 1;
					updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
				}
			}
			if (self.pressingUp === true && self.pressingRight === true && self.pressingDown === false && self.pressingLeft === false){				
				if (self.shootingDir != 2){
					if (!self.pressingShift && self.throwingObject === 0 && (self.weapon == 1 || self.weapon == 2 || self.weapon == 3 || self.weapon == 4)){
						if (!self.firing || (self.firing && self.shootingDir == 1 || self.shootingDir == 3)) //doubleshots
							discharge = true;
					}
					self.shootingDir = 2;
					updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
				}
			}
			if (self.pressingUp === false && self.pressingRight === true && self.pressingDown === false && self.pressingLeft === false){				
				if (self.shootingDir != 3){
					if (!self.pressingShift && self.throwingObject === 0 && (self.weapon == 1 || self.weapon == 2 || self.weapon == 3 || self.weapon == 4)){
						if (!self.firing) //doubleshots
							discharge = true;
					}			
					self.shootingDir = 3;
					updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
				}
			}
			if (self.pressingUp === false && self.pressingRight === true && self.pressingDown === true && self.pressingLeft === false){				
				if (self.shootingDir != 4){
					if (!self.pressingShift && self.throwingObject === 0 && (self.weapon == 1 || self.weapon == 2 || self.weapon == 3 || self.weapon == 4)){
						if (!self.firing || (self.firing && self.shootingDir == 3 || self.shootingDir == 5)) //doubleshots
							discharge = true;
					}
					self.shootingDir = 4;
					updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
				}
			}
			if (self.pressingUp === false && self.pressingRight === false && self.pressingDown === true && self.pressingLeft === false){				
				if (self.shootingDir != 5){
					if (!self.pressingShift && self.throwingObject === 0 && (self.weapon == 1 || self.weapon == 2 || self.weapon == 3 || self.weapon == 4)){
						if (!self.firing) //doubleshots
							discharge = true;
					}
					self.shootingDir = 5;
					updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
				}
			}
			if (self.pressingUp === false && self.pressingRight === false && self.pressingDown === true && self.pressingLeft === true){				
				if (self.shootingDir != 6){
					if (!self.pressingShift && self.throwingObject === 0 && (self.weapon == 1 || self.weapon == 2 || self.weapon == 3 || self.weapon == 4)){
						if (!self.firing || (self.firing && self.shootingDir == 5 || self.shootingDir == 7)) //doubleshots
							discharge = true;
					}
					self.shootingDir = 6;
					updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
				}
			}
			if (self.pressingUp === false && self.pressingRight === false && self.pressingDown === false && self.pressingLeft === true){				
				if (self.shootingDir != 7){
					if (!self.pressingShift && self.throwingObject === 0 && (self.weapon == 1 || self.weapon == 2 || self.weapon == 3 || self.weapon == 4)){
						if (!self.firing) //doubleshots
							discharge = true;
					}
					self.shootingDir = 7;
					updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
				}
			}
			if (self.pressingUp === true && self.pressingRight === false && self.pressingDown === false && self.pressingLeft === true){				
				if (self.shootingDir != 8){
					if (!self.pressingShift && self.throwingObject === 0 && (self.weapon == 1 || self.weapon == 2 || self.weapon == 3 || self.weapon == 4)){
						if (!self.firing || (self.firing && self.shootingDir == 7 || self.shootingDir == 1)) //doubleshots
							discharge = true;
					}			
					self.shootingDir = 8;
					updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
				}
			}

		if (discharge){
			self.aiming = framesOfAiming;
			Discharge(self);				
		}

		//Auto shooting for holding down button
		if (self.firing <= 0 && !self.pressingShift && self.throwingObject === 0 && self.fireRate <= 0 && (self.pressingUp || self.pressingDown || self.pressingLeft || self.pressingRight) && self.weapon != 5){
			Discharge(self);
		}
		if (self.fireRate > 0){
			self.fireRate--;
			if (self.bufferReload && self.fireRate <= 0){
				self.bufferReload = false;
				reload(self.id);				
			}
		}

		//Firing and aiming decay (every frame)
		if (self.aiming > 0){self.aiming--;}
		if (self.triggerTapLimitTimer > 0){self.triggerTapLimitTimer--;}
		if (self.firing > 0){self.firing--;}
		


		//Processing all shots + Hit detection
		for (var s in self.shotList){
			/*{
				all:[]
				organic:[]
				block:[]
			}*/
			var targetsInRange = getTargetsInRangeOfShot(self, self.shotList[s]);

			if (self.weapon == 4){
				for (var t in targetsInRange.organic){
					if (targetsInRange.organic[t].target.health <= 0)
						continue;							
					var isBehindCover = false;
					for (var b in targetsInRange.block){ 
						if (checkIfBlocking(targetsInRange.block[b].target, self, targetsInRange.organic[t].target)){ //And see if it is blocking the shooter's path
							isBehindCover = true;
						}										
					}
					if (!isBehindCover){
						targetsInRange.organic[t].target.hit(self.shootingDir, targetsInRange.organic[t].dist, self, getDistance(self,targetsInRange.organic[t].target), self.shotList[s].x);
						//Calculate blood effect if target is organic
						var bloodX = targetsInRange.organic[t].target.x;
						var bloodY = targetsInRange.organic[t].target.y;
						entityHelpers.sprayBloodOntoTarget(self.shootingDir, bloodX, bloodY, targetsInRange.organic[t].target.id);
					}
				}
				var shotData = {};
				shotData.id = Math.random();
				shotData.playerId = self.id;
				shotData.weapon = self.weapon;
				shotData.x = self.shotList[s].x;
				shotData.spark = false;
				shotData.distance = 10000;
				shotData.shootingDir = self.shootingDir;
				for(var i in SOCKET_LIST){
					SOCKET_LIST[i].emit('shootUpdate',shotData);
				}	
			}
			else if (self.weapon == 5){
				//Out of all blocks in line of shot, which is closest?				
				var stoppingBlock = entityHelpers.getHitTarget(targetsInRange.block);
				var laserDistance = stoppingBlock ? stoppingBlock.dist : laserRange;		
				
				for (var t in targetsInRange.organic){
					if (targetsInRange.organic[t].target.health <= 0)
						continue;							
					var isBehindCover = false;
					for (var b in targetsInRange.block){ 
						if (checkIfBlocking(targetsInRange.block[b].target, self, targetsInRange.organic[t].target)){ //And see if it is blocking the shooter's path
							isBehindCover = true;
						}										
					}
					if (!isBehindCover){
						targetsInRange.organic[t].target.hit(self.shootingDir, targetsInRange.organic[t].dist, self, laserDistance, self.shotList[s].x);
						//Calculate blood effect if target is organic
						var bloodX = targetsInRange.organic[t].target.x;
						var bloodY = targetsInRange.organic[t].target.y;
						entityHelpers.sprayBloodOntoTarget(self.shootingDir, bloodX, bloodY, targetsInRange.organic[t].target.id);
					}
				}

				var shotData = {};
				shotData.id = Math.random();
				shotData.playerId = self.id;
				shotData.weapon = self.weapon;
				shotData.x = self.shotList[s].x;
				shotData.spark = true;				
				shotData.distance = laserDistance;
				shotData.shootingDir = self.shootingDir;
				if (!stoppingBlock){shotData.spark = false;}
				if (self.shootingDir % 2 == 0){
					shotData.distance = laserDistance * 1.42;
				}
				else {
					shotData.distance = laserDistance;
				}
				if (shotData.distance < 0){shotData.distance = 1;}
				for(var i in SOCKET_LIST){
					SOCKET_LIST[i].emit('shootUpdate',shotData);
				}	
			}
			else { //Weapons 1-3
				//Out of all targets in line of shot, which is closest?				
				var hitTarget = entityHelpers.getHitTarget(targetsInRange.all);	
				if (hitTarget != null){
					hitTarget.hit(self.shootingDir, hitTarget.dist, self, getDistance(self,hitTarget), self.shotList[s].x);				
						
					if (hitTarget.team && hitTarget.health){
						//Calculate blood effect if target is organic
						var bloodX = hitTarget.x;
						var bloodY = hitTarget.y;
						if (self.shootingDir == 1){bloodX = self.x;}
						if (self.shootingDir == 2){bloodX = hitTarget.x - hitTarget.distFromDiag/2; bloodY = hitTarget.y - hitTarget.distFromDiag/2;}
						if (self.shootingDir == 3){bloodY = self.y;}
						if (self.shootingDir == 4){bloodX = hitTarget.x - hitTarget.distFromDiag/2; bloodY = hitTarget.y + hitTarget.distFromDiag/2;}
						if (self.shootingDir == 5){bloodX = self.x;}
						if (self.shootingDir == 6){bloodX = hitTarget.x - hitTarget.distFromDiag/2; bloodY = hitTarget.y - hitTarget.distFromDiag/2;}
						if (self.shootingDir == 7){bloodY = self.y;}
						if (self.shootingDir == 8){bloodX = hitTarget.x - hitTarget.distFromDiag/2; bloodY = hitTarget.y + hitTarget.distFromDiag/2;}
						entityHelpers.sprayBloodOntoTarget(self.shootingDir, bloodX, bloodY, hitTarget.id);
					}
				}
				else {
					var shotData = {};
					shotData.id = Math.random();
					shotData.playerId = self.id;
					shotData.weapon = self.weapon;
					shotData.x = self.shotList[s].x;
					shotData.spark = false;
					shotData.distance = bulletRange;
					shotData.shootingDir = self.shootingDir;
					for(var i in SOCKET_LIST){
						SOCKET_LIST[i].emit('shootUpdate',shotData);
					}					
				}
			}	
		} //Shot loop

		self.shotList = [];

		
		/////////////////////// MULTIKILL ////////////////////
		if (self.multikillTimer > 0){
			self.multikillTimer--;
		}
		if (self.multikill > 0 && self.multikillTimer <= 0){
			self.multikill = 0;
		}

		/////////////////////// HEALING ////////////////////
		if (self.healDelay <= 0 && self.health < 100 && self.health > 0){
			self.health++;
			updatePlayerList.push({id:self.id,property:"health",value:self.health});
			self.healDelay += healRate;
		}
		if (self.health >= 100){
			self.lastEnemyToHit = 0;
			self.damageDealers = [];
		}
		if (self.healDelay > 0){self.healDelay--;}

		/////////////////////// ENERGY /////////////////////
		if (self.rechargeDelay <= 0 && self.energy < (100 * self.hasBattery)){
			self.energy++;
			if ((self.hasBattery > 1 && self.energy == 100) || (self.hasBattery > 2 && self.energy == 200) || (self.hasBattery > 3 && self.energy == 300) || (self.hasBattery > 4 && self.energy == 400))
				self.energy++; //Free extra energy at 100 if more than one battery to avoid stopping the charge sfx at 100 (normally 100 is "charge complete")
			if (self.hasBattery == 1 && self.energy > 100){
				self.energy = 100;
			}
			if (self.hasBattery == 2 && self.energy > 200){
				self.energy = 200;
			}
			if (self.energy >= 100){self.energyExhausted = false;}
			updatePlayerList.push({id:self.id,property:"energy",value:self.energy,single:true});
		}
		if (self.rechargeDelay > 0){self.rechargeDelay--;}
				
		///////////////////////CLOAKING/////////////////////
		if (self.cloakEngaged && !self.energyExhausted){
			self.expendEnergy(cloakDrainSpeed);
		}
		
		/////RETURN COOLDOWN//////////
		if (self.lastReturnCooldown > 0)
			self.lastReturnCooldown--;
		
		/////MOVEMENT movement//////////
		var posUpdated = false;
		self.move();


		//default to shootingdir = walkingdir unless otherwise specified!
		if (!self.pressingShift && self.throwingObject === 0 && self.walkingDir != 0 && self.aiming == 0 && !self.pressingUp && !self.pressingDown && !self.pressingLeft && !self.pressingRight && self.reloading <= 0){
			if (self.shootingDir != self.walkingDir){
				self.shootingDir = self.walkingDir;
				updatePlayerList.push({id:self.id,property:"shootingDir",value:self.shootingDir});
			}
		} 

		//Actually move player based on speed
		if (self.speedY != 0){
			posUpdated = true;
			self.y += self.speedY;
		}
		if (self.speedX != 0){
			posUpdated = true;
			self.x += self.speedX;
		}	
		
		if (self.stagger > 0){self.stagger--;}

		////////////////////// BEING PUSHED ///////////////////////////////////////////
		gameEngine.processEntityPush(self);

		///////////////////// COLLISION WITH OBSTACLES/PLAYERS /////////////////////////
		
		//Check collision with players
		entityHelpers.checkBodyCollisionWithGroupOfBodies(self, Player.list);

	
		//Check collision with thugs
		var thugList = thug.getThugList();
		for (var i in thugList){
			if (thugList[i].id != self.id && thugList[i].health > 0 && self.x + self.width > thugList[i].x && self.x < thugList[i].x + thugList[i].width && self.y + self.height > thugList[i].y && self.y < thugList[i].y + thugList[i].height){								
				if (self.x == thugList[i].x && self.y == thugList[i].y){self.x -= 5; updateThugList.push({id:self.id,property:"x",value:self.x});} //Added to avoid math issues when entities are directly on top of each other (distance = 0)
				var dx1 = self.x - thugList[i].x;
				var dy1 = self.y - thugList[i].y;
				var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
				var ax1 = dx1/dist1;
				var ay1 = dy1/dist1;
				if (dist1 < 40){		

					if (self.boosting > 0){
						self.pushSpeed = 20;
						self.boosting = 0;
						updatePlayerList.push({id:self.id,property:"boosting",value:self.boosting});
						updateEffectList.push({type:4,playerId:self.id});
						
						if (self.team != thugList[i].team){
							thugList[i].health -= boostDamage;
							updateThugList.push({id:thugList[i].id,property:"health",value:thugList[i].health})
							entityHelpers.sprayBloodOntoTarget(self.walkingDir, thugList[i].x, thugList[i].y, thugList[i].id);
							thugList[i].attacking = thugAttackDelay;
							if (thugList[i].health <= 0){
								thugList[i].kill(self);
							}
						}
					}
				
					self.x += ax1 / (dist1 / 70); //Higher number is greater push
					self.y += ay1 / (dist1 / 70);
				}				
			}
		}
		

				
		//Check Player collision with blocks
		if (block.checkCollision(self) && !posUpdated){posUpdated = true;}

		
		//Keep player from walls Edge detection. Walls.
		if (self.x > mapWidth - 5){self.x = mapWidth - 5; posUpdated = true;} //right
		if (self.y > mapHeight - 5){self.y = mapHeight - 5; posUpdated = true;} // bottom
		if (self.x < 5){self.x = 5; posUpdated = true;} //left
		if (self.y < 5){self.y = 5; posUpdated = true;} //top







		//log("self.x" + self.x + " self.y" + self.y + " speedX" + self.speedX + " speedY" + self.speedY);

		//and send to clients
		self.y = Math.round(self.y * 10)/10;
		self.x = Math.round(self.x * 10)/10;
		if (self.x != self.lastX){
			self.lastX = self.x;
			updatePlayerList.push({id:self.id,property:"x",value:self.x});	
		}
		if (self.y != self.lastY){
			self.lastY = self.y;
			updatePlayerList.push({id:self.id,property:"y",value:self.y});
		}




		//Pickup updates
		pickup.checkForPickup(self);
		
		//Check Player collision with bag - STEAL
		if (gametype == "ctf" && !(gametype == "horde" || (pregame && pregameIsHorde))){
			if (self.team == 1 && bagBlue.captured == false && self.health > 0 && !(bagBlue.playerThrowing == self.id && bagBlue.speed > 20)){
				if (self.x > bagBlue.x - 67 && self.x < bagBlue.x + 67 && self.y > bagBlue.y - 50 && self.y < bagBlue.y + 50){												
					bagBlue.captured = true;
					bagBlue.speed = 0;
					updateMisc.bagBlue = bagBlue;
					self.holdingBag = true;
					self.previousWeapon = self.weapon;
					updatePlayerList.push({id:self.id,property:"holdingBag",value:self.holdingBag});
					if (!allowBagWeapons){
						self.weapon = 1;
						updatePlayerList.push({id:self.id,property:"weapon",value:self.weapon});
						if (self.reloading > 0){
							self.reloading = 0;
							updatePlayerList.push({id:self.id,property:"reloading",value:self.reloading});				
						}					
					}
					if (bagBlue.x == bagBlue.homeX && bagBlue.y == bagBlue.homeY){
						playerEvent(self.id, "steal");
					}
				}
			}
			else if (self.team == 2 && bagRed.captured == false && self.health > 0 && !(bagRed.playerThrowing == self.id && bagRed.speed > 20)){
				if (self.x > bagRed.x - 67 && self.x < bagRed.x + 67 && self.y > bagRed.y - 50 && self.y < bagRed.y + 50){												
					bagRed.captured = true;
					bagRed.speed = 0;
					updateMisc.bagRed = bagRed;
					self.holdingBag = true;
					self.previousWeapon = self.weapon;
					updatePlayerList.push({id:self.id,property:"holdingBag",value:self.holdingBag});
					if (!allowBagWeapons){
						self.weapon = 1;
						updatePlayerList.push({id:self.id,property:"weapon",value:self.weapon});
						if (self.reloading > 0){
							self.reloading = 0;
							updatePlayerList.push({id:self.id,property:"reloading",value:self.reloading});				
						}					
					}
					if (bagRed.x == bagRed.homeX && bagRed.y == bagRed.homeY){
						playerEvent(self.id, "steal");					
					}
				}
			}

			//Check Player collision with bag - RETURN
			if (self.team == 1 && bagRed.captured == false && self.health > 0 && !gameEngine.isBagHome(bagRed)){
				if (self.x > bagRed.x - 67 && self.x < bagRed.x + 67 && self.y > bagRed.y - 50 && self.y < bagRed.y + 50){			
					if (bagRed.speed > 10){
						self.getSlammed(bagRed.playerThrowing, bagRed.direction, bagRed.speed*2, true); //bagHit bag hit bag slam
					}
					else {
						playerEvent(self.id, "return");
						bagRed.x = bagRed.homeX;
						bagRed.y = bagRed.homeY;
					}
					bagRed.speed = 0;
					updateMisc.bagRed = bagRed;		
				}
			}
			if (self.team == 2 && bagBlue.captured == false && self.health > 0 && !gameEngine.isBagHome(bagBlue)){
				if (self.x > bagBlue.x - 67 && self.x < bagBlue.x + 67 && self.y > bagBlue.y - 50 && self.y < bagBlue.y + 50){												
					if (bagBlue.speed > 10){
						self.getSlammed(bagBlue.playerThrowing, bagBlue.direction, bagBlue.speed*2, true);
					}
					else {
						playerEvent(self.id, "return");
						bagBlue.x = bagBlue.homeX;
						bagBlue.y = bagBlue.homeY;
					}
					bagBlue.speed = 0;
					updateMisc.bagBlue = bagBlue;
				}
			}

			//Check Player collision with bag - CAPTURE
			if (gameOver == false){
				if (self.team == 1 && self.holdingBag == true && bagRed.captured == false && self.health > 0 && (bagRed.x == bagRed.homeX && bagRed.y == bagRed.homeY)){
					if (self.x > bagRed.homeX - 67 && self.x < bagRed.homeX + 67 && self.y > bagRed.homeY - 50 && self.y < bagRed.homeY + 50){												
						//Bag Score
						playerEvent(self.id, "capture");
						gameEngine.capture(1);
					}
				}
				if (self.team == 2 && self.holdingBag == true && bagBlue.captured == false && self.health > 0 && (bagBlue.x == bagBlue.homeX && bagBlue.y == bagBlue.homeY)){
					if (self.x > bagBlue.homeX - 67 && self.x < bagBlue.homeX + 67 && self.y > bagBlue.homeY - 50 && self.y < bagBlue.homeY + 50){												
						//Bag Score
						playerEvent(self.id, "capture");
						gameEngine.capture(2);
					}
				}
			}
			
			//Move bag with player
			if (self.holdingBag == true && self.health > 0){
				if (self.team == 1){
					bagBlue.x = self.x;
					bagBlue.y = self.y;				
					updateMisc.bagBlue = bagBlue;
				}
				else if (self.team == 2){
					bagRed.x = self.x;
					bagRed.y = self.y;				
					updateMisc.bagRed = bagRed;
				}
			}
		}//End check if gametype is ctf
		
		////// RELOADING ///////////////////////////////////////////////////////////////////////////
		if (self.reloading > 0){
			self.reloading--;
			if (self.reloading <= 0) {
				if (self.weapon == 1){
					self.PClip = self.PClip <= 0 ? PClipSize : PClipSize + 1; //chamber bonus
					updatePlayerList.push({id:self.id,property:"PClip",value:self.PClip});
				}
				else if (self.weapon == 2){
					var clipNeeds = DPClipSize - self.DPClip;
					if (clipNeeds < DPClipSize){clipNeeds++;} //chamber bonus
					if (self.DPAmmo >= clipNeeds){
						self.DPClip += clipNeeds;
						self.DPAmmo -= clipNeeds;
					}
					else {
						self.DPClip += self.DPAmmo;
						self.DPAmmo = 0;
					}
					updatePlayerList.push({id:self.id,property:"DPClip",value:self.DPClip});
					updatePlayerList.push({id:self.id,property:"DPAmmo",value:self.DPAmmo});
				}
				else if (self.weapon == 3){
					var clipNeeds = MGClipSize - self.MGClip;
					if (clipNeeds < MGClipSize){clipNeeds++;} //chamber bonus
					if (self.MGAmmo >= clipNeeds){
						self.MGClip += clipNeeds;
						self.MGAmmo -= clipNeeds;
					}
					else {
						self.MGClip += self.MGAmmo;
						self.MGAmmo = 0;
					}
					updatePlayerList.push({id:self.id,property:"MGClip",value:self.MGClip});
					updatePlayerList.push({id:self.id,property:"MGAmmo",value:self.MGAmmo});
				}
				else if (self.weapon == 4){
					var clipNeeds = SGClipSize - self.SGClip;
					if (self.SGAmmo >= 1 && clipNeeds >= 1){
						self.SGClip++;
						self.SGAmmo--;						
					}
					if (clipNeeds >= 2 && self.SGAmmo > 0){
						self.reloading = 30;
						updatePlayerList.push({id:self.id,property:"reloading",value:self.reloading});
					}
					updatePlayerList.push({id:self.id,property:"SGClip",value:self.SGClip});
					updatePlayerList.push({id:self.id,property:"SGAmmo",value:self.SGAmmo});
				}
			}
		}		
		////////////AFK/MISC///////////////////
		if (typeof self.afk === 'undefined'){
		 self.afk = AfkFramesAllowed;
		}
		else if (self.afk >= 0 && self.team != 0 && !pregame && !gameOver){
			self.afk--;
		}
		else if (self.afk <= 0 && bootOnAfk && !isLocal) { //Boot em
			log("Booting on afk: " + self.name);
			if (SOCKET_LIST[self.id]){
				SOCKET_LIST[self.id].emit('bootAfk');
				SOCKET_LIST[self.id].disconnect();
			}
		}
		
	}//End engine()

	self.pullGrenade = function(){
		if (self.throwingObject == 0){
			self.updatePropAndSend("throwingObject", -1);
			self.updatePropAndSend("reloading", 0);
	
			var floorGrenadeId = entityHelpers.checkPointCollisionWithGroup(self, grenade.getList(), 130);
			if (floorGrenadeId && grenade.getById(floorGrenadeId) && !grenade.getById(floorGrenadeId).holdingPlayerId){
				grenade.getById(floorGrenadeId).updatePropAndSend("holdingPlayerId", self.id);
				grenade.getById(floorGrenadeId).updatePropAndSend("throwingPlayerId", self.id);
			}
			else if (!self.energyExhausted){ //bagGrenades bag grenade  && !self.holdingBag
				self.expendEnergy(grenadeEnergyCost);
				grenade.create(self.id, self.id, self.x, self.y);
			}		
		}
	}

	self.throwGrenade = function(){
		if (self.throwingObject === -1){
			self.updatePropAndSend("throwingObject", 30);
			var myNade = grenade.getPlayerNade(self.id);
			if (myNade){
				myNade.updatePropAndSend("holdingPlayerId", false);
				switch (self.shootingDir){
					case 1:
						myNade.updatePropAndSend("speedX", self.speedX);
						myNade.updatePropAndSend("speedY", self.speedY - grenadeThrowSpeed);
						break;
					case 2:
						myNade.updatePropAndSend("speedX", self.speedX + grenadeThrowSpeed*(2/3));
						myNade.updatePropAndSend("speedY", self.speedY - grenadeThrowSpeed*(2/3));
						break;
					case 3:
						myNade.updatePropAndSend("speedX", self.speedX + grenadeThrowSpeed);
						myNade.updatePropAndSend("speedY", self.speedY);
						break;
					case 4:
						myNade.updatePropAndSend("speedX", self.speedX + grenadeThrowSpeed*(2/3));
						myNade.updatePropAndSend("speedY", self.speedY + grenadeThrowSpeed*(2/3));
						break;
					case 5:
						myNade.updatePropAndSend("speedX", self.speedX);
						myNade.updatePropAndSend("speedY", self.speedY + grenadeThrowSpeed);
						break;
					case 6:
						myNade.updatePropAndSend("speedX", self.speedX - grenadeThrowSpeed*(2/3));
						myNade.updatePropAndSend("speedY", self.speedY + grenadeThrowSpeed*(2/3));
						break;
					case 7:
						myNade.updatePropAndSend("speedX", self.speedX - grenadeThrowSpeed);
						myNade.updatePropAndSend("speedY", self.speedY);
						break;
					case 8:
						myNade.updatePropAndSend("speedX", self.speedX - grenadeThrowSpeed*(2/3));
						myNade.updatePropAndSend("speedY", self.speedY - grenadeThrowSpeed*(2/3));
						break;
					default:
						myNade.updatePropAndSend("speedY", self.speedY - grenadeThrowSpeed);
						break;						
				}



			}
		}
	}

	self.shootGrapple = function(){
		console.log("SHOT");
		self.updatePropAndSend("grapple", {
			firing:true,
			dir:self.walkingDir,
			x:self.x,
			y:self.y
		});
	}

	self.releaseGrapple = function(){
		self.updatePropAndSend("grapple", {});
		var releaseSpeed = grappleStrength * 2;
		if (self.walkingDir == 1){self.speedY -= releaseSpeed;}
		if (self.walkingDir == 2){self.speedY -= releaseSpeed * (2/3); self.speedX += releaseSpeed * (2/3);}
		if (self.walkingDir == 3){self.speedX += releaseSpeed;}
		if (self.walkingDir == 4){self.speedY += releaseSpeed * (2/3); self.speedX += releaseSpeed * (2/3);}
		if (self.walkingDir == 5){self.speedY += releaseSpeed;}
		if (self.walkingDir == 6){self.speedY += releaseSpeed * (2/3); self.speedX -= releaseSpeed * (2/3);}
		if (self.walkingDir == 7){self.speedX -= releaseSpeed;}
		if (self.walkingDir== 8){self.speedY -= releaseSpeed * (2/3); self.speedX -= releaseSpeed * (2/3);}

	}

	self.processGrapple = function(){
		if (!self.grapple || typeof self.grapple.x === 'undefined'){return;}
		//console.log("x:" + self.x + " y:" + self.y + " Gx:" + self.grapple.x + " Gy:" + self.grapple.y);
		if (getDistance(self, self.grapple) > grappleLength){self.grapple = {}; console.log("HALT");}
		if (self.grapple.firing){
			if (self.grapple.dir == 1){self.grapple.y -= grappleSpeed;}
			if (self.grapple.dir == 2){self.grapple.y -= grappleSpeed * (2/3); self.grapple.x += grappleSpeed * (2/3);}
			if (self.grapple.dir == 3){self.grapple.x += grappleSpeed;}
			if (self.grapple.dir == 4){self.grapple.y += grappleSpeed * (2/3); self.grapple.x += grappleSpeed * (2/3);}
			if (self.grapple.dir == 5){self.grapple.y += grappleSpeed;}
			if (self.grapple.dir == 6){self.grapple.y += grappleSpeed * (2/3); self.grapple.x -= grappleSpeed * (2/3);}
			if (self.grapple.dir == 7){self.grapple.x -= grappleSpeed;}
			if (self.grapple.dir == 8){self.grapple.y -= grappleSpeed * (2/3); self.grapple.x -= grappleSpeed * (2/3);}
			if (block.checkCollision(self.grapple)){
				self.grapple.firing = false;
			}	
			// if (checkEntityCollision(self.grapple)){
			// 	self.grapple.firing = false;		
			// }	
		}
		if (!self.grapple.firing){
			let dx = self.x - self.grapple.x;  // Compute distance between centers of objects
			let dy = self.y - self.grapple.y;
			let r = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

			if (Math.abs(self.grapple.x - self.x) + Math.abs(self.grapple.y - self.y) > 30){
				self.speedX -= grappleStrength * dx / r;
				self.speedY -= grappleStrength * dy / r;
			}
			else if (self.grapple.x != self.x || self.grapple.y != self.y){
				self.updatePropAndSend("grapple", {});
			}
		}
	}

	self.pressingArrowKey = function(){
		if (self.pressingDown || self.pressingLeft || self.pressingUp || self.pressingRight){
			return true;
		}
		return false;
	}
	self.pressingMovementKey = function(){
		if (self.pressingW || self.pressingA || self.pressingS || self.pressingD){
			return true;
		}
		return false;
	}

	//getSmashed
	self.getSlammed = function(playerId, direction = player.walkingDir, pushSpeed = 20, bagSlam = false){
		//self.getSmashed(player);
		var player = getPlayerById(playerId);
		if (!player){
			return; 
		}

		self.pushSpeed = pushSpeed;
		self.pushDir = direction;
		var sameTeam = player.team == self.team ? true : false;
		if (gametype == "ffa"){sameTeam = false;}
		if (!sameTeam && !bagSlam){
			self.health -= boostDamage;
		}
		//player.pushSpeed = pushSpeed;
		player.boosting = 0;
		updatePlayerList.push({id:player.id,property:"boosting",value:player.boosting});
		updateEffectList.push({type:4,playerId:player.id});
		
	
		//Assassinations
		if (!sameTeam && bagSlam == false && entityHelpers.getDirDif(player.walkingDir, self.shootingDir) <= 1){
			self.health = 0;			
		}

		updatePlayerList.push({id:self.id,property:"health",value:self.health})
		self.healDelay = healDelayTime;
		entityHelpers.sprayBloodOntoTarget(direction, self.x, self.y, self.id);
		if (self.health <= 0){
			self.kill(player);
		}		
	}

	self.processChargingLaser = function(){	//processLaser
		if (self.weapon == 5 && self.laserClip > 0 && self.pressingArrowKey() && self.throwingObject === 0){ // || self.pressingDown || self.pressingUp || self.pressingRight || self.pressingLeft
			if (self.chargingLaser < laserMaxCharge && self.fireRate <= 0){
				self.chargingLaser++;
				if (self.chargingLaser == 1){ //Only send laser to client when first charing up to initiate sfx
					updatePlayerList.push({id:self.id,property:"chargingLaser",value:self.chargingLaser});
				}				
				else if (self.chargingLaser == laserMaxCharge - 40){ //Final client warning
					updatePlayerList.push({id:self.id,property:"chargingLaser",value:self.chargingLaser});
				}				
			}
			else if (self.chargingLaser >= laserMaxCharge){
				//DISCHARGE!!!!
				Discharge(self);
				updatePlayerList.push({id:self.id,property:"laserClip",value:self.laserClip});
				self.chargingLaser = 0;
				updatePlayerList.push({id:self.id,property:"chargingLaser",value:self.chargingLaser});
			}
		}
		//CANCEL CHARGE
		else if (self.chargingLaser > 0){ 
			self.chargingLaser = 0;
			updatePlayerList.push({id:self.id,property:"chargingLaser",value:self.chargingLaser});
		}
		else if (self.weapon == 5 && self.laserClip <= 0 && self.pressingArrowKey() && self.fireRate <= 0){ // || self.pressingDown || self.pressingUp || self.pressingRight || self.pressingLeft
			gunCycle(self, false);
		}

	}

	self.move = function(){
		var selfMaxSpeed = playerMaxSpeed;
		if (self.stagger > 0){
			selfMaxSpeed = selfMaxSpeed * staggerScale;
		}
		if (self.cloakEngaged){
			selfMaxSpeed = selfMaxSpeed * cloakDrag;
		}
		if (self.holdingBag){
			selfMaxSpeed = selfMaxSpeed * bagDrag;
		}


		if(self.pressingW && !self.pressingS && !self.pressingD && !self.pressingA){
			const targetSpeedX = 0;
			const targetSpeedY = -selfMaxSpeed;
			var incrementX = playerAcceleration * diagMovementScale;
			var incrementY = playerAcceleration;

			self.speedX = getSpeedAdjust(self.speedX, targetSpeedX, incrementX);
			if (Math.abs(self.speedX) != 0){
				incrementY = playerAcceleration * diagMovementScale;
			}
			self.speedY = getSpeedAdjust(self.speedY, targetSpeedY, incrementY);

			if (self.walkingDir != 1){
				self.walkingDir = 1;
				updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
			}
		}
		else if(self.pressingD && !self.pressingS && !self.pressingW && !self.pressingA){
			const targetSpeedX = selfMaxSpeed;
			const targetSpeedY = 0;
			var incrementX = playerAcceleration;
			var incrementY = playerAcceleration * diagMovementScale;

			self.speedY = getSpeedAdjust(self.speedY, targetSpeedY, incrementY);
			if (Math.abs(self.speedY) != 0){
				incrementX = playerAcceleration * diagMovementScale;
			}
			self.speedX = getSpeedAdjust(self.speedX, targetSpeedX, incrementX);

			if (self.walkingDir != 3){
				self.walkingDir = 3;
				updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
			}
		}
		else if(self.pressingS && !self.pressingA && !self.pressingW && !self.pressingD){
			const targetSpeedX = 0;
			const targetSpeedY = selfMaxSpeed;
			var incrementX = playerAcceleration * diagMovementScale;
			var incrementY = playerAcceleration;

			self.speedX = getSpeedAdjust(self.speedX, targetSpeedX, incrementX);
			if (Math.abs(self.speedX) != 0){
				incrementY = playerAcceleration * diagMovementScale;
			}
			self.speedY = getSpeedAdjust(self.speedY, targetSpeedY, incrementY);

			if (self.walkingDir != 5){
				self.walkingDir = 5;
				updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
			}
		}
		else if(self.pressingA && !self.pressingS && !self.pressingW && !self.pressingD){
			const targetSpeedX = -selfMaxSpeed;
			const targetSpeedY = 0;
			var incrementX = playerAcceleration;
			var incrementY = playerAcceleration * diagMovementScale;

			self.speedY = getSpeedAdjust(self.speedY, targetSpeedY, incrementY);
			if (Math.abs(self.speedY) != 0){
				incrementX = playerAcceleration * diagMovementScale;
			}
			self.speedX = getSpeedAdjust(self.speedX, targetSpeedX, incrementX);

			if (self.walkingDir != 7){
				self.walkingDir = 7;
				updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
			}
		} //Diags
		else if(self.pressingW && self.pressingD){
			const targetSpeedX = selfMaxSpeed * diagMovementScale;
			const targetSpeedY = -selfMaxSpeed * diagMovementScale;
			var incrementX = playerAcceleration * diagMovementScale;
			var incrementY = playerAcceleration * diagMovementScale;
			
			self.speedY = getSpeedAdjust(self.speedY, targetSpeedY, incrementY);
			self.speedX = getSpeedAdjust(self.speedX, targetSpeedX, incrementX);	

			if (self.walkingDir != 2){
				self.walkingDir = 2;
				updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
			}
		}
		else if(self.pressingD && self.pressingS){
			const targetSpeedX = selfMaxSpeed * diagMovementScale;
			const targetSpeedY = selfMaxSpeed * diagMovementScale;
			var incrementX = playerAcceleration * diagMovementScale;
			var incrementY = playerAcceleration * diagMovementScale;
			
			self.speedY = getSpeedAdjust(self.speedY, targetSpeedY, incrementY);
			self.speedX = getSpeedAdjust(self.speedX, targetSpeedX, incrementX);	

			if (self.walkingDir != 4){
				self.walkingDir = 4;
				updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
			}
		}
		else if(self.pressingA && self.pressingS){
			const targetSpeedX = -selfMaxSpeed * diagMovementScale;
			const targetSpeedY = selfMaxSpeed * diagMovementScale;
			var incrementX = playerAcceleration * diagMovementScale;
			var incrementY = playerAcceleration * diagMovementScale;
			
			self.speedY = getSpeedAdjust(self.speedY, targetSpeedY, incrementY);
			self.speedX = getSpeedAdjust(self.speedX, targetSpeedX, incrementX);	

			if (self.walkingDir != 6){
				self.walkingDir = 6;
				updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
			}
		}
		else if(self.pressingW && self.pressingA){
			const targetSpeedX = -selfMaxSpeed * diagMovementScale;
			const targetSpeedY = -selfMaxSpeed * diagMovementScale;
			var incrementX = playerAcceleration * diagMovementScale;
			var incrementY = playerAcceleration * diagMovementScale;
			
			self.speedY = getSpeedAdjust(self.speedY, targetSpeedY, incrementY);
			self.speedX = getSpeedAdjust(self.speedX, targetSpeedX, incrementX);	

			if (self.walkingDir != 8){
				self.walkingDir = 8;
				updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
			}
		}
		else if ((!self.pressingW && !self.pressingA && !self.pressingS && !self.pressingD) || (self.pressingD && self.pressingA) || (self.pressingS && self.pressingW)){
			const targetSpeedX = 0;
			const targetSpeedY = 0;
			var incrementX = playerAcceleration * diagMovementScale;
			var incrementY = playerAcceleration * diagMovementScale;
			
			self.speedY = getSpeedAdjust(self.speedY, targetSpeedY, incrementY);
			self.speedX = getSpeedAdjust(self.speedX, targetSpeedX, incrementX);	

			if (self.walkingDir != 0){
				self.walkingDir = 0;
				updatePlayerList.push({id:self.id,property:"walkingDir",value:self.walkingDir});
			}
		}



		if (Math.sqrt(self.speedX*self.speedX + self.speedY*self.speedY) <= playerMaxSpeed){
			if (self.boosting != 0){
				self.boosting = 0;
				updatePlayerList.push({id:self.id,property:"boosting",value:self.boosting});
			}
		}


	}

	self.boost = function(){
		self.expendEnergy(boostEnergyCost);
		self.boosting = 1;
		if(self.walkingDir == 1){
			self.speedY -= boostAmount;
		}
		else if(self.walkingDir == 3){
			self.speedX += boostAmount;
		}
		else if(self.walkingDir == 5){
			self.speedY += boostAmount;
		}
		else if(self.walkingDir == 7){
			self.speedX -= boostAmount;
		}
		else if(self.walkingDir == 2){
			self.speedX += boostAmount * diagMovementScale;
			self.speedY -= boostAmount * diagMovementScale;
		}
		else if(self.walkingDir == 4){
			self.speedX += boostAmount * diagMovementScale;
			self.speedY += boostAmount * diagMovementScale;
		}
		else if(self.walkingDir == 6){
			self.speedX -= boostAmount * diagMovementScale;
			self.speedY += boostAmount * diagMovementScale;
		}
		else if(self.walkingDir == 8){
			self.speedX -= boostAmount * diagMovementScale;
			self.speedY -= boostAmount * diagMovementScale;
		}	
		if (self.speedX > speedCap)
			self.speedX = speedCap;
		else if (self.speedX < -speedCap)
			self.speedX = -speedCap;
		if (self.speedY > speedCap)
			self.speedY = speedCap;
		else if (self.speedY < -speedCap)
			self.speedY = -speedCap;		
	}


	self.hit = function(shootingDir, distance, shooter, targetDistance, shotX, weapon = false){
		if (self.health <= 0){return;}
		if (!weapon){weapon = shooter.weapon;}
		if (weapon == 6){
			// if (targetDistance < 10){
			// 	targetDistance = 50;
			// }
			if (targetDistance < 120){
				targetDistance = 120;
			}
		}

		if (weapon != 4 && weapon != 5 && weapon != 6){
			var shotData = {};
			shotData.id = Math.random();
			shotData.playerId = shooter.id;
			shotData.weapon = weapon;
			shotData.x = shotX;
			shotData.spark = false;
			shotData.shootingDir = shootingDir;
			if (!self.team){shotData.spark = true;}
			if (shootingDir % 2 == 0){
				shotData.distance = distance * 1.42 - 20;
			}
			else {
				shotData.distance = distance - 42;
			}
			if (shotData.distance < 0){shotData.distance = 1;}	
			for(var i in SOCKET_LIST){
				SOCKET_LIST[i].emit('shootUpdate',shotData);
			}
		}
		
		if (self.team != shooter.team || (gametype == "ffa" && self.id != shooter.id)){
			self.lastEnemyToHit = shooter.id; //For betrayal/Suicide detection
		}
		
		var damageInflicted = 0;
		
		//Player stagger and cloak interruption stuff
		if (weapon != 6)
			self.stagger = staggerTime;		
		self.healDelay += healDelayTime;
		if (self.healDelay > healDelayTime){self.healDelay = healDelayTime;} //Ceiling on healDelay
		if (self.team != shooter.team || gametype == "ffa"){
			playerEvent(shooter.id, "hit");
		}
		if (self.cloakEngaged){
			self.updatePropAndSend("cloakEngaged", false);
			damageInflicted += cloakBonusDamage;
		}
		

		//Initial damage (all angles)
		if (weapon == 1){ damageInflicted += pistolDamage; } //Single Pistol
		else if (weapon == 2){ damageInflicted += DPDamage; } //Double damage for double pistols
		else if (weapon == 3){ damageInflicted += mgDamage; } //Damage for MG
		else if (weapon == 4){ damageInflicted += -(targetDistance - SGRange)/(SGRange/SGCloseRangeDamageScale) * SGDamage; } //Damage for SG
		else if (weapon == 5){ damageInflicted = LaserDamage;} //Damage for Laser
		else if (weapon == 6){
			//console.log("-(" + targetDistance + " - " + grenadeExplosionSize + ")/(" + grenadeExplosionSize + "/3) * " + grenadeDamage +")");
			damageInflicted += -(targetDistance - grenadeExplosionSize)/(grenadeExplosionSize/3) * grenadeDamage;
			//console.log("result:" + damageInflicted);
		} //Damage for Grenade
		if (weapon != 6){
			if (self.team != shooter.team || gametype == "ffa"){
				shooter.cumulativeAllyDamage = 0;
				var shooterDirDif = entityHelpers.getDirDif(self.shootingDir, shootingDir);
				if (shooterDirDif <= 2){
					//self is NOT facing shooter (within 3 angles)
					if (weapon == 1){ damageInflicted += pistolSideDamage; } //Single Pistol
					else if (weapon == 2){ damageInflicted += DPSideDamage; } //Double damage for double pistols
					else if (weapon == 3){ damageInflicted += mgSideDamage; } //Damage for MG
					else if (weapon == 4){ damageInflicted += -(targetDistance - SGRange)/(SGRange/SGCloseRangeDamageScale) * SGSideDamage; } //Damage for SG
				}
				if (shooterDirDif <= 1){
					//Back Damage
					if (weapon == 1){ damageInflicted += pistolBackDamage; } //Single Pistol
					else if (weapon == 2){ damageInflicted += DPBackDamage; } //Double damage for double pistols
					else if (weapon == 3){ damageInflicted += mgBackDamage; } //Damage for MG
					else if (weapon == 4){ damageInflicted += -(targetDistance - SGRange)/(SGRange/SGCloseRangeDamageScale) * SGBackDamage; } //Damage for SG
				}
			}			
		}
		if ((self.team == shooter.team && self.id != shooter.id) && gametype != "ffa"){ //teamDamage
			damageInflicted *= friendlyFireDamageScale;
			if (weapon == 5){damageInflicted = 15;}			
			if (weapon != 6){shooter.processAllyDamage(damageInflicted, self.id);}			
		}
	
		damageInflicted = damageInflicted * damageScale; //Scale damage
		if (weapon != 6 && (gametype == "horde" || (pregame && pregameIsHorde))){damageInflicted = 0;}

		//Calculate Assists
		if (self.team != shooter.team && gametype != "ffa"){
			if (!self.damageDealers){
				self.damageDealers = [];
			}
			if (self.damageDealers.find(dealer => dealer.id == shooter.id)){
				self.damageDealers.find(dealer => dealer.id == shooter.id).damage += damageInflicted;
			}
			else {
				self.damageDealers.push({id:shooter.id, damage:damageInflicted});
			}
		}

		self.health -= Math.floor(damageInflicted); //damageValue

		updatePlayerList.push({id:self.id,property:"health",value:self.health});
					
		//Damage push
		if (weapon != 6){
			self.pushSpeed += damageInflicted/8 * damagePushScale;
			self.pushDir = Player.list[shooter.id].shootingDir;			
		}
		else if (weapon == 6){
			var pushX = (shootingDir.xMovRatio * grenadePower) * damageInflicted;
			// console.log("(" + shootingDir.xMovRatio + " * " + grenadePower + ") * " + damageInflicted);
			// console.log("PUSH X: " + pushX);
			if (!isNaN(shootingDir.xMovRatio)){
				self.speedX += (shootingDir.xMovRatio * grenadePower) * damageInflicted;
				self.speedY += (shootingDir.yMovRatio * grenadePower) * damageInflicted;
			}
		}

		if (self.health <= 0){
			self.kill(shooter);
		}			
	}

	self.processAllyDamage = function(damageInflicted, victimId){
		if (self.cumulativeAllyDamage >= allyDamageWarningThreshold){
			socket.emit('allyDamageWarning', {playerId:victimId});
			self.cumulativeAllyDamage = 0;
		}
	}

	self.kill = function(shooter){
		if (gametype == "horde" || (pregame && pregameIsHorde)){
			gameEngine.upsertHordeRecords(false);
		}

		if (shooter.id != 0){
			if (self.team != shooter.team || self.lastEnemyToHit || gametype == "ffa"){ //Someone gets credit for the kill
				if ((self.lastEnemyToHit && self.lastEnemyToHit != 0) && (self.team == shooter.team || (gametype != "ffa" && self.id != shooter.id))){ //Killed by teammate, but kill goes to last enemy to hit
					if (getPlayerById(self.lastEnemyToHit))
						shooter = getPlayerById(self.lastEnemyToHit); //Give kill credit to last enemy that hit the player (if killed by own team or self)
				}
				if (gametype == "slayer" && gameOver == false){
					gameEngine.killScore(shooter.team);
				}
				
				if (shooter.id != self.id){
					playerEvent(shooter.id, "kill");				
					shooter.spree++;
					shooter.multikill++;
					shooter.multikillTimer = multikillTimer;
					if (shooter.multikill >= 2){
						playerEvent(shooter.id, "multikill");
					}
					if (shooter.spree == 5 || shooter.spree == 10 || shooter.spree == 15 || shooter.spree == 20){
						playerEvent(shooter.id, "spree");
					}
				}

				//Assists
				if (!self.damageDealers){self.damageDealers = [];}
				var highestNonKillerDamageDealer = {id:"", damage:0};
				for (var d in self.damageDealers){
					if (self.damageDealers[d].damage > highestNonKillerDamageDealer.damage && self.damageDealers[d].id != shooter.id)
						highestNonKillerDamageDealer = self.damageDealers[d];
				}
				if (highestNonKillerDamageDealer.damage >= assistDamageThreshold){
					playerEvent(highestNonKillerDamageDealer.id, "assist");
				}

			}
			else { //Killed by own team or self AND no last enemy to hit
				if (shooter.id == self.id){
					playerEvent(shooter.id, "suicide");
				}
				else {
					playerEvent(shooter.id, "benedict");
				}
			}
		}
		if (self.chargingLaser > 0){
			self.chargingLaser = 0;
			updatePlayerList.push({id:self.id,property:"chargingLaser",value:self.chargingLaser});
		}
		
		if (gametype == "elim" && gameOver == false){				
			var cashToAdd = elimDeathCash;
			var scoreDif = whiteScore - blackScore;

			if ((self.team == 1 && scoreDif < 0) || (self.team == 2 && scoreDif > 0)){ //Comeback mechanics
				cashToAdd += Math.abs(scoreDif * elimDeathCash);
			}
			self.updatePropAndSend("cash", self.cash + cashToAdd);			
			gameEngine.checkIfRoundOver();
		}

		playerEvent(self.id, "death");
		
		
		//Create Body createBody
		if (self.pushSpeed > pushMaxSpeed){ self.pushSpeed = pushMaxSpeed; }
		
		updateEffectList.push({type:5, killerPlayerId:shooter.id, pushSpeed:self.pushSpeed, shootingDir:shooter.shootingDir, playerId:self.id});
		self.hasBattery = 1;
		//Drop Ammo/Pickups drop pickups
		var drops = 0;
		if (self.DPAmmo > 0 || self.DPClip > 0){
			drops++;
			var ammoAmount = self.DPClip + self.DPAmmo;
			var dpId = Math.random();
			pickup.createPickup(dpId, self.x - 40, self.y - 35, 2, ammoAmount, -1);
			self.DPAmmo = 0;
			self.DPClip = 0;
			updatePlayerList.push({id:self.id,property:"DPAmmo",value:self.DPAmmo});		
			updatePlayerList.push({id:self.id,property:"DPClip",value:self.DPClip});		
		}
		if (self.MGAmmo > 0 || self.MGClip > 0){
			drops++;
			var ammoAmount = self.MGClip + self.MGAmmo;
			var mgId = Math.random();
			pickup.createPickup(mgId, self.x - 25 + (drops * 8), self.y - 10, 3, ammoAmount, -1);
			self.MGAmmo = 0;
			self.MGClip = 0;
			updatePlayerList.push({id:self.id,property:"MGAmmo",value:self.MGAmmo});		
			updatePlayerList.push({id:self.id,property:"MGClip",value:self.MGClip});		
		}
		if (self.SGAmmo > 0 || self.SGClip > 0){
			drops++;
			var ammoAmount = self.SGClip + self.SGAmmo;
			var sgId = Math.random();
			pickup.createPickup(sgId, self.x - 30, self.y - 20 + (drops * 10), 4, ammoAmount, -1);
			self.SGAmmo = 0;
			self.SGClip = 0;
			updatePlayerList.push({id:self.id,property:"SGAmmo",value:self.SGAmmo});		
			updatePlayerList.push({id:self.id,property:"SGClip",value:self.SGClip});		
		}
		if (self.laserClip > 0){
			drops++;
			var ammoAmount = self.laserClip;
			var lsId = Math.random();
			pickup.createPickup(lsId, self.x - 30, self.y - 20 + (drops * 10), 6, ammoAmount, -1);
			self.laserClip = 0;
			self.laserClip = 0;
			updatePlayerList.push({id:self.id,property:"laserClip",value:self.laserClip});		
		}
	}

	self.expendEnergy = function(amount){ //loseEnergy spendEnergy useEnergy
		self.rechargeDelay = rechargeDelayTime;
		self.energy -= amount;
		if (self.energy <= 0){
			self.rechargeDelay = rechargeDelayTime * 2;
			self.energy = 0;
			self.energyExhausted = true;
			self.updatePropAndSend("cloakEngaged", false);
		}
		updatePlayerList.push({id:self.id,property:"energy",value:self.energy,single:true});
	}

	self.triggerPlayerEvent = function(event){
		playerEvent(self.id, event);
	}

	self.updatePropAndSend = function(propName, value, singlePlayer = false, coords = false, ){
		if (self[propName] != value){
			self[propName] = value;
			if (!singlePlayer)
				updatePlayerList.push({id:self.id,property:propName,value:value});	
			else {
				updatePlayerList.push({id:self.id,property:propName,value:value, single:true});	
			}
		}
	}


	self.respawn = function(newPlayer = false){
		updatePlayerList.push({id:self.id,property:"name",value:self.name});

		self.rechargeDelay = 0;
		self.healDelay = 0;


		
		self.speed = 0;
		self.speedY = 0;
		self.speedX = 0;
		self.stagger = 0;
		self.respawnTimer = 0;
		self.pushSpeed = 0;		
		self.spree = 0;
		self.multikill = 0;
		self.multikillTimer = 0;
		self.lastEnemyToHit = 0;
		self.energyExhausted = false;		
		
		self.firing = 0; //0-3; 0 = not firing
		self.aiming = 0;
		self.holdingBag = false;
		updatePlayerList.push({id:self.id,property:"holdingBag",value:self.holdingBag});
		self.updatePropAndSend("energy", 100);
		self.updatePropAndSend("cloak", 0);
		self.updatePropAndSend("cloakEngaged", false);
		self.updatePropAndSend("boosting", 0);
		self.updatePropAndSend("throwingObject", 0);
		self.PClip = 15;
		updatePlayerList.push({id:self.id,property:"PClip",value:self.PClip});

		if (gametype != "elim" || (pregameIsHorde && pregame) || newPlayer){	

			self.updatePropAndSend("health", 100);
			self.weapon = startingWeapon;
			updatePlayerList.push({id:self.id,property:"weapon",value:self.weapon});
			self.hasBattery = maxEnergyMultiplier;
			self.DPClip = 0;
			if (startingWeapon == 2){self.DPClip = DPClipSize;}
			updatePlayerList.push({id:self.id,property:"DPClip",value:self.DPClip});
			self.MGClip = 0;
			if (startingWeapon == 3){self.MGClip = MGClipSize;}
			updatePlayerList.push({id:self.id,property:"MGClip",value:self.MGClip});
			self.SGClip = 0;
			if (startingWeapon == 4){self.SGClip = SGClipSize;}
			updatePlayerList.push({id:self.id,property:"SGClip",value:self.SGClip});
			self.laserClip = 0;
			if (startingWeapon == 5){self.laserClip = maxLaserAmmo;}
			updatePlayerList.push({id:self.id,property:"laserClip",value:self.laserClip});
			self.DPAmmo = 0;
			if (startingWeapon == 2){self.DPAmmo = DPClipSize;}
			updatePlayerList.push({id:self.id,property:"DPAmmo",value:self.DPAmmo});
			self.MGAmmo = 0;
			if (startingWeapon == 3){self.MGAmmo = MGClipSize;}
			updatePlayerList.push({id:self.id,property:"MGAmmo",value:self.MGAmmo});
			self.SGAmmo = 0;		
			if (startingWeapon == 4){self.SGAmmo = SGClipSize;}
			updatePlayerList.push({id:self.id,property:"SGAmmo",value:self.SGAmmo});
		}
		else {
			var healthAmount = self.health;
			if (self.health < 100){healthAmount = 100;}
			if (self.willHaveBA){
				self.willHaveBA = false;
				healthAmount = 175;
			}
			self.updatePropAndSend("health", healthAmount);
		}

		self.fireRate = 0;
		self.triggerTapLimitTimer = 0;
		self.reloading = 0;
		
		
		self.pressingUp = false;
		self.pressingRight = false;
		self.pressingDown = false;
		self.pressingLeft = false;
		self.pressingW = false;
		self.pressingD = false;
		self.pressingS = false;		
		self.pressingA = false;
		self.pressingShift = false;					
							
		gameEngine.spawnSafely(self);
		updatePlayerList.push({id:self.id,property:"y",value:self.y});
		updatePlayerList.push({id:self.id,property:"x",value:self.x});		
	}
	Player.list[id] = self;

	logg("Player " + self.name + " ADDED TO LIST and has entered the game.");
	var teamName = self.team;
	if (pcMode == 2){
		if (self.team == 1){
			teamName = "red";
		}
		else if (self.team == 2){
			teamName = "blue";
		}
	}
	// if (teamName != 0)
	// 	sendChatToAll(self.name + " has joined the " + teamName + " team!");
		
	socket.emit('sendPlayerNameToClient', self.name);
	
	gameEngine.sendFullGameStatus(self.id);
	if (gametype == "elim" && !(pregame && pregameIsHorde)){
		self.respawn(true);
		if (!pregame && !gameOver && !roundOver && getTeamSize(self.team) > 1){ //Middle of an active round: Spectate
			self.updatePropAndSend("health", 0);
			self.respawnTimer = respawnTimeLimit - 1;
		}
	}
	else {
		self.respawn(true);
	}

	if (gametype == "horde" || (pregame && pregameIsHorde)){
		dataAccessFunctions.getHordePersonalBest(self.cognitoSub, function(personalBest){
			console.log("GOT PERSONAL BEST:" + personalBest);
			self.hordePersonalBest = personalBest;
			updatePlayerList.push({id:self.id,property:"hordePersonalBest",value:self.hordePersonalBest});		//send only to player!!!
		});
		if (getPlayerListLength() == 1){
			gameEngine.resetHordeMode();
		}
	}
	
	return self;
} //End Player function
Player.list = [];


function getSpeedAdjust(currentSpeed, targetSpeed, increment){
	if (currentSpeed == targetSpeed){return currentSpeed;} //No adjust

	if (currentSpeed > targetSpeed){
		currentSpeed -= increment;
		if (currentSpeed < targetSpeed){
			currentSpeed = targetSpeed;
		}
	}
	else if (currentSpeed < targetSpeed){
		currentSpeed += increment;
		if (currentSpeed > targetSpeed){
			currentSpeed = targetSpeed;
		}
	}
	return currentSpeed;
}



function gunCycle(player, forwards){
	if (player.reloading > 0){
		player.reloading = 0;
		updatePlayerList.push({id:player.id,property:"reloading",value:player.reloading});				
	}

	if (!player.holdingBag || (player.holdingBag && allowBagWeapons)){
		var availWeapons = [1];
		if (player.DPAmmo > 0 || player.DPClip > 0) {availWeapons.push(2);}
		if (player.MGAmmo > 0 || player.MGClip > 0){availWeapons.push(3);}
		if (player.SGAmmo > 0 || player.SGClip > 0){availWeapons.push(4);}
		if (player.laserClip > 0){availWeapons.push(5);}
		const max = 5;
		while (true){
			if (forwards) {player.weapon++;}
			else {player.weapon--;}
			if (availWeapons.includes(player.weapon)){
				break;
			}
			if (player.weapon > max){
				player.weapon = 1;
				break;
			}
			if (player.weapon < 1){
				player.weapon = max + 1;
			}
		}
	}
	else {
		player.weapon = 1;
	}
	updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
}

function gunSwap(player, weapon = false){
	player.updatePropAndSend("reloading", 0);

	if (player.weapon == 1){
		if (player.SGAmmo > 0 || player.SGClip > 0){
			if (player.holdingBag == true && !allowBagWeapons) {
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sg equip sfx
			}
			else {
				player.weapon = 4;
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
			}
		}
		else if (player.MGAmmo > 0 || player.MGClip > 0){
			if (player.holdingBag == true && !allowBagWeapons) {
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sfx
			}
			else {
				player.weapon = 3;
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
			}
		}
		else if (player.DPAmmo > 0 || player.DPClip > 0) {
			if (player.holdingBag == true && !allowBagWeapons) {
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sfx
			}
			else {
				player.weapon = 2;
				updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});						
			}
		}
	}
	else {
		player.weapon = 1;
		updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
	}
}



Player.onConnect = function(socket, cognitoSub, name, team, partyId){
	dataAccessFunctions.getUserCustomizations(cognitoSub, function(customizations){
		dataAccessFunctions.getUserSettings(cognitoSub, function(settings){
			var player = Player(socket.id, cognitoSub, name, team, customizations.result, settings.result, partyId);
			gameEngine.ensureCorrectThugCount();
			gameEngine.gameServerSync(cognitoSub); //Needs to remove incoming users
			
			socket.emit('addToChat', getObjectiveText(), 0);
			sendChatToAll("Welcome, " + name + "!");

			socket.on('keyPress', function(data){
				player.afk = AfkFramesAllowed;
				if (!Player.list[player.id])
					return;

				if (player.health > 0 && player.team != 0){
					var discharge = false;
					if(data.inputId === 87){player.pressingW = data.state;} //W
					else if(data.inputId === 68){player.pressingD = data.state;}
					else if(data.inputId === 83){player.pressingS = data.state;}
					else if(data.inputId === 65){player.pressingA = data.state;}
					
					else if(data.inputId === 38){ //Up
						player.pressingUp = data.state;
					}
					else if(data.inputId === 39){ //Right
						player.pressingRight = data.state;
					}
					else if(data.inputId === 40){ //Down
						player.pressingDown = data.state;
					}
					else if(data.inputId === 37){ //Left
						player.pressingLeft = data.state;
					}	
					else if(data.inputId === 32){ //SPACE
						if ((player.pressingW || player.pressingD || player.pressingS || player.pressingA) && !player.energyExhausted && player.boosting == 0 && player.holdingBag == false){
							if (player.cloakEngaged){
								player.cloakEngaged = false;						
								updatePlayerList.push({id:player.id,property:"cloakEngaged",value:player.cloakEngaged});	
							}
							player.boost();
							updateEffectList.push({type:3,playerId:player.id});
							updatePlayerList.push({id:player.id,property:"boosting",value:player.boosting});
						}
						else if (player.holdingBag == true && player.walkingDir != 0){
							player.holdingBag = false;
							if (player.previousWeapon){
								player.weapon = player.previousWeapon == 5 ? 1 : player.previousWeapon;
								updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
							}
							if (player.energy > 0){
								player.rechargeDelay = rechargeDelayTime;
								player.energy = 1;
								updatePlayerList.push({id:player.id,property:"energy",value:player.energy,single:true});
							}
							if (player.cloakEngaged){
								player.cloakEngaged = false;						
								updatePlayerList.push({id:player.id,property:"cloakEngaged",value:player.cloakEngaged});
							}
							updatePlayerList.push({id:player.id,property:"holdingBag",value:player.holdingBag});	
							if (player.team == 1){
								bagBlue.captured = false;
								updateMisc.bagBlue = bagBlue;
								bagBlue.playerThrowing = player.id;
								bagBlue.speed = 25;
								bagBlue.direction = player.walkingDir;
							}
							else if (player.team == 2){
								bagRed.captured = false;
								updateMisc.bagRed = bagRed;
								bagRed.playerThrowing = player.id;
								bagRed.speed = 25;
								bagRed.direction = player.walkingDir;
							}
						}
						else if ((!player.pressingW && !player.pressingD && !player.pressingS && !player.pressingA) && player.energy > 0){
							if (!player.cloakEngaged && cloakingEnabled){
								player.cloakEngaged = true;
								SOCKET_LIST[player.id].emit('sfx', "sfxCloak");
							}
							else if (player.cloakEngaged){
								player.cloakEngaged = false;
							}
							updatePlayerList.push({id:player.id,property:"cloakEngaged",value:player.cloakEngaged});	
						}
						else {
							//no energy
						}
					}
					else if (data.inputId == 81){ //Q
						gunCycle(player, false);
					}
					else if (data.inputId == 69){ //E
						gunCycle(player, true);
					}
					else if (data.inputId == 82){ //R (or Ctrl)
						reload(player.id);
					}
					else if(data.inputId == 17){ //F "Ctrl" Equipment
										
					}

					else if (data.inputId == 16){ //Shift
						player.pressingShift = data.state;
						if (data.state == false){
							player.throwGrenade();
						}
					}
					else if (data.inputId == 49){ //1
						if (player.weapon != 1){
							if (player.reloading > 0){
								player.reloading = 0;
								updatePlayerList.push({id:player.id,property:"reloading",value:player.reloading});				
							}
							player.weapon = 1;
							updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});

						}
					}
					else if (data.inputId == 50){ //2
						if ((player.DPAmmo > 0 || player.DPClip > 0) && player.weapon != 2) {
							if (player.reloading > 0){
								player.reloading = 0;
								updatePlayerList.push({id:player.id,property:"reloading",value:player.reloading});				
							}					
							if (player.holdingBag == true && !allowBagWeapons) {
								updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sfx
							}
							else {
								player.weapon = 2;
								updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});						
							}
						}
					}
					else if (data.inputId == 51){ //3
						
						if ((player.MGAmmo > 0 || player.MGClip > 0) && player.weapon != 3) {
							if (player.reloading > 0){
								player.reloading = 0;
								updatePlayerList.push({id:player.id,property:"reloading",value:player.reloading});				
							}
							if (player.holdingBag == true && !allowBagWeapons) {
								updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play sfx
							}
							else {
								player.weapon = 3;
								updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
							}
						}
					}
					else if (data.inputId == 52){ //4
						
						if ((player.SGAmmo > 0 || player.SGClip > 0) && player.weapon != 4) {
							if (player.reloading > 0){
								player.reloading = 0;
								updatePlayerList.push({id:player.id,property:"reloading",value:player.reloading});				
							}
							if (player.holdingBag == true && !allowBagWeapons) {
								updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play pistol sfx
							}
							else {
								player.weapon = 4;
								updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});
							}
						}
					}
					else if (data.inputId == 53){ //5
						
						if (player.laserClip > 0 && player.weapon != 5) {
							if (player.reloading > 0){
								player.reloading = 0;
								updatePlayerList.push({id:player.id,property:"reloading",value:player.reloading});				
							}
							if (player.holdingBag == true && !allowBagWeapons) {
								updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon}); //Play laser sfx
							}
							else {
								player.weapon = 5;
								updatePlayerList.push({id:player.id,property:"weapon",value:player.weapon});						
							}
						}
					}
					//TESTING KEY
					else if (data.inputId == 85){ //U (TESTING BUTTON) 
					
					/* hurt player
						player.health -= 10;
						player.healDelay = 300;
						updatePlayerList.push({id:player.id,property:"health",value:player.health});\
					*/				
					}


						
				}//End health > 0 check for allowing input	
				else if(data.inputId === 32 && player.health <= 0 && (gametype == "horde" || (pregame && pregameIsHorde))){ //SPACE
					if (player.respawnTimer >= respawnTimeLimit * 0.5)
						gameEngine.resetHordeMode(player.id);
				}	
			}); //End Socket on Keypress
			
			
			//ping
			socket.on('pingServer', function(socketId){
				if (Player.list[socketId]){
					Player.list[socketId].ticksSinceLastPing = 0;
				}
				socket.emit('pingResponse', socketId);
			});

			socket.on('tutorialCompleted', function(){
				log("TUTORIAL COMPLETED SERVER " + socket.cognitoSub);

				if (socket.cognitoSub && socket.cognitoSub.substring(0,2) != "0."){
					dataAccessFunctions.setUserSetting(socket.cognitoSub, "display", "tutorialCompleted", true);
				}
			});

			
			
			socket.on('purchase', function(data){
				if (!Player.list[data.playerId]){return;}
				if (data.selection == 1 && Player.list[data.playerId].cash >= shop.price1){
					Player.list[data.playerId].cash -= shop.price1;
					updatePlayerList.push({id:data.playerId,property:"cash",value:Player.list[data.playerId].cash});								
					pickup.pickupPickup(data.playerId, 0, {type:3, amount:shop.amount1});
				}		
				else if (data.selection == 2 && Player.list[data.playerId].cash >= shop.price2){
					Player.list[data.playerId].cash -= shop.price2;
					updatePlayerList.push({id:data.playerId,property:"cash",value:Player.list[data.playerId].cash});								
					pickup.pickupPickup(data.playerId, 0, {type:4, amount:shop.amount2});
				}		
				else if (data.selection == 3 && Player.list[data.playerId].cash >= shop.price3){
					Player.list[data.playerId].cash -= shop.price3;
					updatePlayerList.push({id:data.playerId,property:"cash",value:Player.list[data.playerId].cash});								
					pickup.pickupPickup(data.playerId, 0, {type:2, amount:shop.amount3});
				}		
				else if (data.selection == 4 && Player.list[data.playerId].cash >= shop.price4){
					Player.list[data.playerId].cash -= shop.price4;
					updatePlayerList.push({id:data.playerId,property:"cash",value:Player.list[data.playerId].cash});								
					pickup.pickupPickup(data.playerId, 0, {type:6, amount:shop.amount4});
				}		
				else if (data.selection == 5 && Player.list[data.playerId].cash >= shop.price5 && Player.list[data.playerId].health < 175){
					if (!Player.list[data.playerId].willHaveBA){
						Player.list[data.playerId].cash -= shop.price5;
						Player.list[data.playerId].willHaveBA = true;
						updatePlayerList.push({id:data.playerId,property:"cash",value:Player.list[data.playerId].cash});	
						updatePlayerList.push({id:data.playerId,property:"willHaveBA",value:true});	
					}
				}		
				else if (data.selection == 6 && Player.list[data.playerId].cash >= shop.price6 && Player.list[data.playerId].hasBattery < 2){
					Player.list[data.playerId].cash -= shop.price6;
					updatePlayerList.push({id:data.playerId,property:"cash",value:Player.list[data.playerId].cash});								
					Player.list[data.playerId].hasBattery += shop.amount6/100;
				}				
			});

			socket.on('voteEndgame', function(socketId, voteType, vote){
				console.log("GOT VOTE: " + socketId + " " + voteType + " " + vote);
				if (voteType == "gametype" && voteGametype){
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
					else if (vote == "ffa"){
						ffaVotes++;
						voteGametypeIds.push(socketId);
					}
					else if (vote == "elim"){
						elimVotes++;
						voteGametypeIds.push(socketId);
					}
				}
				else if (voteType == "map" && voteMap){
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
					else if (vote == "whirlpool"){
						whirlpoolVotes++;
						voteMapIds.push(socketId);
					}
					else if (vote == "crik"){
						crikVotes++;
						voteMapIds.push(socketId);
					}
					else if (vote == "narrows"){
						narrowsVotes++;
						voteMapIds.push(socketId);
					}
					else if (vote == "longNarrows"){
						longNarrowsVotes++;
						voteMapIds.push(socketId);
					}
				}	
				else if (voteType == "rebalance" && voteRebalance){
					for (var i = 0; i < voteRebalanceTeamsIds.length; i++){
						if (voteRebalanceTeamsIds[i] == socketId){ //Player has already voted
							return;
						}				
					}			
					if (vote == "yes"){
						voteRebalanceTeamsYes++;
						voteRebalanceTeamsIds.push(socketId);
					}
					else if (vote == "no"){
						voteRebalanceTeamsNo++;
						voteRebalanceTeamsIds.push(socketId);
					}
				}	
			});

			socket.on('chat', function(data){
				if (data[1] == "[Team] " || data[1] == "[Team]" || data[1] == "" || data[1] == " "){return;} //blank messages

				if (getPlayerById(data[0])){
					if (data[1].substring(0,2) == "./"){
						evalServer(socket, data[1].substring(2));
					}
					else if (data[1].substring(0,1) == "/"){
						evalServer(socket, data[1].substring(1));
					}
					else { //Regular chat, not a server command
						for(var i in SOCKET_LIST){
							var recipient = getPlayerById(SOCKET_LIST[i].id);
							if (!recipient){continue;}

							//Profanity filter
							var profanityFilterSetting = recipient.settings.display.find(setting => setting.key == "profanityFilter")
							if (!profanityFilterSetting || profanityFilterSetting.value == true){
								data[1] = profanity.censor(data[1]);
							}

							//Team chat check
							if (data[1].substring(0,6) == "[Team]" && getPlayerById(data[0]).team != recipient.team && gametype != "ffa"){continue;}

							SOCKET_LIST[i].emit('addToChat',getPlayerById(data[0]).name.substring(0,12) + ': ' + data[1].substring(0,50), getPlayerById(data[0]).id);
							var overHeadChatMsg = data[1].substring(0,50);
							var overheadChatTeam = 0;
							if (data[1].substring(0,6) == "[Team]"){
								overHeadChatMsg = data[1].substring(6,50);
								overheadChatTeam = getPlayerById(data[0]).team;
							}
							updateEffectList.push({type:7, playerId:data[0], text:overHeadChatMsg, team:overheadChatTeam});
						}
					}
				}
			});

			socket.on('disconnect', function(){
				logg("Socket " + socket.id + " disconnected. PLAYER");
				playerDisconnect(socket.id);
				if (SOCKET_LIST[socket.id])
					delete SOCKET_LIST[socket.id];		
			});

		});
	});
}//End Player.onConnect

const PERM_NONE = 0;
const PERM_OWNER = 1;
const PERM_MODERATOR = 2;
const PERM_DEVELOPER = 3;
function getPerm(cognitoSub) {
	let ret = PERM_NONE;
	if (cognitoSub == createdByCognitoSub)
		ret = PERM_OWNER;
	if (ModCognitoSubs.includes(cognitoSub))
		ret = PERM_MODERATOR;	
	if (DevCognitoSubs.includes(cognitoSub))
		ret = PERM_DEVELOPER;	
	return ret;
}

// I should put these in a JSON file... TOO BAD
const ModCognitoSubs = [ /* There are no moderators yet.*/ ]
const DevCognitoSubs = [ /* I think... this is RTP? */ "0192fb49-632c-47ee-8928-0d716e05ffea" ]


function command(func, /** @type {string} */ match, perm = PERM_NONE) {
	command.list.push({
		"func": func,
		"match": match, /*regex code, see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions */
		"perm": perm
	});
}
command.list = [];
function getIDFromName(name) {
	getPlayerList().forEach(player => {
		if (String(player.name).startsWith(name))
			return player.id;
	})
	return -1;
}

// TODO: recreate all the commands -.-
command((socket, matches, data) => {
	let permstring = "Citizen";
	switch (getPerm(getPlayerById(socket.id).cognitoSub)) {
		case PERM_OWNER: permstring = "Custom Owner"; break;
		case PERM_MODERATOR: permstring = "Moderator"; break;
		case PERM_DEVELOPER: permstring = "Developer"; break;
	}
	socket.emit('addToChat', `You are a ${permstring}`);
}, "^get(Permission|Perm)(s?)", PERM_NONE);

command((socket, matches, data) => {
	if (getPlayerById(socket.id).team == 0) spectatePlayer(socket.id);
	gameEngine.changeTeams(socket.id);
}, "^team( \\w+)?", PERM_NONE);

command((socket, matches, data) => {
	spectatePlayer(socket.id);
}, "^spec", PERM_NONE);

function spectatePlayer(id) {
	if (getPlayerById(id).team == 0) {
		let teamtochange = 0;
		if (getActivePlayerListLength() >= maxPlayers){
			SOCKET_LIST[id].emit('addToChat', "Can't change teams. Game is full!");
			return;
		}
		if (gameEngine.getMoreTeam1Players() >= 1) gameEngine.changeTeams(id, 2);
		else gameEngine.changeTeams(id, 1);
		
	} else {
		abandonMatch(id);
		gameEngine.changeTeams(id, 0);
	}
}

//Server commands
function evalServer(socket, data){
	logg("SERVER COMMAND:" + data);
	command.list.forEach((c, i) => {
		console.log(c);
		let matches = String(data).match(c.match);
		if (matches != null) {
			if (c.perm <= getPerm(getPlayerById(socket.id).cognitoSub)) {
				c.func(socket, matches, data)
				return;
			} else {
				if (customServer) socket.emit('addToChat', "Insufficient Permissions (try asking the server owner?)");
				else socket.emit('addToChat', "Insufficient Permissions (try asking a moderator?)");
			}
			
		}
	});
	socket.emit('addToChat', "Invalid Server Command?");
	return;
/*
	if (!getPlayerById(socket.id))
		return;

	//socket = socketBak;
	if (data == "start" && (customServer && (pregame || getPlayerById(socket.id).cognitoSub == createdByCognitoSub))){
		gameEngine.restartGame();
	}

	if(!allowServerCommands){
		if (data == "QWOPcmd"){
			socket.emit('addToChat', "Server commands enabled");
			allowServerCommands = true;
			return;
		}		
		if (data != "team" && data != "spectate" && data != "spec" && data != "kill" && getPlayerById(socket.id).cognitoSub != "0192fb49-632c-47ee-8928-0d716e05ffea"){
			return;
		}
	}
	
	if (data == "QWOPcmd"){
		socket.emit('addToChat', "Server commands disabled");
		allowServerCommands = false;
	}
	else if (data == "startt" || data == "restartt"){
		gameEngine.restartGame();
	}
	else if (data == "spawn" || data == "respawn"){
		gameEngine.spawnSafely(getPlayerById(socket.id));
	}
	else if (data == "me"){
		logg("BANNED: " + getPlayerById(socket.id).cognitoSub);
		bannedCognitoSubs.push({cognitoSub:getPlayerById(socket.id).cognitoSub, reason:"asking for it"});
		console.log(bannedCognitoSubs);
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
		var playerList = getPlayerList();
		for (var p in playerList){
			if (playerList[p].name == data.substring(4)){
				var id = playerList[p].id;

				var name = playerList[p].name;
				playerDisconnect(id);
				delete SOCKET_LIST[id];
				socket.emit('addToChat', 'Kicked ' + name + ' from game.');
				break;
			}
		}
	}
	else if (data == "team" || data == "teams" || data == "change" || data == "switch" || data == "changeTeams" || data == "changeTeam"){
		if (gametype == "horde" || (pregame && pregameIsHorde)){
			var playerList = getPlayerList();
			for (var p in playerList){
				gameEngine.changeTeams(playerList[p].id, 2);
			}
		}
		else {
			var changeHelpsBalance = false;

			if ((gameEngine.getMoreTeam1Players() > 1 && getPlayerById(socket.id).team == 1) || (gameEngine.getMoreTeam1Players() < -1 && getPlayerById(socket.id).team == 2) || (getPlayerById(socket.id).team == 0 && gameEngine.getMoreTeam1Players() != 0)){
				console.log("Change would help balance!");
				changeHelpsBalance = true;
			}

			var teamToChangeTo = false;
			if (getPlayerById(socket.id).team == 0){
				console.log("TEAM IS ZERO");
				if (getActivePlayerListLength() >= maxPlayers){
					socket.emit('addToChat', "Can't change teams. Game is full!");
					return;
				}
				if (gameEngine.getMoreTeam1Players() >= 1){
					teamToChangeTo = 2;
				}
				else {
					teamToChangeTo = 1;
				}
			}
			console.log("TEAM TO CHANGE TO:" + teamToChangeTo);
			if (isLocal || customServer || changeHelpsBalance || getPlayerById(socket.id).cognitoSub == "0192fb49-632c-47ee-8928-0d716e05ffea"){
				gameEngine.changeTeams(socket.id, teamToChangeTo);
			}
			else {
				socket.emit('addToChat', "Ranked game is in full swing. No changing teams.");
			}
		}
	}
	else if (data == "spectate" || data == "spec"){
		if (getPlayerById(socket.id).team == 0){
			if (getActivePlayerListLength() >= maxPlayers){
				socket.emit('addToChat', "Can't change teams. Game is full!");
				return;
			}
			var team = 1;
			if (gametype == "horde" || (pregame && pregameIsHorde)){team = 2;}
			gameEngine.changeTeams(socket.id, team);
		}
		else {
			abandonMatch(socket.id);
			gameEngine.changeTeams(socket.id, 0);
		}
	}
	else if (data == "boostUp" || data == "boostU" || data == "boostu"){
		boostAmount += 2;
		socket.emit('addToChat', 'Boost up to ' + boostAmount);
	}
	else if (data == "cash" && isLocal){
		getPlayerById(socket.id).cash += 10000;
		getPlayerById(socket.id).cashEarnedThisGame += 10000;
		updatePlayerList.push({id:socket.id,property:"cash",value:Player.list[socket.id].cash});
		updatePlayerList.push({id:socket.id,property:"cashEarnedThisGame",value:Player.list[socket.id].cashEarnedThisGame});

		socket.emit('addToChat', 'Cash up ' + Player.list[socket.id].cash);
	}
	else if (data == "afk"){
		if (bootOnAfk){
			bootOnAfk = false;
		}
		else {
			bootOnAfk = true;
		}
		socket.emit('addToChat', 'Boot on AFK set to ' + bootOnAfk + " [" + AfkFramesAllowed + "]");
	}
	else if (data == "boostDown" || data == "boostD" || data == "boostd"){
		boostAmount -= 2;
		socket.emit('addToChat', 'Boost down to ' + boostAmount);
	}
	else if (data == "speed5" || data == "run5"){
		playerMaxSpeed = 5;
		socket.emit('addToChat', 'max speed set to ' + playerMaxSpeed);
	}
	else if (data == "speed4" || data == "run4"){
		playerMaxSpeed = 4;
		socket.emit('addToChat', 'max speed set to ' + playerMaxSpeed);
	}
	else if (data == "speed6" || data == "run6"){
		playerMaxSpeed = 6;
		socket.emit('addToChat', 'max speed set to ' + playerMaxSpeed);
	}
	else if (data == "speed7" || data == "run7"){
		playerMaxSpeed = 7;
	}
	else if (data == "speed8" || data == "run8"){
		playerMaxSpeed = 8;
	}
	else if (data == "speed9" || data == "run9"){
		playerMaxSpeed = 9;
	}
	else if (data == "speed10" || data == "run10"){
		playerMaxSpeed = 10;
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
	else if (data == "elimt" || data == "eliminationt"){
		gametype = "elim";
		gameEngine.restartGame();
	}
	else if (data == "hordet"){
		gametype = "horde";
		map = "horde";
		gameEngine.restartGame();
	}
	else if (data == "ffa"){
		gametype = "ffa";
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
	else if (data == "whirlpool"){
		map = "whirlpool";
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
	else if (data == "narrows" || data == "narrow"){
		map = "narrows";
		gameEngine.restartGame();
	}
	else if (data == "longNarrows" || data == "lNarrows" || data == "long"){
		map = "longNarrows";
		gameEngine.restartGame();
	}
	else if (data == "map2"){
		map = "map2";
		gameEngine.restartGame();
	}
	else if (data == "stats" || data == "stat"){
		dataAccess.dbFindAwait("RW_USER", {cognitoSub:getPlayerById(socket.id).cognitoSub}, async function(err, res){
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
			thug.clearThugList();
		}
		else {
			logg("Server command: Thugs Enabled");
			socket.emit('addToChat', "Server command: Thugs Enabled");
			spawnOpposingThug = true;
			gameEngine.ensureCorrectThugCount();
		}
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
		var coords = gameEngine.getSafeCoordinates(1);
		thug.createThug(1, coords.x, coords.y);
		socket.emit('addToChat', 'White thug spawned.');	
	}
	else if (data == "sThugBlack"){
		logg("Server command: Spawn Thug (Black)");
		var coords = gameEngine.getSafeCoordinates(2);
		thug.createThug(2, coords.x, coords.y);
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
	else if (data == "capturet" || data == "scoret"){
		if (getPlayerById(socket.id).team == 1){
			gameEngine.capture(1);
		}
		else if (getPlayerById(socket.id).team == 2){
			gameEngine.capture(2);
		}
	}
	else if (data == "kill" || data == "die"){
		if (getPlayerById(socket.id).health > 0){
			getPlayerById(socket.id).health = 0
			updatePlayerList.push({id:getPlayerById(socket.id).id,property:"health",value:getPlayerById(socket.id).health})
			getPlayerById(socket.id).kill({id:0, shootingDir:1});
		}
	}
	else if (data == "hurt"){
		if (getPlayerById(socket.id).health > 0){
			getPlayerById(socket.id).health -= 20;
			getPlayerById(socket.id).healDelay = 500;
			updatePlayerList.push({id:getPlayerById(socket.id).id,property:"health",value:getPlayerById(socket.id).health})
		}
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

		if (getPlayerById(socket.id) && getPlayerById(socket.id).team == 1){
			if (gametype == "ctf"){
				gameEngine.capture(1);
			}
			else if (gametype == "slayer"){
				whiteScore += 100;
			}
		}
		else if (getPlayerById(socket.id) && getPlayerById(socket.id).team == 2){
			if (gametype == "ctf"){
				gameEngine.capture(2);
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

		if (getPlayerById(socket.id) && getPlayerById(socket.id).team == 1){
			if (gametype == "ctf")
				gameEngine.capture(2);
		}
		else if (getPlayerById(socket.id) && getPlayerById(socket.id).team == 2){
			if (gametype == "ctf")
				gameEngine.capture(1);
		}
		minutesLeft = 0;
		secondsLeft = 0;
	}
	else if (data == "crasht" && (isLocal || getPlayerById(socket.id).cognitoSub == "0192fb49-632c-47ee-8928-0d716e05ffea")){
		crash();
	}
	else if ((data == "godt" || data == "haxt") && (isLocal || getPlayerById(socket.id).cognitoSub == "0192fb49-632c-47ee-8928-0d716e05ffea")){
		getPlayerById(socket.id).PClip = 999;
		getPlayerById(socket.id).SGClip = 99;
		getPlayerById(socket.id).MGClip = 999;
		getPlayerById(socket.id).DPClip = 999;
		getPlayerById(socket.id).laserClip = 10;
		getPlayerById(socket.id).health = 175;
		getPlayerById(socket.id).hasBattery = 2;
		updatePlayerList.push({id:socket.id,property:"hasBattery",value:getPlayerById(socket.id).hasBattery});
		updatePlayerList.push({id:socket.id,property:"health",value:getPlayerById(socket.id).health});
		updatePlayerList.push({id:socket.id,property:"weapon",value:getPlayerById(socket.id).weapon});
		updatePlayerList.push({id:socket.id,property:"DPClip",value:getPlayerById(socket.id).DPClip});
		updatePlayerList.push({id:socket.id,property:"MGClip",value:getPlayerById(socket.id).MGClip});
		updatePlayerList.push({id:socket.id,property:"SGClip",value:getPlayerById(socket.id).SGClip});
		updatePlayerList.push({id:socket.id,property:"laserClip",value:getPlayerById(socket.id).laserClip});
		socket.emit('addToChat', 'INITIATE HAX');
	}

	else if (data[0] == "%" && data != "%timer" && (isLocal || getPlayerById(socket.id).cognitoSub == "0192fb49-632c-47ee-8928-0d716e05ffea")){
		try {
			var res = eval(data.substring(1));
		}
		catch(e) {
			socket.emit('addToChat', 'Invalid Command.');
			res = "invalid command";
		}
		finally {
			socket.emit('evalAnswer', res);
		}
	}
	else {
		socket.emit('addToChat', 'Invalid Command.');
	}
	*/
}

function checkForEmptyWeaponAndSwap(playerId){
	
	if ((Player.list[playerId].weapon == 3 && Player.list[playerId].MGClip <= 0 && Player.list[playerId].MGAmmo <= 0)){			
		gunCycle(Player.list[playerId], false);
		updatePlayerList.push({id:playerId,property:"weapon",value:Player.list[playerId].weapon});		
		return true;
	}
	else if ((Player.list[playerId].weapon == 2 && Player.list[playerId].DPClip <= 0 && Player.list[playerId].DPAmmo <= 0)){
			gunCycle(Player.list[playerId], false);
			updatePlayerList.push({id:playerId,property:"weapon",value:Player.list[playerId].weapon});		
			return true;
	}
	else if ((Player.list[playerId].weapon == 4 && Player.list[playerId].SGClip <= 0 && Player.list[playerId].SGAmmo <= 0)){
			gunCycle(Player.list[playerId], false);
			updatePlayerList.push({id:playerId,property:"weapon",value:Player.list[playerId].weapon});		
			return true;
	}
	return false;
}

function reload(playerId){
	if (!Player.list[playerId]){return;}		
	if (Player.list[playerId].throwingObject != 0){return;}
		

	if (checkForEmptyWeaponAndSwap(playerId)){return;}

	if (Player.list[playerId].weapon == 1 && Player.list[playerId].PClip >= PClipSize+1){return;}
	else if ((Player.list[playerId].weapon == 3 && Player.list[playerId].MGClip >= MGClipSize+1) || (Player.list[playerId].weapon == 3 && Player.list[playerId].MGAmmo <= 0)){return;}
	else if ((Player.list[playerId].weapon == 2 && Player.list[playerId].DPClip >= DPClipSize+1) || (Player.list[playerId].weapon == 2 && Player.list[playerId].DPAmmo <= 0)){return;}
	else if ((Player.list[playerId].weapon == 4 && Player.list[playerId].SGClip >= SGClipSize) || (Player.list[playerId].weapon == 4 && Player.list[playerId].SGAmmo <= 0)){return;}
	if (Player.list[playerId].reloading <= 0){
		if (Player.list[playerId].weapon == 1){
			Player.list[playerId].reloading = 60;
			updatePlayerList.push({id:playerId,property:"reloading",value:Player.list[playerId].reloading});
		}					
		else if (Player.list[playerId].weapon == 2){
			Player.list[playerId].reloading = 80;
			updatePlayerList.push({id:playerId,property:"reloading",value:Player.list[playerId].reloading});
		}					
		else if (Player.list[playerId].weapon == 3){
			Player.list[playerId].reloading = 114;
			updatePlayerList.push({id:playerId,property:"reloading",value:Player.list[playerId].reloading});
		}					
		else if (Player.list[playerId].weapon == 4){
			if (Player.list[playerId].fireRate > 0){
				Player.list[playerId].bufferReload = true;
			}
			else {
				Player.list[playerId].reloading = 30;
				updatePlayerList.push({id:playerId,property:"reloading",value:Player.list[playerId].reloading});
			}
		}					
	}	
}

function Discharge(player){
	if (player.reloading > 0 && player.weapon != 4){return;}	
	else if (player.weapon == 1 && player.PClip <= 0){
		reload(player.id);
		player.fireRate = pistolFireRate;
		return;
	}
	else if (player.weapon == 2 && player.DPClip <= 0){
		reload(player.id);
		player.fireRate = DPFireRate;
		return;
	}
	else if (player.weapon == 3 && player.MGClip <= 0){
		reload(player.id);
		player.fireRate = MGFireRate;
		return;
	}
	else if (player.weapon == 4 && player.SGClip <= 0){
		reload(player.id);
		if (player.fireRate == 0)
			player.fireRate = SGFireRate;
		return;
	}
	if (player.triggerTapLimitTimer > 0 && player.firing <= 0){ //Don't let SG fire if TapLimiter is active AND not actively firing 
		return;
	}	

	//If you make it here, allow a new shot to be generated

	//Weapon recoil
	if (player.weapon == 4){
		var pushDirection = player.shootingDir - 4; if (pushDirection <= 0){ pushDirection += 8; }		
		player.pushDir = pushDirection;
		player.pushSpeed = SGPushSpeed;
	}
	if (player.weapon == 5){
		var pushDirection = player.shootingDir - 4; if (pushDirection <= 0){ pushDirection += 8; }		
		player.pushDir = pushDirection;
		player.pushSpeed = laserPushSpeed;
	}
	if (player.weapon == 3){
		var pushDirection = player.shootingDir - 4; if (pushDirection <= 0){ pushDirection += 8; }		
		player.pushDir = pushDirection;
		player.pushSpeed = MGPushSpeed;
	}
	
	//ACTUAL DISCHARGES
	if (player.cloakEngaged){
		player.cloakEngaged = false;
		updatePlayerList.push({id:player.id,property:"cloakEngaged",value:player.cloakEngaged});
	}
	if(player.weapon == 1){
		if (player.firing <= 0){
			player.PClip--;
			updatePlayerList.push({id:player.id,property:"PClip",value:player.PClip});
			player.fireRate = pistolFireRate;
			if (pistolFireRateLimiter){
				player.triggerTapLimitTimer = pistolFireRate;
			}
		}
		player.shotList.push(
			{weapon:player.weapon, x:0, y:0}
		);
	}
	else if(player.weapon == 2){
		if (player.firing <= 0){
			player.DPClip--;
			updatePlayerList.push({id:player.id,property:"DPClip",value:player.DPClip});
			player.fireRate = DPFireRate;
			if (pistolFireRateLimiter){
				player.triggerTapLimitTimer = DPFireRate;			
			}
		}
		player.shotList.push(
			{weapon:player.weapon, x:-20, y:0},
			{weapon:player.weapon, x:20, y:0}
		);
	}
	else if(player.weapon == 3 && player.firing <= 0){
		player.MGClip--;
		updatePlayerList.push({id:player.id,property:"MGClip",value:player.MGClip});
		player.fireRate = MGFireRate;
		player.shotList.push(
			{weapon:player.weapon, x:0, y:0}
		);
	}
	else if(player.weapon == 4){
		if (player.firing <= 0){
			player.SGClip--;
			player.reloading = 0;
			updatePlayerList.push({id:player.id,property:"SGClip",value:player.SGClip});
			player.fireRate = SGFireRate;
			player.triggerTapLimitTimer = SGFireRate;
		}

		player.shotList.push(
			{weapon:player.weapon, x:0, y:0}
		);
	}
	else if(player.weapon == 5 && player.firing <= 0){
		player.laserClip--;
		updatePlayerList.push({id:player.id,property:"laserClip",value:player.laserClip});
		player.fireRate = laserFireRate;
		player.shotList.push(
			{weapon:player.weapon, x:laserOffsetX, y:0}
		);
	}
	
	player.firing = 3; 
}

function abandonMatch(id){
	if (Player.list[id]){
		console.log("Player.list[id].timeInGame: " + Player.list[id].timeInGame + " greater than " + timeInGameRankingThresh + " and team:" + Player.list[id].team + " ");

		if (Player.list[id].team && !customServer && !gameOver && !pregame){
			logg("potential DESERTER!");

			abandoningCognitoSubs.push({cognitoSub:Player.list[id].cognitoSub, team:Player.list[id].team, name:Player.list[id].name, timeInGame:Player.list[id].timeInGame});
			var timesAbandoned = abandoningCognitoSubs.filter(function(player){ //LINQ count
				if (player.cognitoSub == Player.list[id].cognitoSub){
					return player;
				}
			}).length;

			logg("Player has quit " + timesAbandoned + " times. (Abandon limit" + abandonLimit + ")");
			if (timesAbandoned >= abandonLimit && !isLocal && !customServer){
				bannedCognitoSubs.push({cognitoSub:Player.list[id].cognitoSub, reason:"abandoning too many times"});
			}
		}
		if (Player.list[id].holdingBag == true){
			if (Player.list[id].team == 1){
				bagBlue.captured = false;
				updateMisc.bagBlue = bagBlue;
			}
			else if (Player.list[id].team == 2){
				bagRed.captured = false;
				updateMisc.bagRed = bagRed;
			}
		}
		//sendChatToAll(Player.list[id].name + " has disconnected.");
	}
}

Player.onDisconnect = function(id){
	abandonMatch(id);
	logg(Player.list[id].name + " disconnected.");
	delete Player.list[id];
	for(var i in SOCKET_LIST){
		SOCKET_LIST[i].emit('removePlayer', id);
	}	
	gameEngine.ensureCorrectThugCount();
	gameEngine.assignSpectatorsToTeam(false);
	gameEngine.gameServerSync();
}

function getPlayerFromCognitoSub(searchingCognitoSub){
	for (var p in Player.list){
		if (Player.list[p].cognitoSub == searchingCognitoSub){
			return Player.list[p].id;
		}
	}
	return null;
}

//eventTrigger Database push update db
function playerEvent(playerId, event){
	if (!gameOver && Player.list[playerId]){
		if (event == "hit"){
			var addedHitCash = hitCash;
			if (gametype == "elim"){
				addedHitCash = addedHitCash * 2;
			}
			Player.list[playerId].cash += addedHitCash;
			Player.list[playerId].cashEarnedThisGame += addedHitCash;
			updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
			updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
		}
		else if (event == "kill"){
			Player.list[playerId].kills++;			
			Player.list[playerId].cash+=killCash;
			Player.list[playerId].cashEarnedThisGame+=killCash;
			updatePlayerList.push({id:playerId,property:"kills",value:Player.list[playerId].kills});
			updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
			updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
			updateNotificationList.push({text:"+$" + killCash + " - Enemy Killed",playerId:playerId});
		}
		else if (event == "assist"){
			Player.list[playerId].assists++;			
			Player.list[playerId].cash+=assistCash;
			Player.list[playerId].cashEarnedThisGame+=assistCash;
			updatePlayerList.push({id:playerId,property:"assists",value:Player.list[playerId].assists});
			updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
			updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
			updateNotificationList.push({text:"+$" + assistCash + " - Assist",playerId:playerId});
		}
		else if (event == "multikill"){
			if (Player.list[playerId].multikill == 2){
				Player.list[playerId].cash+=doubleKillCash;
				Player.list[playerId].cashEarnedThisGame+=doubleKillCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"**DOUBLE KILL!!**",playerId:playerId});				
			}
			else if (Player.list[playerId].multikill == 3){
				Player.list[playerId].cash+=tripleKillCash;
				Player.list[playerId].cashEarnedThisGame+=tripleKillCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"***TRIPLE KILL!!!***",playerId:playerId});				
			}
			else if (Player.list[playerId].multikill == 4){
				Player.list[playerId].cash+=quadKillCash;
				Player.list[playerId].cashEarnedThisGame+=quadKillCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"****OVERKILL!!!!****",playerId:playerId});				
			}
			else if (Player.list[playerId].multikill == 5){
				Player.list[playerId].cash+=quadKillCash;
				Player.list[playerId].cashEarnedThisGame+=quadKillCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"*****KILLCEPTION!!!!*****",playerId:playerId});				
			}
			else if (Player.list[playerId].multikill >= 6){
				Player.list[playerId].cash+=quadKillCash;
				Player.list[playerId].cashEarnedThisGame+=quadKillCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"******YO DAWG I HEARD YOU LIKE KILLS SO I PUT KILLS IN YOUR KILLS!!!!******",playerId:playerId});				
			}
		}
		else if (event == "spree"){
			if (Player.list[playerId].spree == 5){
				Player.list[playerId].cash+=spreeCash;
				Player.list[playerId].cashEarnedThisGame+=spreeCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"**KILLING SPREE!!**",playerId:playerId});				
			}		
			else if (Player.list[playerId].spree == 10){
				Player.list[playerId].cash+=frenzyCash;
				Player.list[playerId].cashEarnedThisGame+=frenzyCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"****MASSACRE!!***",playerId:playerId});				
			}		
			else if (Player.list[playerId].spree == 15){
				Player.list[playerId].cash+=rampageCash;
				Player.list[playerId].cashEarnedThisGame+=rampageCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"****GENOCIDE!!!****",playerId:playerId});				
			}		
			else if (Player.list[playerId].spree == 20){
				Player.list[playerId].cash+=unbelievableCash;
				Player.list[playerId].cashEarnedThisGame+=unbelievableCash;
				updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
				updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
				updateNotificationList.push({text:"*****ANNIHILATION!!!*****",playerId:playerId});				
			}		
		}
		else if (event == "killThug"){
			Player.list[playerId].cash+=thugCash;
			Player.list[playerId].cashEarnedThisGame+=thugCash;
			updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
			updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
			updateNotificationList.push({text:"+$" + thugCash + " - Thug Killed",playerId:playerId});
		}
		else if (event == "death"){
			Player.list[playerId].deaths++;
			if (Player.list[playerId]){
				updatePlayerList.push({id:playerId,property:"deaths",value:Player.list[playerId].deaths});
			}
		}
		else if (event == "benedict"){
			if (!gameOver && !pregame){
				Player.list[playerId].benedicts++;
				dataAccessFunctions.dbUserUpdate("inc", Player.list[playerId].cognitoSub, {benedicts: 1});
				if (Player.list[playerId].benedicts >= 3 && !customServer){
					bannedCognitoSubs.push({cognitoSub:Player.list[playerId].cognitoSub, reason:"being a Benedict Arnold"});
					SOCKET_LIST[Player.list[playerId].id].emit("betrayalKick");
				}
			}
			updateNotificationList.push({text:"Betrayal!",playerId:playerId});
		}
		else if (event == "suicide"){
			if (!gameOver && !pregame){
				dataAccessFunctions.dbUserUpdate("inc", Player.list[playerId].cognitoSub, {suicide: 1});
			}
			updateNotificationList.push({text:"Suicide!",playerId:playerId});
		}
		else if (event == "steal"){
			Player.list[playerId].steals++;
			// Player.list[playerId].cash += stealCash;
			// Player.list[playerId].cashEarnedThisGame += stealCash;
			// updatePlayerList.push({id:playerId,property:"steals",value:Player.list[playerId].steals});
			// updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
			// updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
			updateNotificationList.push({text:"Bag Stolen",playerId:playerId});
		}
		else if (event == "return"){
			if (Player.list[playerId].lastReturnCooldown > 0){
				updateNotificationList.push({text:"Bag Returned",playerId:playerId});
				return;
			}
			Player.list[playerId].lastReturnCooldown = 300; //returnTimer //returnLimiter
			Player.list[playerId].returns++;
			Player.list[playerId].cash+=returnCash;
			Player.list[playerId].cashEarnedThisGame+=returnCash;
			updatePlayerList.push({id:playerId,property:"returns",value:Player.list[playerId].returns});
			updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
			updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
			updateNotificationList.push({text:"+$" + returnCash + " - Bag Returned",playerId:playerId});
		}
		else if (event == "capture"){
			Player.list[playerId].holdingBag = false;
			updatePlayerList.push({id:playerId,property:"holdingBag",value:false});
			Player.list[playerId].captures++;
			Player.list[playerId].cash+=captureCash;
			Player.list[playerId].cashEarnedThisGame+=captureCash;
			updatePlayerList.push({id:playerId,property:"captures",value:Player.list[playerId].captures});
			updatePlayerList.push({id:playerId,property:"cash",value:Player.list[playerId].cash});
			updatePlayerList.push({id:playerId,property:"cashEarnedThisGame",value:Player.list[playerId].cashEarnedThisGame});
			if (!gameOver){
				updateNotificationList.push({text:"+$" + captureCash + " - BAG CAPTURED!!",playerId:playerId});
			}
		}
	}
	
}


var connect = function(socket, cognitoSub, username, team, partyId){
	Player.onConnect(socket, cognitoSub, username, team, partyId);
}

var getPlayerList = function(){ //This is the one function that returns all players/sockets, including spectators
	return Player.list;
}

var getTeamPlayerList = function(){ //all team players
	var teamPlayers = [];
	for (var i in Player.list){
		if (Player.list[i].team){
			teamPlayers.push(Player.list[i]);
		}
	}			
	return teamPlayers;
}

var getEligiblePlayerList = function(){ //All team playres plus abandoning cognito subs
	var eligiblePlayers = getTeamPlayerList();
	for (var a in abandoningCognitoSubs){
		var abandoningPlayerRejoined = false;
		for (var i in Player.list){ //Make sure abandoning cognitoSub did not rejoin
			if (Player.list[i].team && Player.list[i].cognitoSub == abandoningCognitoSubs[a].cognitoSub){
				Player.list[i].timeInGame += abandoningCognitoSubs[a].timeInGame;
				abandoningPlayerRejoined = true;
				logg("The prodigal child has returned to the game!");				
				break;
			}
		}
		if (abandoningCognitoSubs[a].team && !abandoningPlayerRejoined){
			abandoningCognitoSubs[a].cashEarnedThisGame = 0;
			eligiblePlayers.push(abandoningCognitoSubs[a]);
		}
	}			

	return eligiblePlayers;
}

var getAverageTeamPlayersCash = function(){ //This is the one function that returns all players/sockets, including spectators
	var totalCash = 0;
	var totalPlayers = 0;

	for (var i in Player.list){
		if (Player.list[i].team && typeof Player.list[i].cashEarnedThisGame != 'undefined'){
			totalCash += Player.list[i].cashEarnedThisGame;
			totalPlayers++;
		}
	}			

	return Math.round(totalCash/totalPlayers);
}

var getPlayerById = function(id){
    return Player.list[id];
}

var playerDisconnect = function(id){
    if (Player.list[id])
        Player.onDisconnect(id);
}

function sendChatToAll(text){
	for(var i in SOCKET_LIST){
		SOCKET_LIST[i].emit('addMessageToChat',text);
	}
}
function runPlayerEngines(){
	for (var i in Player.list){
		if (Player.list[i].team != 0)
		Player.list[i].engine();
	}		
}

var getPlayerListLength = function(){ //getPlayerListCount //getPlayerCount
	var length = 0;
	for (var i in Player.list){
		length++;
	}		
	return length;	
}

var getActivePlayerListLength = function(){ //getPlayerListCount //getPlayerCount
	var length = 0;
	for (var i in Player.list){
		if (Player.list[i].team != 0)
			length++;
	}		
	return length;	
}

var getTeamSize = function(team){
	var length = 0;
	for (var i in Player.list){
		if (Player.list[i].team == team)
			length++;
	}		
	return length;	
}

var getHighestPlayerHordeKills = function(){
	var highestKills = 0;
	for (var i in Player.list){
		if (Player.list[i].hordeKills > highestKills && Player.list[i].health > 0)
			highestKills = Player.list[i].hordeKills;
	}		
	return highestKills;	
}

var isSafeCoords = function(potentialX, potentialY, team){
	if (gametype == "ffa"){team = 99;}
	for (var i in Player.list){
		if (Player.list[i].team != team && Player.list[i].health > 0 && potentialX >= Player.list[i].x - threatSpawnRange && potentialX <= Player.list[i].x + threatSpawnRange && potentialY >= Player.list[i].y - threatSpawnRange && potentialY <= Player.list[i].y + threatSpawnRange){																		
			return false;
		}
	}
	return true;
}

function getTargetsInRangeOfShot(shooter, shot){
	var hitTargets = [];
	var blockHitTargets = [];
	var organicHitTargets = [];
	for (var i in Player.list){
		if (Player.list[i].team == 0)
			continue;
		var isHitTarget = entityHelpers.checkIfInLineOfShot(shooter, Player.list[i], shot); //Returns: {target:target,dist:(Distance for shot),distFromDiag:distFromDiag}
		if (isHitTarget){
			hitTargets.push(isHitTarget);
			organicHitTargets.push(isHitTarget);
		}	
	}
	var thugList = thug.getThugList();
	for (var i in thugList){
		var isHitTarget = entityHelpers.checkIfInLineOfShot(shooter, thugList[i], shot);
		if (isHitTarget){
			hitTargets.push(isHitTarget);
			organicHitTargets.push(isHitTarget);
		}	
	}					
	var blockList = block.getBlockList();
	for (var i in blockList){
		if (blockList[i].type == "normal" || blockList[i].type == "red" || blockList[i].type == "blue"){
			var isHitTarget = entityHelpers.checkIfInLineOfShot(shooter, blockList[i], shot);
			if (isHitTarget){
				hitTargets.push(isHitTarget);
				blockHitTargets.push(isHitTarget);
			}	
		}
	}				

	return {
		all:hitTargets,
		block:blockHitTargets,
		organic:organicHitTargets
	};


}

module.exports.connect = connect;
module.exports.getPlayerList = getPlayerList;
module.exports.playerDisconnect = playerDisconnect; //onDisconnect
module.exports.getPlayerById = getPlayerById;
module.exports.runPlayerEngines = runPlayerEngines;
module.exports.getPlayerListLength = getPlayerListLength;
module.exports.isSafeCoords = isSafeCoords;
module.exports.getHighestPlayerHordeKills = getHighestPlayerHordeKills;
module.exports.getTeamSize = getTeamSize;
module.exports.getTeamPlayerList = getTeamPlayerList;
module.exports.getEligiblePlayerList = getEligiblePlayerList;
module.exports.getAverageTeamPlayersCash = getAverageTeamPlayersCash;
module.exports.getActivePlayerListLength = getActivePlayerListLength;
