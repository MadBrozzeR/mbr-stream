import { Splux } from './lib-ref/splux';
import { host } from './splux-host';
import { ChatBox } from './components/chat-box';
import { NotificationBox } from './components/notification-box';
import { Audio } from './components/audio';
import { urlState } from './utils/url-state';
import { createCast } from './utils/broadcaster';
import { useModuleManager } from './utils/utils';

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

  const moduleManager = this.dom('div.page_content', function () {
    this.dom(Audio);

    return useModuleManager(this, {
      chat: ChatBox,
      notifications: NotificationBox,
    });
  });

  urlState.listen(function (data) {
    moduleManager(data);
    host.cast('hashStateChange', data);
  });
}, host);

