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
    getTokenFromUrlParameterAndAutoLogin(); //Call on page load
    showLocalElements();
}


const poolData = {    
	UserPoolId : "us-east-2_J9C8roiT5",
	ClientId : "6knin86fqb0nltirs08s3t9kl"
}; 
const pool_region = 'us-east-2';

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

const googleAppId = '1028026572877-3oo50c7od1oe5003p5omhm17if82nuf6.apps.googleusercontent.com';
const googleClientSecret = '28UMgul9yQSWAElpl0HiMket';

function showLocalElements(){
  $(document).ready(function() {
    if (window.location.href.indexOf("localhost") > -1) {
      document.getElementById("localPlayNow").style.display = "";
    }
  });
}

function cognitoRegisterUser(){
	var username = document.getElementById("usernameText").value;
	var password = document.getElementById("passwordText").value;
	
    var attributeList = [];
    //attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"name",Value:"Prasad Jayashanka"}));
    //attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"preferred_username",Value:"jay"}));
    //attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"gender",Value:"male"}));
    //attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"birthdate",Value:"1991-06-21"}));
    //attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"address",Value:"CMB"}));
    //attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"email",Value:"sampleEmail@gmail.com"}));
    //attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"phone_number",Value:"+5412614324321"}));
    //attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"custom:scope",Value:"admin"}));

    userPool.signUp(username, password, attributeList, null, function(err, result){
        if (err) {
            logg("AWS COGNITO ERROR Registering User: " + username);
            logg(err);
            return;
        }
        cognitoUser = result.user;
        logg('Registered User: ' + cognitoUser.getUsername());
    });
}


function storeTokensInCookie(tokens){
    document.cookie = "accessToken="+tokens.accessToken;
    document.cookie = "idToken="+tokens.idToken;
    document.cookie = "refreshToken="+tokens.refreshToken;
}

function storeCookie(key, value){
    document.cookie = key + "=" + value;
}

//Depricated
function cognitoSignIn() {
	var username = document.getElementById("usernameText").value;
	var password = document.getElementById("passwordText").value;

    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username : username,
        Password : password,
    });
		
    var userData = {
        Username : username,
        Pool : userPool
    };
	
	
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    
    var cognitoTokens = {};

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            logg('Successfully logged in User: ' + username);
            cognitoTokens.accessToken = result.getAccessToken().getJwtToken();
            cognitoTokens.idToken = result.getIdToken().getJwtToken();
            cognitoTokens.refreshToken = result.getRefreshToken().getToken();
            //storeTokensInCookie(cognitoTokens);
            
            console.log('access token + ' + cognitoTokens.accessToken);
            console.log('id token + ' + cognitoTokens.idToken);
            console.log('refresh token + ' + cognitoTokens.refreshToken);
        },
        onFailure: function(err) {
            console.log(err);
        },
		newPasswordRequired: function(userAttributes, requiredAttributes) {
			console.log("User needs new password");
			res({userAttributes, requiredAttributes});
		},
    });
}

//Google Auth
function onSignIn(googleUser) {
  console.log('Successful Google Auth! Getting profile...'); 
  var profile = googleUser.getBasicProfile();
  console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
  console.log('Name: ' + profile.getName());
  console.log('Image URL: ' + profile.getImageUrl());
  console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
  signinCallback(googleUser.getAuthResponse());
}

function signinCallback(authResult) {
  console.log('Calling back to COGNITO');
  console.log(authResult);
  if (authResult['status']['signed_in']) {

     // Add the Google access token to the Cognito credentials login map.
     AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'us-east-2:59ad620e-29a6-4de2-9b6b-c5d20be7ae2d',
        Logins: {
           'accounts.google.com': authResult['id_token']
        }
     });

     // Obtain AWS credentials
     AWS.config.credentials.get(function(){
        // Access AWS resources here.
     });
  }
}

function ValidateToken(token) {
	socket.emit('validateToken', token);
}

function ValidateTokenFromText() {
	var token = document.getElementById("JWToken").value;
	socket.emit('validateToken', token);
}


function ChangePassword(username, password, newPassword) {
        var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: username,
            Password: password,
        });

        var userData = {
            Username: username,
            Pool: userPool
        };
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
                cognitoUser.changePassword(password, newPassword, (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Successfully changed password of the user.");
                        console.log(result);
                    }
                });
            },
            onFailure: function (err) {
                console.log(err);
            },
        });
}

function consoleUrlPram(){
	console.log(getUrlVars());
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


function getTokenFromUrlParameterAndAutoLogin(){
	var code = getUrlParam("code", "");
	console.log("Grabbed code from URL: " + code);
	if (code == ""){
		console.log("Unable to get Url parameter: 'code'");
	}
	getTokenFromCode(code);
}

//TODO!!!: Move server-side

//Post to server body = 3 tokens
//First, check if session exists by POST to server. Does it have cog_a set?
//2, establish connection on POST

async function getTokenFromCode(code){
	const url='https://treatmetcalf.auth.us-east-2.amazoncognito.com/oauth2/token';
	const body = {
		grant_type:'authorization_code',
		code:code,
		client_id:'6knin86fqb0nltirs08s3t9kl',
		redirect_uri:'https://rw.treatmetcalf.com/'
	};
	
	var formBody = Object.keys(body).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(body[key])).join('&');
	
	const params = {
		headers:{
			"Content-Type":'application/x-www-form-urlencoded'
		},
		body:formBody,
		method:"POST"
	};
	var result = {};

	console.log("PARAMS:");
	console.log(params);
	console.log("END PARAMS");
	
	await fetch(url, params)
	.then(data=>{return data.json()})
	.then(res=>{result = res; console.log(res);})
	.catch(error=>{console.log(error)});
	
	console.log("User Id Token:");
    console.log(result);

    //TODO!!! set HttpOnly property
    storeCookie("cog_i", result.id_token);
    storeCookie("cog_a", result.access_token);
    storeCookie("cog_r", result.refresh_token);
	
	ValidateToken(result.access_token);
	clearHistoryAndUrlParams();
}


function postData(url = '', data = {}) {
  // Default options are marked with *
    return fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, cors, *same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            //'Content-Type': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrer: 'no-referrer', // no-referrer, *client
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    })
    .then(response => response.json()); // parses JSON response into native JavaScript objects 
}

function clearHistoryAndUrlParams(){
	window.history.pushState({}, document.title, "/");
}


