page = "trade";
var customizationOptions = {};
var tradeId = "";

var unsavedSettings = false;

initializePage();
function initializePage(){
    tradeId = getTradeId();
    showLocalElements();
	getTokenFromUrlParameterAndLogin();
}

function loginSuccess(){
	showAuthorizedLoginButtons();            
    getRequests();        
}

function loginFail(){
	showDefaultLoginButtons();
}

function loginAlways(){
	populateTradePage();
	showUnset("mainContent");
}

function getTradeId(){
	if (getUrl().indexOf('/trade/') > -1){
		return getUrl().split('/trade/')[1].substring(0,36);
	}	
	return "";
}

function populateTradePage(){

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