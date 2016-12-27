const _ = require('lodash'),
    User = require('./User'),
    Errors = require('./Errors');

var UserManager = function (settings) {
    this._users = null;
    this._nicknamesMap = {};
    this._onUserRemove = null;
    UserManager.prototype._init.call(this, settings || {});
};

UserManager.prototype._init = function (settings) {
    settings = _.merge({
        users: [],
        onUserRemove: null
    }, settings.users);

    this._setOnUserCallbacks()
        .setUsers(settings.users)
        .setOnUserRemove(settings.onUserRemove);
};

UserManager.prototype._setOnUserCallbacks = function () {
    var that = this;
    this._onUserSocketRemove = function (user, socket) {
        if (user.getNumSockets() === 0) {
            that.removeUser(user);
        }
    };
    return this;
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

    user.setOnSocketRemove(this._onUserSocketRemove);

    nickname = user.getNickname();
    lowerNickname = _.lowerCase(nickname);

    if (this._nicknamesMap[lowerNickname]) {
        throw new Errors.UnavailableNicknameError(nickname);
    }

    this._nicknamesMap[lowerNickname] = user;
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
        delete this._nicknamesMap[_.lowerCase(item.getNickname())];
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
    return _.find(this._users, function (item) {
        return item.hasSocket(socket);
    });
};

UserManager.prototype.setOnUserRemove = function (callback) {
    if (callback !== null && typeof callback !== 'function') {
        throw new Error('setOnUserRemove(): The parameter must be a function or null.');
    }

    this._onUserRemove = callback;
    return this;
};

module.exports = UserManager;