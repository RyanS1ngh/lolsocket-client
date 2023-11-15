class LOL {
    constructor({ ApiKey }) {
        this.apiKey = ApiKey;
        this.socket = null;
        this.channels = {};
        this.userId = null;

        this.connection(ApiKey);
    }

    connection(ApiKey) {
        this.socket = new WebSocket(`wss://ws.lolcorp.co.uk:1876?apikey=${ApiKey}`);

        const connectedPromise = new Promise((resolve) => {
            this.socket.addEventListener('open', () => {
                console.log('Connected to LOLSocket server');
                resolve(); // Resolve the promise when the connection is open
            });
        });

        this.socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            const { type, channel, content } = data;
/* 
            if (type === 'message') {
                if (this.channels[channel]) {
                    this.channels[channel].forEach((subscription) => {
                        const callback = subscription.callback;
                        if (typeof callback === 'function') {
                            callback(content);
                        } else {
                            console.error('Callback is not a function:', callback);
                        }
                    });

                    console.log('Received message:', data);
                }
            } else if (type === 'user_id') {
                this.userId = data.userId;
                // set the user id in local storage
                localStorage.setItem('LOL-UID', data.userId);
            } */
        });

        this.socket.addEventListener('close', () => {
            this.logError('Disconnected from WebSocket server');
        });

        return connectedPromise; // Return the promise to indicate when the connection is open
    }

    logError(message) {
        console.log(message);
    }

     subscribe(channel) {
        const channelKey = channel;
    
        if (!this.channels[channelKey]) {
            this.channels[channelKey] = [];
    
            const data = {
                type: 'subscribe',
                channel: channel,
            };
            this.socket.addEventListener('open', () => {
                this.socket.send(JSON.stringify(data));
            });
    
            this.socket.addEventListener('message', (event) => {
                const parsedMessage = JSON.parse(event.data);
                const messageType = parsedMessage.namespace;
                const messageData = parsedMessage.content;
                
               // console.log('Received message:', parsedMessage)

                this.channels[channelKey].forEach(subscription => {
                    if (subscription.type === messageType) {
                        subscription.callback(messageData);
                    }
                });
            });
        }
    
        return {
            bind: (type, callback) => {
                this.channels[channelKey].push({
                    type: type,
                    callback: callback
                });
            }
        };
    }; 

    

    trigger(channel, type, message) {
        const isClient = channel.startsWith('client-');
        if (!isClient) {
            console.log('Client channels must start with "client-"')
        }

        const data = {
            type: 'client',
            namespace: type,
            channel: channel,
            content: message,
            secret: this.apiSecret,
        };

        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            // Handle the case where the socket is not open
            console.error('Socket not open');
        }
    }

    // optional getUid function
    then(callback) {
        this.socket.onopen = () => {
            // LISTEN FOR TYPE user_id FROM SERVER
            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                const { type, userId } = data;

                if (type === 'user_id') {
                    this.userId = userId;
                    // set the user id in local storage
                    localStorage.setItem('LOL-UID', userId);
                    if(typeof callback === 'function'){
                        callback(userId)
                    }
                }
            };
        }

    }
}
module.exports = LOL;
