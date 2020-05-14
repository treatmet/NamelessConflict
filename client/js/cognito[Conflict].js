//Flow
//Load any page
//Check for code= in URL
    //If present, get token ON THE SERVER (change), (check/add to mongo), set HttpOnly cookies on server and send to client
    //If missing, Check if cookies are defined
        //If so, send id and refresh tokens to server and attempt validation on the server
            //If valid, (check/add to mongo) send user info back to client and trigger loginSuccess()
            //If invalid, attempt to use refresh token
                //If refresh token success, set HttpOnly cookie on client and trigger loginSuccess() (check/add to mongo)
                //If refresh fail, exit auth flow (login buttons should remain on page)
        //If cookies are undefined, exit auth flow (login buttons should remain on page)



initializePage();

function initializePage(){
    getTokenFromUrlParameterAndLogin(); 
    getTokenFromCookieAndLogin();
    showLocalElements();
}

//Post to server body = 3 tokens
//First, check if session exists by POST to server. Does it have cog_a set?
//2, establish connection on POST
function getTokenFromUrlParameterAndLogin(){
	var code = getUrlParam("code", "");
	console.log("Grabbed code from URL: " + code);
	if (code == ""){
		console.log("Unable to get Url parameter: 'code'");
	}
	getTokenFromCode(code);
}

function getTokenFromCode(code){
    const validateTokenEndpoint = '/validateToken';
    const data = {
        code:code
    };

    //Probably need to set header for ContentType: application/json
    $.post(validateTokenEndpoint, data, function(data,status){
        console.log("validateToken response:");
        console.log(data);
    });
}


function showLocalElements(){
  $(document).ready(function() {
    if (window.location.href.indexOf("localhost") > -1) {
      document.getElementById("localPlayNow").style.display = "";
    }
  });
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