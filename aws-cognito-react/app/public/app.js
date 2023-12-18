
const Events = {
    VIDEOMUTE: 'VIDEOMUTE',
    VIDEOUNMUTE: 'VIDEOUNMUTE',
    AUDIOMUTE: 'AUDIOMUTE',
    AUDIOUNMUTE: 'AUDIOUNMUTE',
    SCREENSHAREON: 'SCREENSHAREON',
    SCREENSHAREOFF: 'SCREENSHAREOFF',
    LEFTMEETING: 'LEFTMEETING',
    STOPRECORDING: 'STOPRECORDING',
    STARTRECORDING: 'STARTRECORDING'
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

        // session.on('recordingStarted', event => {
        //     // var webComponent = document.querySelector('openvidu-webcomponent');
        //     // webComponent.toolbarRecordingButton = false;
		// 	// pushEvent(event);
        //     console.log(event)
		// });

		// session.on('recordingStopped', event => {
		// 	// pushEvent(event);
        //     // var webComponent = document.querySelector('openvidu-webcomponent');
        //     // webComponent.toolbarRecordingButton = false;
        //     console.log(event)
		// });

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
    webComponent.addEventListener('onToolbarStopRecordingClicked', (event) => {
        console.log(event);
        const sessionId = globalSessionId
        createEvent(sessionId, userId, Events.STOPRECORDING)
    })
    webComponent.addEventListener('onToolbarStartRecordingClicked', (event) => {
        console.log(event);
        const sessionId = globalSessionId
        createEvent(sessionId, userId, Events.STARTRECORDING)
    })
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
    alert('Disclaimer:    The Video Recording will be analyzed for business purposes.');

    
      
    //Getting form inputvalue
    var sessionName = document.getElementById('sessionName').value;
    var makeHost = true
    console.log(makeHost)
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const participantName = urlParams.get('userId');
    const userName = urlParams.get('userName');
    console.log(userName)
    globalSessionId = sessionName
    globalUserId = participantName
    globalMakeHost = makeHost
    console.log(globalSessionId, globalUserId)


    // Requesting tokens
    var promiseResults = await Promise.all([getToken(sessionName, makeHost, participantName), getToken(sessionName, makeHost, participantName)]);
    var tokens = { webcam: promiseResults[0], screen: promiseResults[1] };
    console.log(tokens)

    //Getting the webcomponent element
    var webComponent = document.querySelector('openvidu-webcomponent');

    hideForm();

    // Displaying webcomponent
    webComponent.style.display = 'block';

    webComponent.participantName = userName;

    // You can see the UI parameters documentation here
    // https://docs.openvidu.io/en/stable/api/openvidu-angular/components/OpenviduWebComponentComponent.html#inputs

    // webComponent.toolbarScreenshareButton = false;
    webComponent.minimal = false;
    // webComponent.prejoin = true;
    webComponent.videoMuted = true;
    webComponent.audioMuted = true;
    // webComponent.toolbarParticipantsPanelButton = false;
    // webComponent.activitiesPanelRecordingActivity = false;
    webComponent.activitiesPanelBroadcastingActivity = false;
    webComponent.toolbarActivitiesPanelButton = false;
    webComponent.toolbarBackgroundEffectsButton = false;
    webComponent.toolbarFullscreenButton = false;
    webComponent.toolbarCaptionsButton = false;
    // webComponent.toolbarScreenshareButton = true;
    webComponent.toolbarFullscreenButton = false;
    // webComponent.toolbarLeaveButton = true;
    // webComponent.toolbarChatPanelButton = true;
    // webComponent.toolbarParticipantsPanelButton = true;
    webComponent.toolbarDisplayLogo = false;
    webComponent.streamSettingsButton = false;
    webComponent.toolbarBroadcastingButton = false;
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

var APPLICATION_SERVER_URL = "http://54.161.249.204:9000/";

function getToken(mySessionId, makeHost, participantName) {
    return createSession(mySessionId, participantName).then(sessionId => createToken(sessionId, makeHost, participantName));
}

function createSession(sessionId, participantName) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: APPLICATION_SERVER_URL + "api/sessions",
            data: JSON.stringify({ customSessionId: sessionId }),
            headers: { "Content-Type": "application/json", "participantName": participantName },
            success: response => resolve(response), // The sessionId
            error: (error) => reject(error)
        });
    });
}

function createToken(sessionId, makeHost, participantName) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: APPLICATION_SERVER_URL + 'api/sessions/' + sessionId + '/connections',
            data: JSON.stringify({}),
            headers: { "Content-Type": "application/json", "makeHost": makeHost, "participantName":participantName },
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