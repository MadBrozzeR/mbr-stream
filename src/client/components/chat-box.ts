import { newComponent } from '../splux-host';
import type { EventPayloadData } from '../type';
import { isCast } from '../utils/broadcaster';
import { changeModes, isDefined, isEventType } from '../utils/utils';
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

type ChatEntryParams = {
  user: string;
  message: string;
  userColor?: string;
  persistent?: boolean;
};

const ChatEntry = newComponent('div.chatbox--entry', function (
  entry,
  { user, message, userColor, persistent }: ChatEntryParams
) {
  const name = entry.dom('span.chatbox--entry_name').params({ innerText: user });
  entry.dom('span').params({ innerText: ': ' });
  entry.dom('span').params({ innerText: message });

  if (userColor) {
    name.node.style.setProperty('--color', userColor);
  }

  if (!persistent) {
    setTimeout(function () {
      entry.node.classList.add('chatbox--entry-dim');
    }, TIMEOUT);
  }
});

export const ChatBox = newComponent('div.chatbox', function (_box, { id }: Props) {
  const host = this.host;
  host.styles.add('chat', STYLES);

  let clear = function () {};
  let append = function (params: Omit<ChatEntryParams, 'persistent'>) { console.log(params) };

  const events = {
    message: false,
    follow: false,
    subscribe: false,
    raid: false,
    persistent: false,
  };

  const mover = this.dom(Mover, {
    component: this,
    id,
    title: 'Chat',
    vars: {
      width: '50%',
      height: '20%',
      bottom: '20px',
      left: '20px',
      events: 'message',
    },
    onSetupChange(settings) {
      if (isDefined(settings['events'])) {
        changeModes(events, settings['events']);
      }
    },
  });

  this.dom(Toolbox, { items: {
    test() { append({
      user: TEST_MODE.message.chatter_user_name,
      message: TEST_MODE.message.message.text,
      userColor: TEST_MODE.message.color,
    }) },
    clear() { clear(); host.send({ action: 'clear-all-chats' }); },
    move() { mover.show() },
  } }).dom('div.chatbox--wrapper', function () {
    this.dom('div.chatbox--log', function (log) {
      clear = function () { log.clear() };
      append = function (params) { log.dom(ChatEntry, { ...params, persistent: events.persistent }) };
    });
  });

  this.tuneIn(function (data) {
    if (isCast('interfaceAction', data)) {
      if (data.payload === 'chat-clear') {
        clear();
      }
    } else if (isCast('eventSubEvent', data)) {
      if (isEventType(data.payload, 'channel.chat.message') && events.message) {
        append({
          user: data.payload.event.chatter_user_name,
          message: data.payload.event.message.text,
          userColor: data.payload.event.color,
        });
      } else if (isEventType(data.payload, 'channel.follow') && events.follow) {
        append({
          user: '[INFO]',
          message: `${data.payload.event.user_name} is now FOLLOWING!`,
        });
      } else if (isEventType(data.payload, 'channel.subscribe') && events.subscribe) {
        append({
          user: '[INFO]',
          message: `${data.payload.event.user_name} is now SUBSCRIBED!`,
        });
      } else if (isEventType(data.payload, 'channel.raid') && events.raid) {
        append({
          user: '[INFO]',
          message: `${data.payload.event.from_broadcaster_user_name} RAIDED your stream!` +
            ` (${data.payload.event.viewers} viewers)`,
        });
      }
    }
  });
});
