console.log("cognito.js loading");

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MM3TQ3F');

gtag('js', new Date());
gtag('config', 'AW-364156363');
function gtag_report_conversion(url) {
	var callback = function () {
	  if (typeof(url) != 'undefined') {
		window.location = url;
	  }
	};
	gtag('event', 'conversion', {
		'send_to': 'AW-364156363/Ri0qCNWWlZ4CEMur0q0B',
		'event_callback': callback
	});
	return false;
  }

  window.fbAsyncInit = function() {
    FB.init({
      appId      : '1193014997545418',
      xfbml      : true,
      version    : 'v12.0'
    });
    FB.AppEvents.logPageView();
  };

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));

  


var serverP = getUrlParam("server");
var processP = getUrlParam("process");
var socket = io(getSocketParams());
function getSocketParams(){
	if (serverP != "" && processP != ""){
		return { query: {"server": serverP,"process": processP}};
	}
	else {
		return {};
	}
}


const cognitoClientId = '70ru3b3jgosqa5fpre6khrislj';
const cognitoPoolId = 'us-east-2_SbevJL5zt';
var page = "";
var isWebServer = true;
var myIp = "";
var cognitoSub = "";
var username = "SomeGuy"; //myUsername
var partyId = "";
var userCash = 0;
var federatedUser = false;
var pcMode = 1;
var serverHomePage = "https://socketshot.io/";
var isLocal = false;
var defaultCustomizations = {red:{}, blue:{}};
var tempCognitoSub = "";
var isInParty = false; //implement

var iconSize = 15;

const teams = [
	1,
	2
];

const keycodeToCharRef = {8:"Backspace",9:"Tab",13:"Enter",16:"Shift",17:"Ctrl",18:"Alt",19:"Pause/Break",20:"Caps Lock",27:"Esc",32:"Space",33:"Page Up",34:"Page Down",35:"End",36:"Home",37:"Left",38:"Up",39:"Right",40:"Down",45:"Insert",46:"Delete",48:"0",49:"1",50:"2",51:"3",52:"4",53:"5",54:"6",55:"7",56:"8",57:"9",65:"A",66:"B",67:"C",68:"D",69:"E",70:"F",71:"G",72:"H",73:"I",74:"J",75:"K",76:"L",77:"M",78:"N",79:"O",80:"P",81:"Q",82:"R",83:"S",84:"T",85:"U",86:"V",87:"W",88:"X",89:"Y",90:"Z",91:"Windows",93:"Right Click",96:"Numpad 0",97:"Numpad 1",98:"Numpad 2",99:"Numpad 3",100:"Numpad 4",101:"Numpad 5",102:"Numpad 6",103:"Numpad 7",104:"Numpad 8",105:"Numpad 9",106:"Numpad *",107:"Numpad +",109:"Numpad -",110:"Numpad .",111:"Numpad /",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"Num Lock",145:"Scroll Lock",182:"My Computer",183:"My Calculator",186:";",187:"=",188:",",189:"-",190:".",191:"/",192:"`",219:"[",220:"\\",221:"]",222:"'"};
const keyCharToCodeRef = {"Backspace":8,"Tab":9,"Enter":13,"Shift":16,"Ctrl":17,"Alt":18,"Pause/Break":19,"Caps Lock":20,"Esc":27,"Space":32,"Page Up":33,"Page Down":34,"End":35,"Home":36,"Left":37,"Up":38,"Right":39,"Down":40,"Insert":45,"Delete":46,"0":48,"1":49,"2":50,"3":51,"4":52,"5":53,"6":54,"7":55,"8":56,"9":57,"A":65,"B":66,"C":67,"D":68,"E":69,"F":70,"G":71,"H":72,"I":73,"J":74,"K":75,"L":76,"M":77,"N":78,"O":79,"P":80,"Q":81,"R":82,"S":83,"T":84,"U":85,"V":86,"W":87,"X":88,"Y":89,"Z":90,"Windows":91,"Right Click":93,"Numpad 0":96,"Numpad 1":97,"Numpad 2":98,"Numpad 3":99,"Numpad 4":100,"Numpad 5":101,"Numpad 6":102,"Numpad 7":103,"Numpad 8":104,"Numpad 9":105,"Numpad *":106,"Numpad +":107,"Numpad -":109,"Numpad .":110,"Numpad /":111,"F1":112,"F2":113,"F3":114,"F4":115,"F5":116,"F6":117,"F7":118,"F8":119,"F9":120,"F10":121,"F11":122,"F12":123,"Num Lock":144,"Scroll Lock":145,"My Computer":182,"My Calculator":183,";":186,"=":187,",":188,"-":189,".":190,"/":191,"`":192,"[":219,"\\":220,"]":221,"'":222};


function getTokenFromUrlParameterAndLogin(){
	console.log("Getting tokens from url params and logging in...");
	var code = getUrlParam("code").substring(0,36);
	var cog_a = getUrlParam("cog_a");
	var cog_r = getUrlParam("cog_r");
	tempCognitoSub = getUrlParam("tempCognito");
	
    const validateTokenEndpoint = '/validateToken';
    const data = {
        code:code,
		cog_a:cog_a,
		cog_r:cog_r,
		tempCognitoSub:tempCognitoSub
    };
	
    $.post(validateTokenEndpoint, data, function(data, status){ //validation
        log("validateToken response:");
        console.log(data);
		cognitoSub = tempCognitoSub ? tempCognitoSub : data.cognitoSub;
		cognitoSub = String(cognitoSub);
		serverHomePage = data.serverHomePage;
		myIp = data.ip;
		console.log("About to make sure page(" + page + ") is game OR isLoggedIn:" + isLoggedIn());
		socket.emit('updateSocketInfo', cognitoSub);

		username = data.username;					
		isLocal = data.isLocal;
		if (isLocal){
			serverHomePage = "http://localhost:8080/";
		}

		if (data && data.username && isLoggedIn()){
			//Login Success
			if (data.cash)
				userCash = data.cash;

			updateCashHeaderDisplay(userCash);		
			
			federatedUser = data.federatedUser;
			defaultCustomizations = data.defaultCustomizations;

			setLocalStorage();
			getOnlineFriendsAndParty();	
			//loginSuccess(); wait for response from updateSocketInfo before triggering loginSuccess() -- socket.on('socketInfoUpdated')
	    }
		else {
			//loginFail();
		}
		setPcModeAndIsLocalElements({isLocal:data.isLocal, pcMode:data.pcMode});
		loginAlways();
		assessPerformance();
		if (page != "profile"){
			//removeUrlParams();
		}
    });
}

function assessPerformance(){
	if (gpu.tier == 0){
		show("warningBar");
	}
}

socket.on('socketInfoUpdated', function(data){
	log("socket info updated url:" +  data.url +" isWebServer:" + data.isWebServer);
	isWebServer = data.isWebServer;
	myIp = data.url.split(':')[0];
	log("Updated myIp:" +  myIp);
	if (isLoggedIn()){
		loginSuccess();
	}
	else {
		loginFail();
	}
});

