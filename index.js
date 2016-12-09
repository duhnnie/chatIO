var app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    users = {},
    nicknames = {};

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/fonts/*', function (req, res) {
    res.sendFile(__dirname + req.originalUrl);
});

io.use(function (socket, next) {
    var handshakeData = socket.request,
        nickname = socket.handshake.query['nickname'],
        userObject,
        otherUsers;

    nickname = nickname.trim();

    if (!nickname) {
        return next(new Error("invalid nickname!"));
    }

    console.log("Logging with nickname: " + nickname + '...');

    if (!nicknames[nickname]) {
        otherUsers = Object.keys(nicknames);
        nicknames[nickname] = users[socket.id] = {
            nickname: nickname,
            socket: socket,
            usersList: otherUsers
        };
        next();
        console.log(nickname + ' logged.');
    } else {
        console.log("nickname \"" + nickname + "\" already taken.");
        next(new Error("nickname \"" + nickname + "\" already taken."));
    }
});

io.on('connection', function (socket) {
    console.log('a user connected');

    socket.emit('users_list', users[socket.id].usersList);
    delete users[socket.id].usersList;

    socket.on('disconnect', function () {
        console.log('user disconnected');
        io.emit('user disconnect', {
            user: users[this.id].nickname,
            datetime: (new Date()).toString()
        });

        delete nicknames[users[this.id].nickname];
        delete users[this.id];
    });

    socket.on('chat message', function (msg) {
        io.emit('chat message', {
            user: users[this.id].nickname,
            text: msg,
            datetime: (new Date()).toString()
        });
    });

    socket.broadcast.emit('user connected', {
        user: users[socket.id].nickname,
        datetime: (new Date()).toString()
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});