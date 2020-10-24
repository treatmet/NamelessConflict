page = "profile";
var currentCustomizations = {};
var displayAnimation = "";
var displayTeam = "red";
var customizationOptions = {};

initializePage();
function initializePage(){
    showLocalElements();
	populateProfilePage();
	getTokenFromUrlParameterAndLogin(); 	
}

function loginSuccess(){
	checkViewedProfileIsFriendOrParty();
	showAuthorizedLoginButtons();            
	getRequests();
    showSelfProfileOptions();
}

function loginFail(){
	showDefaultLoginButtons();
}

function loginAlways(){
	showUnset("mainContent");
}

function checkViewedProfileIsFriendOrParty(){	
    if (getViewedProfileCognitoSub() == cognitoSub)
        return;
        
	const params = {
		callerCognitoSub:cognitoSub,
		targetCognitoSub:getViewedProfileCognitoSub()
	};

	$.post('/getPlayerRelationship', params, function(data,status){
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

function getViewedProfileCognitoSub(){
	if (document.getElementById("playerProfile") && getUrl().indexOf('/user/') > -1){
		return getUrl().split('/user/')[1];
	}	
	return "";
}

function populateProfilePage(){
	const params = {
		cognitoSub:getViewedProfileCognitoSub()
	}
	if (document.getElementById("playerProfile") && getUrl().indexOf('/user/') > -1){	
		$.post('/getProfile', params, function(data,status){
            console.log("getProfilePage response from server:");
            console.log(data);		
			if (!data.success){
				document.getElementById("mainContent").innerHTML = '<div id="fullScreenError" class="sectionTitle">Invalid User</div>';
			}
			else { //Viewing valid player profile
				var mainContentHTML = document.getElementById("mainContent").innerHTML;
				for (var element in data){
					var regex = new RegExp("{{" + element + "}}","g");
					mainContentHTML = mainContentHTML.replace(regex, data[element]);
				}

				document.getElementById("mainContent").innerHTML = mainContentHTML;
                $.post('/getPlayerCustomizations', params, function(data,status){
                    if (!data){
                        alert("Error retrieving player customiaztions.");
                    }
                    else { //Got customizations
                        currentCustomizations = data;
                        cycleAppearance();
                    }
                });
			}
		});
	}	
}

function showSelfProfileOptions(){
    if (getViewedProfileCognitoSub() == cognitoSub && cognitoSub != "") {
        show('updateUserForm');
        show('editUserButton');
        showSecondaySectionTitles();
        show("appearanceOptions");
        $.get( '/getPlayerCustomizationOptions', function(data) {
            console.log("GOT DATA:");
            console.log(data);
            customizationOptions = data;
            populateCustomizationOptions();
        });
    }
    else {
        showUnset("invitePlayerButtons");			
    }
}

function displayAppearanceFrame(image, zoom){
    var ctx = document.getElementById("ctx").getContext("2d", { alpha: false });
    var canvas = document.getElementById("ctx");

    var backgroundImg = new Image();
    backgroundImg.src = "/client/img/factory-floor.png";

    loadImages([backgroundImg.src], function(){
        drawOnCanvas(ctx, backgroundImg, 0, 0, false, false, 1, true, false);
        drawOnCanvas(ctx, image, (canvas.width/2 - ((image.width * zoom) / 2)), (canvas.height/2 - ((image.height*zoom)/2)), false, false, zoom, false, false);
	});

}

/////////////////////////// EDIT PROFILE /////////////////////
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

function editUserButtonClick(){
    if (getUrl().includes(cognitoSub)){
		document.getElementById('editUserFieldText').innerHTML = 'Select attribute you would like to change:';
        if (federatedUser){
            document.getElementById('editUserPasswordText').style.display = 'none';
            document.getElementById('oldPasswordText').style.display = 'none';
            document.getElementById('newPasswordText').style.display = 'none';
            document.getElementById('newPasswordText2').style.display = 'none';
            document.getElementById('newEmailText').style.display = 'none';
            document.getElementById('newUsernameText').style.display = '';
            document.getElementById('editUsernameButton').style.display = 'none';
            document.getElementById('editPasswordButton').style.display = 'none';            
			document.getElementById('editUserFieldText').innerHTML = 'Update username:';
        }
        document.getElementById('editUserButton').style.display = 'none';
		document.getElementById('statsTables').style.display = 'none';
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
    document.getElementById('statsTables').style.display = '';

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

//////////////////////////////// INTERACT WITH USER BUTTONS ////////////////////////

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
	document.getElementById("kickFromPartyButton").style.backgroundColor = "gray";
	
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

//////////////////////////////// APPEARANCE ////////////////////////

function toggleAppearanceMode(event) {
    var tablinks = document.getElementsByClassName("toggleIcons");
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    event.currentTarget.className += " active";

    var appearanceOptions = document.getElementById("appearanceOptions");
    var shopOptions = document.getElementById("shopOptions");

    if (appearanceOptions && shopOptions){
        switch (event.currentTarget.id){
            case "customizeToggleIcon":
                appearanceOptions.style.display = "block";
                shopOptions.style.display = "none";
                break;
            case "shopToggleIcon":
                appearanceOptions.style.display = "none";
                shopOptions.style.display = "block";            
                break;
            default:
                log("Unknown appearance mode clicked...");
                break;
        }
    }
    else {
        log("DETECTED NONEXISTANT DIV");
    }    
}

function showContent(event) {
    var tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (var i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(event.currentTarget.id + "Div").style.display = "block";
    event.currentTarget.className += " active";
}

function selectTeam(event) {
    var tablinks;
    tablinks = document.getElementsByClassName("teamTablinks");
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].id = tablinks[i].id.replace("Active", "");
    }
    event.currentTarget.id += "Active";
    displayTeam = event.currentTarget.innerHTML.toLowerCase();
    drawProfileCustomizations();
    populateCustomizationOptions();
}

function drawProfileCustomizations(){
    drawCustomizations(currentCustomizations, 0, function(frames, id){
        displayAppearanceFrame(frames[displayTeam][displayAnimation], 1);
    });
}

function onBlur(element){
    if (element.value == ""){
        resetElement(element);
    }    
}

function cycleAppearance(){
    if (displayAnimation == "pistol"){
        displayAnimation = "DP";
    }
    else if (displayAnimation == "DP"){
        displayAnimation = "MG";
    }
    else if (displayAnimation == "MG"){
        displayAnimation = "SG";
    }
    else if (displayAnimation == "SG"){
        displayAnimation = "pistol";
    }
    else {
        displayAnimation = "pistol";
    }
    
    drawProfileCustomizations();
}

function populateCustomizationOptions(){
    var options = customizationOptions;

    options = {
        red: {
            hat: {
                Type:[
                    {
                        id:"default",
                        title:"None",
                        text:"",
                        img:"none.png"
                    },
                    {
                        id:"halo",
                        title:"Halo",
                        text:"Conflict Progressed",
                        img:"hat/halo.png"
                    },
                    {
                        id:"skiMask",
                        title:"Ski Mask",
                        text:"Thug life",
                        img:"hat/skiMask.png"
                    },
                    {
                        id:"sunglasses",
                        title:"Shades",
                        text:"Cool as a cucumber",
                        img:"hat/sunglasses.png"
                    },
                    {
                        id:"googly",
                        title:"Googly Eyes",
                        text:"These eyes be poppin",
                        img:"hat/googly.png"
                    }
                ]
            },
            hair: {
                Type:[
                    {
                        id:"bald",
                        title:"Bald",
                        text:"",
                        img:"hair/bald.png"
                    },
                    {
                        id:"crew",
                        title:"Crew Cut",
                        text:"Military standard",
                        img:"hair/crew.png"
                    },
                    {
                        id:"afro",
                        title:"Afro",
                        text:"It's an afro",
                        img:"hair/afro.png"
                    },
                    {
                        id:"bigAfro",
                        title:"Big Afro",
                        text:"Let's bring back the 80s!",
                        img:"hair/bigAfro.png"
                    },
                    {
                        id:"cornrows",
                        title:"Cornrows",
                        text:"Hey now, don't be culturally appropriating the Greeks",
                        img:"hair/cornrows.png"
                    }                    
                ],
                Color:[
                    {
                        id:"#603913",
                        title:"Brown",
                        text:"It's brown"
                    },
                    {
                        id:"#130900",
                        title:"Black",
                        text:"Jet black"
                    },
                    {
                        id:"#fff3b3",
                        title:"Slim Shady",
                        text:"I'm back!"
                    },
                    {
                        id:"#c6c6c6",
                        title:"Grey",
                        text:"Wise beyond your years"
                    }
                ]                
            }
        },
        blue: {
            hat: {
                Type:[
                    {
                        id:"googly",
                        title:"Googly Eyes",
                        text:"These eyes be poppin",
                        img:"hat/googly.png"
                    }
                ],
                Color:[
                    {
                        id:"#0000FF",
                        title:"Blue",
                        text:"Rrrrrroyal blue"
                    }
                ]
            }
        }
    }


    for (const category in options[displayTeam]){
        var HTML = "";
        log("Grabbing ID " + category + "Div");
        var div = document.getElementById(category + "Div");
        if (typeof div === 'undefined')
            continue;

        for (const subCategory in options[displayTeam][category]){
            var displaySubCategory = subCategory;
            if (subCategory == "Type")
                displaySubCategory = "";

            HTML += "<div class='shopCategory'>" + displaySubCategory + "</div>"

            for (const item in options[displayTeam][category][subCategory]){
                var shopIconClass = "shopIcon";
                if (currentCustomizations[displayTeam][category + displaySubCategory] == options[displayTeam][category][subCategory][item].id){
                    shopIconClass += " active";
                }

                if (subCategory == 'Type'){
                    HTML += "<div class='shopItem'><div class='" + shopIconClass + "' id ='" + options[displayTeam][category][subCategory][item].id + "' onclick='customizationSelect(event, \"" + displayTeam + "\",\"" + category + displaySubCategory + "\")'><img src='/client/img/shopIcons/" + options[displayTeam][category][subCategory][item].img + "'></div>";
                }
                else if(subCategory == 'Color'){
                    HTML += "<div class='shopItem'><div class='" + shopIconClass + "' id='" + options[displayTeam][category][subCategory][item].id + "' onclick='customizationSelect(event, \"" + displayTeam + "\",\"" + category + displaySubCategory + "\")' style='background-color:" + options[displayTeam][category][subCategory][item].id + "'></div>";
                }
                HTML += "<div class='shopTitle'>" + options[displayTeam][category][subCategory][item].title + "</div><br>";
                HTML += "<div class='shopText'>" + options[displayTeam][category][subCategory][item].text + "</div>";
                HTML += "</div>";
            }
        }
        div.innerHTML = HTML;
    }
}


// event.currentTarget.innerHTML.toLowerCase()
// tablinks[i].className = tablinks[i].className.replace(" active", "")



function customizationSelect(event, team, key){
    currentCustomizations[team][key] = event.currentTarget.id;
    drawProfileCustomizations();
    populateCustomizationOptions();

    var params = {
        team:team,
        key:key,
        value:event.currentTarget.id,
        cognitoSub:getViewedProfileCognitoSub()
    };
	$.post('/setPlayerCustomizations', params, function(data,status){
        log("/setPlayerCustomizations response:");
		log(data.msg);
	});
}
