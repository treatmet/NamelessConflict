const cognitoClientId = '70ru3b3jgosqa5fpre6khrislj';
const cognitoPoolId = 'us-east-2_SbevJL5zt';
var cognitoSub = "";
var username = "";
var preferredUsername = "";
var partyId = "";
var federatedUser = false;
var pageLoaded = false;
var autoJoinGame = "false";

var serverHomePage = "/";
//var serverHomePage = "https://rw.treatmetcalf.com/";




//includeHTMLHeader();
initializePage();
function initializePage(){
    //showDefaultLoginButtons();
    showLocalElements();
    getTokenFromUrlParameterAndLogin(); 	
	setPlayerSearchText();
}

//Post to server body = 3 tokens
//First, check if session exists by POST to server. Does it have cog_a set?
//2, establish connection on POST
function getTokenFromUrlParameterAndLogin(){
	console.log("Getting tokens from url params and logging in...");
	var code = getUrlParam("code", "").substring(0,36);
	var cog_a = getUrlParam("cog_a", "");
	var cog_i = getUrlParam("cog_i", "");
	var cog_r = getUrlParam("cog_r", "");
	console.log("Got cog_a from url: " + cog_a);

	console.log("Grabbed code from URL: " + code);
	if (code == ""){
		console.log("Unable to get Url parameter: 'code'");
	}
	
    const validateTokenEndpoint = '/validateToken';
    const data = {
        code:code,
		cog_a:cog_a,
		cog_i:cog_i,
		cog_r:cog_r
    };

    $.post(validateTokenEndpoint, data, function(data,status){
        console.log("validateToken response:");
        console.log(data);
        if (data && data.username){
            //Successful Auth
            cognitoSub = data.cognitoSub;
			console.log('emmiting updateSocketInfo');
			socket.emit('updateSocketInfo', cognitoSub);
            username = data.username;
            preferredUsername = data.username;
			
			//Update buttons to have auth tokens in url parameters !!!!REMOVE THIS SECTION - we have moved from links to buttons
			var serverSelectLinks = document.getElementsByClassName("serverSelectLink");
			if (getCookie("cog_a").length > 0){
				for (let s = 0; s < serverSelectLinks.length; s++) {
					var tokenParams = getJoinParams();
					serverSelectLinks[s].href = serverSelectLinks[s].href.replace(/\?join=true/g,tokenParams);
				}
			}

            federatedUser = data.federatedUser;
  		
			if (!data.isWebServer){
				autoJoinGame = getUrlParam("join", "false");
			}
			showServerLoginButtons();
            showAuthorizedLoginButtons();            
            setLocalStorage();
			getRequests();
			getOnlineFriendsAndParty();
			checkViewedProfileIsFriendOrParty();
			autoPlayNow();
	    }
        else { //Failed Auth
            showDefaultLoginButtons();
        }
		removeUrlParams();
    });
}

function getJoinParams(){
	var tokenParams = "?join=true";
	if (getCookie("cog_a").length > 0){
		tokenParams += "&cog_a=" + getCookie("cog_a");
		tokenParams += "&cog_r=" + getCookie("cog_r");	
	}
	return tokenParams;
}

window.addEventListener('load', function () {
	if (autoJoinGame != "true") {
		if (document.getElementById("serverLoginButtons") && cognitoSub == "") {
			document.getElementById("serverLoginButtons").style.display = "inline-block";				
		}
		showMainContent();	
	}

	focusPlayerSearchPageBox();
	pageLoaded = true;
	autoPlayNow();	
})

function focusPlayerSearchPageBox(){
	if (document.getElementById("playerSearchPageBox")){
		document.getElementById("playerSearchPageBox").focus();
	}
}

function autoPlayNow(){
	if (autoJoinGame == "true" && pageLoaded){
		var options = {};
		options.server = getUrl();
		playNow();
	}
}