function updateCashHeaderDisplay(cash){
	if (document.getElementById("cashHeaderValue")){
		document.getElementById("cashHeaderValue").innerHTML = getCashFormat(cash);
		show("cashHeaderDisplay");
	}
}

function getCashFormat(cash){
	return "$" + numberWithCommas(cash);
}

function updateProfileLink(){
	if (document.getElementById("menuRightLink")){
		var link = serverHomePage + "user/" + cognitoSub;
		var unsetUsernameHtml = "";
		if (username.indexOf("Facebook_") > -1 || username.indexOf("Google_") > -1){
			unsetUsernameHtml = "<span style='color:red'> [Click here to set Username] </span>";
			link += "/?view=username";
		}
		document.getElementById("menuRightLink").innerHTML = '<a href="' + link + '" style="" class="elecText" id="profileLink">' + unsetUsernameHtml + " Profile" + '&gt;</a>';
	}
}

function setPcModeAndIsLocalElements(data){
	pcMode = data.pcMode;
	var redirectUri = serverHomePage;
	if (data.isLocal == true || serverHomePage != "https://socketshot.io/"){
		redirectUri = "https://rw2.treatmetcalf.com/";
	}	
	
	if (document.getElementById("header")){
		if (document.getElementById("logInH")){
			document.getElementById("logInH").setAttribute("onclick","window.location.href='https://treatmetcalfgames.auth.us-east-2.amazoncognito.com/login?response_type=code&client_id=70ru3b3jgosqa5fpre6khrislj&redirect_uri=" + redirectUri + "'");
			document.getElementById("createAccountH").setAttribute("onclick","window.location.href='https://treatmetcalfgames.auth.us-east-2.amazoncognito.com/signup?response_type=code&client_id=70ru3b3jgosqa5fpre6khrislj&redirect_uri=" + redirectUri + "';");
		}
		if (document.getElementById("logIn")){
			document.getElementById("logIn").setAttribute("onclick","window.location.href='https://treatmetcalfgames.auth.us-east-2.amazoncognito.com/login?response_type=code&client_id=70ru3b3jgosqa5fpre6khrislj&redirect_uri=" + redirectUri + "'");
			document.getElementById("createAccount").setAttribute("onclick","window.location.href='https://treatmetcalfgames.auth.us-east-2.amazoncognito.com/signup?response_type=code&client_id=70ru3b3jgosqa5fpre6khrislj&redirect_uri=" + redirectUri + "';");
		}
		document.getElementById("titleText").innerHTML = "<a href='" + serverHomePage + "'><img src='/src/client/img/logo-trans.png'></a>";
	}
}

function getTokenUrlParams(){
	var tokenParams = "";
	if (getCookie("cog_a").length > 0){
		tokenParams += "&cog_a=" + getCookie("cog_a");
		tokenParams += "&cog_r=" + getCookie("cog_r");	
	}
	return tokenParams;
}

socket.on('reloadHomePage', function(){
	window.location.href = serverHomePage;
});

socket.on('redirect', function(url){
	window.location.href  = url;
});

socket.on('redirectToUrl', function(url){
	redirectToUrl(url);
});

function redirectToUrl(url){
	if (page == "game" || page == "trade"){
		console.log("ERROR - You were attempted to be summoned to another server/game, but you are in a game/trade currently");
		return;
	}
	url = url + getTokenUrlParams();
	logg("Redirecting webpage to " + url);
	window.location.href = url;
}


function autoPlayNow(){
	playNow();
}

function playNow(){
	if (!isLocal){		
		gtag_report_conversion();
	}
	
	log("playNow on this server");
	var options = {
		tempCognito:tempCognitoSub
	};
	console.log(options);
	
	var postUrl = serverHomePage + 'playNow?server=' + serverP + '&process=' + processP;
	if (isLocal) {
		postUrl = "/playNow";
	}
	$.post(postUrl, options, function(data,status){
		log("Play Now response:");
		console.log(data);		
		if (!data.success){
			alert(data.msg);
			window.location.href = serverHomePage;
		}
	});
}

function showMoreControls(){
	document.getElementById("controlsRowTwo").style.display = "inline-block";
	document.getElementById("learnToPlayMore").style.display = "none";
}

function getJoinableServer(options){

	console.log("Get Joinable Server to PLAY NOW. options.server:" + options.server);
	// if (cognitoSub == "")
	// 	return;
		
	options.partyId = partyId;
	options.cognitoSub = cognitoSub;
	options.username = username;
	if (options.privateServer){
		options.password = prompt("This server requires a password", "Enter Password");
	}

	if (options.server){
		logg("Attempting to join server with: ");
		console.log(options);
		hide("mainContent");
		show("gameLoader");
		$.post('/getJoinableServer', options, function(data,status){
			log("Join Server response:");
			console.log(data);		
			if (data.server){
				if (data.unregisteredPlayer){
					console.log("UNREGISTERED PLAYER DETECTED");
					window.location.href = data.server;
				} else {
					setTimeout(function(){ alert("Temporary error when joining game. If you try joining again, I'm sure it will work.");window.location.href = serverHomePage; }, 20000);
				}
			}
			else {
				alert(data.msg);
				window.location.href = serverHomePage;
			}
		});
	}
	else {
		logg("ERROR: No server option provided");
	}
}

function getOnlineFriendsAndParty(){	
	//Get friends
	const data = {
		cognitoSub:cognitoSub
	};
	if (page != "game"){
		$.post('/getOnlineFriends', data, function(data,status){
			//console.log("getOnlineFriends response:");
			//console.log(data);		
			updateOnlineFriendsSectionHtml(data);		
			waitingOnRequest = false;
		});
	}	
	//Get party
	$.post('/getParty', data, function(data,status){
		/*
		var data = {
			partyId:"12345",
			party:[{cognitoSub:"67890",username:"myman",leader:true}] //Party members including you
		};	
		*/
		//console.log("getParty response:");
		//console.log(data);	
		
		if (data && data.partyId){
			partyId = data.partyId;
		}
		else {
			partyId = "";
			return;
		}
		
		var partyData = transformToUIPartyData(data);
		
		if (page == "game"){return};
		updatePartySectionHtml(partyData);		
		if (page == "profile"){
			updateKickInviteToPartyButtons(partyData);
		}
		if (partyData.leader.cognitoSub && partyData.leader.cognitoSub != cognitoSub){
			show("serversHiddenMsg");
			hide("serverList");
		}
		else {
			showUnset("serverList");
			hide("serversHiddenMsg");
		}
	});
}

function transformToUIPartyData(data){
	var partyData = {
		leader: {},
		party: []
	};
	for (var p = 0; p < data.party.length; p++){
		if (data.party[p].leader == true){
			partyData.leader = data.party[p];
		}
		if (data.party[p].cognitoSub != cognitoSub && data.party[p].leader != true){
			partyData.party.push(data.party[p]);
		}
	}
	return partyData;
}

