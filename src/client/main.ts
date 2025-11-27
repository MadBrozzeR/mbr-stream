import { Splux } from './lib-ref/splux';
import { host } from './splux-host';
import { wsConnect } from './utils/ws';
import { ChatBox } from './components/chat-box';
import { isEventType } from './utils/utils';
import { NotificationBox } from './components/notification-box';
import { Audio } from './components/audio';
import { urlState } from './utils/url-state';
import { createCast } from './utils/broadcaster';
import { firstMessage } from './utils/notification-utils';

const STYLES = {
  'html, body': {
    margin: 0,
    height: '100%',
  },
  '.page_content': {
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
};

Splux.start(function (body, head) {
  const host = this.host;
  head.dom(host.styles.target);
  host.styles.add('main', STYLES);
  host.cast = function (type, payload) {
    body.broadcast(createCast(type, payload));
  }

  this.dom('div.page_content', function () {
    this.dom(ChatBox);
    this.dom(NotificationBox);
    this.dom(Audio);
  });

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
    }
  });

  urlState.listen(function (data) {
    host.cast('hashStateChange', data);
  });
}, host);

