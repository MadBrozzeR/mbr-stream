import type { Host } from '../splux-host';
import type { WSEvents, WSIncomeEvent } from '@common-types/ws-events';
import { getDashName } from './utils';
import { urlState } from './url-state';
import { Timer2 } from './timer';

// const WS_URL = 'wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30';
const WS_URL = 'ws://localhost:8922/ws';
const KEEP_ALIVE_TIME = 60000;

export function wsConnect (
  url: string,
  handler: (wsEvent: WSEvents) => void,
  onCreate?: (ws: WebSocket, send: (message: WSIncomeEvent) => void) => void,
  onConnect?: () => void,
  onClose?: () => void
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
  ws.onclose = function (event) {
    console.log('close', event);
    onClose && onClose();
    wsConnect(url, handler, onCreate, onConnect, onClose);
  };
  ws.onopen = function () {
    isConnected = true;
    for (let index = 0 ; index < pendingMessages.length ; ++index) {
      const message = pendingMessages[index];
      if (message) {
        send(message);
      }
    }
    onConnect && onConnect();
  }
  ws.onerror = function (event) {
    console.log(event);
  }

  onCreate && onCreate(ws, send);

  return handler;
}

export const startWebSocket = function (host: Host) {
  const keepAliveTimer = new Timer2(function () {
    host.state.wsStatus.set(false);
  });

  wsConnect(WS_URL + `?dash=${getDashName()}`, function (message) {
    host.state.wsStatus.set(true);
    keepAliveTimer.set(KEEP_ALIVE_TIME);

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

      case 'info':
        host.cast('info', message.payload);
        break;

      case 'moduleSetup':
        urlState.set(message.payload.module, message.payload.setup);
        break;

      case 'showClip':
        host.cast('showClip', message.payload);
        break;

      case 'getStreams':
        host.cast('getStreams', message.payload);
        break;

      case 'broadcast':
        host.cast('broadcast', message.payload);
        break;
    }
  }, function (_, send) {
    host.wsSend = function (message) {
      send(message);
    };
  }, function () {
    host.state.wsStatus.set(true);
    keepAliveTimer.set(KEEP_ALIVE_TIME);
  }, function () {
    host.state.wsStatus.set(false);
    keepAliveTimer.stop();
  });
};
