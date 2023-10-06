(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
}((function () { 'use strict';

    /**
     * The code was extracted from:
     * https://github.com/davidchambers/Base64.js
     */

    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    function InvalidCharacterError(message) {
        this.message = message;
    }

    InvalidCharacterError.prototype = new Error();
    InvalidCharacterError.prototype.name = "InvalidCharacterError";

    function polyfill(input) {
        var str = String(input).replace(/=+$/, "");
        if (str.length % 4 == 1) {
            throw new InvalidCharacterError(
                "'atob' failed: The string to be decoded is not correctly encoded."
            );
        }
        for (
            // initialize result and counters
            var bc = 0, bs, buffer, idx = 0, output = "";
            // get next character
            (buffer = str.charAt(idx++));
            // character found in table? initialize bit storage and add its ascii value;
            ~buffer &&
            ((bs = bc % 4 ? bs * 64 + buffer : buffer),
                // and if not first of each 4 characters,
                // convert the first 8 bits to one ascii character
                bc++ % 4) ?
            (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)))) :
            0
        ) {
            // try to find character in table (0-63, not found => -1)
            buffer = chars.indexOf(buffer);
        }
        return output;
    }

    var atob = (typeof window !== "undefined" &&
        window.atob &&
        window.atob.bind(window)) ||
    polyfill;

    function b64DecodeUnicode(str) {
        return decodeURIComponent(
            atob(str).replace(/(.)/g, function(m, p) {
                var code = p.charCodeAt(0).toString(16).toUpperCase();
                if (code.length < 2) {
                    code = "0" + code;
                }
                return "%" + code;
            })
        );
    }

    function base64_url_decode(str) {
        var output = str.replace(/-/g, "+").replace(/_/g, "/");
        switch (output.length % 4) {
            case 0:
                break;
            case 2:
                output += "==";
                break;
            case 3:
                output += "=";
                break;
            default:
                throw "Illegal base64url string!";
        }

        try {
            return b64DecodeUnicode(output);
        } catch (err) {
            return atob(output);
        }
    }

    function InvalidTokenError(message) {
        this.message = message;
    }

    InvalidTokenError.prototype = new Error();
    InvalidTokenError.prototype.name = "InvalidTokenError";

    function jwtDecode(token, options) {
        if (typeof token !== "string") {
            throw new InvalidTokenError("Invalid token specified");
        }

        options = options || {};
        var pos = options.header === true ? 0 : 1;
        try {
            return JSON.parse(base64_url_decode(token.split(".")[pos]));
        } catch (e) {
            throw new InvalidTokenError("Invalid token specified: " + e.message);
        }
    }

    /*
     * Expose the function on the window object
     */

    //use amd or just through the window object.
    if (window) {
        if (typeof window.define == "function" && window.define.amd) {
            window.define("jwt_decode", function() {
                return jwtDecode;
            });
        } else if (window) {
            window.jwt_decode = jwtDecode;
        }
    }

})));
//# sourceMappingURL=jwt-decode.js.map

function LOL({ API_KEY, API_SECRET, TLS }) {
    this.apiKey = API_KEY;
    this.apiSecret = API_SECRET;
    if (TLS) {
        const url = `wss://ws.lolcorp.co.uk:4000/${API_KEY}`;
        this.socket = new WebSocket(url);
    } else {
        const url = `ws://ws.lolcorp.co.uk:3000/${API_KEY}`;
        this.socket = new WebSocket(url);
    }

    this.socket.onerror = (error) => {
        console.log('disconnected');
    };

    this.socket.onopen = () => {
        console.log('connected');
    };

    this.channels = {};

    this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const { type, channel, content } = data;
        if (type === 'message') {
            if (this.channels[channel]) {
                this.channels[channel].forEach((callback) => {
                    callback(content);
                });
            }
        }

        if (type === 'token') {
            this.token = data.token;
            // jwt decode
            const decoded = jwt_decode(data.token);
            const userId = decoded.userId;
            this.userID = userId;
            console.log('userId', userId)
            if (!userId) {
                this.socket.close();
            }
        }
    };

    this.subscribe = (channel) => {
        const channelKey = `${this.apiKey}-${channel}`;
        const data = {
            type: 'subscribe',
            channel: channel,
            secret: this.apiSecret,
            token: this.token
        };
        this.socket.send(JSON.stringify(data));

        if (!this.channels[channelKey]) {
            this.channels[channelKey] = [];
        }

        return {
            bind: (type, callback) => {
                this.channels[channelKey].push({
                    type: type,
                    callback: callback
                });

                this.socket.onmessage = (event) => {
                    const parsedMessage = JSON.parse(event.data);
                    const messageType = parsedMessage.emit_type;
                    const messageData = parsedMessage.content;

                    this.channels[channelKey].forEach(subscription => {
                        if (subscription.type === messageType) {
                            subscription.callback(messageData);
                        }
                    });
                };
            }
        };
    };

    this.trigger = (channel, type, message) => {
        const isClient = channel.startsWith('client-');
        this.subscribe(channel);
        if (isClient) {
            const data = {
                type: 'client-publish',
                emit_type: type,
                channel: channel,
                content: message,
                secret: this.apiSecret,
                userId: this.userID,
                token: this.token
            };
            this.socket.send(JSON.stringify(data));
        } else if (!isClient) {
            const data = {
                type: 'publish',
                emit_type: type,
                channel: channel,
                content: message,
                secret: this.apiSecret,
                userId: this.userID,
                token: this.token
            };
            this.socket.send(JSON.stringify(data));
        }
    };
}

module.exports = LOL;