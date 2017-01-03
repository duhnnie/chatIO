var AUDIO,
    audioCtx;

function onError() {};

function loadAudioBuffer(url, callback) {
    var request = new XMLHttpRequest();

    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    request.onload = function () {
        audioCtx.decodeAudioData(request.response, function (buffer) {
            if (typeof callback === 'function') {
                callback(buffer);
            }
        }, onError);
    };

    request.send();
}

window.addEventListener('load', function () {
    var messageSound,
        connectedSound,
        disconnectedSound,
        userConnectedSound,
        userDisconnectedSound;

    function playSound(buffer) {
        var source;

        if (!buffer) {
            return;
        }

        source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);
    }

    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    } catch (e) {
        return console.log("Your browser doesn't support WebAudio API.");
    }

    loadAudioBuffer('sounds/message.mp3', function (buffer) {
        messageSound = buffer;
    });

    loadAudioBuffer('sounds/user_connected.mp3', function (buffer) {
        userConnectedSound = buffer;
    });

    loadAudioBuffer('sounds/disconnected.mp3', function (buffer) {
        disconnectedSound = buffer;
    });

    loadAudioBuffer('sounds/user_disconnected.mp3', function (buffer) {
        userDisconnectedSound = buffer;
    });

    loadAudioBuffer('sounds/connected.mp3', function (buffer) {
        connectedSound = buffer;
    });

    AUDIO = {
        newMessage: function () {
            playSound(messageSound);
        },
        userConnected: function () {
            playSound(userConnectedSound);
        },
        userDisconnected: function () {
            playSound(userDisconnectedSound);
        },
        disconnected: function () {
            playSound(disconnectedSound);
        }
    };
});