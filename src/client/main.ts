import { Splux } from './lib-ref/splux';
import { host } from './splux-host';
import { wsConnect } from './ws';
import { ChatBox } from './components/chat-box';
import { isEventType } from './utils';
import { NotificationBox } from './components/notification-box';
import { Audio } from './components/audio';
import { urlState } from './url-state';
import { createCast } from './broadcaster';

const STYLES = {
  'html, body': {
    margin: 0,
    height: '100%',
    overflow: 'hidden',
  },
};

Splux.start(function (body, head) {
  const host = this.host;
  head.dom(host.styles.target);
  host.styles.add('main', STYLES);
  host.cast = function (type, payload) {
    body.broadcast(createCast(type, payload));
  }

  body.dom(ChatBox);
  body.dom(NotificationBox);
  body.dom(Audio);

  host.getConfig().then(function (config) {
    if (config && config.startChat) {
      wsConnect('wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30', function (message) {
        if (isEventType(message, 'channel.chat.message')) {
          host.appendMessage(message.event);
          host.pushNotification({ text: message.event.message.text, audio: 'amethyst-break1.ogg' });
        } else if (isEventType(message, 'channel.follow')) {
          host.pushNotification({ text: `${message.event.user_name} is now FOLLOWING my channel!!!`, audio: 'witch-ambient1.ogg' });
        } else if (isEventType(message, 'channel.subscribe')) {
          // host.pushNotification(message);
          host.pushNotification({ text: `${message.event.user_name} is now SUBSCRIBED to my channel!!!`, audio: 'witch-ambient1.ogg' });
        }
      });
    }
  });

  urlState.listen(function (data) {
    host.cast('hashStateChange', data);
  });
}, host);

