console.log("cognito.js loading");

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
var cognitoSub = "";
var username = "";
var partyId = "";
var userCash = 0;
var federatedUser = false;
var pcMode = 1;
var serverHomePage = "https://rw.treatmetcalf.com/";
var isLocal = false;
var defaultCustomizations = {red:{}, blue:{}};

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
			userCash = data.cash;
			updateCashHeaderDisplay(data.cash);
			
			
			log('emmiting updateSocketInfo cognitoSub=' + cognitoSub);
			console.log(socket);
			socket.emit('updateSocketInfo', cognitoSub);
            username = data.username;					
			federatedUser = data.federatedUser;
			isLocal = data.isLocal;
			if (isLocal){
				serverHomePage = "/";
			}
			console.log("SET SERVER HOMEPAGE: " + serverHomePage);
			defaultCustomizations = data.defaultCustomizations;

			setLocalStorage();
			getOnlineFriendsAndParty();	
			//loginSuccess(); wait for response from updateSocketInfo before triggering loginSuccess() -- socket.on('socketInfoUpdated')
	    }
		else {
			loginFail();
		}
		setPcModeAndIsLocalElements({isLocal:data.isLocal, pcMode:data.pcMode});
		loginAlways();
		if (page != "profile"){
			removeUrlParams();
		}
    });
}

function updateCashHeaderDisplay(cash){
	if (document.getElementById("cashHeaderValue")){
		document.getElementById("cashHeaderValue").innerHTML = "$" + numberWithCommas(cash);
		show("cashHeaderDisplay");
	}
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
			document.getElementById("titleText").innerHTML = "<a href='" + serverHomePage + "'>SocketShot</a>";
		}
		else {
			document.getElementById("titleText").innerHTML = "<a href='" + serverHomePage + "'>SocketShot</a>";
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
      showUnset("localPlayNow");
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
		document.getElementById('userWelcomeText').innerHTML = getUserWelcomeHTML(printedUsername);	
	}
}

function getUserWelcomeHTML(printedUsername){
	var HTML = "";
	HTML += "<span>Logged in as </span>" + "<a href='/user/" + cognitoSub + "'>" + printedUsername + "</a>";
	return HTML;
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


function drawName(drawingCanvas, playerUsername, color, x, y, icon = false){
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
		drawingCanvas.fillText(playerUsername, x, y); 
	drawingCanvas.restore();
}

function drawIcon(drawingCanvas, icon, x, y, width = false, height = false){
	if (!icon)
		return;
	if (!width || !height){
		width = iconSize;
		height = iconSize;
	}
	drawingCanvas.drawImage(icon, x, y, width, height);
}

function getUserIconImg(iconCanvasValue, team, cb){
    if (iconCanvasValue == "none"){
        cb(false, team);
		return;
    }
    var iconImg = new Image();
    iconImg.src = "/client/img/dynamic/icon/" + iconCanvasValue + ".png";
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
	function _loadAllImages(callback){
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
                data[r].actionName = "Look Ahead";
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

console.log("cognito.js loaded");