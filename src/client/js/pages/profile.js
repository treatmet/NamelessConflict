page = "profile";
var viewedProfileCognitoSub = "";
var viewedProfileName = "";
var viewedProfileRank = "bronze1";
var currentCustomizations = {};
var customizationOptions = {};
var shopOptions = {};

const playerCenterOffset = 4;
var displayAnimation = "";
var displayTeam = 1;
var shopRefreshTimer = 10000000;
var rouletteOn = false;

var unsavedSettings = false;
var currentSettings = {keybindings:[], display:[]};
var originalSettings = {keybindings:[], display:[]};

initializePage();
function initializePage(){
    viewedProfileCognitoSub = getViewedProfileCognitoSub();
    showLocalElements();
	getTokenFromUrlParameterAndLogin();
}

function loginSuccess(){
	checkViewedProfileIsFriendOrParty();
	showAuthorizedLoginButtons();            
    getRequests();  
      
}

function loginFail(){
	showDefaultLoginButtons();
}

function loginAlways(){
	populateProfilePage();
	showUnset("mainContent");
}

function checkViewedProfileIsFriendOrParty(){	
    if (viewedProfileCognitoSub == cognitoSub)
        return;
        
	const params = {
		callerCognitoSub:cognitoSub,
		targetCognitoSub:viewedProfileCognitoSub
	};

	$.post('/getPlayerRelationship', params, function(data,status){
		if (data.friends == true){
			hide("addFriendButton");
            show("removeFriendButton");
		    show("inviteToTradeButton");
		}
		else {
			hide("removeFriendButton");											
			show("addFriendButton");
		}
	});
}

function updateKickInviteToPartyButtons(data){
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
		return getUrl().split('/user/')[1].substring(0,36);
	}	
	return "";
}

function populateProfilePage(){
	const params = {
		cognitoSub:viewedProfileCognitoSub
    }
	if (document.getElementById("playerProfile") && getUrl().indexOf('/user/') > -1){	
		$.post('/getProfile', params, function(data,status){
            console.log("getProfilePage response from server:");
            console.log(data);		
			if (!data.success){
                ///!!! Invalid user page constantly refreshes
				document.getElementById("mainContent").innerHTML = '<div id="fullScreenError" class="sectionTitle">Invalid User Page</div>';
			}
			else { //Viewing valid player profile
                viewedProfileName = data.USERNAME;
                viewedProfileRank = data.rank;
				var mainContentHTML = document.getElementById("mainContent").innerHTML;
				for (var element in data){
					var regex = new RegExp("{{" + element + "}}","g");
					mainContentHTML = mainContentHTML.replace(regex, data[element]);
				}
                $.get('/getUserCustomizations', params, function(data,status){
                    logg("GET USER CUSTOMIZATIONS RESPONSE:");
                    console.log(data);
                    if (!data.result){
                        alert("Error retrieving user customiaztions.");
                    }
                    else { //Got customizations
                        currentCustomizations = data.result;
                        showSelfProfileOptions();
                        cycleAppearance();
                    }
                });
				document.getElementById("mainContent").innerHTML = mainContentHTML;
			}
		});
	}	
}

function showSelfProfileOptions(){
    if (viewedProfileCognitoSub == cognitoSub && isLoggedIn()) {
        showBlock("shopCompletionDisplay");
        show("appearanceOptions");			
        show("shopCustomizeToggle");			
        show("statsOptionsToggle");			
        showSecondaySectionTitles();
		
		getCustomizationOptions(viewedProfileCognitoSub, function(data){
            customizationOptions = data.result;
			
			createCustomizationOptionDivs();
			populateCustomizationOptions();
			showContent("hat");	
            populateShopCompletion();
            
			$.get( '/getUserShopList', {cognitoSub:viewedProfileCognitoSub}, function(data) {
                logg("GET SHOP LIST RESPONSE:");
                console.log(data);
                if (data.result){
                    shopOptions = data.result;
                    shopRefreshTimer = shopOptions.timer.time;

                    if (getUrlParam("view") == "shop"){
                        toggleEquipBuy('buyTab');
                    }   
                    else if (getUrlParam("view") == "username"){
                        toggleStatsSettings('settingsTab');
                        showEditUserForm();
                    }        
                    
                }
                populateShopOptions();
            });			
		});
        $.get( '/getUserSettings', {cognitoSub:viewedProfileCognitoSub}, function(data) {
            logg("GET SETTINGS RESPONSE:");
            console.log(data);
            if (data.result){
                currentSettings.keybindings = hydrateKeybindingSettings(data.result.keybindings);
                originalSettings.keybindings = JSON.parse(JSON.stringify(hydrateKeybindingSettings(data.result.keybindings))); //Extra step to avoid originalSettings being a reference to currentSettings
                currentSettings.display = data.result.display;
                originalSettings.display = JSON.parse(JSON.stringify(data.result.display)); //Extra step to avoid originalSettings being a reference to currentSettings
                buildKeybindingsTable(currentSettings.keybindings);
                buildDisplaySettings(currentSettings.display);
            }
        });      
        buildProgressList();
    }
    else {
        show("invitePlayerButtons");			
    }
}

