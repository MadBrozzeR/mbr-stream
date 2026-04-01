import { Splux } from './lib-ref/splux';
import { newHost } from './splux-host';
import { Audio } from './components/basic/audio';
import { urlState } from './utils/url-state';
import { createCast, isCast } from './utils/broadcaster';
import { useModuleManager } from './utils/utils';
import { startWebSocket } from './utils/ws';
import { setDragger } from './utils/dragger';
import { appendMoverShowListeners } from './components/basic/mover-controls';

import { ChatBox } from './components/modules/chat-box';
import { NotificationBox } from './components/modules/notification-box';
import { Frame } from './components/modules/frame';
import { Countdown } from './components/modules/countdown';
import { StreamInfo } from './components/modules/stream-info';
import { EventLog } from './components/modules/event-log';
import { ChatBot } from './components/modules/chat-bot';
import { ChatterList } from './components/modules/chatter-list';
import { Reactions } from './components/modules/reactions';

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

const KEY_CODE_CTRL = 17;

Splux.start(function (body, head) {
  const host = this.host;
  head.dom(host.styles.target);
  host.styles.add('main', STYLES);
  host.cast = function (type, payload) {
    body.broadcast(createCast(type, payload));
  };
  startWebSocket(host);
  host.dragger = setDragger(this);

  const moduleManager = this.dom('div.page_content', function (manager) {
    this.dom(Audio);

    appendMoverShowListeners(this, KEY_CODE_CTRL);

    host.getModulePosition = function (module) {
      const pageRect = manager.node.getBoundingClientRect();
      const moduleRect = module.node.getBoundingClientRect();

      return {
        top: moduleRect.top,
        left: moduleRect.left,
        bottom: pageRect.bottom - moduleRect.bottom,
        right: pageRect.right - moduleRect.right,
        width: moduleRect.right - moduleRect.left,
        height: moduleRect.bottom - moduleRect.top,
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
      host.state.streamList.put(cast.payload.info);
    }
  });
}, newHost());

