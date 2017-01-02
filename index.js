"use strict";

const UserManager = require('./lib/UserManager'),
    Errors = require('./lib/Errors');

var app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    userManager = new UserManager(),
    port = process.env.PORT || 3000;

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/fonts/*', function (req, res) {
    res.sendFile(__dirname + req.originalUrl);
});

app.get('/js/*', function (req, res) {
    res.sendFile(__dirname + req.originalUrl);
});

app.get('/css/*', function (req, res) {
    res.sendFile(__dirname + req.originalUrl);
});

userManager.setOnUserRemove(function (manager, user) {
    var nickname;

    console.log("User " + user.getNickname() + " got disconnected!");

    io.emit('user_disconnect', {
        user: user.getNickname(),
        datetime: (new Date()).toString()
    });
});

io.use(function (socket, next) {
    var handshakeData = socket.request,
        nickname = socket.handshake.query['nickname'],
        user,
        otherUsers;

    try {
        userManager.addUser({
            nickname: nickname,
            socket: socket
        });

        next();
    } catch (e) {
        // TODO: Not all the errors should be returned explicitly.
        console.log("Error: ", e.message);
        next(new Error(e.message));
    }
});

io.on('connection', function (socket) {
    let connectedUser = userManager.getUserBySocket(socket),
        connectedUserUID = connectedUser.getUID(),
        connectedUserNickname = connectedUser.getNickname();

    console.log(connectedUserNickname + " got connected!");

    socket.emit('user_data', userManager.getUserPrivateInfo(connectedUserUID));

    socket.on('disconnect', function () {
        console.log(connectedUserNickname + " got disconnected!");
        userManager.removeUser(connectedUser);
    });

    socket.on('chat_message', function (msg) {
        if (msg.message = msg.message.trim()) {
            io.emit('chat_message', {
                id: msg.id,
                user: connectedUserNickname,
                text: msg.message,
                color: connectedUser.getColor(),
                datetime: (new Date()).toString()
            });
        }
    });

    socket.on('typing', function () {
        this.broadcast.emit('typing', {
            user: connectedUserNickname
        });
    });

    socket.on('stop_typing', function () {
        this.broadcast.emit('stop typing', {
            user: connectedUserNickname
        });
    });

    socket.broadcast.emit('user_connected', {
        user: userManager.getUserInfo(connectedUserUID),
        datetime: (new Date()).toString()
    });
});

http.listen(port, function () {
    console.log('listening on *:' + port);
});