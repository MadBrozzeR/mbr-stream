import type { Host } from '../splux-host.js';
import { WSEvents } from '@common-types/ws-events';

// const WS_URL = 'wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30';
const WS_URL = 'ws://localhost:8922/ws';

const session = {
  id: '',
  ws: null as WebSocket | null,
};

export function wsConnect (url: string, handler: (wsEvent: WSEvents) => void) {
  const ws = new WebSocket(url);
  ws.onmessage = function (event) {
    const data: WSEvents = JSON.parse(event.data);
    // console.log(data);
    handler(data);
  };
  ws.onclose = function () {
    if (session.ws === ws) {
      wsConnect(url, handler);
    }
  };

  return handler;
}

export const startWebSocket = function (host: Host) {
  wsConnect(WS_URL, function (message) {
    switch (message.type) {
      case 'notification':
        host.cast('eventSubEvent', message.payload);
        break;

      case 'streamInfo':
        host.cast('streamInfo', message.payload);
        break;
    }
  });
};
