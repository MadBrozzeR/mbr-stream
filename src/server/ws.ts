import { MadSocketClient } from 'madsocket';
import { Logger } from 'mbr-logger';
import { config } from './config';
import { subscribe } from './api-wrappers';

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

export const startWSClient = function () {
  let sessionId = '';
  const history: any[] = [];

  return config.startChat ? new MadSocketClient({
    connect() {
      console.log('Connected to twitch Server');
    },

    disconnect() {
      console.log('Connection is closed');
      this.connect();
    },

    async message(data) {
      const dataString = data.toString();
      log(dataString);

      try {
        const message = JSON.parse(dataString);

        switch (message.metadata?.message_type) {
          case 'session_welcome':
            sessionId = message.payload?.session?.id || '';
            subscribe(sessionId);
            break;

          case 'session_reconnect':
            this.connect();
            break;

          case 'notification':
            console.log(dataString);
            history.push(message);
            break;
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

      console.log(type, info);
    }
  }).connect() : null;
}
