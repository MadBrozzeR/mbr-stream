const { MadSocket } = require('madsocket');

const clients = [];

const ws = new MadSocket({
  connect() {
    console.log('Client connected');
    clients.push(this);
  },
  disconnect() {
    console.log('Client disconnected');
    const index = clients.indexOf(this);
    if (index > -1) {
      clients.splice(index, 1);
    }
  },
  message(message) {
    console.log('Message', message);
  },
  start() {
    console.log('WS started. Message examples:');
    console.log('{"metadata":{"message_id":"648496d3-5004-4c86-b68c-ff2255a430a4","message_type":"session_reconnect","message_timestamp":"2026-04-03T17:31:21.443436683Z"},"payload":{"session":{"id":"AgoQhGKedyI0TkC2YaA5OvV5thIGY2VsbC1h","status":"reconnecting","connected_at":"2026-04-03T15:57:06.275229755Z","keepalive_timeout_seconds":null,"reconnect_url":"ws://localhost:8955/","recovery_url":null}}}');
    console.log('{"metadata":{"message_id":"aca33321-5c18-4295-92b2-4cca49418fa1","message_type":"session_keepalive","message_timestamp":"2026-04-04T19:42:15.263522829Z"},"payload":{}}');
  },
});

ws.listen(8955);

process.stdin.on('data', function (data) {
  clients.forEach(function (client) {
    client.send(data.toString().trim());
  });
});
