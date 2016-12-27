const UserManager = require('./lib/UserManager'),
    Errors = require('./lib/Errors');

var app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http)
    userManager = new UserManager(),
    port = process.env.PORT || 3000;

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/fonts/*', function (req, res) {
    res.sendFile(__dirname + req.originalUrl);
});

userManager.setOnUserRemove(function (manager, user) {
    var nickname;

    console.log("User " + user.getNickname() + " got disconnected!");

    io.emit('user disconnect', {
        user: user.getNickname(),
        datetime: (new Date()).toString()
    });
});

io.use(function (socket, next) {
    var handshakeData = socket.request,
        nickname = socket.handshake.query['nickname'],
        uid = socket.handshake.query['uid'],
        user,
        otherUsers;

    try {
        console.log("New connection petition using " + (uid ? 'uid: ' + uid : 'nickname: ' + nickname));
        if (uid) {
            if (user = userManager.getUserByUID(uid)) {
                user.addSocket(socket);
            } else {
                return next(new Errors.UserNotFoundError(uid));
            }
        }

        if (!user) {
            userManager.addUser({
                nickname: nickname,
                sockets: [socket]
            });
        }
        next();
    } catch (e) {
        // TODO: Not all the errors should be returned explicitly.
        console.log("Error: ", e.message);
        next(new Error("Error: " + e.message));
    }
});

io.on('connection', function (socket) {
    var connectedUser = userManager.getUserBySocket(socket),
        connectedUserUID = connectedUser.getUID()
        connectedUserNickname = connectedUser.getNickname();

    console.log('New client for user "' + connectedUserNickname + '" connected!');

    socket.emit('init_data', {
        uid: connectedUserUID,
        nickname: connectedUserNickname,
        users: userManager.getUsers(connectedUserUID).map(function (user) {
            return user.getNickname()
        }),
        numClients: connectedUser.getNumSockets()
    });

    socket.on('disconnect', function () {
        console.log('A client for user "' + connectedUserNickname + '" got disconnected! (' + (connectedUser.getNumSockets() - 1) + " left)");

        connectedUser.removeSocket(this);
    });

    socket.on('chat message', function (msg) {
        if (msg = msg.trim()) {
            io.emit('chat message', {
                user: connectedUserNickname,
                text: msg,
                datetime: (new Date()).toString()
            });
        }
    });

    socket.on('typing', function () {
        this.broadcast.emit('typing', {
            user: connectedUserNickname
        });
    });

    socket.on('stop typing', function () {
        this.broadcast.emit('stop typing', {
            user: connectedUserNickname
        });
    });

    socket.broadcast.emit('user connected', {
        user: connectedUserNickname,
        datetime: (new Date()).toString()
    });
});

http.listen(port, function () {
    console.log('listening on *:' + port);
});