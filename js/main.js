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
    typing = [],
    users = {};

function appendMessage(type, message) {
    var textNode,
        messageHTML,
        content = [],
        datetime,
        span,
        color,
        aux;

    datetime = document.createElement('datetime');
    datetime.datetime = datetime.textContent = (message && message.datetime) || "2016-08-12";

    switch (type) {
        case MESSAGE_TYPE.ONLINE:
            textNode = document.createTextNode("Estás connectado!");
            span = document.createElement('span');
            span.appendChild(textNode);
            aux = document.createElement('div');
            aux.className = 'notification';
            aux.appendChild(span);
            aux.appendChild(datetime);
            content.push(aux);
            break;
        case MESSAGE_TYPE.MESSAGE:
            aux = document.createElement('div');
            aux.className = "author";
            aux.appendChild(document.createTextNode(message.user));
            content.push(aux);
            span = document.createElement('span');
            span.appendChild(document.createTextNode(message.text));
            aux = document.createElement('div');
            aux.appendChild(span);
            aux.appendChild(datetime);
            aux.className = "message-content";
            content.push(aux);
            color = message.color;
            if (message.user !== me.nickname) {
                AUDIO.newMessage();
            }
            break;
        case MESSAGE_TYPE.CONNECTED:
            aux = document.createElement('strong');
            aux.appendChild(document.createTextNode(message.nickname));
            span = document.createElement('span');
            span.appendChild(aux);
            span.appendChild(document.createTextNode(" se ha unido a la sala de chat."));
            aux = document.createElement('div');
            aux.className = 'notification';
            aux.appendChild(span);
            aux.appendChild(datetime);
            content.push(aux);
            color = message.color;
            AUDIO.userConnected();
            break;
        case MESSAGE_TYPE.DISCONNECTED:
            aux = document.createElement('strong');
            aux.appendChild(document.createTextNode(message));
            span = document.createElement('span');
            span.appendChild(aux);
            span.appendChild(document.createTextNode(" ha dejado la sala de chat."));
            aux = document.createElement('div');
            aux.className = 'notification';
            aux.appendChild(span);
            aux.appendChild(datetime);
            content.push(aux);
            AUDIO.userDisconnected();
            break;
        case MESSAGE_TYPE.TYPING:
            if (typing.length) {
                span = document.createElement('span');
                aux = document.createElement('strong');
                aux.appendChild(document.createTextNode(typing.join(', ')));
                span.appendChild(aux);
                span.appendChild(document.createTextNode((typing.length > 1 ? ' are' : ' is') + ' typing...'));

                content.push(span);
            } else {
                (aux = document.getElementById('typing_notification')) ? aux.remove() : '';
                return;
            }
            break;
        case MESSAGE_TYPE.OFFLINE:
            textNode = document.createTextNode("Estás desconectado!");
            span = document.createElement('span');
            span.appendChild(textNode);
            aux = document.createElement('div');
            aux.className = 'notification';
            aux.appendChild(span);
            aux.appendChild(datetime);
            content.push(aux);
            AUDIO.disconnected();
            break;
    }

    if (type === MESSAGE_TYPE.TYPING) {
        messageHTML = document.getElementById('typing_notification');
    }

    if (!messageHTML) {
        messageHTML = document.createElement('li');
        messageHTML.id = type === MESSAGE_TYPE.TYPING ? 'typing_notification' : '';
    } else {
        while (messageHTML.hasChildNodes()) {
            messageHTML.childNodes[0].remove();
        }
    }

    content.forEach(function (item) {
        messageHTML.appendChild(item);
    });

    DOM.list.appendChild(messageHTML);
    messageHTML.style.backgroundColor = color;
    DOM.list.scrollTop = DOM.list.scrollHeight;
}

function formatNickname(nickname) {
    return nickname.match(/\b(\w)/g).slice(0, 2).join("").toUpperCase();
}

function initAvatar() {
    var div = document.createElement('div');
    div.className = 'circle';
    div.id = "user-picture";
    div.style.backgroundColor = me.color;
    div.appendChild(document.createTextNode(formatNickname(me.nickname)));
    document.getElementById('avatar').appendChild(div);
    document.getElementById('username').appendChild(document.createTextNode(me.nickname));
}

function addUserToList(user) {
    var li = document.createElement('li'),
        div = document.createElement('div'),
        avatar = document.createElement('div'),
        span = document.createElement('span');

    div.className = 'user-avatar';
    avatar.className = 'circle user-icon';
    avatar.appendChild(document.createTextNode(formatNickname(user.nickname)));
    span.appendChild(document.createTextNode(user.nickname));

    div.appendChild(avatar);
    div.appendChild(span);
    li.appendChild(div);

    li.id = "user-" + user.nickname;
    avatar.style.backgroundColor = user.color;

    DOM.usersList.appendChild(li);
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

function updateChatSize() {
    DOM.container.style.width = window.innerWidth + "px";
    DOM.container.style.height = window.innerHeight + "px";
}

document.addEventListener("DOMContentLoaded", function () {
    DOM.list = document.querySelector('#messages');
    DOM.input = document.getElementById('message-input');
    DOM.container = document.getElementById('container');
    DOM.usersList = document.getElementById('users');
    DOM.sendButton = document.getElementById('send-button');

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
                DOM.input.placeholder = "Escribe aquí";
                DOM.sendButton.textContent = "Enviar";
                appendMessage(MESSAGE_TYPE.ONLINE);
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
                addUserToList(data.data);
                appendMessage(MESSAGE_TYPE.CONNECTED, data.data);
                break;
            case COMMANDS.USER_DISCONNECTED:
                appendMessage(MESSAGE_TYPE.DISCONNECTED, data.data);
                typing = typing.filter(function (user) {
                    return user != data.data;
                });
                document.getElementById('user-' + data.data).remove();
                break;
            case COMMANDS.RECEIVED_MESSAGE:
                appendMessage(MESSAGE_TYPE.MESSAGE, data.data);
                if (data.data.user === me.nickname) {
                    DOM.sendButton.disabled = DOM.input.disabled = false;
                    DOM.sendButton.textContent = "Enviar";
                    DOM.input.placeholder = "Escribe aquí";
                    DOM.input.focus();
                }
                break;
            case COMMANDS.DISCONNECT:
                DOM.sendButton.disabled = DOM.input.disabled = true;
                DOM.sendButton.textContent = DOM.input.placeholder = "Sin conexión!";
                appendMessage(MESSAGE_TYPE.OFFLINE);
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
            console.log("typing...");
            worker.port.postMessage({
                cmd: COMMANDS.TYPING
            });
        }
        clearTimeout(timeoutHandler);
        timeoutHandler = setTimeout(function () {
            isTyping = false;
            console.log("...stop typing");
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
            DOM.sendButton.textContent = DOM.input.placeholder = "Enviando...";
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

    window.addEventListener('resize', function () {
        updateChatSize();
    });

    updateChatSize();

    worker.port.start();

    worker.port.postMessage({
        cmd: COMMANDS.CONNECT
    });
});