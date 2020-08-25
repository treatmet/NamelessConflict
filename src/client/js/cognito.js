console.log("cognito.js loading");

var serverP = getUrlParam("server", "");
var processP = getUrlParam("process", "");
var socket = io(getSocketParams());
function getSocketParams(){
	if (serverP != "" && processP != ""){
		return { query: {"server": serverP,"process": processP}};
	}
	else {
		return {};
	}
}
// TODO:set values based on game.html query string params
/*
var socket = io({
	query: {
		"server": "1",
		"process": "1"
	}
});
*/


const cognitoClientId = '70ru3b3jgosqa5fpre6khrislj';
const cognitoPoolId = 'us-east-2_SbevJL5zt';
var page = "";
var cognitoSub = "";
var username = "";
var partyId = "";
var federatedUser = false;
var pcMode = 1;
var serverHomePage = "https://rw.treatmetcalf.com/";
var isLocal = false;

function getTokenFromUrlParameterAndLogin(){
	console.log("Getting tokens from url params and logging in...");
	var code = getUrlParam("code", "").substring(0,36);
	var cog_a = getUrlParam("cog_a", "");
	var cog_r = getUrlParam("cog_r", "");
	
    const validateTokenEndpoint = '/validateToken';
    const data = {
        code:code,
		cog_a:cog_a,
		cog_r:cog_r
    };
	
    $.post(validateTokenEndpoint, data, function(data,status){ //validation
        log("validateToken response:");
        console.log(data);
		
        if (data && data.username){
            cognitoSub = data.cognitoSub;
			
			
			log('emmiting updateSocketInfo cognitoSub=' + cognitoSub);
			console.log(socket);
			socket.emit('updateSocketInfo', cognitoSub);
            username = data.username;					
			federatedUser = data.federatedUser;
			isLocal = data.isLocal;
	
			setLocalStorage();
			getOnlineFriendsAndParty();	
			//loginSuccess(); wait for response from updateSocketInfo before triggering loginSuccess() -- socket.on('socketInfoUpdated')
	    }
		else {
			loginFail();
		}
		setPcModeAndIsLocalElements({isLocal:data.isLocal, pcMode:data.pcMode});
		loginFinally();
		removeUrlParams();
    });
}

function updateProfileLink(){
	if (document.getElementById("menuRightLink")){
		var link = serverHomePage + "user/" + cognitoSub;
		document.getElementById("menuRightLink").innerHTML = '<a href="' + link + '" style="" class="elecText" id="profileLink">' + "Profile" + '&gt;</a>';
	}
}

