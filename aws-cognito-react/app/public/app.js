
const Events = {
    VIDEOMUTE: 'VIDEOMUTE',
    VIDEOUNMUTE: 'VIDEOUNMUTE',
    AUDIOMUTE: 'AUDIOMUTE',
    AUDIOUNMUTE: 'AUDIOUNMUTE',
    SCREENSHAREON: 'SCREENSHAREON',
    SCREENSHAREOFF: 'SCREENSHAREOFF',
    LEFTMEETING: 'LEFTMEETING'
  };
var audioOn = false;
var videoOn = false;
var screenOn = false;

var globalSessionId = ""
$(document).ready(async () => {
    var webComponent = document.querySelector('openvidu-webcomponent');
    var form = document.getElementById('main');

   
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const userId = urlParams.get('userId');

    webComponent.addEventListener('onSessionCreated', (event) => {
        var session = event.detail;
   

        // You can see the session documentation here
        // https://docs.openvidu.io/en/stable/api/openvidu-browser/classes/session.html

        session.on('connectionCreated', (e) => {
            console.log("connectionCreated", e);
        });

        session.on('streamDestroyed', (e) => {
            console.log("streamDestroyed", e);
        });

        session.on('streamCreated', (e) => {
            console.log("streamCreated", e);
        });

        session.on('sessionDisconnected', (event) => {
            console.warn("sessionDisconnected event");
            
            var form = document.getElementById('main');
            form.style.display = 'block';
            webComponent.style.display = 'none';
            console.log(event);
            const sessionId = globalSessionId
        });

        session.on('exception', (exception) => {
            console.error(exception);
        });
    });
    webComponent.addEventListener('onJoinButtonClicked', (event) => {
        console.log(event)
        const sessionId = globalSessionId
        createParticipant(sessionId, userId)
     });
    webComponent.addEventListener('onToolbarLeaveButtonClicked', (event) => { 
        console.log(event);
        const sessionId = globalSessionId
        createEvent(sessionId, userId, Events.LEFTMEETING)
    });
    webComponent.addEventListener('onToolbarCameraButtonClicked', (event) => {
        console.log(event);
        const sessionId = globalSessionId
        if (videoOn) {
            createEvent(sessionId, userId, Events.VIDEOMUTE)
            videoOn = false
        } else {
            createEvent(sessionId, userId, Events.VIDEOUNMUTE)
            videoOn = true
        }
        
     });
    webComponent.addEventListener('onToolbarMicrophoneButtonClicked', (event) => { 
        console.log(event);
        const sessionId = globalSessionId
        if (!audioOn) {
            createEvent(sessionId, userId, Events.AUDIOUNMUTE)
            audioOn = true
        } else {
            createEvent(sessionId, userId, Events.AUDIOMUTE)
            audioOn = false
        }
    });
    webComponent.addEventListener('onToolbarScreenshareButtonClicked', (event) => {
        console.log(event);
        const sessionId = globalSessionId
        if (!screenOn) {
            createEvent(sessionId, userId, Events.SCREENSHAREON)
            screenOn = true
        } else {
            createEvent(sessionId, userId, Events.SCREENSHAREOFF)
            screenOn = false
        }
    });

    webComponent.addEventListener('onToolbarParticipantsPanelButtonClicked', (event) => { });
    webComponent.addEventListener('onToolbarChatPanelButtonClicked', (event) => { });
    webComponent.addEventListener('onToolbarFullscreenButtonClicked', (event) => { });
    webComponent.addEventListener('onParticipantCreated', (event) => {
        console.log(event);
     });

});


async function joinSession() {
    
      
    //Getting form inputvalue
    var sessionName = document.getElementById('sessionName').value;
    var makeHost = document.getElementById('hostcheck').value;
    console.log(makeHost)
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const participantName = urlParams.get('userId');
    globalSessionId = sessionName
    globalUserId = participantName
    globalMakeHost = makeHost
    console.log(globalSessionId, globalUserId)


    // Requesting tokens
    var promiseResults = await Promise.all([getToken(sessionName, makeHost), getToken(sessionName, makeHost)]);
    var tokens = { webcam: promiseResults[0], screen: promiseResults[1] };
    console.log(tokens)

    //Getting the webcomponent element
    var webComponent = document.querySelector('openvidu-webcomponent');

    hideForm();

    // Displaying webcomponent
    webComponent.style.display = 'block';

    webComponent.participantName = participantName;

    // You can see the UI parameters documentation here
    // https://docs.openvidu.io/en/stable/api/openvidu-angular/components/OpenviduWebComponentComponent.html#inputs

    // webComponent.toolbarScreenshareButton = false;
    // webComponent.minimal = true;
    // webComponent.prejoin = true;
    webComponent.videoMuted = true;
    webComponent.audioMuted = true;

    // webComponent.toolbarScreenshareButton = true;
    // webComponent.toolbarFullscreenButton = true;
    // webComponent.toolbarLeaveButton = true;
    // webComponent.toolbarChatPanelButton = true;
    // webComponent.toolbarParticipantsPanelButton = true;
    // webComponent.toolbarDisplayLogo = true;
    // webComponent.toolbarDisplaySessionName = true;
    // webComponent.streamDisplayParticipantName = true;
    // webComponent.streamDisplayAudioDetection = true;
    // webComponent.streamSettingsButton = true;
    // webComponent.participantPanelItemMuteButton = true;

    webComponent.tokens = tokens;
}

function hideForm() {
    var form = document.getElementById('main');
    form.style.display = 'none';

}


/**
 * --------------------------------------------
 * GETTING A TOKEN FROM YOUR APPLICATION SERVER
 * --------------------------------------------
 * The methods below request the creation of a Session and a Token to
 * your application server. This keeps your OpenVidu deployment secure.
 * 
 * In this sample code, there is no user control at all. Anybody could
 * access your application server endpoints! In a real production
 * environment, your application server must identify the user to allow
 * access to the endpoints.
 * 
 * Visit https://docs.openvidu.io/en/stable/application-server to learn
 * more about the integration of OpenVidu in your application server.
 */

var APPLICATION_SERVER_URL = "http://localhost:9000/";

function getToken(mySessionId, makeHost) {
    return createSession(mySessionId).then(sessionId => createToken(sessionId, makeHost));
}

function createSession(sessionId) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: APPLICATION_SERVER_URL + "api/sessions",
            data: JSON.stringify({ customSessionId: sessionId }),
            headers: { "Content-Type": "application/json" },
            success: response => resolve(response), // The sessionId
            error: (error) => reject(error)
        });
    });
}

function createToken(sessionId, makeHost) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: APPLICATION_SERVER_URL + 'api/sessions/' + sessionId + '/connections',
            data: JSON.stringify({}),
            headers: { "Content-Type": "application/json", "makeHost": makeHost },
            success: (response) => resolve(response), // The token
            error: (error) => reject(error)
        });
    });
}

function createParticipant(sessionId, userId) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: APPLICATION_SERVER_URL + 'api/sessions/' + sessionId + '/participants',
            data: JSON.stringify({}),
            headers: { "Content-Type": "application/json", "UserId": userId},
            success: (response) => resolve(response), // The token
            error: (error) => reject(error)
        });
    });
}

function createEvent(sessionId, participantId, event) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: APPLICATION_SERVER_URL + 'api/sessions/' + sessionId +  "/participants/" + participantId + "/events",
            data: JSON.stringify({}),
            headers: { "Content-Type": "application/json", "EventType": event},
            success: (response) => resolve(response), // The token
            error: (error) => reject(error)
        });
    });
}