page = "trade";
var tradeId = getUrlParam("tradeId");
var customizationOptions = {};
var yourOfferings = [];
var opponentsOfferings = [];

initializePage();
function initializePage(){
    console.log("tradeId:" + tradeId);
    showLocalElements();
	getTokenFromUrlParameterAndLogin();
}

function loginSuccess(){
	showAuthorizedLoginButtons();            
    registerForTrade();
    showUnset("mainContent");
}

function loginFail(){
	showDefaultLoginButtons();
}

function loginAlways(){
	populateTradePage();
}

function getTradeId(){
    return getUrlParam("tradeId");
}

function populateTradePage(){
	getCustomizationOptions(cognitoSub, function(customizationsResult){
		customizationOptions = customizationsResult.result;	
		createCustomizationOptionDivs();
		populateCustomizationOptions(true);
		showContent("hat");
		show("appearanceOptions");		
	});
}

function registerForTrade(){
	const params = {
		cognitoSub:cognitoSub,
		tradeId:tradeId
	};
	//sleep(500);
	$.post('/registerForTrade', params, function(data,status){
		console.log("registerForTrade endpoint response from server:");
        console.log(data);		
        
        if (data.status){
            document.getElementById("leftPlayerTradeTitle").innerHTML = data.opponentName + "'s offerings";
            //Successfully joined a trade that the server was expecting you to join
        }
        else {
            alert(data.msg);
            window.location.href = serverHomePage;
        }
	});	
}

function addItemToTradeClick(itemId){
    console.log("Emmiting addItemToTrade");
    socket.emit("addItemToTrade", {itemId:itemId, cognitoSub:cognitoSub, tradeId:tradeId});
}

function removeItemFromTradeClick(itemId){
    socket.emit("removeItemFromTrade", {itemId:itemId, cognitoSub:cognitoSub, tradeId:tradeId});
}

function liveTradeAcceptClick(){
    socket.emit("acceptTrade", {cognitoSub:cognitoSub, tradeId:tradeId});
}


socket.on('updateTrade', function(trade){ //tradeUpdate
    console.log("CURRENT TRADE:");
    console.log(trade);
    var yourListDiv = document.getElementById("rightPlayerTradeList");
    var opponentListDiv = document.getElementById("leftPlayerTradeList");

    var opponentListHTML = "";
    var yourListHTML = "";

    if (trade.yourCashOffered > 0){
        var cashItem = getCashItem(trade.yourCashOffered);
        yourListHTML += getShopItemHTML(cashItem, false, "tradeListYourOffered");
    }
    if (trade.opponentCashOffered > 0){
        var cashItem = getCashItem(trade.opponentCashOffered);
        opponentListHTML += getShopItemHTML(cashItem, false, "tradeListOpponentOffered");
    }

    for (const item in trade.yourItemsOffered){
        yourListHTML += getShopItemHTML(trade.yourItemsOffered[item], false, "tradeListYourOffered");
    }
    for (const item in trade.opponentItemsOffered){
        opponentListHTML += getShopItemHTML(trade.opponentItemsOffered[item], false, "tradeListOpponentOffered");
    }

    yourListDiv.innerHTML = yourListHTML;
    opponentListDiv.innerHTML = opponentListHTML;

    drawShopIcons("rightPlayerTradeList", trade.yourItemsOffered);
    drawShopIcons("leftPlayerTradeList", trade.opponentItemsOffered);


    //Set Accepted Status
    if (trade.yourAccepted){
        yourListDiv.style.backgroundColor = "rgb(21 159 8)";
        document.getElementById("tradeAccept").style.backgroundColor = "#bc2020";
        document.getElementById("tradeAccept").innerHTML = "Unaccept";
    }
    else{
        yourListDiv.style.backgroundColor = "#20333f";
        document.getElementById("tradeAccept").style.backgroundColor = "#16e448";
        document.getElementById("tradeAccept").innerHTML = "Accept Trade";
    }

    if (trade.opponentAccepted)
        opponentListDiv.style.backgroundColor = "rgb(21 159 8)";
    else
        opponentListDiv.style.backgroundColor = "#20333f";

    //Show/hide timer
    if (trade.yourAccepted && trade.opponentAccepted){
        document.getElementById("tradeTimerContainer").style.color = "white";
    }
    else {
        document.getElementById("tradeTimerContainer").style.color = "#2c2f31";
        document.getElementById("tradeTimer").innerHTML = "5";
    }

    //Enable/disable accept button
    if (trade.yourItemsOffered.length > 0 || trade.opponentItemsOffered.length > 0 || trade.opponentCashOffered > 0 || trade.yourCashOffered > 0){
        document.getElementById("tradeAccept").disabled = false;
    }
    else {

        document.getElementById("tradeAccept").disabled = true;
        document.getElementById("tradeAccept").style.backgroundColor = "#acacac";
    }

});

function getCashItem(cash){
    var cashItem = {
        id:"cash", 
        value:cash, 
        text:"Cash", 
        category:"other", 
        canvasValue:"cash.png", 
        ownedCount:1, 
        price:0, 
        rarity:0, 
        subCategory:"other", 
        team:0, 
        title:getCashFormat(cash)
    }
    return cashItem;
}

socket.on('tradeTimer', function(timer){
    console.log("Timer:");
    console.log(timer);

    document.getElementById("tradeTimer").innerHTML = timer;
});


//CHAT STUFF/////////////////////////////////////////////////////
var chatText = document.getElementById("chat-text-trade");
var chatInput = document.getElementById("chat-input-trade");
var chatForm = document.getElementById("chat-form-trade");
var offerMoneyForm = document.getElementById("offerMoneyForm");
var offerMoneyInput = document.getElementById("offerMoneyInput");
chatForm.onsubmit = function(e){
    socket.emit('chat', {username:username, text:chatInput.value});
    chatInput.value = "";
	e.preventDefault();
}

offerMoneyForm.onsubmit = function(e){
    offerMoney();
    e.preventDefault();
}

function offerMoney(){
    if (isNaN(parseInt(offerMoneyInput.value))){
        return;
    }
    var cashOffered = parseInt(offerMoneyInput.value);

    if (userCash >= cashOffered){
        socket.emit("addItemToTrade", {money:cashOffered, cognitoSub:cognitoSub, tradeId:tradeId});
    }
    else {
        alert("You don't have that much money");
    }
}


socket.on('addMessageToChat', function(text, color = "#FFFFFF"){ //Server message
	addToChat(text, color);
});

var maxChatMessages = 9;
function addToChat(data, color = "#FFFFFF", bold = false){
	var nodes = chatText.childNodes.length;
	for (var i=0; i<nodes - (maxChatMessages - 1); i++){
		chatText.childNodes[i].remove();
	}

	var boldStyle = "";
	if (bold)
		boldStyle = " font-weight:600;";

	chatText.innerHTML = chatText.innerHTML + '<div class="chatElement" style="color:' + color + ';' + boldStyle + '">' + data + '</div>';
	chatStale = 0;			
}

function clearChat(){
	var chatLength = chatText.childNodes.length;
	for (var i=chatLength-1; i>=0; i--){
		chatText.childNodes[i].remove();
	}
}



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