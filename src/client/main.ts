import { Splux } from './lib-ref/splux';
import { newHost } from './splux-host';
import { ChatBox } from './components/chat-box';
import { NotificationBox } from './components/notification-box';
import { Audio } from './components/audio';
import { urlState } from './utils/url-state';
import { createCast, isCast } from './utils/broadcaster';
import { useModuleManager } from './utils/utils';
import { Frame } from './components/frame';
import { Countdown } from './components/countdown';
import { startWebSocket } from './utils/ws';
import { StreamInfo } from './components/stream-info';
import { EventLog } from './components/event-log';
import { ChatBot } from './components/chat-bot';
import { ChatterList } from './components/chatter-list';
import { ChromakeySvg } from './svg/chromakey.svg';
import { Reactions } from './components/reactions';

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

const CHROMAKEYS = {
  'chromakey-green1':
    '1 0 0 0 0 ' +
    '0 1 0 0 0 ' +
    '0 0 1 0 0 ' +
    '-0.5 -1 1 1 0',

  'chromakey-green':
    '1 0 0 0 0 ' +
    '0 1 0 0 0 ' +
    '0 0 1 0 0 ' +
    '0 -1 0 1 0',
};

Splux.start(function (body, head) {
  const host = this.host;
  head.dom(host.styles.target);
  host.styles.add('main', STYLES);
  host.cast = function (type, payload) {
    body.broadcast(createCast(type, payload));
  };
  startWebSocket(host);

  const moduleManager = this.dom('div.page_content', function (manager) {
    this.dom(Audio);
    this.node.appendChild(ChromakeySvg(CHROMAKEYS).node);

    host.getModulePosition = function (module) {
      const pageRect = manager.node.getBoundingClientRect();
      const moduleRect = module.node.getBoundingClientRect();

      return {
        top: moduleRect.top,
        left: moduleRect.left,
        bottom: pageRect.bottom - moduleRect.bottom,
        right: pageRect.right - moduleRect.right,
      };
    }

    return useModuleManager(this, {
      chat: ChatBox,
      notifications: NotificationBox,
      frame: Frame,
      counter: Countdown,
      streamInfo: StreamInfo,
      events: EventLog,
      chatBot: ChatBot,
      chatters: ChatterList,
      reactions: Reactions,
    });
  });

  host.send({ action: 'get-stream-info' }).then(function (data) {
    host.state.streamInfo.set(data);
  }).catch(console.log);

  urlState.listen(function (data) {
    moduleManager(data);
    host.cast('hashStateChange', data);
  });

  this.tuneIn(function (cast) {
    if (isCast('streamInfo', cast)) {
      host.state.streamInfo.set(cast.payload);
    }
  });
}, newHost());

