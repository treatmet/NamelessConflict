const fetch = require('node-fetch');
const request = require('request-promise');
const jwkToPem = require('jwk-to-pem');
const jwt = require('jsonwebtoken');

const cognitoClientId = '70ru3b3jgosqa5fpre6khrislj';
const expectedIss = 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_SbevJL5zt';

var getAuthorizedUser = async function(cookies){
	var tokens = {
		access_token:cookies["cog_a"],
		refresh_token:cookies["cog_r"]
	};			
	
	return await validateTokenOrRefresh(tokens);
}

var getTokenFromCodeAndValidate = async function(code){
	var error = false;
	var redirectUri = 'https://socketshot.io/';
	
	if (isLocal || isTest)
		redirectUri = 'https://rw2.treatmetcalf.com/';
	

    const url='https://treatmetcalfgames.auth.us-east-2.amazoncognito.com/oauth2/token';
	const body = {
		grant_type:'authorization_code',
		code:code,
		client_id:cognitoClientId,
		redirect_uri:redirectUri
	};
	
	var formBody = Object.keys(body).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(body[key])).join('&');
	
	const params = {
		headers:{
			"Content-Type":'application/x-www-form-urlencoded'
		},
		body:formBody,
		method:"POST"
	};

	var tokens = {};
	
	log("Calling Cognito Get Token endpoint with: " + formBody);
	await fetch(url, params)
	.then(data=>{return data.json()})
	.then(res=>{tokens = res;})
	.catch(error=>{
        logg(error);
        error = true;
    });
    if (error || !tokens.access_token){
		return {msg:"ERROR - Unable to exchange code for token! " + code};
    }
	
	var validationResponse = await validateTokenOrRefresh(tokens);

	return validationResponse;
}

var validateTokenOrRefresh = async function(tokens){
	log("Validating token or refreshing..");
	//log("access_token=" + tokens.access_token);
	//log("id_token=" + tokens.id_token);
	//log("refresh_token=" + tokens.refresh_token);
	var validationResponse = await validateToken(tokens.access_token); //sets username and cognitoSub

	validationResponse.refresh_token = tokens.refresh_token;
	validationResponse.id_token = tokens.id_token;
	validationResponse.access_token = tokens.access_token;
	if (validationResponse.fail) { //If token validation failed, use the refresh token to get a new one
		var refreshResult = await refreshCognitoToken(tokens.refresh_token);
		if (refreshResult.id_token){
			log("SUCCESSFULLY REFRESHED TOKEN");
			validationResponse.id_token = refreshResult.id_token;
			validationResponse.access_token = refreshResult.access_token;
		}
		var refreshedValidationResponse = await validateToken(refreshResult.access_token);
		if (refreshedValidationResponse.msg){
			validationResponse.cognitoSub = refreshedValidationResponse.cognitoSub;
			validationResponse.username = refreshedValidationResponse.username;
			validationResponse.federatedUser = refreshedValidationResponse.federatedUser;
			validationResponse.msg = "Token Refreshed - " + refreshedValidationResponse.msg;
		}
		if (!validationResponse.cognitoSub){ //Refresh failed
			delete validationResponse.refresh_token;
		}
	}
	return validationResponse;
}

