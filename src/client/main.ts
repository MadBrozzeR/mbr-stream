import { Splux } from './lib-ref/splux';
import { host } from './splux-host';
import { wsConnect } from './ws';
import { ChatBox } from './components/chat-box';
import { isEventType } from './utils';

const START_CHAT = true;

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

  body.dom(ChatBox);

  if (START_CHAT) {
    wsConnect('wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30', function (message) {
      if (isEventType(message, 'channel.chat.message')) {
        host.appendMessage(message.event);
      } else if (isEventType(message, 'channel.follow', 'channel.subscribe')) {
        host.pushNotification(message);
      }
    });
  }
}, host);

