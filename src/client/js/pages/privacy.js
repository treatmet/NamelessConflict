page = "trade";
var tradeId = getUrlParam("tradeId");
var customizationOptions = {};
var yourOfferings = [];
var opponentsOfferings = [];
var opponentName = "";

initializePage();
function initializePage(){
    showLocalElements();
	getTokenFromUrlParameterAndLogin();
}

function loginSuccess(){
	showAuthorizedLoginButtons();            
}

function loginFail(){
	showDefaultLoginButtons();
}

function loginAlways(){
    showUnset("mainContent");
}
