import type { BadgeData } from '@common-types/ws-events';
import { newComponent } from '../splux-host';
import type { ChatMessageEvent, EventPayloadData } from '../type';
import { isCast } from '../utils/broadcaster';
import { changeModes, checkForAutoMessage, isDefined, isEventType } from '../utils/utils';
import { MessageRow } from './message-row';
import { UserName } from './user-name';
import { ModuleBox } from './module-box';

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
  '@keyframes fly-in': {
    from: {
      opacity: 0,
      transform: 'translateX(-100%)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0)',
    },
  },

  '.chatbox': {
    '--wrapper': {
      position: 'relative',
      height: '100%',
      width: '100%',
      overflowY: 'clip',
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

      '_separator': {
        verticalAlign: 'middle',
      },

      '_content': {
        animation: '0.5s fly-in ease-in-out',
      },
    },
  },
};

type ChatEntryParams = {
  user: string;
  badges: BadgeData[];
  message: string | ChatMessageEvent;
  userColor?: string;
  persistent?: boolean;
};

const ChatEntry = newComponent('div.chatbox--entry', function (
  entry,
  { user, message, userColor, badges, persistent }: ChatEntryParams
) {
  let disableAnimation = function () {};

  this.dom('div.chatbox--entry_content', function () {
    this.dom(UserName, { name: user, badges, color: userColor });

    this.dom('span.chatbox--entry_separator').params({ innerText: ': ' });
    if (typeof message === 'string') {
      this.dom('span').params({ innerText: message });
    } else {
      const messageRow = this.dom(MessageRow, { message });
      disableAnimation = function () {
        messageRow.setAnimation('static');
      };
    }
  });

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

  this.dom(ModuleBox, {
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
    toolbarItems: {
      test() { append({
        user: TEST_MODE.message.chatter_user_name,
        badges: [],
        message: TEST_MODE.message.message,
        userColor: TEST_MODE.message.color,
      }) },
      clear() { clear(); host.send({ action: 'clear-all-chats' }); },
    }
  }).dom('div.chatbox--wrapper', function () {
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
      if (isEventType(data.payload.event, 'channel.chat.message') && events.message) {
        const isAutoMessage = checkForAutoMessage(data.payload.event.event, host.state.streamInfo.state);
        if (!isAutoMessage) {
          append({
            user: data.payload.event.event.chatter_user_name,
            badges: data.payload.badges,
            message: data.payload.event.event.message,
            userColor: data.payload.event.event.color,
          });
        }
      } else if (isEventType(data.payload.event, 'channel.follow') && events.follow) {
        append({
          user: '[INFO]',
          badges: [],
          message: `${data.payload.event.event.user_name} is now FOLLOWING!`,
        });
      } else if (isEventType(data.payload.event, 'channel.subscribe') && events.subscribe) {
        append({
          user: '[INFO]',
          badges: [],
          message: `${data.payload.event.event.user_name} is now SUBSCRIBED!`,
        });
      } else if (isEventType(data.payload.event, 'channel.raid') && events.raid) {
        append({
          user: '[INFO]',
          badges: [],
          message: `${data.payload.event.event.from_broadcaster_user_name} RAIDED your stream!` +
            ` (${data.payload.event.event.viewers} viewers)`,
        });
      }
    }
  });
});