function updateOnlineFriendsSectionHtml(friends){
	if (!document.getElementById("onlineFriendsSection")){return;}
	var section = document.getElementById("onlineFriendsSection");
	var html = "<span>Online friends [" + friends.length + "]";	
	if (friends.length > 0){
		html += ": </span>";
		for (var i = 0; i < friends.length; i++){
			html += " <a href='" + serverHomePage + "user/" + friends[i].cognitoSub + "'>" + friends[i].username + "</a> "
		}
		section.style.display = "";
	}
	else {
		section.style.display = "none"; //Hide online friends section in case of zero friends online
		html += "</span>";
	}
	section.innerHTML = html;
}

/*var partyData = {
	leader:{cognitoSub:"12345",username:"myguy"},
	party:[{cognitoSub:"67890",username:"myman"}] //Party members excluding you 07/2020
};*/
function updatePartySectionHtml(partyData){
	if (!document.getElementById("partySection")){return;}
	var section = document.getElementById("partySection");	
	var html = "";

	section.style.display = 'unset';
	if ((partyData.leader.cognitoSub == cognitoSub && partyData.party.length <= 0) || !partyData.leader.cognitoSub){
		//Solo party
		section.style.display = 'none';
		return;
	}	
	else if (partyData.leader.cognitoSub == cognitoSub && partyData.party.length > 0){
		//Party leader with party members
		html += "<span title='Party Leader'>👑 Players in your party: </span>";			
		if (partyData.party.length > 0){
			for (var i = 0; i < partyData.party.length; i++){
				html += " <a href='" + serverHomePage + "user/" + partyData.party[i].cognitoSub + "'>" + partyData.party[i].username + "</a> ";
			}
		}
	}
	else {
		//In another player's party
		html += "<span>You are in </span> ";
		html += "<a href='" + serverHomePage + "user/" + partyData.leader.cognitoSub + "'>" + partyData.leader.username + "'s </a> <span> party </span>";
		if (partyData.party.length > 0){
			html += " <span> with </span>";
			for (var i = 0; i < partyData.party.length; i++){
				html += " <a href='" + serverHomePage + "user/" + partyData.party[i].cognitoSub + "'>" + partyData.party[i].username + "</a> ";
			}
		}
	}
	html += " <button id='leavePartyButton' class='RWButton' onclick='leavePartyButtonClick(\"" + partyData.leader.cognitoSub + "\")'>Leave</button>";
	section.innerHTML = html;
}

function getRequests(){
	const data = {
		cognitoSub:cognitoSub
	};
	$.post('/getRequests', data, function(data,status){
		/*
		data.friendRequests = [
			{cognitoSub:12345, username:abcd},
			{cognitoSub:12345, username:abcd}
		];
		data.partyRequests = [
			{cognitoSub:12345, username:abcd},
			{cognitoSub:12345, username:abcd}
		];
		*/
		updateRequestsSectionHtml(data);
		//console.log("getRequests response:");
		//console.log(data);		
	});
}

function updateRequestsSectionHtml(data){	
	if (document.getElementById("invitesBar") && (data.party.length > 0 || data.friend.length > 0)){

		if (data.friend.length > 0){document.getElementById("invitesBar").style.backgroundColor = '#153e17';}
			else {document.getElementById("friendInvitesSection").style.display = 'none';}
		if (data.party.length > 0){document.getElementById("invitesBar").style.backgroundColor = '#003461';}
			else {document.getElementById("partyInvitesSection").style.display = 'none';}
		document.getElementById("invitesBar").style.display = 'inline-block';
		
		var friendRequestsHtml = "<span>Friend Requests: </span>";	
		for (var f = 0; f < data.friend.length; f++){
			friendRequestsHtml += "<span> [ </span><a href='" + serverHomePage + "user/" + data.friend[f].cognitoSub + "'>" + data.friend[f].username + "</a> ";
			friendRequestsHtml += "<a class='accept' id='friendAccept' onclick='friendAcceptClick(\"" + data.friend[f]._id + "\")'>Accept</a> <a class='decline' id='friendDecline' onclick='requestDeclineClick(\"" + data.friend[f]._id + "\")'>Decline</a>";
			friendRequestsHtml += "<span> ] </span>";
		}
		document.getElementById("friendInvitesSection").innerHTML = friendRequestsHtml;
		
		var partyRequestsHtml = "";	
		for (var f = 0; f < data.party.length; f++){
			partyRequestsHtml += "<span> [ </span><a href='" + serverHomePage + "user/" + data.party[f].cognitoSub + "'>" + data.party[f].username + "</a><span> invited you to a party </span>";
			partyRequestsHtml += "<a class='accept' id='partyAccept' onclick='partyAcceptClick(\"" + data.party[f]._id + "\")'>Accept</a> <a class='decline' id='partyDecline' onclick='requestDeclineClick(\"" + data.party[f]._id + "\")'>Decline</a>";
			partyRequestsHtml += "<span> ] </span>";
		}
		populateHTML("partyInvitesSection", partyRequestsHtml);
	}
	if (data.trade.length > 0){
		showBlock("tradeInvitesSection");
		var tradeRequestsHtml = "";	
		for (var f = 0; f < data.trade.length; f++){
			tradeRequestsHtml += "<span> [ </span><a href='" + serverHomePage + "user/" + data.trade[f].cognitoSub + "'>" + data.trade[f].username + "</a><span> invited you to a trade </span>";
			tradeRequestsHtml += "<a class='accept' id='tradeAccept' onclick='tradeAcceptClick(\"" + data.trade[f]._id + "\")'>Accept</a> <a class='decline' id='tradeDecline' onclick='requestDeclineClick(\"" + data.trade[f]._id + "\")'>Decline</a>";
			tradeRequestsHtml += "<span> ] </span>";
		}
		populateHTML("tradeInvitesSection", tradeRequestsHtml);
	}
}

//Leaves if member, ends party if leader
function leavePartyButtonClick(userPartyId){
	const params = {
		partyId:userPartyId,
		cognitoSub:cognitoSub
	};
	
	$.post('/leaveParty', params, function(data,status){
		console.log("leaveParty endpoint response from server:");
		console.log(data);		
		window.location.reload();
	});	
}



