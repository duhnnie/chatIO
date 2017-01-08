const   MESSAGE_TYPE = {
        MESSAGE: 1,
        CONNECTED: 2,
        ONLINE: 3,
        DISCONNECTED: 4,
        TYPING: 5,
        OFFLINE: 6
    },
    DOM = {};

var worker,
    me,
    timeoutHandler,
    isTyping = false,
    lastMessage = {},
    typing = [],
    users = {};

function appendMessage(type, message) {
    var messageItem,
        messageItemClassName,
        component,
        aux,
        messageComponents = [];

    switch (type) {
        case MESSAGE_TYPE.ONLINE:
            messageItemClassName = "notification";

            component = document.createElement("span");
            component.textContent = "You're online!";
            messageComponents.push(component);

            component = document.createElement("span");
            component.className = "message-time";
            component.textContent = formatDate(message.datetime);
            messageComponents.push(component);
            break;
        case MESSAGE_TYPE.MESSAGE:
            messageItemClassName = "message";

            if (lastMessage.user !== message.user) {
                if(message.user !== me.nickname) {
                    component = document.createElement('h2');
                    component.className = "message-author";
                    component.textContent = message.user;
                    messageComponents.push(component);
                } else {
                    messageItemClassName += " message-first";
                }

                component = document.createElement("div");
                component.className = "avatar message-avatar";
                component.style.backgroundColor = message.color;
                component.textContent = formatNickname(message.user);
                messageComponents.push(component);
            }

            component = document.createElement("div");
            component.className = "message-text";
            component.style.backgroundColor = message.user !== me.nickname ? '' : message.color;
            component.textContent = message.text;
            messageComponents.push(component);

            component = document.createElement("span");
            component.className = "message-time";
            component.textContent = formatDate(message.datetime);
            messageComponents.push(component);

            component = document.createElement("div");
            component.className = "clear";
            messageComponents.push(component);

            if (message.user !== me.nickname) {
                messageItemClassName += " incoming";
                AUDIO.newMessage();
            }
            lastMessage = message;
            break;
        case MESSAGE_TYPE.CONNECTED:
            messageItemClassName = "notification";

            aux = document.createElement("strong");
            aux.textContent = message.user.nickname;
            component = document.createElement("span");
            component.appendChild(aux);
            component.appendChild(document.createTextNode(" joined the conversation"));
            messageComponents.push(component);

            component = document.createElement("span");
            component.className = "message-time";
            component.textContent = formatDate(message.datetime);
            messageComponents.push(component);
            AUDIO.userConnected();
            break;
        case MESSAGE_TYPE.DISCONNECTED:
            messageItemClassName = "notification";

            aux = document.createElement("strong");
            aux.textContent = message.user;
            component = document.createElement("span");
            component.appendChild(aux);
            component.appendChild(document.createTextNode(" left the conversation"));
            messageComponents.push(component);

            component = document.createElement("span");
            component.className = "message-time";
            component.textContent = formatDate(message.datetime);
            messageComponents.push(component);
            AUDIO.userDisconnected();
            break;
        case MESSAGE_TYPE.TYPING:
            if (typing.length) {
                while (DOM.typing.hasChildNodes()) {
                    DOM.typing.childNodes[0].remove();
                }
                aux = document.createElement('strong');
                aux.appendChild(document.createTextNode(typing.join(', ')));
                DOM.typing.appendChild(aux);
                DOM.typing.appendChild(document.createTextNode((typing.length > 1 ? ' are' : ' is') + ' typing...'));
                $(DOM.typing).fadeIn();
            } else {
                $(DOM.typing).fadeOut();
            }
            break;
        case MESSAGE_TYPE.OFFLINE:
            messageItemClassName = "notification";

            component = document.createElement("span");
            component.textContent = "You're offline!";
            messageComponents.push(component);

            component = document.createElement("span");
            component.className = "message-time";
            component.textContent = formatDate(message.datetime);
            messageComponents.push(component);
            AUDIO.disconnected();
            break;
    }

    if (!messageComponents.length) {
        return;
    }

    messageItem = document.createElement('li');
    messageItem.className = messageItemClassName;

    for (let messageComponent of messageComponents) {
        messageItem.appendChild(messageComponent);
    }

    // Verify id the list is totally scrolled
    aux = DOM.list.clientHeight + DOM.list.scrollTop === DOM.list.scrollHeight;

    DOM.list.appendChild(messageItem);

    if (type === MESSAGE_TYPE.ONLINE) {
        $(messageItem).slideDown(function () {
            AUDIO.connected();
        });
    } else {
        $(messageItem).fadeIn();
    }

    if (aux) {
        $(DOM.list).animate({
            scrollTop: DOM.list.scrollHeight - DOM.list.clientHeight
        });
    }
}

function formatNickname(nickname) {
    return nickname.match(/\b(\w)/g).slice(0, 3).join("").toUpperCase();
}

function initAvatar() {
    DOM.userAvatar.style.backgroundColor = me.color;
    DOM.userAvatar.textContent = formatNickname(me.nickname);
    DOM.userName.textContent = me.nickname;
}