function buildProgressList(){

}

function buildDisplaySettings(displaySettings){
    var settingsList = document.getElementById("displaySettingsList");
    var HTML = "";

    var forceTeamNameColors = displaySettings.find(setting => setting.key == "forceTeamNameColors");
    var profanityFilter = displaySettings.find(setting => setting.key == "profanityFilter");
    var enableBlood = displaySettings.find(setting => setting.key == "enableBlood");

    if (forceTeamNameColors){
        var settingValue = forceTeamNameColors.value == true ? 'checked' : '';
        console.log(settingValue);
        HTML += "<input type='checkbox' class='settingsCheckbox' id='forceTeamNameColors' name='forceTeamNameColors' value='forceTeamNameColors' onclick='forceTeamNameColorsClicked()' " + settingValue + "><label for='forceTeamNameColors'> Force Team Name Colors</label><br></br>";
    }

    var profanityFilterCheckboxValue = 'checked';
    if (profanityFilter && profanityFilter.value == false){
        profanityFilterCheckboxValue = '';
    }
    HTML += "<input type='checkbox' class='settingsCheckbox' id='profanityFilter' name='profanityFilter' value='profanityFilter' onclick='profanityFilterClicked()' " + profanityFilterCheckboxValue + "><label for='profanityFilter'> Enable Profanity Filter</label><br></br>";
    
    var enableBloodCheckboxValue = '';
    if (enableBlood && enableBlood.value == true){
        enableBloodCheckboxValue = 'checked';
    }
    HTML += "<input type='checkbox' class='settingsCheckbox' id='enableBlood' name='enableBlood' value='enableBlood' onclick='enableBloodClicked()' " + enableBloodCheckboxValue + "><label for='enableBlood'> Enable Blood Effects</label><br></br>";
    
    
    settingsList.innerHTML = HTML;
}

function forceTeamNameColorsClicked(){
    flagUnsavedSettings(true);
    var forceTeamNameColors = currentSettings.display.find(setting => setting.key == "forceTeamNameColors");
    if (forceTeamNameColors && document.getElementById("forceTeamNameColors")){
        forceTeamNameColors.value = document.getElementById("forceTeamNameColors").checked;
    }
}

function profanityFilterClicked(){
    flagUnsavedSettings(true);
    if (!document.getElementById("profanityFilter")){return;}

    var profanityFilter = currentSettings.display.find(setting => setting.key == "profanityFilter");
    if (typeof profanityFilter === 'undefined'){
        currentSettings.display.push(newSetting("profanityFilter", document.getElementById("profanityFilter").checked))
        profanityFilter = currentSettings.display.find(setting => setting.key == "profanityFilter");
    }

    if (profanityFilter){
        profanityFilter.value = document.getElementById("profanityFilter").checked;
    }
}

function enableBloodClicked(){
    flagUnsavedSettings(true);
    if (!document.getElementById("enableBlood")){return;}

    var enableBlood = currentSettings.display.find(setting => setting.key == "enableBlood");
    if (typeof enableBlood === 'undefined'){
        currentSettings.display.push(newSetting("enableBlood", document.getElementById("enableBlood").checked))
        enableBlood = currentSettings.display.find(setting => setting.key == "enableBlood");
    }

    if (enableBlood){
        enableBlood.value = document.getElementById("enableBlood").checked;
    }
}

function newSetting(key, value){
    return {
        "key":key,
        "value":value
    };
}

