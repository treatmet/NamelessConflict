page = "profile";
var viewedProfileCognitoSub = "";
var currentCustomizations = {};
var displayAnimation = "";
var displayTeam = "red";
var customizationOptions = {};
var shopOptions = {};
var shopRefreshTimer = 0;

initializePage();
function initializePage(){
    viewedProfileCognitoSub = getViewedProfileCognitoSub();
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
		return getUrl().split('/user/')[1];
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
				var mainContentHTML = document.getElementById("mainContent").innerHTML;
				for (var element in data){
					var regex = new RegExp("{{" + element + "}}","g");
					mainContentHTML = mainContentHTML.replace(regex, data[element]);
				}
                $.get('/getUserCustomizations', params, function(data,status){
                    console.log("GET USER CUSTOMIZATIONS RESPONSE:");
                    console.log(data);
                    if (!data.result){
                        alert("Error retrieving user customiaztions.");
                    }
                    else { //Got customizations
                        currentCustomizations = data.result;
                        cycleAppearance();
                    }
                });
				document.getElementById("mainContent").innerHTML = mainContentHTML;
			}
		});
	}	
}

function showSelfProfileOptions(){
    if (viewedProfileCognitoSub == cognitoSub && cognitoSub != "") {
        show("appearanceOptions");			
        show("shopCustomizeToggle");			
        show('updateUserForm');
        show('editUserButton');
        showSecondaySectionTitles();
        show("appearanceOptions");
        $.get( '/getUserCustomizationOptions', {cognitoSub:viewedProfileCognitoSub}, function(data) {
            console.log("GET CUSTOMIZATION OPTIONS RESPONSE:");
            console.log(data);
            if (data.result)
                customizationOptions = data.result;
            populateCustomizationOptions();
        });
        $.get( '/getUserShopList', {cognitoSub:viewedProfileCognitoSub}, function(data) {
            console.log("GET SHOP LIST RESPONSE:");
            console.log(data);
            if (data.result)
                shopOptions = data.result;

            console.log("GOT SHOP OPTIONS:");
            console.log(shopOptions);
            console.log("CALLING POPULATRE SHOP OPTIONS");
            populateShopOptions();
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
    var shopOptionsDiv = document.getElementById("shopOptions");

    if (appearanceOptions && shopOptionsDiv){
        switch (event.currentTarget.id){
            case "customizeToggleIcon":
                appearanceOptions.style.display = "block";
                shopOptionsDiv.style.display = "none";
                break;
            case "shopToggleIcon":
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

function toggleShopSelected(event) {
    var tablinks = document.getElementsByClassName("toggleIcons");
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    event.currentTarget.className += " active";

    var appearanceOptions = document.getElementById("appearanceOptions");
    var shopOptionsDiv = document.getElementById("shopOptions");

    if (appearanceOptions && shopOptionsDiv){
        switch (event.currentTarget.id){
            case "customizeToggleIcon":
                appearanceOptions.style.display = "block";
                shopOptionsDiv.style.display = "none";
                break;
            case "shopToggleIcon":
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
 


    for (const category in options[displayTeam]){
        var HTML = "";
        log("Grabbing ID " + category + "Div");
        var div = document.getElementById(category + "Div");
        if (typeof div === 'undefined')
            continue;

        for (const subCategory in options[displayTeam][category]){
            var displaySubCategory = capitalizeFirstLetter(subCategory);

            if (subCategory == "type")
                displaySubCategory = "";

            HTML += "<div class='shopCategory'>" + displaySubCategory + "</div>"

            for (const item in options[displayTeam][category][subCategory]){
                var shopIconClass = "shopIcon";
                if (currentCustomizations[displayTeam][category + displaySubCategory] == options[displayTeam][category][subCategory][item].canvasPng){
                    shopIconClass += " active";
                }

                HTML += "<div class='shopItem' id ='" + options[displayTeam][category][subCategory][item].canvasPng + "' onclick='customizationSelect(event, \"" + displayTeam + "\",\"" + category + displaySubCategory + "\")'>";
                if (subCategory == 'type'){
                    HTML += "<div class='" + shopIconClass + "'><img src='/client/img/shopIcons/" + options[displayTeam][category][subCategory][item].icon + "'></div>";
                }
                else if(subCategory == 'color'){
                    HTML += "<div class='" + shopIconClass + "' style='background-color:" + options[displayTeam][category][subCategory][item].icon + "'></div>";
                }
                HTML += "<div class='shopTitle'>" + options[displayTeam][category][subCategory][item].title + "</div><br>";
                HTML += "<div class='shopText'>" + options[displayTeam][category][subCategory][item].text + "</div>";
                HTML += "</div>";
            }
        }
        div.innerHTML = HTML;
    }
}

function populateShopOptions(){


    console.log("shopOptions OPTIONS:");
    console.log(shopOptions);

    var options = shopOptions;


    shopRefreshTimer = options.timer.time;

    var div = document.getElementById("shopOptions");
    var HTML = "<div class='shopCategory'></div>";
	HTML += "<div class='refreshItem' id='refresh' onclick='shopClick(\"refresh\", " + options.timer.resetPrice + ")'>";
	HTML += "<div class='shopIcon' id='default'><img src='/client/img/shopIcons/refresh.png'></div>";
	HTML += "<div class='shopTitle'>Refresh Store Now</div><br><div class='shopText'>$" + numberWithCommas(options.timer.resetPrice) + "</div>";
    HTML +=	"</div>";
    HTML += "<div id='refreshTimer'>" + getRefreshTimerTextHTML() + "</div>";
    HTML += "<div class='shopCategory'>Store</div>";

    for (const item in options.shop){
        HTML += "<div class='shopItem' id='" + options.shop[item].id + "' onclick='shopClick(\"" + options.shop[item].id + "\"," + options.shop[item].price + ")'>";
        if (options.shop[item].subCategory == "color"){
            HTML += "<div class='shopIcon' id='" + options.shop[item].color + "' style='background-color:" + options.shop[item].icon + "'></div>";
        }
        else {
            HTML += "<div class='shopIcon' id ='" + options.shop[item].canvasPng + "'><img src='/client/img/shopIcons/" + options.shop[item].icon + "'></div>";
        }

        var rarityImg;
        switch(options.shop[item].rarity){
            case 0:
                rarityImg = "rarities/common.png";
                break;
            case 1:
                rarityImg = "rarities/rare.png";
                break;
            case 2:
                rarityImg = "rarities/epic.png";
                break;
            case 3:
                rarityImg = "rarities/legendary.png";
                break;
            default:            
                break;
        }

        if (rarityImg)
            HTML += "<div class='shopIconOverlay' id ='" + options.shop[item].id + "' onclick='shopClick(\"" + options.shop[item].id + "\"," + options.shop[item].price + ")'><img src='/client/img/shopIcons/" + rarityImg + "'></div>";
        if (options.shop[item].title)
            HTML += "<div class='shopTitle'>" + options.shop[item].title + "</div><br>";
        if (options.shop[item].price)
            HTML += "<div id='shopTextPrice' class='shopText'>$" + numberWithCommas(options.shop[item].price) + "</div><br>";

        var displayCategory = "";
        if (options.shop[item].category != "other"){
            displayCategory += capitalizeFirstLetter(options.shop[item].category);
            if (options.shop[item].subCategory != "type"){
                displayCategory += (" " + capitalizeFirstLetter(options.shop[item].subCategory));
            }
        }
        if (displayCategory.length > 0)
            HTML += "<div id='shopTextCategory' class='shopText'>" + displayCategory + "</div>";

        switch(options.shop[item].team){
            case 1:
                HTML += "<div class='shopText' style='color: #bf1f1f;'>| Red team item</div>";
                break;
            case 2:
                HTML += "<div class='shopText' style='color: #476aeb;'>| Blue team item</div>";
                break;
            default:
                break;
        }       

        HTML += "</div>"; 
    }
    HTML += "</div>"; 
    div.innerHTML = HTML;    
}




function customizationSelect(event, team, key){
    currentCustomizations[team][key] = event.currentTarget.id;
    drawProfileCustomizations();
    populateCustomizationOptions();

    var params = {
        team:team,
        key:key,
        value:event.currentTarget.id,
        cognitoSub:viewedProfileCognitoSub
    };
	$.post('/setUserCustomizations', params, function(data,status){
        log("/setUserCustomizations response:");
		log(data.msg);
	});
}

function shopClick(id, price){
    logg("SHOP ID");
    console.log(id);
    logg("SHOP PRICE");
    console.log(price);
    if (userCash >= price){

    }

}

function secondsToTimer(seconds){
    if (seconds < 0 ){
        seconds = 0;
        window.location.reload();
    }

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


setInterval( 
	function(){	
		//Tick clock
        shopRefreshTimer--;
        document.getElementById('refreshTimer').innerHTML = getRefreshTimerTextHTML();
	},
	1000/1 // 1000/Ticks per second
);

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
                color: "",
                canvasPng: "skiMaskHat",
                icon: "hat/skiMask.png",
                team:0,
                rarity: 0
            },
            {
                id:"slimShadyHairColor",
                title: "Slim Shady",
                price: 5000,
                category: "hair",
                subCategory: "color",
                color: "#fff3b3",
                canvasPng: "",
                icon: "#fff3b3",
                team:1,
                rarity: 1
            },
            {
                id:"unlock",
                title: "Unlock New Store Slot",
                category: "other",
                subCategory: "",
                price: 10000,
                icon: "locked.png",
                color: "",
                canvasPng: "",                
                team:0,
                rarity: 3
            }
        ]
    };
    */

//Customization Options example
/*
   options = {
        red: {
            hat: {
                type:[
                    {
                        canvasPng:"noneHat",
                        title:"None",
                        text:"",
                        icon:"none.png"
                    },
                    {
                        canvasPng:"haloHat",
                        title:"Halo",
                        text:"Conflict Progressed",
                        icon:"hat/halo.png"
                    },
                    {
                        canvasPng:"skiMaskHat",
                        title:"Ski Mask",
                        text:"Thug life",
                        icon:"hat/skiMask.png"
                    },
                    {
                        canvasPng:"sunglassesHat",
                        title:"Shades",
                        text:"Cool as a cucumber",
                        icon:"hat/sunglasses.png"
                    },
                    {
                        canvasPng:"googlyHat",
                        title:"Googly Eyes",
                        text:"These eyes be poppin",
                        icon:"hat/googly.png"
                    }
                ]
            },
            hair: {
                type:[
                    {
                        canvasPng:"bald",
                        title:"Bald",
                        text:"",
                        icon:"hair/bald.png"
                    },
                    {
                        canvasPng:"crewHair",
                        title:"Crew Cut",
                        text:"Military standard",
                        icon:"hair/crew.png"
                    },
                    {
                        canvasPng:"afroHair",
                        title:"Afro",
                        text:"It's an afro",
                        icon:"hair/afro.png"
                    },
                    {
                        canvasPng:"bigAfro",
                        title:"Big Afro",
                        text:"Let's bring back the 80s!",
                        icon:"hair/bigAfro.png"
                    },
                    {
                        canvasPng:"cornrowsHair",
                        title:"Cornrows",
                        text:"Hey now, don't be culturally appropriating the Greeks",
                        icon:"hair/cornrows.png"
                    }                    
                ],
                color:[
                    {
                        color:"#603913",
                        title:"Brown",
                        text:"It's brown",
                        icon:"#603913"
                    },
                    {
                        color:"#130900",
                        title:"Black",
                        text:"Jet black",
                        icon:"#130900"
                    },
                    {
                        color:"#fff3b3",
                        title:"Slim Shady",
                        text:"I'm back!",
                        icon:"#fff3b3"
                    },
                    {
                        color:"#c6c6c6",
                        title:"Grey",
                        text:"Wise beyond your years",
                        icon:"#c6c6c6"
                    }
                ]                
            }
        },
        blue: {
            hat: {
                type:[
                    {
                        canvasPng:"googly",
                        title:"Googly Eyes",
                        text:"These eyes be poppin",
                        icon:"hat/googly.png"
                    }
                ],
                color:[
                    {
                        color:"#0000FF",
                        title:"Blue",
                        text:"Rrrrrroyal blue",
                        icon:"#0000FF"
                    }
                ]
            }
        }
    }
*/