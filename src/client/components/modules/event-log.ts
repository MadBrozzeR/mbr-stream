import type { BadgeData } from '@common-types/ws-events';
import { ComponentParams, newComponent } from '/@client/splux-host';
import type { ChatMessageEvent } from '/@client/type';
import { isCast } from '/@client/utils/broadcaster';
import { isEventType } from '/@client/utils/utils';
import { MessageRow } from '../basic/message-row';
import { UserInfo, UserName } from '../basic/user-name';
import { ModuleBox } from '../basic/module-box';
import { UserModal } from '../basic/user-modal';

type Params = {
  id: string;
};

const STYLES = {
  '.event_log': {
    '--log_wrapper': {
      height: '100%',
      width: '100%',
      position: 'relative',
    },

    '--log': {
      height: '100%',
      overflow: 'auto',
    },

    '--entry_separator': {
      lineHeight: '1em',
      verticalAlign: 'middle',
    },

    '--entry_text': {
      lineHeight: '1em',
      verticalAlign: 'middle',
    },

    '--notification': {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#d00',
      color: 'white',
      whiteSpace: 'pre',
      padding: '4px',

      '-hidden': {
        display: 'none',
      },
    },
  },
};

const TEST_MESSAGE: ChatMessageEvent = {
  text: 'Message text, that is not too short, but still not too long',
  fragments: [{"type":"text","text":"3 emoji ","cheermote":null,"emote":null,"mention":null},{"type":"emote","text":"PopNemo","cheermote":null,"emote":{"id":"emotesv2_5d523adb8bbb4786821cd7091e47da21","emote_set_id":"0","owner_id":"0","format":["static","animated"]},"mention":null},{"type":"text","text":" ya-ya ","cheermote":null,"emote":null,"mention":null},{"type":"emote","text":"SirSword","cheermote":null,"emote":{"id":"301544922","emote_set_id":"300374282","owner_id":"139075904","format":["static"]},"mention":null}],
};

const INFO_USER = '[INFO]';
const EMOTE_SCALE_TIMEOUT = 3000;

type LogEntryParams = {
  user?: string | UserInfo;
  badges?: BadgeData[];
  message: string | ChatMessageEvent;
  userColor?: string;
  onUserClick?: (user: UserInfo) => void;
};

const LogEntry = newComponent('div.event_log--entry', function (
  entry,
  { user = INFO_USER, message, userColor, badges = [], onUserClick }: LogEntryParams
) {
  const params: ComponentParams<typeof UserName> = { user, badges, color: userColor };
  if (onUserClick && typeof user !== 'string') {
    params.onClick = function () {
      onUserClick(user);
    }
  }
  entry.dom(UserName, params);
  entry.dom('span.event_log--entry_separator').params({ innerText: ': ' });
  if (typeof message === 'string') {
    entry.dom('span.event_log--entry_text').params({ innerText: message });
  } else {
    entry.dom(MessageRow, { message, scaleEmotesFor: EMOTE_SCALE_TIMEOUT });
  }
});

export const EventLog = newComponent('div.event_log', function (_, { id }: Params) {
  const host = this.host;
  host.styles.add('event-log', STYLES);

  let append = function (params: LogEntryParams) { console.log(params) };

  this.dom(ModuleBox, {
    component: this,
    id,
    title: 'Event Log',
    vars: {
      width: '100%',
      height: '90%',
      bottom: '0',
      left: '0',
    },
    toolbarItems: {
      test() {
        append({ user: 'testMessage', message: TEST_MESSAGE });
      },
    },
  }).dom('div.event_log--log_wrapper', function () {
    const userModal = this.dom(UserModal);

    const notificator = this.dom('div.event_log--notification.event_log--notification-hidden', function (notification) {
      const currentNotifications: string[] = [];

      function update () {
        if (currentNotifications.length) {
          notification.node.innerText = currentNotifications.join('\n');
          notification.node.classList.remove('event_log--notification-hidden');
        } else {
          notification.node.classList.add('event_log--notification-hidden');
        }
      }

      function add (message: string) {
        if (currentNotifications.indexOf(message) === -1) {
          currentNotifications.push(message);
          update();
        }
      }

      function remove (message: string) {
        const messageIndex = currentNotifications.indexOf(message);
        if (messageIndex > -1) {
          currentNotifications.splice(messageIndex, 1);
          update();
        }
      }

      return { add, remove };
    });

    this.dom('div.event_log--log', function (log) {
      append = function (params) {
        log.dom(LogEntry, { ...params, onUserClick(user) { userModal.open(user) } });
        log.node.scrollTo(0, log.node.scrollHeight);
      };
    });

    function wsStateListener (state: boolean) {
      const message = 'It feels like connection is broken. Check your server!';
      if (state) {
       notificator.remove(message);
      } else {
       notificator.add(message);
      }
    }

    host.state.wsStatus.listen(wsStateListener);

    this.on({
      remove() {
        host.state.wsStatus.unlisten(wsStateListener);
      }
    });
  });


  this.tuneIn(function (data) {
    if (isCast('eventSubEvent', data)) {
      const event = data.payload.event;

      if (isEventType(event, 'channel.chat.message')) {
        append({
          user: { name: event.event.chatter_user_name, id: event.event.chatter_user_id },
          badges: data.payload.badges,
          message: event.event.message,
          userColor: event.event.color,
        });
      } else if (isEventType(event, 'channel.follow')) {
        append({
          message: `${event.event.user_name} is now FOLLOWING!`,
        });
      } else if (isEventType(event, 'channel.subscribe')) {
        append({
          message: `${event.event.user_name} is now SUBSCRIBED!`,
        });
      } else if (isEventType(event, 'channel.raid')) {
        append({
          message: `${event.event.from_broadcaster_user_name} RAIDED your stream!` +
            ` (${event.event.viewers} viewers)`,
        });
      } else if (isEventType(event, 'channel.shoutout.receive')) {
        append({
          message:
            `${event.event.from_broadcaster_user_name} just gave you a SHOUTOUT for ${event.event.viewer_count} viewers`,
        });
      } else if (isEventType(event, 'channel.shoutout.create')) {
        append({
          message:
            `You just gave ${event.event.broadcaster_user_name} a SHOUTOUT for ${event.event.viewer_count} viewers`,
        });
      }
    } else if (isCast('info', data)) {
      append({
        message: data.payload,
      });
    }
  });
});