function buildKeybindingsTable(data){
    var table = document.getElementById("keybindingConfigTable");
    var HTML = "";
    HTML += "<tr><th>Action Name</th><th>Primary Key</th><th>Secondary Key</th><th></th></tr>"; //Header row
    if (typeof table != 'undefined'){

        for (var r = 0; r < data.length; r++){
            var primaryClassName = "keybindingClickableCell";
            if (data[r].action == "chat")
                primaryClassName = "keybindingUnclickableCell";
                
            HTML += "<tr>";
                HTML += "<td id='moveUpActionName'>" + data[r].actionName + "</td>";
                HTML += "<td class='"+ primaryClassName + "' id='" + data[r].action + "Primary" + "' onclick='listenForBinding(\"" + data[r].action + "\", 1)'>" + keycodeToChar(data[r].primary) + "</td>";
                HTML += "<td class='keybindingClickableCell' id='" + data[r].action + "Secondary" + "' onclick='listenForBinding(\"" + data[r].action + "\", 2)'>" + keycodeToChar(data[r].secondary) + "</td>";
                HTML += "<td id='moveUpDefault'><button class='RWButton keybindingDefault' onclick='setDefault(\"" + data[r].action + "\")'>Default</button></td>";
            HTML += "</tr>";
        }
        table.innerHTML = HTML;
    }
}

function listenForBinding(action, slot){
    if (action == "chat" && slot == 1)
        return;
    var currentKeyConfig = currentSettings.keybindings.find(key => key.action == action);
    var slotName;
    var div;
    switch(slot){
        case 1:
            div = document.getElementById(action + "Primary");
            slotName = "primary";
            break;
        case 2:
            div = document.getElementById(action + "Secondary");
            slotName = "secondary";
            break;
        default:
            break;
    }
    if (div && currentKeyConfig){
        setAllKeybindingCells(currentSettings);
        listeningSlot = {action:action, slot:slotName};
        div.style.backgroundColor = "#434377";
        div.innerHTML = "Press key...";
    }
}


var listeningSlot = false;
document.onkeydown = function(event){
    if(event.keyCode === 27){ //Esc
        removeConfirmationMessage("rarityTextShop");
        setAllKeybindingCells(currentSettings);
	}
    else if (listeningSlot){
        var currentKeyConfig = currentSettings.keybindings.find(key => key.action == listeningSlot.action);
        if (!currentKeyConfig)
            return;
        for(var c = 0; c < currentSettings.keybindings.length; c++){ //Remove keybinding if already mapped elsewhere
            if (currentSettings.keybindings[c]["primary"] == event.keyCode)
                currentSettings.keybindings[c]["primary"] = -1;
            if (currentSettings.keybindings[c]["secondary"] == event.keyCode)
                currentSettings.keybindings[c]["secondary"] = -1;
        }
        currentKeyConfig[listeningSlot.slot] = event.keyCode;
        setAllKeybindingCells(currentSettings);
        listeningSlot = false;
        flagUnsavedSettings(true);
    }
}

function flagUnsavedSettings(unsaved){
    if (unsaved){
        unsavedSettings = true;
        window.onbeforeunload = function(){
            return 'Are you sure you want to leave?';
        };
    }
    else {
        unsavedSettings = false;
        window.onbeforeunload = null;    
    }
}

function setAllKeybindingCells(settings){
    var clickableCells = document.getElementsByClassName("keybindingClickableCell");
    for (var c = 0; c < clickableCells.length; c++){
        clickableCells[c].style.backgroundColor = 'unset';
        var loopSlotName = "primary";
        switch(clickableCells[c].id.indexOf("Primary")){
            case -1:
                loopSlotName = "Secondary";
                var keyConfigLoop = settings.keybindings.find(key => key.action == clickableCells[c].id.substr(0, clickableCells[c].id.indexOf(loopSlotName)));
                if (keyConfigLoop)
                    clickableCells[c].innerHTML = keycodeToChar(keyConfigLoop[loopSlotName.toLocaleLowerCase()]);
                break;
            default:
                loopSlotName = "Primary";
                var keyConfigLoop = settings.keybindings.find(key => key.action == clickableCells[c].id.substr(0, clickableCells[c].id.indexOf(loopSlotName)));
                if (keyConfigLoop)
                    clickableCells[c].innerHTML = keycodeToChar(keyConfigLoop[loopSlotName.toLocaleLowerCase()]);
                break;
        }
    }
}

