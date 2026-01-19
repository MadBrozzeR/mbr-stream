import type { Host } from '../splux-host.js';
import type { WSEvents, WSIncomeEvent } from '@common-types/ws-events';

// const WS_URL = 'wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30';
const WS_URL = 'ws://localhost:8922/ws';

const session = {
  id: '',
  ws: null as WebSocket | null,
};

export function wsConnect (
  url: string,
  handler: (wsEvent: WSEvents) => void,
  onCreate?: (ws: WebSocket, send: (message: WSIncomeEvent) => void) => void
) {
  const ws = new WebSocket(url);
  const pendingMessages: WSIncomeEvent[] = [];
  let isConnected = false;

  /* Unused until I figured out how to make server not break the connection after receiving a message. */
  function send (message: WSIncomeEvent) {
    if (isConnected) {
      ws.send(JSON.stringify(message));
    } else {
      pendingMessages.push(message);
    }
  }

  ws.onmessage = function (event) {
    const data: WSEvents = JSON.parse(event.data);
    // console.log(data);
    handler(data);
  };
  ws.onclose = function () {
    if (session.ws === ws) {
      wsConnect(url, handler, onCreate);
    }
  };
  ws.onopen = function () {
    isConnected = true;
    for (let index = 0 ; index < pendingMessages.length ; ++index) {
      const message = pendingMessages[index];
      if (message) {
        send(message);
      }
    }
  }

  onCreate && onCreate(ws, send);

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

      case 'interfaceAction':
        host.cast('interfaceAction', message.payload);
        break;
    }
  }, function (_, send) {
    host.wsSend = function (message) {
      send(message);
    };
  });
};
