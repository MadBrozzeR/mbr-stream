import { Client } from 'madsocket';
import { config } from './config';

const EVENTSUB_URL = 'wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30';

let sessionId = '';

export const wsClient = config.startChat ? Client.connect(EVENTSUB_URL, {
  message(data) {
    try {
      const message = JSON.parse(data.toString());

      switch (message.metadata?.message_type) {
        case 'session_welcome':
          sessionId = message.payload?.session?.id || '';
          sessionId;
          break;
      }
    } catch (error) {
      console.log('WebSocket message parsing error', error);
    }
  },
}) : null;
