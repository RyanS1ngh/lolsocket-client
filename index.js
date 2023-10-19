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
class LOL {
    constructor({ API_KEY, API_SECRET, TLS }) {
        this.apiKey = API_KEY;
        this.apiSecret = API_SECRET;
        this.TLS = TLS;
        this.channels = {};
        this.userID = null;

        this.socket = null;
    }

    async connect() {
        const protocol = this.TLS ? 'wss' : 'ws';
        const port = this.TLS ? 4000 : 3000;
        const url = `${protocol}://ws.lolcorp.co.uk:${port}/${this.apiKey}`;
        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(url);
            this.socket.onopen = () => {
                // send a message type connected to the server
                const data = {
                    type: 'connected'
                };
                this.socket.send(JSON.stringify(data));
                resolve();
            };

            this.socket.onerror = (error) => {
                reject(new Error('WebSocket connection failed.'));
            };

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
                    console.log('userId', userId);
                    if (!userId) {
                        this.socket.close();
                    }
                    // store the user id in localStorage as LOL_USER_ID
                    localStorage.setItem('LOL_USER_ID', userId);
                }
            };
        });
    }

    subscribe(channel) {
        return new Promise((resolve, reject) => {
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

            resolve({
                bind: (type, callback) => {
                    this.channels[channelKey].push({
                        type: type,
                        callback: callback
                    });
                    // No need to modify onmessage here, already handled during socket initialization.
                }
            });
        });
    }

    trigger(channel, type, message) {
        return new Promise((resolve, reject) => {
            const isClient = channel.startsWith('client-');
            this.subscribe(channel)
                .then(() => {
                    const data = {
                        type: isClient ? 'client-publish' : 'publish',
                        emit_type: type,
                        channel: channel,
                        content: message,
                        secret: this.apiSecret,
                        userId: this.userID,
                        token: this.token
                    };
                    this.socket.send(JSON.stringify(data));
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }
}

module.exports = LOL;
