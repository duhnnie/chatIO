const _ = require('lodash'),
    uuidV1 = require('uuid/v1'),
    color = require('./ColorManager');

var User = function (settings) {
    this._uid = null;
    this._puid = null;
    this._nickname = null;
    this._socket = null;
    this._color = null;
    User.prototype._init.call(this, settings);
};

User.prototype._init = function (settings) {
    settings = _.merge({
        uid: uuidV1(),
        puid: uuidV1(),
        nickname: null,
        socket: null,
        color: color.getColor()
    }, settings);

    this.setUID(settings.uid)
        .setPUID(settings.puid)
        .setNickname(settings.nickname)
        .setSocket(settings.socket)
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

User.prototype.setPUID = function (puid) {
    if(!(puid = puid.trim())) {
        throw new Error('Invalid UID');
    }

    this._puid = puid;
    return this;
};

User.prototype.getPUID = function () {
    return this._puid;
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

User.prototype.setSocket = function (socket) {
    // TODO: valid the parameter is a Socket instance

    this._socket = socket;
    return this;
};

User.prototype.getSocket = function () {
    return this._socket;
};

User.prototype.getColor = function () {
    return this._color;
};

User.prototype.getInfo = function () {
    return {
        uid: this._uid,
        puid: this._puid,
        nickname: this._nickname,
        color: this._color
    };
};

module.exports = User;