function addUserToList(user) {
    var userItem = document.createElement("li"),
        userAvatar = document.createElement("div"),
        userName = document.createElement("div");

    userItem.className = "user";
    userAvatar.className = "avatar user-avatar";
    userName.className = "user-name";

    userAvatar.textContent = formatNickname(user.nickname);
    userAvatar.style.backgroundColor = user.color;
    userName.textContent = user.nickname;

    userItem.id = "user-" + user.nickname;

    userItem.appendChild(userAvatar);
    userItem.appendChild(userName);

    DOM.usersList.appendChild(userItem);
    $(userItem).fadeIn();
};

function setUsersList(users) {
    while (DOM.usersList.hasChildNodes()) {
        DOM.usersList.childNodes[0].remove();
    }
    users.forEach(function (item) {
        addUserToList(item);
    });
}

function askNickname() {
    var nickname = prompt("Enter your nickname:") || "";

    worker.port.postMessage({
        cmd: COMMANDS.NICKNAME,
        data: {
            nickname: nickname
        }
    });
}

function formatDate (milliseconds) {
    var date = new Date(milliseconds);

    return date.getHours() + ':' + date.getMinutes();
};

document.addEventListener("DOMContentLoaded", function () {
    DOM.userAvatar = document.querySelector('#localuser-avatar');
    DOM.userName = document.querySelector('#localuser-name');
    DOM.list = document.querySelector('#messages');
    DOM.input = document.querySelector('#message-input');
    DOM.usersList = document.querySelector('#users');
    DOM.sendButton = document.querySelector('#send-button');
    DOM.typing = document.querySelector("#typing");

    if (!window.SharedWorker) {
        return alert("Tu navegador no soporta SharedWorkers, intenta con otro navegador\n/Your browser doesn't support SharedWorkers, try it on another browser.");
    }

    worker = new SharedWorker('js/worker.js');

    worker.port.addEventListener("message", function (e) {
        var data = e.data;
        switch (data.cmd) {
            case COMMANDS.NICKNAME:
                askNickname();
                break;
            case COMMANDS.CONNECTED:
                DOM.sendButton.disabled = DOM.input.disabled = false;
                DOM.input.placeholder = "Type a message";
                DOM.sendButton.textContent = "Send";
                appendMessage(MESSAGE_TYPE.ONLINE, data.data);
                break;
            case COMMANDS.USER_DATA:
                me = data.data;
                initAvatar();
                setUsersList(me.users);
                break;
            case COMMANDS.TYPING:
                typing.push(data.data);
                appendMessage(MESSAGE_TYPE.TYPING);
                break;
            case COMMANDS.STOP_TYPING:
                typing = typing.filter(function (user) {
                    return user != data.data;
                });
                appendMessage(MESSAGE_TYPE.TYPING);
                break;
            case COMMANDS.USER_CONNECTED:
                addUserToList(data.data.user);
                appendMessage(MESSAGE_TYPE.CONNECTED, data.data);
                break;
            case COMMANDS.USER_DISCONNECTED:
                appendMessage(MESSAGE_TYPE.DISCONNECTED, data.data);
                typing = typing.filter(function (user) {
                    return user != data.data.user;
                });
                $('#user-' + data.data.user).fadeOut();
                break;
            case COMMANDS.RECEIVED_MESSAGE:
                appendMessage(MESSAGE_TYPE.MESSAGE, data.data);
                if (data.data.user === me.nickname) {
                    DOM.sendButton.disabled = DOM.input.disabled = false;
                    DOM.sendButton.textContent = "Send";
                    DOM.input.placeholder = "Type a message";
                    DOM.input.focus();
                }
                break;
            case COMMANDS.DISCONNECT:
                DOM.sendButton.disabled = DOM.input.disabled = true;
                DOM.sendButton.textContent = DOM.input.placeholder = "Disconected!";
                appendMessage(MESSAGE_TYPE.OFFLINE, data.data);
                users = {};
                setUsersList([]);
                break;
            case COMMANDS.ERROR:
                alert("Error: " + data.data.message);
                break;
            default:
                throw new Error('Invalid command.');
        }
    });

    worker.addEventListener("error", function (e) {
        console.log("Error on worker: " + e.message + " " + e.filename + ":" + e.lineno);
    });

    DOM.input.addEventListener('input', function () {
        if (!isTyping) {
            isTyping = true;
            worker.port.postMessage({
                cmd: COMMANDS.TYPING
            });
        }
        clearTimeout(timeoutHandler);
        timeoutHandler = setTimeout(function () {
            isTyping = false;
            worker.port.postMessage({
                cmd: COMMANDS.STOP_TYPING
            });
        }, 3000);
    });

    document.querySelector('form').addEventListener('submit', function (e) {
        var inputValue = DOM.input.value.trim();
        e.preventDefault();
        clearTimeout(timeoutHandler);
        worker.port.postMessage({ cmd: COMMANDS.STOP_TYPING });
        isTyping = false;
        if (inputValue) {
            DOM.sendButton.disabled = DOM.input.disabled = true;
            DOM.sendButton.textContent = DOM.input.placeholder = "Sending...";
            worker.port.postMessage({
                cmd: COMMANDS.SEND_MESSAGE,
                data: {
                    id: Date.now(),
                    message: inputValue
                }
            });
        }
        DOM.input.value = '';
    });

    worker.port.start();

    worker.port.postMessage({
        cmd: COMMANDS.CONNECT
    });
});