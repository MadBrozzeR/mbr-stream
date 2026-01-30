import { Splux } from './lib-ref/splux';
import { newHost } from './splux-host';
import { ChatBox } from './components/chat-box';
import { NotificationBox } from './components/notification-box';
import { Audio } from './components/audio';
import { urlState } from './utils/url-state';
import { createCast } from './utils/broadcaster';
import { useModuleManager } from './utils/utils';
import { Frame } from './components/frame';
import { Countdown } from './components/countdown';
import { startWebSocket } from './utils/ws';
import { StreamInfo } from './components/stream-info';
import { EventLog } from './components/event-log';
import { ChatBot } from './components/chat-bot';

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
  };
  startWebSocket(host);

  const moduleManager = this.dom('div.page_content', function () {
    this.dom(Audio);

    return useModuleManager(this, {
      chat: ChatBox,
      notifications: NotificationBox,
      frame: Frame,
      counter: Countdown,
      streamInfo: StreamInfo,
      events: EventLog,
      chatBot: ChatBot,
    });
  });

  host.send({ action: 'get-stream-info' }).then(function (data) {
    host.state.streamInfo.set(data);
  }).catch(console.log);

  urlState.listen(function (data) {
    moduleManager(data);
    host.cast('hashStateChange', data);
  });
}, newHost());

