import type { Host } from '../splux-host.js';
import type { Notification } from '../type';
import { WSEvents } from '@common-types/ws-events';

// const WS_URL = 'wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30';
const WS_URL = 'ws://localhost:8922/ws';

const session = {
  id: '',
  ws: null as WebSocket | null,
};

export function wsConnect (url: string, handler: (notification: Notification) => void) {
  const ws = new WebSocket(url);
  ws.onmessage = function (event) {
    const data: WSEvents = JSON.parse(event.data);
    // console.log(data);
    switch (data.type) {
      case 'notification':
        handler(data.payload);
        break;
    }
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
    host.cast('eventSubEvent', message);
  });
};
