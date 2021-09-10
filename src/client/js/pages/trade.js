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
}

function loginFail(){
	showDefaultLoginButtons();
}

function loginAlways(){
	populateTradePage();
	showUnset("mainContent");
}

function getTradeId(){
    return getUrlParam("tradeId");
}

function populateTradePage(){
	getCustomizationOptions(cognitoSub, function(customizationsResult){
		customizationOptions = customizationsResult.result;	
		createCustomizationOptionDivs();
		populateCustomizationOptions();
		showContent("hat");
		show("appearanceOptions");		
	});
}

function registerForTrade(){
	const params = {
		cognitoSub:cognitoSub,
		tradeId:tradeId
	};
	
	$.post('/registerForTrade', params, function(data,status){
		console.log("registerForTrade endpoint response from server:");
        console.log(data);		
        
        if (data.status){
            //Successfully joined a trade that the server was expecting you to join
        }
        else {
            alert(data.msg);
            window.location.href = serverHomePage;
        }
	});	
}

function addItemToTradeClick(itemId){
    socket.emit("addItemToTrade", {itemId:itemId, cognitoSub:cognitoSub, tradeId:tradeId});
}

function removeItemFromTradeClick(itemId){
    socket.emit("removeItemFromTrade", {itemId:itemId, cognitoSub:cognitoSub, tradeId:tradeId});
}

function liveTradeAcceptClick(){
    socket.emit("acceptTrade", {cognitoSub:cognitoSub, tradeId:tradeId});
}


socket.on('updateTrade', function(trade){
    console.log("CURRENT TRADE:");
    console.log(trade);
    var yourListDiv = document.getElementById("rightPlayerTradeList");
    var opponentListDiv = document.getElementById("leftPlayerTradeList");

    var opponentListHTML = "";
    var yourListHTML = "";

    for (const item in trade.yourItemsOffered){
        yourListHTML += getShopItemHTML(trade.yourItemsOffered[item], false, "tradeListYourOffered");
    }
    for (const item in trade.opponentItemsOffered){
        opponentListHTML += getShopItemHTML(trade.opponentItemsOffered[item], false, "tradeListOpponentOffered");
    }

    yourListDiv.innerHTML = yourListHTML;
    opponentListDiv.innerHTML = opponentListHTML;

    //Set Accepted Status
    if (trade.yourAccepted){
        yourListDiv.style.backgroundColor = "green";
        document.getElementById("tradeAccept").style.backgroundColor = "#bc2020";
        document.getElementById("tradeAccept").innerHTML = "Unaccept";
    }
    else{
        yourListDiv.style.backgroundColor = "#20333f";
        document.getElementById("tradeAccept").style.backgroundColor = "#16e448";
        document.getElementById("tradeAccept").innerHTML = "Accept Trade";
    }

    if (trade.opponentAccepted)
        opponentListDiv.style.backgroundColor = "green";
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

});

socket.on('tradeTimer', function(timer){
    console.log("Timer:");
    console.log(timer);

    document.getElementById("tradeTimer").innerHTML = timer;
});


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