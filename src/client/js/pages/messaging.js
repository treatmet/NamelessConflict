page = "messaging";
initializePage();
function initializePage(){
    showLocalElements();
	getTokenFromUrlParameterAndLogin();
}

function loginSuccess(){
	showAuthorizedLoginButtons();            
    getRequests();        
    populateMessagesPage(function(){
        showUnset("mainContent");
    });
}

function loginFail(){
	showDefaultLoginButtons();
}

function loginAlways(){    
}


//Messaging variables
// var selectedConversation = {
//     conversationId:false,
//     partnerUsername:false,
//     partnerCognitoSub:false
// };
const dateOptions = {month: 'short', day: 'numeric', hour:'numeric', minute:'numeric'};
var globalConversations = [];
var globalMessages = [];

function populateMessagesPage(cb){


    var conversationId = getUrlParam("conversationId");
    populateConversations(conversationId, function(){

        //load conversation's messages
        if (conversationId){
            getActiveConversationMessages(function(){
                buildMessagesHTML(globalMessages);
                cb();                
            });
        }
        else {
            cb();
        }

        //cb();
    })

}

// function setSelectedConversation(id, username, cognitoSub){
//     selectedConversation.conversationId = id;
//     selectedConversation.partnerUsername = username;
//     selectedConversation.partnerCognitoSub = cognitoSub;
// }


function populateConversations(conversationId, cb){

    var params = {
        cognitoSub:cognitoSub,
        conversationId:conversationId
    };

    $.get('/getConversations', params, function(data){
        logg("getConversations RESPONSE:");
        if (!data.result){
            alert("Error retrieving user conversations." + data.error);
            cb(false);
        }
        else { //success            
            globalConversations = convertToClientConversations(data.result);
            buildConversationsHTML(globalConversations);
            cb(true);
        }
    });
}

// function findSelectedConversationAndSet(conversations){
//     for (var c = 0; c<conversations.length; c++){
//         if (conversations[c].active){
//             var isUserOne = false;
//             if (conversations[c].userOneCognitoSub == cognitoSub){isUserOne = true;}

//             if (isUserOne){setSelectedConversation(selectedConversation.conversationId, conversations[c].userTwoUsername, conversations[c].userTwoCognitoSub);}
//             else {setSelectedConversation(selectedConversation.conversationId, conversations[c].userOneUsername, conversations[c].userOneCognitoSub);}
//         }
//     }
// }



function buildConversationsHTML(conversations){
    if (!conversations || conversations.length <= 0){return;}
    var HTML = "";
    var conversationsDiv = document.getElementById("conversationColumn");
    if (!conversationsDiv){return;}
   
    HTML += '<table class="conversationsTable">';
    for (var c = 0; c<conversations.length; c++){
        HTML += buildConversationHTML(conversations[c]);
    }        
    HTML += '</table>';
    conversationsDiv.innerHTML = HTML;
}

function buildConversationHTML(conversation){
    var HTML = "<tr>";
        HTML += "<td>";
            var className = "conversation";
            if (conversation.active){className += " active";}
            HTML += '<div class="' + className +'" data-conversationId="' + conversation.id + '" onclick="conversationClick(this)">';
                var unreadHTML = "";
                if (conversation.myUnreads){unreadHTML = " | <span style='color:red;'>[" + conversation.myUnreads + " Unread]</span>";}
                HTML += '<div class="conversationTitle">' + conversation.partnerUsername + unreadHTML + '</div>';
                HTML += '<div class="conversationPreview">' + conversation.lastMessagePreview + '</div>'
            HTML + '</div>';    
        HTML += "</td>";
    HTML += "</tr>";

    return HTML;
}

function getActiveConversationMessages(cb){

    var activeConversation = getActiveConversation();
    if (!activeConversation){log("No active conversation"); return;}



    var params = {
        userOneCognitoSub:cognitoSub,
        userTwoCognitoSub:activeConversation.partnerCognitoSub,
        conversationId:activeConversation.id
    };

    $.get('/getConversationMessages', params, function(data){
        logg("getConversationMessages RESPONSE:");
        if (!data.result){
            alert("Error retrieving user ConversationMessages." + data.error);
            cb();
        }
        else { //success        
            var clientMessages = convertToClientMessages(data.result);   
            globalMessages = clientMessages;            
            cb();
        }
    });
}