function setOriginalSettings(){
    currentSettings = JSON.parse(JSON.stringify(originalSettings)); //Extra step to avoid originalSettings being a reference to currentSettings  
    buildDisplaySettings(currentSettings.display);
    buildKeybindingsTable(currentSettings.keybindings);
}

function setDefault(action){
    var keyConfig = currentSettings.keybindings.find(key => key.action == action);
    if (keyConfig && keyConfig.default){
        keyConfig.primary = keyConfig.default;
        keyConfig.secondary = -1;
        flagUnsavedSettings(true);
    }
    setAllKeybindingCells(currentSettings);
}

function keycodeToChar(code){    
    var char = keycodeToCharRef[code];
    if (!char)
        char = "[none]";

    return char;
}

function drawProfileCustomizations(){
    drawCustomization(currentCustomizations[displayTeam], displayAnimation, displayTeam, 0, function(drawnFrameTorso, id){
        drawCustomization(currentCustomizations[displayTeam], "legs", displayTeam, 0, function(drawnFrameLegs, id){
            displayAppearanceFrame(drawnFrameTorso, 1, drawnFrameLegs);
        });
    });
}

function displayAppearanceFrame(image, zoom = 1, secondImage = false){
    var ctx = document.getElementById("ctx").getContext("2d", { alpha: false });
    var canvas = document.getElementById("ctx");

    var backgroundImg = new Image();
    backgroundImg.src = "/src/client/img/map/tile.png";

    loadImages([backgroundImg.src], function(){
        var backgroundLayer = {
            img:backgroundImg
        };  
        drawOnCanvas(ctx, backgroundLayer);
        if (secondImage){
            var legsLayer = {
                img:secondImage,
                x:(canvas.width/2 - ((secondImage.width * zoom) / 2)),
                y:(canvas.height/2 - (((secondImage.height - playerCenterOffset)*zoom)/2)),
            };    
            drawOnCanvas(ctx, legsLayer, zoom, false);
        }
        var layer = {
            img:image,
            x:(canvas.width/2 - ((image.width * zoom) / 2)),
            y:(canvas.height/2 - ((image.height*zoom)/2)),
        };  
        drawOnCanvas(ctx, layer, zoom, false);
        if (currentCustomizations[displayTeam].icon == "rank"){
            currentCustomizations[displayTeam].icon = viewedProfileRank;
        }
        getUserIconImg(currentCustomizations[displayTeam].icon, false, function(iconImg, team){
            drawName(ctx, viewedProfileName, currentCustomizations[displayTeam].nameColor, canvas.width/2, 20, iconImg);
        });                
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

function showEditUserForm(){
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
        hideSettingsSections();
        show("updateUserForm");
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

function showKeybindingConfig(){
    hideSettingsSections();
    show("updateKeybindingsSection");
    showUnset('keybindingsConfig');
    hide('editKeybindingsButton');
}

function showDisplaySettings(){
    hideSettingsSections();
    show('displaySettingsContent');
    show('updateDisplaySettingsSection');
    hide("displaySettingsButton");
}

function hideSettingsSections(){
    var sections = document.getElementsByClassName("settingsSection");
    for (var s = 0; s < sections.length; s++){
        hide(sections[s].id);
    }
}

function showSettingsSections(){
    var sections = document.getElementsByClassName("settingsSection");
    for (var s = 0; s < sections.length; s++){
        show(sections[s].id);
    }
}

function settingsConfirmButtonClick(){
    var unHydratedSettings = JSON.stringify(unHydrateSettings(currentSettings));
    window.onbeforeunload = null;
    if (unsavedSettings){
        $.post('/setUserSettings', {viewedProfileCognitoSub:viewedProfileCognitoSub, settings:unHydratedSettings}, function(data,status){
            log("/setUserSettings response:");
            console.log(data);
            if (data.result){
                window.location.href = window.location.pathname;                    
            }
            else {
                alert(data.msg);
            }
        });        
    }
    else {
        window.location.href = window.location.pathname;
    }
}




function keybindingsResetButtonClick(){
    //Button removed for now
}


function settingsCancelButtonClick(){
    setOriginalSettings();
    show("editKeybindingsButton");
    show("displaySettingsButton");
    hide("keybindingsConfig");
    hide("displaySettingsContent");
    showSettingsSections();
    flagUnsavedSettings(false);
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
    showSettingsSections();
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

function inviteToTradeButtonClick() {
	console.log("inviteToTradeButtonClick() myIp:" + myIp);

	if (document.getElementById("playerProfile") && getUrl().indexOf('/user/') > -1){
		const data = {
			cognitoSub:cognitoSub,
            username:username,
            targetUsername:viewedProfileName,
			targetCognitoSub:getUrl().split('/user/')[1],
			ip: myIp,
			type:"trade"
		};		
		upsertRequest(data);
	}
}

function sendMessageButtonClick() {
	console.log("sendMessageButtonClick()");

	if (document.getElementById("playerProfile") && getUrl().indexOf('/user/') > -1){
		const data = {
			cognitoSub:cognitoSub,
            username:username,
            targetUsername:viewedProfileName,
			targetCognitoSub:getUrl().split('/user/')[1]
		};		
        
        $.post('/getOrCreateConversation', data, function(response,status){
            if (response){
                console.log("getOrCreateConversation response:");
                console.log(response);
                if (response.error){
                    alert("Error initiating conversation. " + response.msg);
                }
                else if (response.conversationId){
                    window.location = serverHomePage + "messaging/?conversationId=" + response.conversationId;
                }
            }
        });

	}
}

function upsertRequest(data){
	$.post('/upsertRequest', data, function(response,status){
        if (response){
            console.log("upsertRequest response:");
            console.log(response);
            if (response.error){
                alert(response.msg);
            }
            else {
                if (data.type == "trade" && response.url){
                    window.location = response.url;
                }
                else {
                    window.location.reload();
                }
            }
        }
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

function toggleStatsSettings(divId) {
    var div = document.getElementById(divId);
    removeConfirmationMessage("rarityTextShop");

    var tablinks = [ document.getElementById("statsTab"), document.getElementById("settingsTab") ]; 
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    div.className += " active";

    var statsContent = document.getElementById("statsContent");
    var settingsContent = document.getElementById("settingsContent");

    if (statsContent && settingsContent){
        switch (divId){
            case "statsTab":
                statsContent.style.display = "block";
                settingsContent.style.display = "none";
                break;
            case "settingsTab":
                statsContent.style.display = "none";
                settingsContent.style.display = "block";            
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

function toggleEquipBuy(divId) {
    var div = document.getElementById(divId);
    removeConfirmationMessage("rarityTextShop");

    var tablinks = [ document.getElementById("customizeTab"), document.getElementById("buyTab") ]; 
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    div.className += " active";

    var appearanceOptions = document.getElementById("appearanceOptions");
    var shopOptionsDiv = document.getElementById("shopOptions");

    if (appearanceOptions && shopOptionsDiv){
        switch (divId){
            case "customizeTab":
                appearanceOptions.style.display = "block";
                shopOptionsDiv.style.display = "none";
                break;
            case "buyTab":
                appearanceOptions.style.display = "none";
                shopOptionsDiv.style.display = "block";            
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

function selectTeam(event, team) {
    var tablinks;
    tablinks = document.getElementsByClassName("teamTablinks");
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].id = tablinks[i].id.replace("Active", "");
    }
    event.currentTarget.id += "Active";
    displayTeam = team;
    drawProfileCustomizations();
    populateCustomizationOptions();
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
        displayAnimation = "Laser";
    }
    else if (displayAnimation == "Laser"){
        displayAnimation = "pistol";
    }
    else {
        displayAnimation = "pistol";
    }
    
    drawProfileCustomizations();
}

function populateShopCompletion(){
    if (customizationOptions && customizationOptions.completion && customizationOptions.completion.percent){
        var percentage = document.getElementById("shopCompletionPercentage");
        var exclusives = document.getElementById("shopCompletionExclusives");
        if (percentage){
            percentage.innerHTML = customizationOptions.completion.percent + "%"
        }
        if (exclusives){
            exclusives.innerHTML = "+" + customizationOptions.completion.exclusives;
        }
    }
}

function populateShopOptions(){
    console.log("shopOptions OPTIONS:");
    console.log(shopOptions);

    var options = shopOptions;
    var div = document.getElementById("shopOptions");
    var HTML = "";
    HTML += "<div id='shopTopBar'>";
        HTML += "<div class='shopItem' id='refreshShop' style='width: 260px;' onclick='shopClick(\"refresh\", " + options.timer.resetPrice + ")'>";
        HTML += "<div class='shopIcon' id='default'><img src='/src/client/img/shopIcons/refresh.png'></div>";
        HTML += "<div id='shopTitle' style='color:#FFFFFF;' class='shopTitle'>Refresh Store Now</div><br><div class='shopText'>$" + numberWithCommas(options.timer.resetPrice) + "</div>";
        HTML += "<div id='rarityTextShop' class='shopTitle' style='float:right;'></div>";
        HTML +=	"</div>";
        HTML += "<div id='refreshTimer'>" + getRefreshTimerTextHTML() + "</div>";
    HTML += "</div>";

    HTML += "<div id='shopMainContent'>";
    HTML += "<div class='shopCategory' style='margin-top: 10px;'>Store</div>";
    for (const item in options.shop){
        HTML += getShopItemHTML(options.shop[item], false, "shop");
    }

    HTML += "</div>"; 
    HTML += "</div>"; 
    div.innerHTML = HTML;

    //draw on icon canvases
    drawShopIcons("shopOptions", options.shop)

    // for (const item in options.shop){
    //     if (options.shop[item].category == "other"){continue;}
    //     drawShopIcon(options.shop[item], options.shop[item].id + "ShopCtx");
    // }
}



function customizationSelect(canvasValue, team, key){
    if (key == "icon" && isRank(canvasValue)){
        canvasValue = "rank";
    }
    
    if (key == "pistolColor"){displayAnimation = "pistol";}
    if (key == "dpColor"){displayAnimation = "DP";}
    if (key == "mgColor"){displayAnimation = "MG";}
    if (key == "sgColor"){displayAnimation = "SG";}

    currentCustomizations[team][key] = canvasValue;
    drawProfileCustomizations();
    populateCustomizationOptions();

    var params = {
        team:team,
        key:key,
        value:canvasValue,
        cognitoSub:viewedProfileCognitoSub
    };
	$.post('/setUserCustomizations', params, function(data,status){
        log("/setUserCustomizations response:");
		log(data.msg);
	});
}

function isRank(value){
    const rankings = [
		"bronze1",
		"bronze2",
		"bronze3",
		"silver1",
		"silver2",
		"silver3",
		"gold1",
		"gold2",
		"gold3",
		"diamond",
		"diamond2"
    ];
    
    if (rankings.indexOf(value) > -1){
        return true;
    }
    return false;
}

function shopClick(itemId, price){
    console.log("Click Shop item");
    var item = document.getElementById(itemId+"Shop");
    console.log(item);
    var rarityTextId = "rarityTextShop";
    var rarityText = item.getElementById(rarityTextId);
    var confirmationMessage = "Confirm?";

    if (userCash >= price){
        if (rarityText.innerHTML != confirmationMessage){
            removeConfirmationMessage(rarityTextId);
            rarityText.innerHTML = confirmationMessage;
            rarityText.style.color = "#FFF";
            item.style.backgroundColor = "#BBB";
            if (itemId == "refresh"){
                rouletteOn = true;
            }
        }
        else {
            document.getElementById("shopOptions").style.pointerEvents = 'none'; // prevent double purchases
            $.post('/buyItem', {viewedProfileCognitoSub:viewedProfileCognitoSub, itemId:itemId}, function(data,status){
                log("/buyItem response:");
                console.log(data);
                if (data.result){
                    // window.location.reload();
                    console.log('RELOAD');
                    console.log(window.location.pathname + '?view=shop');
                    window.location.href = window.location.pathname + '?view=shop';                    
                }
                else {
                    alert(data.msg);
                }
            });        
        }
    }
    else {
        rarityText.innerHTML = "Too Poor!";
        rarityText.style.color = "#FF0000";
    }
}

function showQuestionMarksOverIcons(){
    var shopItems = document.getElementsByClassName("shopItem");
    for (var i = 0; i < shopItems.length; i++) {
        shopItems[i].getElementById("ShopCtx");
    }
}

function removeConfirmationMessage(rarityTextId){
    rouletteOn = false;
    var shopItems = document.getElementsByClassName("shopItem");
    for (var i = 0; i < shopItems.length; i++) {   
        
        if (shopItems[i].className.indexOf("shopItem customizeItem") > -1)   
            continue;
        if (!shopItems[i].getElementById("shopTitle")){
            //alert("Something went wrong when loading the item shop. Please refresh the page if you wish to shop.");
            logg("Something went wrong when loading the item shop. Please refresh the page if you wish to shop.");
            continue;
        }
        shopItems[i].getElementById(rarityTextId).style.color = shopItems[i].getElementById("shopTitle").style.color;
        shopItems[i].style.backgroundColor = "transparent";

        if (rgb2hex(shopItems[i].getElementById("shopTitle").style.color) == "#0074e0"){
            shopItems[i].getElementById(rarityTextId).innerHTML = "Rare";
        }
        else if (rgb2hex(shopItems[i].getElementById("shopTitle").style.color) == "#b700d8"){
            shopItems[i].getElementById(rarityTextId).innerHTML = "Epic";
        }
        else if (rgb2hex(shopItems[i].getElementById("shopTitle").style.color) == "#ffd200"){
            shopItems[i].getElementById(rarityTextId).innerHTML = "Legendary";
        }
        else {
            shopItems[i].getElementById(rarityTextId).innerHTML = "";
        }
    }    
}

function secondsToTimer(seconds){
    var colon = seconds % 2 == 0 ? ":" : " ";

    var hours = Math.floor(seconds / (60 * 60));
    seconds -= hours * (60 * 60);
    if (hours < 10){
        hours = "0" + hours;
    }

    var minutes = Math.floor(seconds / (60));
    seconds -= minutes * (60);
    if (minutes < 10){
        minutes = "0" + minutes;
    }
        
    if (seconds < 10){
        seconds = "0" + seconds;
    }

    var formattedTime = hours + colon + minutes + " " + seconds + "s";

    return formattedTime;
}

function getRefreshTimerTextHTML(){
    return '<div id="refreshTimerText">⟳ in </div><div id="refreshTimerTimer">' + secondsToTimer(shopRefreshTimer) + '</div>';
}

/* function getItemOwnedCount(itemId){
    var count = 0;
    if (!customizationOptions.fullList)
        return count;
    
    for (var i = 0; i < customizationOptions.fullList.length; i++){
        if (customizationOptions.fullList[i] == itemId)
            count++;
    }

	return count;
}
 */


setInterval( 
	function(){	
		//Tick tick tock clock
        if (viewedProfileCognitoSub == cognitoSub && shopRefreshTimer > -1){
            shopRefreshTimer--;
            if (shopRefreshTimer < 1 && document.getElementById("shopOptions") && document.getElementById("shopOptions").style.display != "none"){
                alert("Shop refresh available! Refresh page to get new shop items!");
                shopRefreshTimer = 86393;
            }
            document.getElementById('refreshTimer').innerHTML = getRefreshTimerTextHTML();
        }
	},
	1000 //Millisecond tick length
);

setInterval( 
	function(){	
        if (viewedProfileCognitoSub == cognitoSub){
            var shopIconRoulettes = document.getElementsByClassName("shopIconRoulette");
            var shopIconCanvases = document.getElementsByClassName("shopIconCanvas");

            if (rouletteOn){
                for (var c in shopIconCanvases){
                    if (shopIconCanvases[c].style)
                        shopIconCanvases[c].style.display = 'none';
                }
                for (var r in shopIconRoulettes){
                    if (shopIconCanvases[r].style){
                        shopIconRoulettes[r].style.display = 'inline-block';
                        const randy = randomInt(1,6);
                        switch(randy){
                            case 1:
                                shopIconRoulettes[r].src = '/src/client/img/shopIcons/roulette/questionB.png';
                                break;
                            case 2:
                                shopIconRoulettes[r].src = '/src/client/img/shopIcons/roulette/questionG.png';
                                break;
                            case 3:
                                shopIconRoulettes[r].src = '/src/client/img/shopIcons/roulette/questionY.png';
                                break;
                            case 4:
                                shopIconRoulettes[r].src = '/src/client/img/shopIcons/roulette/questionO.png';
                                break;
                            case 5:
                                shopIconRoulettes[r].src = '/src/client/img/shopIcons/roulette/questionR.png';
                                break;
                            case 6:
                                shopIconRoulettes[r].src = '/src/client/img/shopIcons/roulette/questionP.png';
                                break;
                            default:
                                shopIconRoulettes[r].src = '/src/client/img/shopIcons/roulette/questionB.png';
                                break;
                        }
                    }
                }
            } 
            else {
                for (var c in shopIconCanvases){
                    if (shopIconCanvases[c].style)
                        shopIconCanvases[c].style.display = 'inline-block';
                }
                for (var r in shopIconRoulettes){
                    if (shopIconCanvases[r].style)
                        shopIconRoulettes[r].style.display = 'none';
                }
            }       
        }
	},
	75 //Millisecond tick length
);



//userSettings example
/*
{
    keybindings:[
        {
            action:"moveUp",
            primary:57,
            secondary:-1
        },
        {
            action:"moveDown",
            primary:57,
            secondary:-1
        }
    ],
    display:[
        standardEnemyNameColors: false
    ]
}
*/


//shopOptions example
/*
    var options = {
        timer: {
            time: 10000,
            resetPrice: 10000
        },
        shop: [
            {
                id:"skiMaskHat",
                title: "Ski Mask",
                price: 5000,
                category: "hat",
                subCategory: "type",
                canvasValue: "skiMaskHat",
                team:0,
                rarity: 0
            },
            {
                id:"slimShadyHairColor",
                title: "Slim Shady",
                price: 5000,
                category: "hair",
                subCategory: "color",
                canvasValue: "#fff3b3",
                team:1,
                rarity: 1
            },
            {
                id:"unlock",
                title: "Unlock New Store Slot",
                category: "other",
                subCategory: "",
                price: 10000,
                color: "",
                canvasValue: "",                
                team:0,
                rarity: 3
            }
        ]
    };
    */

//Customization Options example
/*
   options = {
        "1": {
            hat: {
                type:[
                    {
                        id: "noneHat",
                        canvasValue:"noneHat",
                        title:"None",
                        text:"",
                        rarity:1
                    },
                    {
                        id:"haloHat",
                        canvasValue:"haloHat",
                        title:"Halo",
                        text:"Conflict Progressed",
                        rarity:1
                    },
                    {
                        id:"skiMaskHat",
                        canvasValue:"skiMaskHat",
                        title:"Ski Mask",
                        text:"Thug life",
                        rarity:1
                    },
                    {
                        id:"sunglassesHat",
                        canvasValue:"sunglassesHat",
                        title:"Shades",
                        text:"Cool as a cucumber",
                        rarity:1
                    },
                    {
                        id:"googlyHat",
                        canvasValue:"googlyHat",
                        title:"Googly Eyes",
                        text:"These eyes be poppin",
                        rarity:1
                    }
                ]
            },
            hair: {
                type:[
                    {
                        id:"bald",
                        canvasValue:"bald",
                        title:"Bald",
                        text:"",
                        rarity:1
                    },
                    {
                        id:"crewHair",
                        canvasValue:"crewHair",
                        title:"Crew Cut",
                        text:"Military standard",
                        rarity:1
                    },
                    {
                        id:"afroHair",
                        canvasValue:"afroHair",
                        title:"Afro",
                        text:"It's an afro",
                        rarity:1
                    },
                    {
                        id:"bigAfro",
                        canvasValue:"bigAfro",
                        title:"Big Afro",
                        text:"Let's bring back the 80s!",
                        rarity:1
                    },
                    {
                        id:"cornrowsHair",
                        canvasValue:"cornrowsHair",
                        title:"Cornrows",
                        text:"Hey now, don't be culturally appropriating the Greeks",
                        rarity:1
                    }                    
                ],
                color:[
                    {
                        id:"#603913",
                        canvasValue:"#603913",
                        title:"Brown",
                        text:"It's brown",
                        rarity:1
                    },
                    {
                        canvasValue:"#130900",
                        title:"Black",
                        text:"Jet black",
                        rarity:1
                    },
                    {
                        canvasValue:"#fff3b3",
                        title:"Slim Shady",
                        text:"I'm back!",
                        rarity:1
                    },
                    {
                        canvasValue:"#c6c6c6",
                        title:"Grey",
                        text:"Wise beyond your years",
                        rarity:1
                    }
                ]                
            }
        },
        "2": {
            hat: {
                type:[
                    {
                        canvasValue:"googly",
                        title:"Googly Eyes",
                        text:"These eyes be poppin",
                        rarity:1
                    }
                ],
                color:[
                    {
                        canvasValue:"#0000FF",
                        title:"Velvet",
                        text:"Rrrrrroyal blue",
                        rarity:1
                    }
                ]
            }
        },
        fullList:[
            "slimShadyHair"
            "bigAfroHair"
        ]
    }
*/