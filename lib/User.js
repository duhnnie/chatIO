const _ = require('lodash'),
    uuidV1 = require('uuid/v1'),
    color = require('./ColorManager');

var User = function (settings) {
    this._uid = null;
    this._nickname = null;
    this._sockets = [];
    this._onSocketRemove = null;
    this._color = null;
    User.prototype._init.call(this, settings);
};

User.prototype._init = function (settings) {
    settings = _.merge({
        uid: uuidV1(),
        nickname: null,
        sockets: [],
        onRemoveSocket: null,
        color: color.getColor()
    }, settings);

    this.setUID(settings.uid)
        .setNickname(settings.nickname)
        .setSockets(settings.sockets)
        .setOnSocketRemove(settings.onRemoveSocket)
        ._color = settings.color;
};

User.prototype.setUID = function (uid) {
    if(!(uid = uid.trim())) {
        throw new Error('Invalid UID');
    }

    this._uid = uid;
    return this;
};

User.prototype.getUID = function () {
    return this._uid;
};

User.prototype.setNickname = function (nickname) {
    if(!(nickname && (nickname = nickname.trim()))) {
        throw new Error('Invalid nickname.');
    }
    this._nickname = nickname;
    return this;
};

User.prototype.getNickname = function () {
    return this._nickname;
};

User.prototype.addSocket = function (socket) {
    // TODO: valid the parameter is a Socket instance

    this._sockets.push(socket);
    return this;
};

User.prototype.removeSocket = function (socket) {
    var removedSockets;

    if (typeof socket === 'string') {
        removedSockets = _.remove(this._sockets, function (item) {
            return item.id === socket;
        });
    } else {
        removedSockets = _.remove(this._sockets, function (item) {
            return item === socket;
        });
    }

    if (removedSockets && removedSockets.length && typeof this._onSocketRemove === 'function') {
        // Assume the removed socket will always be just one.
        this._onSocketRemove(this, removedSockets[0]);
    }

    return this;
};

User.prototype.setSockets = function (sockets) {
    if (!_.isArray(sockets)) {
        throw new Error('setSockets(): parameter must be an array.');
    }

    this._sockets = [];

    for (socket of sockets) {
        this.addSocket(socket);
    }
    return this;
};

User.prototype.getSockets = function () {
    return this._sockets.slice(0);
};

User.prototype.hasSocket = function (socket) {
    var index = _.findIndex(this._sockets, function (item) {
        return item === socket;
    });

    return index >= 0;
};

User.prototype.setOnSocketRemove = function (callback) {
    if (callback !== null && typeof callback !== 'function') {
        throw new Error('setOnSocketRemove(): The parameter must be a function or null.');
    }

    this._onSocketRemove = callback;
    return this;
};

User.prototype.getNumSockets = function () {
    return this._sockets.length;
};

User.prototype.getColor = function () {
    return this._color;
};

User.prototype.getInfo = function () {
    return {
        uid: this._uid,
        nickname: this._nickname,
        numClients: this.getNumSockets(),
        color: this._color
    };
};

module.exports = User;