var validateToken = async function(token) {
	//logg('VALIDATING TOKEN:' + token);

	var username = "";
	var cognitoSub = "";
	var federatedUser = false;

	var validateTokenResult = {};
	await request({
		url: 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_SbevJL5zt/.well-known/jwks.json',
		json: true
	}, async function (error, response, body) {
		//log("STATUS CODE:" + response.statusCode);
		if (!error && response.statusCode === 200) {

			//Step 1: Confirm the Structure of the JWT
			var decodedJwt = jwt.decode(token, { complete: true });
			if (!decodedJwt) {
				log("validateToken - Not a valid JWT token");
				validateTokenResult = {fail:true, msg:"ERROR  - Not a valid JWT token"};
				return;
			}
			else {

				//Step 2: Validate the JWT Signature
				var payload = validateJWTSignatureAndGetPayload(body['keys'], decodedJwt, token);
				if (!payload){
					logg("ERROR - Invalid JWT Signature!!");
					validateTokenResult = {fail:true, msg:"ERROR - Invalid JWT Signature!!"};
					return;					
				}
				else{

					//Step 3: Verify the Claims
					var currentDateInterval = new Date() / 1000;
					//currentDateInterval = 9999999999999; //Force expiration
					if (payload.exp < currentDateInterval) { //payload.exp is seconds since Jan 1 1970
					logg("WARNING - Expired Token, authentication required");
						validateTokenResult = {fail:true, msg:"WARNING - Expired Token, authentication required"};
						return;
					}
					if (payload.client_id && payload.client_id != cognitoClientId){
						logg("ERROR - Token client_id does not match cognito Client Id");
						validateTokenResult = {fail:true, msg:"ERROR - Token client_id does not match cognito Client Id"};
						return;
					}
					if (payload.iss != expectedIss){
						logg("ERROR - Token does not have correct issuer (Cognito Pool ARN)");
						validateTokenResult = {fail:true, msg:"ERROR - Token does not have correct issuer (Cognito Pool ARN)"};
						return;
					}
					//logg("Valid Token! Returning...");

					username = payload.username;
					cognitoSub = payload.sub;
					if (payload['cognito:groups']){
						federatedUser = true;
						//log("Confirmed user is a federated account.");
					}

					if (username != "" && cognitoSub != "") {
						//SUCCESS
						//log("USERNAME SUCCESSFULLY GOT FROM TOKEN: " + username);
						
						validateTokenResult = {
							cognitoSub: cognitoSub,
							username: username,
							federatedUser:federatedUser,
							msg:"Successfully Validated Token!"
						};
					}
				}
			}
		}
		else {
			//FAIL
			logg("validateToken - Error! Unable to download JWKs");
			return {msg:"ERROR - Unable to download JWKs"};
		}
	}).then(function (result) {		
	}).catch(function (err){log(err);});
	return validateTokenResult;
}

var refreshCognitoToken = async function(refreshToken){

	logg("Token invalid or expired, attempting to refresh using Refresh Token");
    const url='https://treatmetcalfgames.auth.us-east-2.amazoncognito.com/oauth2/token';
	const body = {
		grant_type:'refresh_token',
		client_id:cognitoClientId,
		refresh_token:refreshToken
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
	
	await fetch(url, params)
	.then(data=>{return data.json()})
	.then(res=>{result = res;})
	.catch(error=>{
        logg(error);
        error = true;
    });
	return result;
}

var validateJWTSignatureAndGetPayload = function(keys, decodedJwt, token){
	var result = null;
	var pems = {};


	for (var i = 0; i < keys.length; i++) {
		//Convert each key to PEM
		var key_id = keys[i].kid;
		var modulus = keys[i].n;
		var exponent = keys[i].e;
		var key_type = keys[i].kty;
		var jwk = { kty: key_type, n: modulus, e: exponent };
		var pem = jwkToPem(jwk);
		pems[key_id] = pem;
	}
	var kid = decodedJwt.header.kid;
	var pem = pems[kid];
	if (!pem) {
		logg('ERROR in validateJWTSignatureAndGetPayload - unable to convert jwk to pem');
		return null;
	}
	else {
		
		jwt.verify(token, pem, function (err, payload) {
			if (err) {
				logg("validateJWTSignatureAndGetPayload - Invalid Token:");
				logg(token);
				return null;
			}
			else {
				//logg("SUCCESS validateJWTSignaturePayload");
				result = payload;
			}
		});
	}
	return result;
}

module.exports.getAuthorizedUser = getAuthorizedUser;
module.exports.getTokenFromCodeAndValidate = getTokenFromCodeAndValidate;
module.exports.validateTokenOrRefresh = validateTokenOrRefresh;
module.exports.validateToken = validateToken;