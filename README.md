# Client-Side Module (LOLSocket-Client)

##  LOLSocket-Client

LOLSocket-js is a JavaScript library that simplifies real-time communication between servers and clients using WebSockets. It provides an easy-to-use interface for subscribing to channels, triggering events, and handling private messages.

Get your API keys from [https://lolsocket.com](https://lolsocket.com).


### Installation

```
npm install lolsocket-client
```

### Usage


```
const LOL = require('lolsocket-client');

const lol = new LOL({ ApiKey: 'YOUR_API_KEY' });

// Get LOL-UID
lol.then((userId) => {
    // Your logic with the obtained LOL-UID
});
// Subscribe to a channel
const channelSubscription = lol.subscribe('channel-name');

channelSubscription.bind('message-type', (messageData) => {
    // Your logic to handle incoming messages of 'message-type'
});

// Trigger an event
lol.trigger('channel-name', 'event-type', { your: 'event-data' });

```

### Features

- Subscribe to channels and listen for messages in specific namespaces.

- Trigger events to broadcast messages to the server.

- Compatible with Vue.js, React, Angular, and vanilla JavaScript.


### License

This project is Owned by [LOLSocket](https://lolsocket.com)& [LOLCorp](https://lolcorp.co.uk). 