function convertToClientMessages(messages){
    var partnerUsername = getActiveConversation().partnerUsername;



    for (var m = 0; m < messages.length; m++){
        datey = new Date(messages[m].timestamp);
        messages[m].timestamp = datey.toLocaleDateString(undefined, dateOptions);
        if (messages[m].senderCognitoSub == cognitoSub){
            messages[m].username = username;
        }
        else {
            messages[m].username = partnerUsername;
        }
    }

    return messages;
}




function conversationClick(conversationDiv) {

    //set conversation list display attributes
    var conversations = document.getElementsByClassName('conversation');
    for (var c = 0; c < conversations.length; c++){
        conversations[c].className = "conversation";   
    }
    conversationDiv.className = "conversation active";
    var conversationId = conversationDiv.getAttribute("data-conversationId");

    if (conversationId && (!getActiveConversation() || getActiveConversation().id != conversationId)){
        setActiveConversation(conversationId);
        getActiveConversationMessages(function(){
            buildMessagesHTML(globalMessages);
        });    
    }

    //update RW_CONVERSATION (unreads)

}

function setActiveConversation(conversationId){
    for (var c = 0; c<globalConversations.length; c++){
        globalConversations[c].active = false;
        if (globalConversations[c].id == conversationId){
            globalConversations[c].active = true;
            if (globalConversations[c].myUnreads){
                globalConversations[c].myUnreads = 0;
                buildConversationsHTML(globalConversations);
            }
        }
    }
}

function getActiveConversation(){
    return globalConversations.find(conv => conv.active == true);
}

async function buildMessagesHTML(messages){

    var HTML = "";
    var messagesDiv = document.getElementById("messagesTableContainer");
    if (!messagesDiv){log("couldnt find div"); return;}

    HTML += '<table class="messagesTable">';
    for (var c = 0; c<messages.length; c++){
        HTML += getMessageHTML(messages[c]);
    }        
    HTML += '</table>';
    messagesDiv.innerHTML = HTML;
    show("messagesInputDiv");
    await sleep(0);
    scrollToBottomOfMessages();
}

function getMessageHTML(message){
    var sender = false;
    if (message.senderCognitoSub == cognitoSub){sender = true;}
    var className = sender ? "messageSent" : "messageRecieved"
    var HTML = "";

    HTML += "<tr>";
        HTML += "<td class='" + className + "'>";
            if (sender){
                HTML += getMessageInfoHTML(message);
                HTML += "<div class='message'>" + message.message + "</div>";
            }
            else {
                HTML += getMessageInfoHTML(message);
                HTML += "<div class='message'>" + message.message + "</div>";
            }
        HTML += "</td>";
    HTML += "</tr>";

    return HTML;
}

function getMessageInfoHTML(message){
    var HTML = "";

    HTML += "<div class='messageInfo'>"
        HTML += "<div class='messageUsername'>" + message.username + "</div>"
        HTML += "<div class='messageTimestamp'>" + message.timestamp + "</div>"
    HTML += "</div>"

    return HTML;
}

function sendMessageClick(){
    if (!getActiveConversation()){return;}

    var msg = document.getElementById("chat-input-msg").value;
    document.getElementById("chat-input-msg").value = "";

    if (msg == "" || msg == " "){return;}

    var params = {
        senderCognitoSub:cognitoSub,
        recipientCognitoSub:getActiveConversation().partnerCognitoSub,
        timestamp:new Date(),
        message:msg,
        conversationId:getActiveConversation().id
    }

    $.post('/sendMessage', params, function(res,status){
        if (res.error){
            alert("Error sending your message, please refresh the page. " + res.error);
        }
        else { //success
            //add to UI
            var myMessage = {
                username:username,
                senderCognitoSub:cognitoSub,
                timestamp:new Date().toLocaleDateString(undefined, dateOptions),
                message:msg
            };
            globalMessages.push(myMessage);
            buildMessagesHTML(globalMessages);            
        }
    });
}

$("#chat-form-msg").submit(function(e) {
    e.preventDefault();
});

$("#chat-input-msg").keypress(function (e) {
    if(e.which === 13 && !e.shiftKey) {
        e.preventDefault();
    
        sendMessageClick();
    }
});

function scrollToBottomOfMessages(){
    var objDiv = document.getElementById("messagesTableContainer");
    objDiv.scrollTop = objDiv.scrollHeight;
}