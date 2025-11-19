import type { Notification } from './type.js';

const session = {
  id: '',
  ws: null as WebSocket | null,
};

export function wsConnect (url: string, handler: (notification: Notification) => void) {
  const ws = new WebSocket(url);
  ws.onmessage = function (event) {
    const data = JSON.parse(event.data);
    // console.log(data);
    switch (data.metadata.message_type) {
      case 'session_welcome':
        if (session.ws) {
          const oldWs = session.ws;
          session.ws = ws;
          oldWs.close();
        }
        session.id = data.payload.session.id;
        session.ws = ws;
        fetch('/subscribe?session=' + session.id).then(function (response) {
          if (!response.ok) {
            console.log('HTTP Error: ' + response.status);
            ws.close();
          } else {
            // Ignore
          }
        }).catch(function (error) {
          console.log(error);
        });
        break;

      case 'notification':
        handler(data.payload);
        break;

      case 'session_reconnect':
        wsConnect(data.payload.session.reconnect_url, handler);
        break;
    }
  };
  ws.onclose = function () {
    if (session.ws === ws) {
      wsConnect(url, handler);
    }
  };
}