function getPerformanceInstrucitons(){
	var isFirefox = typeof InstallTrigger !== 'undefined';
	var browser = "Chrome";
	if (isFirefox){
		browser = "Firefox";
	}

	var html = "";
	html += '<img class="perfCloseIcon" src="/src/client/img/icons/close.png" onclick=\'hide("performanceInstructions")\'>';
	html += '<div id="unplayableHeader" class="redFlashing">Unplayable conditions detected! Follow these performance instructions!</div><br>';
	html += '1. Game performs best in Google Chrome or Firefox <span style="font-weight: normal;">[If one doesn’t work, try the other]</span><br><br>';
	html += '2. Make sure hardware acceleration is enabled in ' + browser + '’s settings:';
	html += '<div id="hardwareAccelGif">';

	if (isFirefox){
		html +=  '<div style="position:relative; padding-bottom:calc(56.25% + 44px)"><iframe src="https://gfycat.com/ifr/SillyConsiderateIchidna?hd=1&controls=0" frameborder="0" scrolling="no" width="100%" height="100%" style="position:absolute;top:0;left:0;" allowfullscreen></iframe></div>';
	}
	else {
		html +=  '<div style="position:relative; padding-bottom:calc(56.25% + 44px)"><iframe src="https://gfycat.com/ifr/HopefulWildBuffalo?hd=1&controls=0" frameborder="0" scrolling="no" width="100%" height="100%" style="position:absolute;top:0;left:0;" allowfullscreen></iframe></div>';
	}
	
	html +=  '</div><br><br>';
	html +=  '3. Close other browser tabs; Close other CPU intensive applications<br><br>';
	if (page == "game")
		html +=  '4. Use Low Graphics mode: <button id="lowGraphcsModeButton" style="background-color: #818181;" class="RWButton" onclick="reallyLowGraphicsToggle()">Low Graphics Mode [Off]</button><br><br>';
	html +=  '5. Connect to internet with ethernet cable instead of wifi<br><br>';
	html +=  '<div id="closePerfInstructions"><a href="#" style="font-size: 16px;" onclick=\'hide("performanceInstructions")\'>Click here to close these instructions</a></div>';
	return html;
}

function reallyLowGraphicsToggle(setting){
	if (typeof reallyLowGraphicsMode === 'undefined')
		return;

	if (typeof setting === 'undefined'){
		if (reallyLowGraphicsMode){
			setting = false;
		}
		else {
			setting = true;
		}
	}
		
	if (setting === false){
		console.log("Setting to low graphics FALSE");
		setCookie("lowGraphics", "false");
		reallyLowGraphicsMode = false;
		bodyLimit = 16;
		document.getElementById("lowGraphcsModeButton").innerHTML = 'Low Graphics Mode [OFF]';
		document.getElementById("lowGraphcsModeButton").style.backgroundColor = "#529eec";
		if (document.getElementById("lowGraphcsModeButtonSide")){
			document.getElementById("lowGraphcsModeButtonSide").innerHTML = 'Low Graphics Mode [OFF]';
			document.getElementById("lowGraphcsModeButtonSide").style.backgroundColor = "#529eec";
		}
	}
	else {
		console.log("Setting to low graphics TRUE");
		reallyLowGraphicsMode = true;
		setCookie("lowGraphics", "true");
		bodyLimit = 2;
		Body.list = [];
		document.getElementById("lowGraphcsModeButton").innerHTML = 'Low Graphics Mode [ON]';
		document.getElementById("lowGraphcsModeButton").style.backgroundColor = "#3a71a8";
		if (document.getElementById("lowGraphcsModeButtonSide")){
			document.getElementById("lowGraphcsModeButtonSide").innerHTML = 'Low Graphics Mode [ON]';
			document.getElementById("lowGraphcsModeButtonSide").style.backgroundColor = "#3a71a8";
		}
	}
}

function showPerformanceInstructionsHeader(){
	if (document.getElementById('performanceInstructions') && (document.getElementById('performanceInstructions').style.display == '' || document.getElementById('performanceInstructions').style.display == 'none')){
		document.getElementById('performanceInstructions').innerHTML = getPerformanceInstrucitons();
		show('performanceInstructions');
	}
	else {
		hide('performanceInstructions');
	}
}

function friendAcceptClick(id){
	const params = {
		type:"friend",
		id:id,
		accept:true
	};
	
	$.post('/requestResponse', params, function(data,status){
		console.log("requestResponse (friend accept) endpoint response from server:");
		console.log(data);		
		window.location.reload();
	});
}

function partyAcceptClick(id){
	const params = {
		type:"party",
		id:id,
		accept:true
	};
	
	$.post('/requestResponse', params, function(data,status){
		console.log("requestResponse (party accept) endpoint response from server:");
		console.log(data);		
		window.location.reload();
	});
}

function requestDeclineClick(id){
	const params = {
		id:id,
		accept:false
	};
	
	$.post('/requestResponse', params, function(data,status){
		console.log("requestResponse (decline) endpoint response from server:");
		console.log(data);		
		window.location.reload();
	});
}

//acceptTradeClick
function tradeAcceptClick(id){
	const params = {
		type:"trade",
		id:id,
		accept:true
	};
	
	console.log("Accepted Trade request, awaiting response from server");
	$.post('/requestResponse', params, function(data,status){
		console.log("requestResponse (party accept) endpoint response from server:");
		console.log(data);		
		if (data.error){
			alert(data.error);
		}
		else {
			//window.location.href = data.url; //redirection happens server-side
		}
	});
}

function isValidUsername(newUsername){
    if (newUsername == "Username" || newUsername == ""){
        return false;        
    }
    else if (newUsername.length < 3){
        alert("Please enter a Username that is at least 3 characters long.");
        return false;
    }
    else if (newUsername.length > 15){
        alert("Username is too long.\nPlease enter a Username that is less than 15 characters.");
        return false;
    }
    else if (!isValid(newUsername) || newUsername.indexOf(' ') > -1 || newUsername.indexOf('@') > -1 || newUsername.indexOf('%') > -1 || newUsername.indexOf(')') > -1 || newUsername.indexOf('(') > -1 || newUsername.indexOf('}') > -1 || newUsername.indexOf('{') > -1 || newUsername.indexOf('nigger') > -1 || newUsername.indexOf('cunt') > -1){
        alert("Spaces and special characters (\"@\", \"%\", etc) are not allowed in Usernames.");
        return false;
    }

    return true;
}

