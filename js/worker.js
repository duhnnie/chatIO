importScripts('/socket.io/socket.io.js');
importScripts('/js/const.js');

var socket,
    user,
    clients = [];

function initConnection(nickname) {
    if (!socket) {
        socket = io(undefined, { query: "nickname=" + nickname});

        socket.on('error', function (errorMsg) {
            postToAll({
                cmd: COMMANDS.ERROR,
                data: {
                    message: errorMsg
                }
            });
        });

        socket.on('connect', function () {
            postToAll({
                cmd: COMMANDS.CONNECTED
            });
        });

        socket.on('typing', function (data) {
            postToAll({
                cmd: COMMANDS.TYPING,
                data: data.user
            });
        });

        socket.on('stop typing', function (data) {
            postToAll({
                cmd: COMMANDS.STOP_TYPING,
                data: data.user
            });
        });

        socket.on('disconnect', function () {
            postToAll({
                cmd: COMMANDS.DISCONNECT
            });
        });

        socket.on('user_data', function (data) {
            user = data;
            postToAll({
                cmd: COMMANDS.USER_DATA,
                data: user
            });
        });

        socket.on('user_connected', function (data) {
            user.users.push(data.user);
            postToAll({
                cmd: COMMANDS.USER_CONNECTED,
                data: data.user
            });
        });

        socket.on('user_disconnect', function (data) {
            var index = user.users.findIndex(function (user) {
                return user.nickname === data.user;
            });

            if (index >= 0) {
                user.users.splice(index, 1);
            }

            postToAll({
                cmd: COMMANDS.USER_DISCONNECTED,
                data: data.user
            });
        });

        socket.on('chat_message', function (data) {
            postToAll({
                cmd: COMMANDS.RECEIVED_MESSAGE,
                data: data
            });
        });
    }
}

function postToAll(message) {
    for (port of clients) {
        port.postMessage(message);
    }
}

function messageHandler(message, port) {
    let cmd = message.cmd || ""
        data = message.data || {};

    switch (cmd) {
        case COMMANDS.CONNECT:
            if (user) {
                port.postMessage({ cmd: COMMANDS.CONNECTED });
                port.postMessage({
                    cmd: COMMANDS.USER_DATA,
                    data: user
                });
            } else {
                port.postMessage({
                    cmd: COMMANDS.NICKNAME
                });
            }
            break;
        case COMMANDS.NICKNAME:
            initConnection(data.nickname);
            break;
        case COMMANDS.TYPING:
            socket.emit("typing");
            break;
        case COMMANDS.STOP_TYPING:
            socket.emit("stop_typing");
            break;
        case COMMANDS.SEND_MESSAGE:
            socket.emit('chat_message', data);
            break;
        default:
            port.postMessage({
                cmd: COMMANDS.ERROR,
                data: {
                    message: "Invalid command."
                }
            });
    }
}

self.addEventListener("connect", function (e) {
    var port = e.ports[0];

    clients.push(port);

    port.addEventListener("message", function (e) {
        messageHandler(e.data, port);
    }, false);

    port.start();

    // if (!socket) {
    //     initConnection();
    // }

    // try {
    //     var socket = io(undefined, {query: "dd"});
    // } catch (e) {
    //     port.postMessage("Error: " + e.message + " " + e.filename + ":" + e.lineno);
    // }

}, false);