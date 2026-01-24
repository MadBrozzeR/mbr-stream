import { newComponent } from '../splux-host';
import type { ChatMessageEvent, EventPayloadData } from '../type';
import { isCast } from '../utils/broadcaster';
import { changeModes, isDefined, isEventType } from '../utils/utils';
import { MessageRow } from './message-row';
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
      fragments: [{"type":"text","text":"3 emoji ","cheermote":null,"emote":null,"mention":null},{"type":"emote","text":"PopNemo","cheermote":null,"emote":{"id":"emotesv2_5d523adb8bbb4786821cd7091e47da21","emote_set_id":"0","owner_id":"0","format":["static","animated"]},"mention":null},{"type":"text","text":" ya-ya ","cheermote":null,"emote":null,"mention":null},{"type":"emote","text":"SirSword","cheermote":null,"emote":{"id":"301544922","emote_set_id":"300374282","owner_id":"139075904","format":["static"]},"mention":null}],
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
        verticalAlign: 'middle',
      },

      '_separator': {
        verticalAlign: 'middle',
      },
    },
  },
};

type ChatEntryParams = {
  user: string;
  message: string | ChatMessageEvent;
  userColor?: string;
  persistent?: boolean;
};

const ChatEntry = newComponent('div.chatbox--entry', function (
  entry,
  { user, message, userColor, persistent }: ChatEntryParams
) {
  let disableAnimation = function () {};
  const name = entry.dom('span.chatbox--entry_name').params({ innerText: user });

  entry.dom('span.chatbox--entry_separator').params({ innerText: ': ' });
  if (typeof message === 'string') {
    entry.dom('span').params({ innerText: message });
  } else {
    const messageRow = entry.dom(MessageRow, { message });
    disableAnimation = function () {
      messageRow.setAnimation('static');
    };
  }

  if (userColor) {
    name.node.style.setProperty('--color', userColor);
  }

  if (!persistent) {
    setTimeout(function () {
      entry.node.classList.add('chatbox--entry-dim');
      disableAnimation();
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
      message: TEST_MODE.message.message,
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
          message: data.payload.event.message,
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