function isValid(str){
 return !/[~`!#$%\^&*+=\[\]\\';,\/{}|\\"@:<>\?]/g.test(str);
}


//Unused
function setCookie(cname, cvalue, exdays = 90) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function setLocalStorage(){
    var keyPrefix = 'CognitoIdentityServiceProvider.' + cognitoClientId;
    var lastUserKey = keyPrefix + '.LastAuthUser';
    localStorage.setItem(lastUserKey, username);
}

function logOutClick(){
	cognitoSub = "";
    $.post('/logOut', {}, function(data,status){
		if (page == "trade"){
			window.location = serverHomePage;
		}
		else {
			window.location.reload();
		}
    });
}

function showLocalElements(){
  $(document).ready(function() {
    if (window.location.href.indexOf("localhost") > -1) {
      showUnset("localPlayNow");
    }
  });
}

function localClick(){


}

function showDefaultLoginButtons(){
	if (page == "game"){return;}
    show("createAccountH");
    show("logInH");
    show("playNowH");
    document.getElementById("playNowH").innerHTML = "Play as Guest";
    document.getElementById("logOutH").style.display = "none";
    if (document.getElementById('userWelcomeText')){
        document.getElementById('userWelcomeText').style.display = "none";
	}
}

function showAuthorizedLoginButtons(){
	if (page == "game"){return;}
    hide("createAccountH");
    hide("logInH");
    showUnset("playNowH");
    show("partyUpMessage");
    showUnset("logOutH");
    if (document.getElementById('userWelcomeText')){
        var printedUsername = username.substring(0,15);
		document.getElementById('userWelcomeText').innerHTML = getUserWelcomeHTML(printedUsername);	
		document.getElementById('userWelcomeText').style.display = "inline-block";
		buildHeaderMessagingLink();
	}
}

function getUserWelcomeHTML(printedUsername){
	var HTML = "";
	var linky = "/user/" + cognitoSub;


	if (printedUsername.includes("Facebook_") || printedUsername.includes("Google_") && !getUrl().includes(cognitoSub)){
		printedUsername += " - <span style='color:red; text-decoration-color: red;'>[click here to update username]</span>"
		linky += "/?view=username";
	}
	HTML += "<span>Logged in as </span>" + "<a href='" + linky + "'>" + printedUsername + "</a>";
	return HTML;
}

function buildHeaderMessagingLink(){
	if (page == "messaging"){return;}

	var params = {
        cognitoSub:cognitoSub,
	};
	
    $.get('/getConversations', params, function(data){
        logg("getConversations RESPONSE:");
        console.log(data);
        if (!data.result){
            alert("Error retrieving user conversations." + data.error);
            cb(false);
        }
        else { //success            
            // globalConversations = convertToClientConversations(data.result);
            // buildConversationsHTML(globalConversations);
			// cb(true);
			var convos = convertToClientConversations(data.result);
			var unreads = 0;
			var conversationId = false;
			for (var c = 0; c < convos.length; c++){
				if (convos[c].myUnreads){
					conversationId = convos[c].id;
					unreads += convos[c].myUnreads;
				}
			}
			if (unreads){document.getElementById("messagingLink").className = "messagingLinkUnreads";}
			document.getElementById("messagingLink").innerHTML = getMessagingLinkHTML(unreads, conversationId);
			show("messagingLink");
        }
    });
}

function getMessagingLinkHTML(unreads, conversationId = false){
	var HTML = "";
	var msgLink = "/messaging";
	if (conversationId){msgLink += "/?conversationId=" + conversationId;}
	if (unreads){
		HTML += "<a href='" + msgLink + "'>✉ [" + unreads + "]</a>";
	}
	else {
		HTML += "<a href='" + msgLink + "'>✉</a>";
	}
	return HTML;
}

function convertToClientConversations(conversations){
    var convertedConversations = [];

    for (var c = 0; c<conversations.length; c++){
        var isUserOne = false;
        if (conversations[c].userOneCognitoSub == cognitoSub){isUserOne = true;}

        if (isUserOne){
            conversations[c].myUnreads = conversations[c].userOneUnreads;
            conversations[c].partnerUsername = conversations[c].userTwoUsername;
            conversations[c].partnerCognitoSub = conversations[c].userTwoCognitoSub;
        }
        else {
            conversations[c].myUnreads = conversations[c].userTwoUnreads;
            conversations[c].partnerUsername = conversations[c].userOneUsername;
            conversations[c].partnerCognitoSub = conversations[c].userOneCognitoSub;
        }

        delete conversations[c].userOneUnreads;
        delete conversations[c].userTwoUnreads;
        delete conversations[c].userTwoUsername;
        delete conversations[c].userOneUsername;
        delete conversations[c].userOneCognitoSub;
        delete conversations[c].userTwoCognitoSub;

        convertedConversations.push(conversations[c]);
    }
    console.log(convertedConversations);
    return convertedConversations;
}

function showSecondaySectionTitles(){
	document.getElementById('sectionTitle2').style.display = 'inline-block';
	document.getElementById('sectionTitle3').style.display = 'inline-block';	
}

function getUrlParam(parameter, defaultvalue = ""){
    var urlparameter = defaultvalue;
    if(window.location.href.indexOf(parameter) > -1){
        urlparameter = getUrlVars()[parameter];
        }
    return urlparameter;
}


function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function getUrl(){ //Get server Ip, myIp, myUrl
    return window.location.pathname;
}

function removeUrlParams(){
	var uri = window.location.toString();
	if (uri.indexOf("?") > 0) {
		var clean_uri = uri.substring(0, uri.indexOf("?"));
		window.history.replaceState({}, document.title, clean_uri);
	}
}

function getCognitoUser(){
	    var userData = {
            Username: username,
            Pool: getCognitoUserPool()
        };
        return new AmazonCognitoIdentity.CognitoUser(userData);
}

function getCognitoUserPool(){
	var poolData = {
		UserPoolId:cognitoPoolId,
		ClientId:cognitoClientId
	};
	return new AmazonCognitoIdentity.CognitoUserPool(poolData);
}

if (document.getElementById("playerSearchForm")){
	document.getElementById("playerSearchForm").onsubmit = function(e){
		submitPlayerSearch(e);
	}
}

function submitPlayerSearch(e){ //Used in header as well
	e.preventDefault();
	if (!isValid(e.target.elements[0].value)){
		alert("Invalid character (\"$\", \"%\", \";\", \"{\", etc) in search. Please remove character and try again.");
		return;
	}
	if (e.target.elements[0].value.length <= 2){
		alert("Search must be at least 3 characters long.");
		return;		
	}
	window.location.href = serverHomePage + "search/" + e.target.elements[0].value;
}

function localPlayNowClick(){
	socket.emit('test', "123456");
	//window.location.href = '/?join=true';
}

function show(element){
	//log("Showing element: " + element);
	if (document.getElementById(element)) {
		document.getElementById(element).style.display = "inline-block";
	}
}

function showUnset(element){
	if (document.getElementById(element)) {
		document.getElementById(element).style.display = "unset";
	}
}

function showBlock(element){
	if (document.getElementById(element)) {
		document.getElementById(element).style.display = "block";
	}
}

function hide(element){
	if (document.getElementById(element)) {
		document.getElementById(element).style.display = "none";
	}
}

//EVERY 1 SECOND
const headerRefreshSeconds = 10;
var headerRefreshTicker = headerRefreshSeconds;
var waitingOnRequest = false;
setInterval( 
	function(){	
	
		//Refresh header
		if (document.getElementById("header") && document.getElementById("header").style.display != 'none' && isLoggedIn() && page != "trade"){
			headerRefreshTicker--;
			if (headerRefreshTicker < 1){
				//logg("Refreshing header");
				getRequests();
				if (!waitingOnRequest){
					getOnlineFriendsAndParty();
					if (page == "home")
						getServerList();
				}
				waitingOnRequest = true;
				if (page == "profile"){
					checkViewedProfileIsFriendOrParty();
				}
				
				headerRefreshTicker = headerRefreshSeconds;
			}
		}
	},
	1000/1 //Ticks per second
);

function isLoggedIn(){
	if (cognitoSub.length > 0 && cognitoSub.substring(0,2) != "0."){
		//logg("Determined user is logged in");
		return true;
	}

	//if (cognitoSub.substring(0,2) == "0.")
		//logg("User not logged in, temp cognitoSub in use:" + cognitoSub);
	//if (cognitoSub.length == 0)
		//logg("User not logged in, no cognitoSub set");

	return false;
}

//Shared Functions handy handy
function getCountInArray(string, array){
    var count = 0;
    if (!array || !array.length)
        return count;
    
    for (var i = 0; i < array.length; i++){
        if (array[i] == string)
            count++;
    }

	return count;
}

function numberWithCommas(x) {
	if (x.typeOf == 'undefined'){
		return "";
	}
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function removeIndexesFromArray(array, indexes){
	for (var i = 0; i < indexes.length; i++){
		array.splice(indexes[i], 1);
	}
	return array;
}

function capitalizeFirstLetter(str){
	if (!str){
		logg("ERROR CAPITALIZING FIRST LETTER OF STRING!");
		return "";
	}
	return str.charAt(0).toUpperCase() + str.slice(1);
}

Element.prototype.getElementById = function(req) {
    var elem = this, children = elem.childNodes, i, len, id;
 
    for (i = 0, len = children.length; i < len; i++) {
        elem = children[i];
        
        //we only want real elements
        if (elem.nodeType !== 1 )
            continue;

        id = elem.id || elem.getAttribute('id');
        
        if (id === req) {
            return elem;
        }
        //recursion ftw
        //find the correct element (or nothing) within the child node
        id = elem.getElementById(req);

        if (id)
            return id;
    }
    //no match found, return null
    return null;
}

//Function to convert rgb color to hex format
function rgb2hex(rgb) {
	if (!rgb)
		return "#FFFFFF";
 rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
 return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

function hex(x) {
  return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
}
var hexDigits = new Array
        ("0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"); 


function drawName(drawingCanvas, playerUsername, color, x, y, icon = false, stroke = false){
	drawingCanvas.save();
        drawingCanvas.textAlign="center";
        drawingCanvas.font = 'bold 12px Electrolize';        
		drawingCanvas.fillStyle = color;
		drawingCanvas.shadowColor = "#FFFFFF";
		drawingCanvas.shadowOffsetX = 0; 
		drawingCanvas.shadowOffsetY = 0;
		drawingCanvas.shadowBlur = 3;

		var txtWidth = drawingCanvas.measureText(playerUsername).width;
		if (icon){
			icon.width = iconSize;
			icon.height = iconSize;
			x += icon.width/2;
			drawIcon(drawingCanvas, icon, x - (icon.width) - txtWidth/2 - 1, y - (icon.height/2) - 4, icon.width, icon.height);
		}
		if (stroke){
			drawingCanvas.strokeStyle = "#FFF";
			ctx.lineWidth  = 1;
			drawingCanvas.strokeText(playerUsername, x, y); 
		}

		drawingCanvas.fillText(playerUsername, x, y); 
	drawingCanvas.restore();
}

function drawIcon(drawingCanvas, icon, x, y, width = false, height = false){
	if (page == "game" && (countdownToRedrawGraphics > -1 && countdownToRedrawGraphics < 4)){
		return;
	}
		

	if (!icon || !drawingCanvas)
		return;
	if (!width || !height){
		width = iconSize;
		height = iconSize;
	}
	drawingCanvas.drawImage(icon, x, y, width, height);
}

function getUserIconImg(iconCanvasValue, team, cb){
    if (iconCanvasValue == "none" || iconCanvasValue == "rank"){
        cb(false, team);
		return;
    }
    var iconImg = new Image();
    iconImg.src = "/src/client/img/dynamic/icon/" + iconCanvasValue + ".png";
	loadImages([iconImg.src], function(invalidSrcPaths){
    	cb(iconImg, team);
	});
}

//imgArr is a list of strings containing the paths to images (src property)
function loadImages(imgArr,callback) {
	//Keep track of the images that are loaded
	var imagesLoaded = 0;
	var invalidSrcPaths = [];
	if (!imgArr || imgArr.length == 0){callback([]); return;}
	async function _loadAllImages(callback){
		//console.log("Slept on " + imagesLoaded + " " + imgArr[imagesLoaded]);

		//Create an temp image and load the url
		var img = new Image();
		$(img).attr('src',imgArr[imagesLoaded]); //Second parameter must be the src of the image

		//log("loading " + imagesLoaded + "/" + imgArr.length + " " + img.src);
		if (img.complete || img.readyState === 4) {
			//log("CACHED " + (imagesLoaded + 1) + "/" + imgArr.length + " " + img.src);
			// image is cached
			imagesLoaded++;
			//Check if all images are loaded
			if(imagesLoaded == imgArr.length) {
				//If all images loaded do the callback
				callback(invalidSrcPaths);
			} else {
				//If not all images are loaded call own function again
				_loadAllImages(callback);
			}
		} else {
			$(img).load(function(){
				//log("DONE " + imagesLoaded + "/" + imgArr.length + " " + img.src);
				//Increment the images loaded variable
				imagesLoaded++;
				//Check if all images are loaded
				if(imagesLoaded == imgArr.length) {
					//If all images loaded do the callback
					callback(invalidSrcPaths);
				} else {
					//If not all images are loaded call own function again
					_loadAllImages(callback);
				}
			});
			$(img).error(function(){
				log("ERROR LOADING IMAGE AT PATH : " + img.src);
				invalidSrcPaths.push(img.src);
				imagesLoaded++;
				if(imagesLoaded == imgArr.length) {
					callback(invalidSrcPaths);
				} else {
					_loadAllImages(callback);
				}
			});


		}
	};		
	_loadAllImages(callback);
}

function getRankFromRating(rating){
	if (!rating)
		return {rank:"bronze1", floor:0, nextRank:"bronze2", ceiling:100};
		
	const rankings = [
		{rank:"bronze1",rating:0},
		{rank:"bronze2",rating:100},
		{rank:"bronze3",rating:200},
		{rank:"silver1",rating:300},
		{rank:"silver2",rating:500},
		{rank:"silver3",rating:700},
		{rank:"gold1",rating:1000},
		{rank:"gold2",rating:1300},
		{rank:"gold3",rating:1600},
		{rank:"diamond",rating:2000},
		{rank:"diamond2",rating:9999}
	];

	for (var r in rankings){
		var rPlus = parseInt(r)+1; //ToInt32
		var rMinus = parseInt(r)-1;
		if (rating < rankings[rPlus].rating){
			log(rankings[r].rank + " is his rank");
			var response = {rank:rankings[r].rank, floor:rankings[r].rating, previousRank:"bronze1", nextRank:"diamond2", ceiling:9999};
			if (rankings[rPlus]){
				response.nextRank = rankings[rPlus].rank;
				response.ceiling = rankings[rPlus].rating;
			}
			if (rankings[rMinus]){
				response.previousRank = rankings[rMinus].rank;
			}
			return response;
		}		
	}
	return {rank:"bronze1", floor:0, nextRank:"bronze2", ceiling:100};
}

function randomInt(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function unHydrateSettings(data){
    var keybindingSettings = data.keybindings;
    if (keybindingSettings){
        for (var r = 0; r < keybindingSettings.length; r++){
            delete keybindingSettings[r].default;
            delete keybindingSettings[r].actionName;
        }
        data.keybindings = keybindingSettings;
    }
    return data;
}

function hydrateKeybindingSettings(data){
    for (var r = 0; r < data.length; r++){
        switch (data[r].action){
            case "moveUp":
                data[r].actionName = "Move Up";
                data[r].default = 87;
                break;
            case "moveRight":
                data[r].actionName = "Move Right";
                data[r].default = 68;
                break;
            case "moveDown":
                data[r].actionName = "Move Down";
                data[r].default = 83;
                break;
            case "moveLeft":
                data[r].actionName = "Move Left";
                data[r].default = 65;
                break;
            case "shootUp":
                data[r].actionName = "Shoot Up";
                data[r].default = 38;
                break;
            case "shootRight":
                data[r].actionName = "Shoot Right";
                data[r].default = 39;
                break;
            case "shootDown":
                data[r].actionName = "Shoot Down";
                data[r].default = 40;
                break;
            case "shootLeft":
                data[r].actionName = "Shoot Left";
                data[r].default = 37;
                break;
            case "action":
                data[r].actionName = "Boost/Cloak";
                data[r].default = 32;
                break;
            case "swapLeft":
                data[r].actionName = "Prev. Weapon";
                data[r].default = 81;
                break;
            case "swapRight":
                data[r].actionName = "Next Weapon";
                data[r].default = 69;
                break;
            case "reload":
                data[r].actionName = "Reload";
                data[r].default = 82;
                break;
            case "look":
                data[r].actionName = "Utility";
                data[r].default = 16;
                break;
            case "weapon1":
                data[r].actionName = "Weapon 1";
                data[r].default = 49;
                break;
            case "weapon2":
                data[r].actionName = "Weapon 2";
                data[r].default = 50;
                break;
            case "weapon3":
                data[r].actionName = "Weapon 3";
                data[r].default = 51;
                break;
            case "weapon4":
                data[r].actionName = "Weapon 4";
                data[r].default = 52;
                break;
            case "chat":
                data[r].actionName = "Chat";
                data[r].default = 13;
                break;
            default:
                break;
        }
    }
    return data;
}

function sleep(ms){ //sleep
	return new Promise(resolve => setTimeout(resolve, ms));
}

//hydrate HTML populate HTML
function populateHTML(id, content){
	if (document.getElementById(id)){
		document.getElementById(id).innerHTML = content;
	}
}

////////////////////////User Customization Stuff//////////////////////////
function createCustomizationOptionDivs(){
    var div = document.getElementById("appearanceOptions");
    var categoryTabsHTML = '<div id="appearaceCategoryTabs" class="tab">';
    var categoryHTML = "";
    for (const category in customizationOptions.items){
        categoryTabsHTML += getCategoryTabHTML(category);

        var categoryDiv = category + "Div";
        var activeText = "";
        if (category == "hat"){activeText = " active";}
		
        categoryHTML += '<div id="' + categoryDiv + '" class="tabcontent' + activeText + '"></div>';
 	}
	categoryTabsHTML += "</div>";
	
	div.innerHTML = categoryTabsHTML + categoryHTML;
}

function getCustomizationOptions(requestCognitoSub, cb){
	$.get( '/getUserCustomizationOptions', {cognitoSub:requestCognitoSub}, function(data) {
		logg("GET CUSTOMIZATION OPTIONS RESPONSE:");
		console.log(data);
		cb(data);
	});    
}


function populateCustomizationOptions(disableDefaultItems = false){
    var options = customizationOptions;

    var div = document.getElementById("appearanceOptions");

    for (const category in options.items){
        var categoryDiv = category + "Div";
		if (!document.getElementById(categoryDiv)){console.log("ERROR - DIV NOT CREATED"); continue;}
		var categoryContentHTML = "";

		var itemsInCategory = [];
        for (const subCategory in options.items[category]){
            var displaySubCategory = capitalizeFirstLetter(subCategory);
            if (subCategory == "type"){displaySubCategory = "";}
            categoryContentHTML += "<div class='shopCategory'>" + displaySubCategory + "</div>"

			options.items[category][subCategory] = options.items[category][subCategory].sort(
				function (item1, item2){
					return item1.rarity - item2.rarity;
				}
            );
            for (const item in options.items[category][subCategory]){
				itemsInCategory.push(options.items[category][subCategory][item]);
                var active = false;

				if (typeof displayTeam != 'undefined'){
					if ((displayTeam == 1 && options.items[category][subCategory][item].team == 2) || (displayTeam == 2 && options.items[category][subCategory][item].team == 1)){continue;}

					if (currentCustomizations[displayTeam][category + displaySubCategory] == options.items[category][subCategory][item].canvasValue ||
					(options.items[category][subCategory][item].canvasValue == "rank" && currentCustomizations[displayTeam][category + displaySubCategory] == viewedProfileRank) ||
					(subCategory == "pistol" && currentCustomizations[displayTeam]["pistolColor"] == options.items[category][subCategory][item].canvasValue) ||
					(subCategory == "dualPistols" && currentCustomizations[displayTeam]["dpColor"] == options.items[category][subCategory][item].canvasValue) ||
					(subCategory == "machineGun" && currentCustomizations[displayTeam]["mgColor"] == options.items[category][subCategory][item].canvasValue) ||
					(subCategory == "shotgun" && currentCustomizations[displayTeam]["sgColor"] == options.items[category][subCategory][item].canvasValue)
					){
						active = true;
					}
				}
               
                options.items[category][subCategory][item].customizationCategory = category + displaySubCategory;
                if (subCategory == "pistol"){ options.items[category][subCategory][item].customizationCategory = "pistolColor";}
                if (subCategory == "dualPistols"){ options.items[category][subCategory][item].customizationCategory = "dpColor";}
                if (subCategory == "machineGun"){ options.items[category][subCategory][item].customizationCategory = "mgColor";}
                if (subCategory == "shotgun"){ options.items[category][subCategory][item].customizationCategory = "sgColor";}
				options.items[category][subCategory][item].subCategory = subCategory;
				var type = "customizationOptions";
				if (page == "trade"){
					type = "tradeListOwned";
				}
                categoryContentHTML += getShopItemHTML(options.items[category][subCategory][item], active, type, disableDefaultItems);
            }
        }
		document.getElementById(categoryDiv).innerHTML = categoryContentHTML;
		drawShopIcons(categoryDiv, itemsInCategory);
    }

    
    

    // //draw on icon canvases
    // for (const team in options){
    //     if (team == "fullList"){continue;}
    //     for (const category in options[team]){
	// 		for (const subCategory in options[team][category]){
    //             for (const item in options[team][category][subCategory]){
    //                 //Logic for not drawing if already drawn
    //                     drawShopIcon(options[team][category][subCategory][item] + "Canvas", options[team][category][subCategory][item]);
    //             }
    //         }
    //     }
    // }   
}

function getCanvasDiv(){
}

function getCategoryTabHTML(category){
    return '<button class="tablinks" id="' + category + '" onclick="showContent(\'' + category + '\')">' + capitalizeFirstLetter(category) + '</button>';
}

function getShopItemHTML(item, active, type, disableDefaultItems = false, cashValue = 0){
	var isInShop = false;
	if (type == "shop"){
		isInShop = true;
	}

	var shopItemClass = "shopItem";
	if (type == "customizationOptions"){shopItemClass += " customizeItem"}
    var shopIconClass = "shopIcon";
    if (active){
        shopItemClass += " active";
        shopIconClass += " active";
    }

    var ownedHTML = "";
    var ownedCount = item.ownedCount;
    if (ownedCount > 0){
        if (isInShop){
            ownedHTML += " | ";
        }
        ownedHTML += "[" + ownedCount + " owned]";
        if (!isInShop && item.text){ //No need for break if no description subtext
            ownedHTML = "<br>" + ownedHTML;
        }
        if (!isInShop && ownedCount < 2){
            ownedHTML = "";
        }
	}

	var disabledStyle = "";
	if (disableDefaultItems && item.defaultItem){
		disabledStyle = "style='background-color: black;pointer-events: none;'";
	}
	

	const shopItemDivId = item.id + capitalizeFirstLetter(type);
    var HTML = "<div id='" + shopItemDivId + "' class='" + shopItemClass + "' " + getOnClickHTML(item, type) + " " + disabledStyle + ">";

    var iconCtxId = item.id + "Canvas";
    if (item.category == "other"){
        HTML += "<div class='" + shopIconClass + "' id ='" + iconCtxId + "'><img src='/src/client/img/shopIcons/" + item.canvasValue + "'></div>";
    }
    else {
        var iconClassPrefix = isInShop ? "shop" : "equip";
        HTML += "<div class='" + shopIconClass + "' id ='" + item.id + "'>";
        HTML += "<img class='" + iconClassPrefix + "IconRoulette' style='display:none' src='/src/client/img/shopIcons/roulette/questionO.png'>";
        HTML += "<canvas class='" + iconClassPrefix + "IconCanvas iconCanvas' id='" + iconCtxId + "'></canvas>";
        HTML += "</div>";
    }
    
    //Rarity appearance configuration
    const showRarityImg = isInShop ? true : false;
    const showRarityTitleColor = isInShop ? true : false;

    
    var rarityImg;
    var rarityText;
    var rarityColor;
    switch(item.rarity){
        case 0:
            rarityImg = false;
            rarityText = "";
            rarityColor = "#ffffff";
            break;
        case 1:
            rarityImg = "rarities/rare.png";
            rarityText = "Rare";
            rarityColor = "#0074e0";
            break;
        case 2:
            rarityImg = "rarities/epic.png";
            rarityText = "Epic";
            rarityColor = "#b700d8";                
            break;
        case 3:
            rarityImg = "rarities/legendary.png";
            rarityText = "Legendary";
            rarityColor = "#ffd200";
            break;
        case 4:
            rarityImg = "rarities/legendary.png";
            rarityText = "Legendary";
            rarityColor = "#ffd200";
            break;
        default:            
            break;
    }

    if (item.hideFromShop){
        rarityText = "[Exclusive]";   
        rarityColor = "#ff3600";
    }

    if (rarityImg && showRarityImg)
        HTML += "<div class='shopIconOverlay' id ='" + item.id + "''><img src='/src/client/img/shopIcons/" + rarityImg + "'></div>";

    //Item Title
    if (item.title){
        HTML += "<div id='shopTitle' class='shopTitle' ";
        if (showRarityTitleColor)  
            HTML += "style='color:" + rarityColor + "'";
        HTML += ">" + item.title + "</div>";
    }    
	//Rarity Text
	var rarityTextId = "rarityText";
	if (type == "shop"){rarityTextId = "rarityTextShop";}
    HTML += "<div id='" + rarityTextId + "' class='shopTitle' style='float:right; color:" + rarityColor + "'>" + rarityText + "</div>";

    //Item category
    if (isInShop){
        HTML += "<br>";
        HTML += "<div id='shopTextCategory' class='shopText'>" + getDisplayCategory(item) + "</div>";
        //Team item text
        if (item.team){
            switch(item.team){
                case 1:
                    HTML += "<div class='shopText' style='color: #bf1f1f;'>| Red team item</div>";
                    break;
                case 2:
                    HTML += "<div class='shopText' style='color: #476aeb;'>| Blue team item</div>";
                    break;
                default:
                    break;
            }       
        }
        HTML += "<br>";
    }

    //Price + Owned
    if (item.price && isInShop)
        HTML += "<div id='shopTextPrice' class='shopText'>$" + numberWithCommas(item.price) + ownedHTML + "</div>";
    HTML += "<br>";
    if (item.text && !isInShop){
        HTML += "<div class='shopText'>" + item.text + ownedHTML + "</div>";
    }



    HTML += "</div>"; 

    return HTML;
}

function getDisplayCategory(item){
    var displayCategory = "";
    if (item.category){
        if (item.category != "other"){
            displayCategory += capitalizeFirstLetter(item.category);
            if (item.subCategory != "type"){
                displayCategory += (" " + capitalizeFirstLetter(item.subCategory));
            }
        }
    }
    return displayCategory;
}

function getOnClickHTML(item, type){
    var onClickHTML = "";
    if (type == "tradeListOwned"){
        onClickHTML = "onclick='addItemToTradeClick(\"" + item.id + "\")'";
    }
    else if (type == "tradeListYourOffered"){
        onClickHTML = "onclick='removeItemFromTradeClick(\"" + item.id + "\")'";
    }
    else if (type == "tradeListOpponentOffered"){
        onClickHTML = "";
    }
    else if (type == "shop"){
        onClickHTML = "onclick='shopClick(\"" + item.id + "\"," + item.price + ")'";
    }
    else {
        onClickHTML = "onclick='customizationSelect(\"" + item.canvasValue + "\", \"" + displayTeam + "\",\"" + item.customizationCategory + "\")'";
    }
    return onClickHTML;
}

function showContent(divId) {
    var div = document.getElementById(divId);
    var tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (var i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(divId + "Div").style.display = "block";
    div.className += " active";
}

console.log("cognito.js loaded");