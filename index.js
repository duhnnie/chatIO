var app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    users = {};

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.use(function (socket, next) {
    var handshakeData = socket.request,
        nickname = socket.handshake.query['nickname']; //handshakeData._query['nickname'];

    if (!nickname || !nickname.trim()) {
        return next(new Error("invalid nickname!"));
    }
    
    console.log("Logging with nickname: " + nickname + '...');

    if (!users[nickname]) {
        users[nickname] = socket;        
        next();    
        console.log(nickname + ' logged.');
    } else {
        console.log("nickname \"" + nickname + "\" already taken.");
        next(new Error("nickname \"" + nickname + "\" already taken."));
    }
});

io.on('connection', function (socket) {
    console.log('a user connected');

    socket.on('disconnect', function () {
        console.log('user disconnected');
        io.emit('user disconnect');
    });

    socket.on('chat message', function (msg) {
        io.emit('chat message', msg);
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});