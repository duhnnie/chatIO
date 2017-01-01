var UnavailableNicknameError = function (nickname) {
    this.name = 'UnavailableNicknameError';
    this.message = 'The nickname \"' + nickname + '\" is already taken.';
    this.stack = (new Error()).stack;
};

UnavailableNicknameError.prototype = Object.create(Error.prototype);

UnavailableNicknameError.prototype.constructor = UnavailableNicknameError;

var InvalidParameterError = function (message) {
    this.name = 'InvalidParameter';
    this.message = message || 'Invalid parameters.';
    this.stack = (new Error()).stack;
};

InvalidParameterError.prototype = Object.create(Error.prototype);

InvalidParameterError.prototype.constructor = InvalidParameterError;

var UserNotFoundError = function (user) {
    this.name = 'UserNotFoundError';
    this.message = 'User ' + user + ' not found.';
    this.stack = (new Error()).stack;
};

UserNotFoundError.prototype = Object.create(Error.prototype);

UserNotFoundError.prototype.constructor = UserNotFoundError;

module.exports = {
    UnavailableNicknameError: UnavailableNicknameError,
    InvalidParameterError: InvalidParameterError,
    UserNotFoundError: UserNotFoundError
};