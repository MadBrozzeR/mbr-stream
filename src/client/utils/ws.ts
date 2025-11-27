import type { Host } from '../splux-host.js';
import type { Notification } from '../type';
import { firstMessage } from './notification-utils';
import { isEventType } from './utils';

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

  return handler;
}

export const startWebSocket = (function () {
  let status: 'idle' | 'running' | 'disabled' | 'connecting' = 'idle';

  return function (host: Host) {
    if (status !== 'idle') {
      return;
    }

    status = 'connecting';

    host.getConfig().then(function (config) {
      if (config && config.startChat) {
        wsConnect('wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30', function (message) {
          if (isEventType(message, 'channel.chat.message')) {
            host.appendMessage(message.event);

            if (firstMessage.check(message.event.chatter_user_id)) {
              host.pushNotification({ text: message.event.message.text, audio: 'amethyst-break1.ogg' });
            }
          } else if (isEventType(message, 'channel.follow')) {
            host.pushNotification({ text: `${message.event.user_name} is now FOLLOWING my channel!!!`, audio: 'witch-ambient1.ogg' });
          } else if (isEventType(message, 'channel.subscribe')) {
            // host.pushNotification(message);
            host.pushNotification({ text: `${message.event.user_name} is now SUBSCRIBED to my channel!!!`, audio: 'witch-ambient1.ogg' });
          }
        });
        status = 'running';
      } else {
        status = 'disabled';
      }
    });
  };
})();