function setPcModeAndIsLocalElements(data){
	pcMode = data.pcMode;
	var redirectUri = "https://rw.treatmetcalf.com/";
	if (data.isLocal == true){
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
		
		if (pcMode == 2){
			document.getElementById("titleText").innerHTML = "<a href='" + serverHomePage + "'>R-Wars</a>";
		}
		else {
			document.getElementById("titleText").innerHTML = "<a href='" + serverHomePage + "'>R-Wars</a>";
		}
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

socket.on('socketInfoUpdated', function(data){
	log("socket info updated url:" +  data.url +" isWebServer:" + data.isWebServer);
	loginSuccess();
});

socket.on('reloadHomePage', function(){
	window.location.href = serverHomePage;
});

socket.on('redirect', function(url){
	window.location.href = url;
});

socket.on('redirectToGame', function(url){
	url = url + getTokenUrlParams();
	logg("Redirecting webpage to " + url);
	window.location.href = url;
});

function autoPlayNow(){
	playNow();
}

function playNow(){
	log("playNow on this server");
	var options = {};
	var postUrl = 'https://rw.treatmetcalf.com/playNow?server=' + serverP + '&process=' + processP;
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

function getJoinableServer(options){
	if (cognitoSub == "")
		return;
		
	options.partyId = partyId;
	options.cognitoSub = cognitoSub;
	if (options.server){
		logg("Attempting to join server with: ");
		console.log(options);
		hide("mainContent");
		show("gameLoader");
		$.post('/getJoinableServer', options, function(data,status){
			log("Join Server response:");
			console.log(data);		
			if (data.server){
				//Redirect happens on server side, do nothing here
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
	html += " <button id='leavePartyButton' class='RWButton' onclick='leavePartyButtonClick(\"" + partyData.leader.cognitoSub + "\")'>🚫</button>";
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
	if (document.getElementById("invitesBar") && data.partyRequests.length > 0 || data.friendRequests.length > 0){
		if (data.friendRequests.length > 0){document.getElementById("invitesBar").style.backgroundColor = '#153e17';}
			else {document.getElementById("friendInvitesSection").style.display = 'none';}
		if (data.partyRequests.length > 0){document.getElementById("invitesBar").style.backgroundColor = '#003461';}
			else {document.getElementById("partyInvitesSection").style.display = 'none';}
		document.getElementById("invitesBar").style.display = 'inline-block';
		
		var friendRequestsHtml = "<span>Friend Requests: </span>";	
		for (var f = 0; f < data.friendRequests.length; f++){
			friendRequestsHtml += "<span> [ </span><a href='" + serverHomePage + "user/" + data.friendRequests[f].cognitoSub + "'>" + data.friendRequests[f].username + "</a> ";
			friendRequestsHtml += "<a id='friendAccept' onclick='friendAcceptClick(\"" + data.friendRequests[f]._id + "\")'>Accept</a> <a id='friendDecline' onclick='requestDeclineClick(\"" + data.friendRequests[f]._id + "\")'>Decline</a>";
			friendRequestsHtml += "<span> ] </span>";
		}
		document.getElementById("friendInvitesSection").innerHTML = friendRequestsHtml;
		
		var partyRequestsHtml = "";	
		for (var f = 0; f < data.partyRequests.length; f++){
			partyRequestsHtml += "<span> [ </span><a href='" + serverHomePage + "user/" + data.partyRequests[f].cognitoSub + "'>" + data.partyRequests[f].username + "</a><span> invited you to a party </span>";
			partyRequestsHtml += "<a id='partyAccept' onclick='partyAcceptClick(\"" + data.partyRequests[f]._id + "\")'>Accept</a> <a id='partyDecline' onclick='requestDeclineClick(\"" + data.partyRequests[f]._id + "\")'>Decline</a>";
			partyRequestsHtml += "<span> ] </span>";
		}
		document.getElementById("partyInvitesSection").innerHTML = partyRequestsHtml;
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

function isValidUsername(newUsername){
    if (newUsername == "Username" || newUsername == ""){
        return false;        
    }
    else if (newUsername.length < 3){
        alert("Please enter a Username that is at least 3 characters long.");
        return false;
    }
    else if (newUsername.length > 20){
        alert("Username is too long.\nPlease enter a Username that is less than 20 characters.");
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
function setCookie(cname, cvalue, exdays) {
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
    $.post('/logOut', {}, function(data,status){
		window.location.reload();
    });
}

function showLocalElements(){
  $(document).ready(function() {
    if (window.location.href.indexOf("localhost") > -1) {
      document.getElementById("localPlayNow").style.display = "";
    }
  });
}

function localClick(){
	console.log("NAVING22");
	window.location.href = "https://google.com",true;
	return false;
}

function showDefaultLoginButtons(){
	if (page == "game"){return;}
    document.getElementById("createAccountH").style.display = "";
    document.getElementById("logInH").style.display = "";
    document.getElementById("playNowH").style.display = "none";
    document.getElementById("logOutH").style.display = "none";
    if (document.getElementById('userWelcomeText')){
        document.getElementById('userWelcomeText').style.display = "none";
	}
}

function showAuthorizedLoginButtons(){
	if (page == "game"){return;}
    document.getElementById("createAccountH").style.display = "none";
    document.getElementById("logInH").style.display = "none";
    document.getElementById("playNowH").style.display = "";
    document.getElementById("logOutH").style.display = "";
    if (document.getElementById('userWelcomeText')){
        var printedUsername = username.substring(0,15);
        if (printedUsername.includes("Facebook_") || printedUsername.includes("Google_") && !getUrl().includes(cognitoSub)){
            printedUsername += " - (click here to update username)"
        }
        document.getElementById('userWelcomeText').style.display = "inline-block";
		document.getElementById('userWelcomeText').innerHTML = "<a href='/user/" + cognitoSub + "'>Logged in as " + printedUsername + "</a>";	
	}
    if (document.getElementById('updateUserForm')){
		if (getUrl().includes(cognitoSub)){
			document.getElementById('updateUserForm').style.display = '';
			document.getElementById('editUserButton').style.display = '';
			showSecondaySectionTitles();
		}
		else {
			showUnset("invitePlayerButtons");			
		}
    }
}

function showSecondaySectionTitles(){
	document.getElementById('sectionTitle2').style.display = 'inline-block';
	document.getElementById('sectionTitle3').style.display = 'inline-block';	
}

function getUrlParam(parameter, defaultvalue){
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
	if (document.getElementById(element)) {
		document.getElementById(element).style.display = "inline-block";
	}
}

function showUnset(element){
	if (document.getElementById(element)) {
		document.getElementById(element).style.display = "unset";
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
setInterval( 
	function(){	
	
		//Refresh header
		if (document.getElementById("header") && document.getElementById("header").style.display != 'none' && cognitoSub.length > 0){
			headerRefreshTicker--;
			if (headerRefreshTicker < 1){
				//logg("Refreshing header");
				getRequests();
				getOnlineFriendsAndParty();
				if (page == "profile"){
					checkViewedProfileIsFriendOrParty();
				}
				
				headerRefreshTicker = headerRefreshSeconds;
			}
		}
	},
	1000/1 //Ticks per second
);
console.log("cognito.js loaded");