import { MadSocket, MadSocketClient, ClientConnection } from 'madsocket';
import { Logger } from 'mbr-logger';
import { config } from './config';
import { subscribe } from './api-wrappers';
import { Request } from 'mbr-serv-request';
import { EventSubMessageMap } from './common-types/eventsub-types';
import { isEventSubMessageType } from './utils';

const EVENTSUB_URL = 'wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30';

const logger = new Logger(config.eventSubLog, {
  listeners: {
    error: console.log,
    fallback: console.log,
  }
});

function log(message: string) {
  logger.put(`[${new Date().toJSON()}]${message}`)
}

class Timer {
  ref: ReturnType<typeof setTimeout> | null = null;
  timeout = 0;
  callback: () => void = function () {};

  set(timeout?: number) {
    if (timeout !== undefined) {
      this.timeout = timeout;
    }
    this.stop();
    if (this.timeout) {
      this.ref = setTimeout(this.callback, this.timeout);
    }
  }

  stop() {
    this.ref && clearTimeout(this.ref);
  }
}

export const startWSClient = function (callback: (message: EventSubMessageMap[keyof EventSubMessageMap]) => void) {
  let sessionId = '';
  const history: any[] = [];
  const timer = new Timer();

  const wsClient = config.startChat ? new MadSocketClient({
    connect() {
      console.log('Connected to twitch Server');
    },

    disconnect() {
      console.log('Connection is closed');
      timer.stop();
      this.connect();
    },

    async message(data) {
      const dataString = data.toString();
      log(dataString);
      timer.set();

      try {
        const message: EventSubMessageMap[keyof EventSubMessageMap] = JSON.parse(dataString);

        if (isEventSubMessageType(message, 'session_welcome')) {
          sessionId = message.payload.session.id;
          if (message.payload.session.keepalive_timeout_seconds) {
            timer.set(message.payload.session.keepalive_timeout_seconds * 1500);
          }
          subscribe(sessionId);
        }

        else if (isEventSubMessageType(message, 'session_reconnect')) {
          this.connect(message.payload.session.reconnect_url);
        }

        else if (isEventSubMessageType(message, 'notification')) {
          callback(message);
          history.push(message);
        }

        else if (isEventSubMessageType(message, 'session_keepalive')) {
          callback(message);
        }
      } catch (error) {
        console.log('WebSocket message parsing error', error);
      }
    },
  }, {
    url: EVENTSUB_URL,
    debug(type, data) {
      const info = data === undefined
        ? ''
        : data instanceof Buffer
          ? { buffer: data, text: data.toString() }
          : data;

      console.log(type, this.status, info);
    }
  }).connect() : null;

  timer.callback = function () {
    console.log('Socket is idle for too long; reconnection attempt');
    wsClient?.connect();
  }

  return wsClient;
}

export function startWSServer () {
  const clients: ClientConnection[] = [];
  const ws = new MadSocket({
    connect() {
      clients.push(this);
    },
    disconnect() {
      const index = clients.indexOf(this);
      if (index > -1) {
        clients.splice(index, 1);
      }
    },
  });

  return {
    attach(request: Request) {
      ws.leech(request.request, request.response);
    },
    send(message: string) {
      for (let index = 0 ; index < clients.length ; ++index) {
        clients[index]?.send(message);
      }
    },
    sendData(data: object) {
      this.send(JSON.stringify(data));
    },
  };
}
