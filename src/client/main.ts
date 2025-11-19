import { Splux } from 'splux';
import { host } from './splux-host';
import { wsConnect } from './ws';
import { Chatbox } from './chat';

const START_CHAT = true;

const STYLES = {
  'html, body': {
    margin: 0,
    height: '100%',
  },
};

Splux.start(function (_body, head) {
  const host = this.host;
  head.dom(host.styles.target);
  host.styles.add('main', STYLES);

  this.dom(Chatbox);

  if (START_CHAT) {
    wsConnect('wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30', function (message) {
      switch (message.subscription.type) {
        case 'channel.chat.message':
          host.appendMessage(message.event);
      }
    });
  }
}, host);