function playNow(){
	var options = {};
	//options.partyId = partyId; //Getting from DB
	//options.username = username; //Getting from DB
	//options.cognitoSub = cognitoSub; cognitoSub can be gathered by getting authenticated user
	
	$.post('/playNow', options, function(data,status){
		console.log("Play Now response:");
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
			console.log("Join Server response:");
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

function localPlayNowClick(){
	socket.emit('test', "123456");

	//window.location.href = '/?join=true';
}

function show(element){
	if (document.getElementById(element)) {
		document.getElementById(element).style.display = "inline-block";
	}
}

function hide(element){
	if (document.getElementById(element)) {
		document.getElementById(element).style.display = "none";
	}
}

function showServerLoginButtons(){
	if (document.getElementById("serverLoginButtons")) {
		document.getElementById("serverLoginButtons").style.display = "none";
	}
}

function showInviteButtons(){
	if (document.getElementById('invitePlayerButtons')){
		document.getElementById('invitePlayerButtons').style.display = '';
	}
}

function hideAddFriendButton(){
	if (document.getElementById('addFriendButton')){
		document.getElementById('addFriendButton').style.display = 'none';
	}
}

function showMainContent(){
	if (document.getElementById("mainContent")){
		document.getElementById("mainContent").style.display = "unset";
	}
}

function showServerList(){
	if (document.getElementById("serverList")){
		document.getElementById("serverList").style.display = "unset";
	}
}

function getOnlineFriendsAndParty(){	
	//Get friends
	const data = {
		cognitoSub:cognitoSub
	};
	$.post('/getOnlineFriends', data, function(data,status){
		console.log("getOnlineFriends response:");
		console.log(data);		
		updateOnlineFriendsSectionHtml(data);		
	});
	
	//Get party
	$.post('/getParty', data, function(data,status){
		/*
		var data = {
			partyId:"12345",
			party:[{cognitoSub:"67890",username:"myman",leader:true}] //Party members including you
		};	
		*/
		console.log("getParty response:");
		console.log(data);	
		
		if (data && data.partyId){
			partyId = data.partyId;
		}
		else {
			alert("Error getting party data");
			partyId = "";
			return;
		}
		
		var partyData = transformToUIPartyData(data);
		
		updatePartySectionHtml(partyData);		
		updateKickInviteToPartyButtons(partyData);
		if (partyData.leader.cognitoSub && partyData.leader.cognitoSub != cognitoSub){
			show("serversHiddenMsg");
			hide("serverList");
		}
		else {
			showServerList();
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


function updateKickInviteToPartyButtons(data){
	var viewedProfileCognitoSub = getViewedProfileCognitoSub();
	var isInParty = false;
	for (var p = 0; p < data.party.length; p++){
		if (viewedProfileCognitoSub == data.party[p].cognitoSub){
			isInParty = true;
		}
	}

	if (data.leader.cognitoSub == cognitoSub && data.party.length > 0 && isInParty){ //If you are the leader, and viewed profile is in party
		hide("inviteToPartyButton");
		show("kickFromPartyButton");
	}
	else if(data.leader.cognitoSub && data.leader.cognitoSub != cognitoSub && (isInParty || viewedProfileCognitoSub == data.leader.cognitoSub)){ //If there is a leader, and you're not it. AND viewed profile is already in party (or is the leader)
		hide("inviteToPartyButton");
		hide("kickFromPartyButton");			
	}
	else {
		hide("kickFromPartyButton");			
		show("inviteToPartyButton");
	}
}

function updateOnlineFriendsSectionHtml(friends){
	var section = document.getElementById("onlineFriendsSection");
	var html = "<span>Online friends [" + friends.length + "]";	
	if (friends.length > 0){
		html += ": </span>";
		for (var i = 0; i < friends.length; i++){
			html += " <a href='" + serverHomePage + "user/" + friends[i].cognitoSub + "'>" + friends[i].username + "</a> "
		}
	}
	else {
		section.style.display = "none"; //Hide online friends section in case of zero friends online
		html += "</span>";
	}
	section.innerHTML = html;
}

	/*var partyData = {
		leader:{cognitoSub:"12345",username:"myguy"},
		party:[{cognitoSub:"67890",username:"myman"}] //Party members other than you
	};*/
function updatePartySectionHtml(partyData){
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
		console.log("getRequests response:");
		console.log(data);		
	});
}

function updateRequestsSectionHtml(data){
	if (data.partyRequests.length > 0 || data.friendRequests.length > 0){
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
	const data = {
		partyId:userPartyId,
		cognitoSub:cognitoSub
	};
	
	$.post('/leaveParty', data, function(data,status){
		console.log("leaveParty endpoint response from server:");
		console.log(data);		
		window.location.reload();
	});	
}

function friendAcceptClick(id){
	const data = {
		type:"friend",
		id:id,
		accept:true
	};
	
	$.post('/requestResponse', data, function(data,status){
		console.log("requestResponse (friend accept) endpoint response from server:");
		console.log(data);		
		window.location.reload();
	});
}

function partyAcceptClick(id){
	const data = {
		type:"party",
		id:id,
		accept:true
	};
	
	$.post('/requestResponse', data, function(data,status){
		console.log("requestResponse (party accept) endpoint response from server:");
		console.log(data);		
		window.location.reload();
	});
}

function requestDeclineClick(id){
	const data = {
		id:id,
		accept:false
	};
	
	$.post('/requestResponse', data, function(data,status){
		console.log("requestResponse (decline) endpoint response from server:");
		console.log(data);		
		window.location.reload();
	});
}

function getViewedProfileCognitoSub(){
	if (document.getElementById("playerProfile") && getUrl().indexOf('/user/') > -1){
		return getUrl().split('/user/')[1];
	}	
}

function checkViewedProfileIsFriendOrParty(){
	if (document.getElementById("playerProfile") && getUrl().indexOf('/user/') > -1){
		console.log("passed profile page check, making call with:");
	
		const data = {
			callerCognitoSub:cognitoSub,
			targetCognitoSub:getViewedProfileCognitoSub()
		};
		
		console.log(data);
	
	    $.post('/getPlayerRelationship', data, function(data,status){
			console.log("getPlayerRelationship response:");
			console.log(data);
			if (data.friends == true){
				hide("addFriendButton");
				show("removeFriendButton");								
			}
			else {
				hide("removeFriendButton");											
				show("addFriendButton");
			}
		});
	}
}




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

function showDefaultLoginButtons(){
    document.getElementById("createAccount").style.display = "";
    document.getElementById("logIn").style.display = "";
    document.getElementById("playNow").style.display = "none";
    document.getElementById("logOut").style.display = "none";
    if (document.getElementById('userWelcomeText')){
        document.getElementById('userWelcomeText').style.display = "none";
	}
}



function showAuthorizedLoginButtons(){
    document.getElementById("createAccount").style.display = "none";
    document.getElementById("logIn").style.display = "none";
    document.getElementById("playNow").style.display = "";
    document.getElementById("logOut").style.display = "";
    if (document.getElementById('userWelcomeText')){
        var printedUsername = preferredUsername.substring(0,15);
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
			showInviteButtons();			
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

//clear all url params
function removeUrlParams(){
	var uri = window.location.toString();
	if (uri.indexOf("?") > 0) {
		var clean_uri = uri.substring(0, uri.indexOf("?"));
		window.history.replaceState({}, document.title, clean_uri);
	}
}

function setPlayerSearchText(){
	if (document.getElementById('playerSearchPageBox')){
		playerSearchPageBox.value = window.location.href.split("/search/")[1];
	}
}

/////////////////////////////EDIT USER PROFILE FUNCTIONS////////////////////////////////////////////

function editUserButtonClick(){
    if (getUrl().includes(cognitoSub)){
		document.getElementById('editUserFieldText').innerHTML = 'Select attribute you would like to change:';
        if (federatedUser){
            document.getElementById('editUserPasswordText').style.display = 'none';
            document.getElementById('oldPasswordText').style.display = 'none';
            document.getElementById('newPasswordText').style.display = 'none';
            document.getElementById('newPasswordText2').style.display = 'none';
            document.getElementById('newEmailText').style.display = 'none';
            document.getElementById('editUserFieldText').innerHTML = 'Update Username:';
            document.getElementById('newUsernameText').style.display = '';
            document.getElementById('editUsernameButton').style.display = 'none';
            document.getElementById('editPasswordButton').style.display = 'none';            
			document.getElementById('editUserFieldText').innerHTML = 'You may change the following:';
        }
        document.getElementById('editUserButton').style.display = 'none';
        document.getElementById('updateUserTextBoxes').style.display = '';
    }
}

async function editUserConfirmButtonClick(){    
    var oldPassword = document.getElementById('oldPasswordText').value;
    var newUsername = document.getElementById('newUsernameText').value;
    var newPassword = document.getElementById('newPasswordText').value;
    var newPassword2 = document.getElementById('newPasswordText2').value;
    var newEmail = document.getElementById('newEmailText').value;
    if (getUrl().includes(cognitoSub)){
        if (federatedUser){
            if (isValidUsername(newUsername)){
                updateMongoUsername(newUsername, cognitoSub);
            }
        }
        else {
            if ((newPassword.length == 0 || newPassword == "Password") && (newUsername.length == 0 || newUsername == "Username") && (newEmail.length == 0 || newEmail == "Email")){
                alert("No fields were updated.");
                return;
            }
            if (isValidUsername(newUsername)){
                updatePreferredUsername(oldPassword, newUsername);
            }
            if (newPassword.length > 0 && newPassword != "Password"){
                if (newPassword == newPassword2){
                    ChangePassword(oldPassword, newPassword);
                }
                else {
                    alert("New password fields do not match.");
                }
            }
        }
    }
}

async function updateMongoUsername(newUsername, cognitoSub){
    var data = {
        newUsername:newUsername,
        cognitoSub:cognitoSub
    };
    
    await $.post('/updateUsername', data, function(data,status){
    if (data){
		if (data.error){
			alert(data.error);
		}
		else {
			window.location.reload();
		}
    }
        console.log("updateUsername response:");
        console.log(data);
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

function editUsernameButtonClick(){
    if (document.getElementById('oldPasswordText').value.length > 0 && document.getElementById('oldPasswordText').value != "Password"){
		document.getElementById('editUserFieldText').innerHTML = 'Enter new username:';
        document.getElementById('newUsernameText').style.display = '';
        document.getElementById('editUsernameButton').style.display = 'none';
        document.getElementById('editPasswordButton').style.display = 'none';
    }
    else {
        alert("Enter your current password first.");
    }
}

function editPasswordButtonClick(){
    if (document.getElementById('oldPasswordText').value.length > 0 && document.getElementById('oldPasswordText').value != "Password"){
		document.getElementById('editUserFieldText').innerHTML = 'Enter new password:';
        document.getElementById('newPasswordText').style.display = '';
        document.getElementById('newPasswordText2').style.display = '';
        document.getElementById('editUsernameButton').style.display = 'none';
        document.getElementById('editPasswordButton').style.display = 'none';
    }
    else {
        alert("Enter your current password first.");
    }
}

function editUserCancelButtonClick(){
    resetEditUserElements();
    document.getElementById('editUserButton').style.display = '';
    document.getElementById('updateUserTextBoxes').style.display = 'none';

    document.getElementById('newUsernameText').style.display = 'none';
    document.getElementById('editUsernameButton').style.display = '';
    document.getElementById('editPasswordButton').style.display = '';
    document.getElementById('newPasswordText').style.display = 'none';
    document.getElementById('newPasswordText2').style.display = 'none';

}

function newUserNameClick(){	
        var newUsernameText = document.getElementById("newUsernameText");
		newUsernameText.style.color = "#000000";
		if (newUsernameText.value == "Username"){newUsernameText.value = "";}		
}

function passwordClick(element){
	element.style.color = "#000000";
	if (element.value == "Password" || element.value == "Password Confirm"){element.value = "";}
    element.type = "password";
}

function newEmailClick(){
    var newEmailText = document.getElementById("newEmailText"); 		
	newEmailText.style.color = "#000000";
	if (newEmailText.value == "Email"){newEmailText.value = "";}
}

function addFriendButtonClick(){
	console.log("addFriendButtonClick()");

	if (document.getElementById("playerProfile") && getUrl().indexOf('/user/') > -1){

		const friendRequestData = {
			cognitoSub:cognitoSub,
			username:username,
			targetCognitoSub:getUrl().split('/user/')[1],
			type:"friend"
		};		
		upsertRequest(friendRequestData);

		const data = {
			cognitoSub:cognitoSub,
			targetCognitoSub:getUrl().split('/user/')[1]
		};		
		console.log(data);
		$.post('/addFriend', data, function(data,status){
		if (data){
			if (data.error){
				alert(data.error);
			}
			else {
				window.location.reload();
			}
		}
			console.log("addFriend response:");
			console.log(data);
		});
	}
}

function removeFriendButtonClick(){
	const data = {
		cognitoSub:cognitoSub,
		targetCognitoSub:getUrl().split('/user/')[1]
	};	
	$.post('/removeFriend', data, function(data,status){
	if (data){
		if (data.error){
			alert(data.error);
		}
		else {
			window.location.reload();
		}
	}
		console.log("removeFriend response:");
		console.log(data);
	});
}

function inviteToPartyButtonClick() {
	console.log("partyRequestButtonClick()");

	if (document.getElementById("playerProfile") && getUrl().indexOf('/user/') > -1){
		const data = {
			cognitoSub:cognitoSub,
			username:username,
			targetCognitoSub:getUrl().split('/user/')[1],
			type:"party"
		};		
		upsertRequest(data);
	}

}

function upsertRequest(data){
	$.post('/upsertRequest', data, function(data,status){
	if (data){
		if (data.error){
			alert(data.error);
		}
		else {
			window.location.reload();
		}
	}
		console.log("upsertRequest response:");
		console.log(data);
	});
}



function kickFromPartyButtonClick() {
	document.getElementById("kickFromPartyButton").style.backgrounColor = "gray";
	
	const data = {
		cognitoSub: cognitoSub,
		targetCognitoSub: getUrl().split('/user/')[1]
	};
	
	$.post('/kickFromParty', data, function(data,status){
		console.log("Kick from party endpoint response from server:");
		console.log(data);		
		window.location.reload(); //remove when doing ui polish
		//hide("kickFromPartyButton");			
		//show("inviteToPartyButton");
	});
}



/*-------------------------------COGNITO FUNCTIONS------------------------------------------------------*/


function updatePreferredUsername(password, newUsername){
    console.log("updating username");
	var attributeList = [];
    var attribute = {
        Name : 'preferred_username',
        Value : newUsername
    };
    var attribute = new AmazonCognitoIdentity.CognitoUserAttribute(attribute);
    attributeList.push(attribute);


    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: username,
        Password: password,
    });

    var cognitoUser = getCognitoUser();

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            cognitoUser.updateAttributes(attributeList, function(err, result) {
                if (err) {
                    console.log(err);
                    alert("Unable to update Username. Make sure your current password was entered correctly (the first textbox).\n\n Or, that username may already be taken.\n\n Check your browser's console log for the full error message.");
                } 
                else {
                    console.log('Update Attribute result: ' + result);
                    updateMongoUsername(newUsername, cognitoSub);
                }
            });
        },
        onFailure: function (err) {
            console.log(err);
            alert("Unable to update Username. Make sure your current password was entered correctly (the first textbox).\n\n Or, that username may already be taken.\n\n Check your browser's console log for the full error message.");
        },
    });
}

function setLocalStorageAll(cog_a, cog_i, cog_r){
    console.log(getCognitoUserPool().getCurrentUser());

    var keyPrefix = 'CognitoIdentityServiceProvider.' + cognitoClientId;
    var idTokenKey = keyPrefix + '.' + username + '.idToken';
    var accessTokenKey = keyPrefix + '.' + username + '.accessToken';
    var refreshTokenKey = keyPrefix + '.' + username + '.refreshToken';
    var lastUserKey = keyPrefix + '.LastAuthUser';

    localStorage.setItem(lastUserKey, username);
}


function ChangePassword(password, newPassword) {
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: username,
        Password: password,
    });

    var cognitoUser = getCognitoUser();

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            cognitoUser.changePassword(password, newPassword, (err, result) => {
                if (err) {
                    console.log(err);
                    alert("Unable to update Password. Make sure if your current password was entered correctly (the first textbox). Check your browser's console log for the full error message.");
                } else {
                    console.log("Successfully changed password of the user.");
                    console.log(result);
                    document.getElementById("updateInfo").value += "Successfully changed password\n";
                    window.location.reload();
                }
            });
        },
        onFailure: function (err) {
            console.log(err);
            log(username + " " + password);
            alert("Unable to update Password. Make sure if your current password was entered correctly (the first textbox). Check your browser's console log for the full error message.");
        },
    });
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

function onBlur(element){
    if (element.value == ""){
        resetElement(element);
    }    
}

function resetEditUserElements(){
    resetElement(document.getElementById('oldPasswordText'));
    resetElement(document.getElementById('newUsernameText'));
    resetElement(document.getElementById('newPasswordText'));
    resetElement(document.getElementById('newPasswordText2'));
    resetElement(document.getElementById('newEmailText'));
}

function resetElement(element){
    if (element.id == "oldPasswordText" || element.id == "newPasswordText"){
        element.value = "Password";
        element.style.color = "gray";
        element.type = "none";
        //element.style.background-color: "lightgray";
    }
    else if (element.id == "newPasswordText2"){
        element.value = "Password Confirm";
        element.style.color = "gray";
        element.type = "none";        
        //element.style.background-color: "lightgray";
    }
    else if (element.id == "newUsernameText"){
        element.value = "Username";
        element.style.color = "gray";
        element.type = "none";
        //element.style.background-color: "lightgray";
    }
    else if (element.id == "newEmailText"){
        element.value = "Email";
        element.style.color = "gray";
        element.type = "none";
        //element.style.background-color: "lightgray";
    }

}



/* PLAYER SEARCH*/

var playerSearchForm = document.getElementById("playerSearchForm");
if (playerSearchForm){
	playerSearchForm.onsubmit = function(e){
		submitPlayerSearch(e);
	}
}
var playerSearchPageForm = document.getElementById("playerSearchPageForm");
if (playerSearchPageForm){
	playerSearchPageForm.onsubmit = function(e){	
		submitPlayerSearch(e);
	}
}

function submitPlayerSearch(e){
	e.preventDefault();
	if (!isValid(e.target.elements[0].value)){
		alert("Invalid character (\"$\", \"%\", \";\", \"{\", etc) in search. Please remove character and try again.");
		return;
	}
	if (e.target.elements[0].value.length <= 2){
		alert("Search must be at least 3 characters long.");
		return;		
	}
	window.location.pathname = serverHomePage + "search/" + e.target.elements[0].value;
}

//EVERY 1 SECOND
const headerRefreshSeconds = 10;
var headerRefreshTicker = headerRefreshSeconds;
setInterval( 
	function(){	
	
		//Refresh header
		if (document.getElementById("header").style.display != 'none' && cognitoSub.length > 0){
			headerRefreshTicker--;
			if (headerRefreshTicker < 1){
				logg("Refreshing header");
				getRequests();
				getOnlineFriendsAndParty();
				checkViewedProfileIsFriendOrParty();
				
				headerRefreshTicker = headerRefreshSeconds;
			}
		}
	},
	1000/1 //Ticks per second
);

