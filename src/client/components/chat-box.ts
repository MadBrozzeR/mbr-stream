import { newComponent } from '../splux-host';
import type { EventPayloadData } from '../type';
import { isCast } from '../utils/broadcaster';
import { Mover } from './mover';
import { Toolbox } from './toolbar';

type Props = {
  id: string;
};

const TIMEOUT = 20000;

const TEST_MODE: { isActive: boolean, message: EventPayloadData['channel.chat.message'] } = {
  isActive: true,
  message: {
    broadcaster_user_id: '',
    broadcaster_user_login: '',
    broadcaster_user_name: '',
    chatter_user_id: '',
    chatter_user_login: '',
    chatter_user_name: 'chatter',
    message_id: '',
    message_type: 'text',
    message: {
      text: 'Message text, that is not too short, but still not too long',
      fragments: [],
    },
    badges: [],
    source_broadcaster_user_id: '',
    source_broadcaster_user_login: '',
    source_broadcaster_user_name: '',
    source_message_id: '',
    color: '',
    channel_points_custom_reward_id: '',
  },
};

const STYLES = {
  '.chatbox': {
    '--wrapper': {
      position: 'relative',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
    },

    '--log': {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
    },

    '--entry': {
      lineHeight: '24px',
      fontSize: '20px',
      padding: '2px',
      backgroundColor: 'rgba(0, 0, 12, 0.2)',
      textShadow: '-1px -1px black, 1px -1px black, -1px 1px black, 1px 1px black',
      color: 'white',

      '-dim': {
        opacity: '0.5',
        transition: '.5s opacity ease-in-out',
      },

      '_name': {
        color: 'var(--color, white)',
      },
    },
  },
};

const ChatEntry = newComponent('div.chatbox--entry', function (
  entry,
  { messageEvent }: { messageEvent: EventPayloadData['channel.chat.message']}
) {
  const name = entry.dom('span.chatbox--entry_name').params({ innerText: messageEvent.chatter_user_name });
  entry.dom('span').params({ innerText: ': ' });
  entry.dom('span').params({ innerText: messageEvent.message.text });

  if (messageEvent.color) {
    name.node.style.setProperty('--color', messageEvent.color);
  }

  setTimeout(function () {
    entry.node.classList.add('chatbox--entry-dim');
  }, TIMEOUT);
});

export const ChatBox = newComponent('div.chatbox', function (_box, { id }: Props) {
  const host = this.host;
  host.styles.add('chat', STYLES);

  let clear = function () {};

  const mover = this.dom(Mover, {
    component: this,
    id,
    title: 'Chat',
    vars: {
      width: '50%',
      height: '20%',
      bottom: '20px',
      left: '20px',
    },
  });

  this.dom(Toolbox, { items: {
    test() { host.appendMessage(TEST_MODE.message) },
    clear() { clear() },
    move() { mover.show() },
  } }).dom('div.chatbox--wrapper', function () {
    this.dom('div.chatbox--log', function (log) {
      clear = function () { log.clear() };

      this.tuneIn(function (data) {
        if (isCast('chatMessage', data)) {
          log.dom(ChatEntry, { messageEvent: data.payload });
        }
      });
    });
  });
});
