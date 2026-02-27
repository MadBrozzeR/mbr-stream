import { MadSocket, MadSocketClient, ClientConnection } from 'madsocket';
import { Logger } from 'mbr-logger';
import { config } from './config';
import { subscribe } from './api-wrappers';
import { Request } from 'mbr-serv-request';
import type { EventSubMessageMap } from './common-types/eventsub-types';
import { isEventSubMessageType } from './utils';
import type { WSEvents, WSIncomeEvent } from './common-types/ws-events';
import { List } from './list';

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
  callback: () => void;

  constructor(callback: () => void = function () {}) {
    this.callback = callback;
  }

  set(timeout?: number) {
    const timer = this;

    if (timeout !== undefined) {
      this.timeout = timeout;
    }

    this.stop();
    if (this.timeout) {
      this.ref = setTimeout(function () {
        timer.stop();
        timer.callback();
      }, this.timeout);
    }
  }

  stop() {
    this.ref && clearTimeout(this.ref);
    this.ref = null;
  }

  isActive() {
    return !!this.ref;
  }
}

const RECONNECT_ON_ERROR_DELAY = 60000;

export const startWSClient = function (callback: (message: EventSubMessageMap[keyof EventSubMessageMap]) => void) {
  let sessionId = '';
  const history: any[] = [];
  const idleTimer = new Timer(function () {
    console.log('Socket is idle for too long; reconnection attempt');
    wsClient?.connect();
  });
  const reconnectionTimer = new Timer(function () {
    wsClient?.connect();
  });

  const wsClient = config.startChat ? new MadSocketClient({
    connect() {
      console.log('Connected to twitch Server');
    },

    error(error) {
      if (error.message.indexOf('429') > -1) {
        console.log(`Connected ended with status 429. Recconnecting in ${RECONNECT_ON_ERROR_DELAY / 1000}s`);
        reconnectionTimer.set(RECONNECT_ON_ERROR_DELAY);
      }
    },

    disconnect() {
      console.log('Connection is closed');
      idleTimer.stop();
      if (!reconnectionTimer.isActive()) {
        this.connect();
      }
    },

    async message(data) {
      const dataString = data.toString();
      log(dataString);
      idleTimer.set();

      try {
        const message: EventSubMessageMap[keyof EventSubMessageMap] = JSON.parse(dataString);

        if (isEventSubMessageType(message, 'session_welcome')) {
          sessionId = message.payload.session.id;
          if (message.payload.session.keepalive_timeout_seconds) {
            idleTimer.set(message.payload.session.keepalive_timeout_seconds * 1500);
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

  return wsClient;
}

type Client = {
  info: { name: string };
  socket: ClientConnection;
};

function removeClient(clients: List<Client>, socket: ClientConnection) {
  clients.remove(function (client) {
    if (client.socket === socket) {
      console.log(`Client ${client.info.name} disconnected`);
      return true;
    };

    return false;
  });
}

function getClientNames (clients: List<Client>) {
  let names = '';

  clients.iterate(function ({ info: { name } }) {
    names += names ? `, ${name}` : name;
  });

  return names;
}

const DASH_NAME_RE = /dash=([^&]+)/;

type SendConditions = {
  name?: string;
};

export function startWSServer () {
  type Listener = (this: ReturnType<typeof startWSServer>, event: WSIncomeEvent) => void;

  const clients = new List<Client>();
  const listeners = new List<Listener>();

  setInterval(function () {
    ifc.sendData({ type: 'keepalive', payload: {} })
  }, 45000);

  const ws = new MadSocket({
    connect() {
      const client = this;

      const dashNameMatch = DASH_NAME_RE.exec(client.request.url || '');
      const name = dashNameMatch && dashNameMatch[1] || 'unknown';

      clients.add({
        info: { name },
        socket: client,
      });

      console.log(`Client ${name} has connected`);
      console.log(`Currently connected: ${getClientNames(clients)}`);
    },
    disconnect() {
      removeClient(clients, this)
    },
    message(messageData) {
      const message: WSIncomeEvent = JSON.parse(messageData.toString());
      console.log('WS Client -> Server:', message);

      listeners.iterate(function (listener) {
        listener.call(ifc, message);
      });
    }
  }, { debug: console.log });

  const ifc = {
    attach(request: Request) {
      ws.leech(request.request, request.response);
    },
    send(message: string, conditions?: SendConditions) {
      clients.iterate(function (client) {
        if (conditions && conditions.name && conditions.name !== client.info.name) {
          return;
        }

        client.socket.send(message).catch(function () {
          removeClient(clients, client.socket);
        });
      });
    },
    sendData(data: WSEvents, conditions?: SendConditions) {
      console.log('WS Server -> Client:', data);
      this.send(JSON.stringify(data), conditions);
    },
    listen(listener: Listener) {
      listeners.add(listener);
    },
  };

  return ifc;
}
