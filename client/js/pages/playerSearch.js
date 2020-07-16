const page = "playerSearch";
initializePage();
function initializePage(){
    showLocalElements();
	populateSearchPage();
	getTokenFromUrlParameterAndLogin(); 	
}


function populateSearchPage(){
	if (document.getElementById('playerSearchPageBox')){
		$.post('/getPlayerSearchResults', {searchText:getSearchText()}, function(res,status){
			console.log("getPlayerSearchResults response:");
			console.log(res);
			
			var searchResultsHTML = "";
			for (var i = 0; i < res.length; i++){
				searchResultsHTML+="<a href='" + serverHomePage + "user/" + res[i].cognitoSub + "'>" + res[i].username + "</a><br>";
			}	
		
			document.getElementById('searchResults').innerHTML = searchResultsHTML;
		});

		setPlayerSearchText();
	}	
}

window.addEventListener('load', function () {
	showUnset("mainContent");	

	focusPlayerSearchPageBox();
	pageLoaded = true;
})

function focusPlayerSearchPageBox(){
	if (document.getElementById("playerSearchPageBox")){
		document.getElementById("playerSearchPageBox").focus();
	}
}

function setPlayerSearchText(){
	document.getElementById('playerSearchPageBox').value = getSearchText();
}

function getSearchText(){
	if (document.getElementById('playerSearchPageBox') && getUrl().indexOf('/search/') > -1){
		return getUrl().split('/search/')[1];
	}	
	return "";
}

if (document.getElementById("playerSearchPageForm")){
	document.getElementById("playerSearchPageForm").onsubmit = function(e){	
		submitPlayerSearch(e);
	}
}
