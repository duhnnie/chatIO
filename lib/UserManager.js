const _ = require('lodash'),
    User = require('./User'),
    Errors = require('./Errors');

var UserManager = function (settings) {
    this._users = null;
    this._nicknamesMap = {};
    this._socketMap = {};
    this._onUserRemove = null;
    UserManager.prototype._init.call(this, settings || {});
};

UserManager.prototype._init = function (settings) {
    settings = _.merge({
        users: [],
        onUserRemove: null
    }, settings.users);

    this.setUsers(settings.users)
        .setOnUserRemove(settings.onUserRemove);
};

UserManager.prototype.addUser = function (user) {
    var nickname,
        lowerNickname;

    if (!user) {
        throw new Errors.InvalidParameterError('addUser(): The parameter must be a generic object or an instance of User.');
    }
    if (!(user instanceof User)) {
        user = new User(user);
    }

    nickname = user.getNickname();
    lowerNickname = _.toLower(nickname);

    if (this._nicknamesMap[lowerNickname]) {
        throw new Errors.UnavailableNicknameError(nickname);
    }

    this._nicknamesMap[lowerNickname] = user;
    this._socketMap[user.getSocket().id] = user;
    this._users.push(user);
    return this;
};

UserManager.prototype.removeUser = function (user) {
    var removed;

    if (typeof user === 'string') {
        removed = _.remove(this._users, function (item) {
            return item.uid === user;
        });
    } else {
        removed = _.remove(this._users, function (item) {
            return item === user;
        });
    }

    for (item of removed) {
        delete this._nicknamesMap[_.toLower(item.getNickname())];
        if (typeof this._onUserRemove === 'function') {
            this._onUserRemove(this, item);
        }
    }

    return this;
};

UserManager.prototype.setUsers = function (users) {
    if (!_.isArray(users)) {
        throw new Errors.InvalidParameterError("setUsers(): The parameter must be an array.");
    }
    this._users = [];
    for (user of users) {
        this.addUser(user);
    }
    return this;
};

UserManager.prototype.getUsers = function (relativeTo) {
    return this._users.filter(function (user) {
        return user.getUID() !== relativeTo;
    });
};

UserManager.prototype.getUserByUID = function (uid) {
    return this._users.find(function (user) {
        return user.getUID() === uid;
    });
};

UserManager.prototype.getUserByNickname = function (uid) {
    return this._nicknamesMap[uid];
};

UserManager.prototype.getUserBySocket = function (socket) {
    return this._socketMap[socket.id];
    // return _.find(this._users, function (item) {
    //     return item.hasSocket(socket);
    // });
};

UserManager.prototype.setOnUserRemove = function (callback) {
    if (callback !== null && typeof callback !== 'function') {
        throw new Error('setOnUserRemove(): The parameter must be a function or null.');
    }

    this._onUserRemove = callback;
    return this;
};

UserManager.prototype.getUserPrivateInfo = function (identifier) {
    var user, ret;

    if (typeof identifier === 'string') {
        user = this.getUserByUID(identifier);
    } else {
        user = this.getUserBySocket(identifier);
    }

    if (!user) {
        throw new Errors.UserNotFoundError(identifier);
    }

    ret = user.getInfo();
    ret.users = this.getUsers(user.getUID()).map(function (user) {
        return {
            nickname: user.getNickname(),
            color: user.getColor()
        }
    });

    return ret;
};

UserManager.prototype.getUserInfo = function (identifier) {
    var ret = this.getUserPrivateInfo(identifier);

    delete ret.uid;
    delete ret.users;

    return ret;
};

module.exports = UserManager;