# LOLSocket Client

**LOLSocket Client** is a lightweight JavaScript library that provides a convenient interface for interacting with the LOLSocket API. LOLSocket is a real-time messaging service that allows you to send and receive messages over WebSocket connections.

### Installation
You can install the LOLSocket Client module using npm:

```bash
npm install lolsocket-client
```

### Usage

To use LOLSocket Client in your JavaScript application, import the module and create a new instance of the `LOL` class, passing your LOLSocket API credentials:
```
const LOL = require('lolsocket-client');

const lolInstance = new LOL({
    API_KEY: 'your_api_key',
    API_SECRET: 'your_api_secret',
    TLS: true // Set to true for secure WebSocket connection, false for unsecure connection
});

```

### Subscribing to a Channel

```
const channelSubscription = lolInstance.subscribe('example-channel');
channelSubscription.bind('message', (content) => {
    console.log('Received message:', content);
});

```

### Sending a Message
```
const channelName = 'example-channel';
const messageType = 'text';
const messageContent = 'Hello, LOLSocket!';
lolInstance.trigger(channelName, messageType, messageContent);

```


API Reference
-------------

### `LOL(options)`

Creates a new LOLSocket Client instance.

*   `options` (Object):
    *   `API_KEY` (String, required): Your LOLSocket API key.
    *   `API_SECRET` (String, required): Your LOLSocket API secret.
    *   `TLS` (Boolean, optional): Set to true for secure WebSocket connection (default: true).

### `subscribe(channel)`

Subscribes to a specific channel.

*   `channel` (String, required): The name of the channel to subscribe to.

Returns an object with a `bind(type, callback)` method for handling incoming messages of a specific type.

### `trigger(channel, type, message)`

Sends a message to a specific channel.

*   `channel` (String, required): The name of the channel to send the message to.
*   `type` (String, required): The type of the message.
*   `message` (String, required): The content of the message.

### Example
```
const LOL = require('lolsocket-client');

const lolInstance = new LOL({
    API_KEY: 'your_api_key',
    API_SECRET: 'your_api_secret',
    TLS: true
});

const channelSubscription = lolInstance.subscribe('example-channel');
channelSubscription.bind('message', (content) => {
    console.log('Received message:', content);
});

lolInstance.trigger('example-channel', 'text', 'Hello, LOLSocket!');

```

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
