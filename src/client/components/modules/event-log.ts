import type { BadgeData } from '@common-types/ws-events';
import { ComponentParams, Host, newComponent } from '/@client/splux-host';
import type { ChatMessageEvent } from '/@client/type';
import { isCast } from '/@client/utils/broadcaster';
import { isEventType, isKeyOf } from '/@client/utils/utils';
import { MessageRow } from '../basic/message-row';
import { UserInfo, UserName } from '../basic/user-name';
import { ModuleBox } from '../basic/module-box';
import { UserModal } from '../basic/user-modal';
import { ComponentSplux } from '/@client/lib-ref/splux';
import { Splux } from 'splux';
import { CHECKMARK_1_HEAVY, CROSS_1_HEAVY } from '/@client/constants';

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

    '--entry_moderator': {
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

    '--entry-striked': {
      ' .user_name': {
        textDecoration: 'line-through',
      },
      ' .event_log--entry_text': {
        textDecoration: 'line-through',
      },
      ' .message_row': {
        textDecoration: 'line-through',
      },
    },

    '--entry_actions': {
      verticalAlign: 'middle',
      display: 'inline-block',
      marginRight: '2px',
    },

    '--action': {
      ':before': {
        display: 'block',
        lineHeight: '1em',
        textAlign: 'center',
        color: 'white',
      },

      display: 'inline-block',
      width: '1em',
      height: '1em',
      borderRadius: '2px',
      margin: '2px',
      cursor: 'pointer',

      '_reward_fulfill': {
        ':before': {
          content: '"' + CHECKMARK_1_HEAVY + '"',
        },

        backgroundColor: '#00aa00',
      },

      '_reward_cancel': {
        ':before': {
          content: '"' + CROSS_1_HEAVY + '"',
        },

        backgroundColor: '#aa0000',
      },

      '_remove_message': {
        ':before': {
          content: '"' + CROSS_1_HEAVY + '"',
        },

        backgroundColor: '#aa0000',
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

type EventActionPayload = {
  rewardFulfill: { id: string; reward_id: string; };
  rewardCancel: { id: string; reward_id: string; };
  removeMessage: { id: string };
};

type EventActionConfig<K extends keyof EventActionPayload> = {
  className: string;
  action: (host: Host, data: EventActionPayload[K]) => void;
};

const ACTIONS: { [K in keyof EventActionPayload]: EventActionConfig<K> } = {
  rewardFulfill: {
    className: 'event_log--action_reward_fulfill',
    action(host, data) {
      host.send({
        action: 'update-custom-reward-redemption',
        payload: { reward_id: data.reward_id, id: data.id, status: 'FULFILLED' },
      });
    },
  },
  rewardCancel: {
    className: 'event_log--action_reward_cancel',
    action(host, data) {
      host.send({
        action: 'update-custom-reward-redemption',
        payload: { reward_id: data.reward_id, id: data.id, status: 'CANCELED' },
      });
    },
  },
  removeMessage: {
    className: 'event_log--action_remove_message',
    action(host, data) {
      host.send({
        action: 'remove-message',
        payload: { id: data.id },
      });
    },
  },
};

type Actions = {
  [K in keyof typeof ACTIONS]?: Parameters<(typeof ACTIONS)[K]['action']>[1];
};

type LogEntryMode = {
  mode: 'string';
  node: Splux<HTMLSpanElement, Host>;
} | {
  mode: 'complex';
  node: ComponentSplux<typeof MessageRow>;
} | { mode: 'empty' };

type LogEntryParams = {
  id?: string;
  user?: string | UserInfo;
  badges?: BadgeData[];
  message: string | ChatMessageEvent;
  userColor?: string;
  onUserClick?: (user: UserInfo) => void;
  onActionClick?: <T extends keyof Actions>(type: T, data: Actions[T]) => void;
  actions?: Actions;
};

type EntryActionsParams = {
  actions: Actions;
  onClick: <T extends keyof Actions>(type: T, data: Actions[T]) => void;
};

const EntryActions = newComponent('span.event_log--entry_actions', function (_, {
  actions, onClick
}: EntryActionsParams) {
  // console.log(actions, onClick);
  for (const type in actions) {
    if (isKeyOf(type, ACTIONS) && ACTIONS[type]) {
      this.dom('span').params({
        className: 'event_log--action ' + ACTIONS[type].className,
        onclick() {
          onClick(type, actions[type]);
        },
      });
    }
  }
});

const LogEntry = newComponent('div.event_log--entry', function (
  entry,
  { user = INFO_USER, message, userColor, badges = [], onUserClick, actions, onActionClick }: LogEntryParams
) {
  const params: ComponentParams<typeof UserName> = { user, badges, color: userColor };
  if (onUserClick && typeof user !== 'string') {
    params.onClick = function () {
      onUserClick(user);
    }
  }
  if (actions && onActionClick) {
    entry.dom(EntryActions, { actions, onClick: onActionClick });
  }
  entry.dom(UserName, params);
  entry.dom('span.event_log--entry_separator').params({ innerText: ': ' });
  const messageBlock = entry.dom('span.event_log--entry_message', function (messageBlock) {
    let mode: LogEntryMode = { mode: 'empty' };

    function set(message: string | ChatMessageEvent) {
      if (typeof message === 'string') {
        if (mode.mode === 'string') {
          mode.node.node.innerText = message;
          return;
        } else if (mode.mode === 'complex') {
          mode.node.remove();
        }

        mode = {
          mode: 'string',
          node: messageBlock.dom('span.event_log--entry_text').params({ innerText: message }),
        };
      } else {
        if (mode.mode === 'complex') {
          mode.node.setText(message);
          return;
        } else if (mode.mode === 'string') {
          mode.node.remove();
        }

        mode = {
          mode: 'complex',
          node: messageBlock.dom(MessageRow, { message, scaleEmotesFor: EMOTE_SCALE_TIMEOUT }),
        };
      }
    }

    set(message);

    return {
      set,
    }
  });

  return {
    remove() {
      entry.node.classList.add('event_log--entry-striked');
    },
    update(message: LogEntryParams['message']) {
      messageBlock.set(message);
    }
  }
});

export const EventLog = newComponent('div.event_log', function (_, { id }: Params) {
  const host = this.host;
  host.styles.add('event-log', STYLES);

  const messages: Record<string, ComponentSplux<typeof LogEntry>> = {};

  let append = function (params: LogEntryParams) { console.log(params) };

  function handleAction <K extends keyof Actions>(type: K, data: Actions[K]) {
    if (data) {
      ACTIONS[type].action(host, data);
    }
  }

  function remove(id: string) {
    if (messages[id]) {
      messages[id].remove();
    }
  }

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
        const entry = log.dom(LogEntry, {
          ...params,
          onUserClick(user) { userModal.open(user) },
          onActionClick: handleAction,
        });
        params.id && (messages[params.id] = entry);
        log.node.scrollTo(0, log.node.scrollHeight);
      };
    });

    const unlistenWSState = host.state.wsStatus.listen(function (state: boolean) {
      const message = 'It feels like connection is broken. Check your server!';
      if (state) {
       notificator.remove(message);
      } else {
       notificator.add(message);
      }
    });

    this.on({
      remove() {
        unlistenWSState();
      }
    });
  });

  function update (id: string, message: string | ChatMessageEvent) {
    if (messages[id]) {
      messages[id].update(message);
      return true;
    } else {
      return false;
    }
  }

  this.tuneIn(function (data) {
    if (isCast('eventSubEvent', data)) {
      const event = data.payload.event;

      if (isEventType(event, 'channel.chat.message')) {
        append({
          id: event.event.message_id,
          user: { name: event.event.chatter_user_name, id: event.event.chatter_user_id },
          badges: data.payload.badges,
          message: event.event.message,
          userColor: event.event.color,
          actions: { removeMessage: { id: event.event.message_id } },
        });
      } else if (isEventType(event, 'channel.chat.message_delete')) {
        remove(event.event.message_id);
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
      } else if (isEventType(event, 'channel.channel_points_custom_reward_redemption.add')) {
        let message = `[${event.event.status}] ${event.event.user_name} just redeemed "${event.event.reward.title}" (${event.event.reward.cost})`;
        if (event.event.user_input) {
          message += ` saying "${event.event.user_input}"`;
        }
        const actions = {
          rewardFulfill: { id: event.event.id, reward_id: event.event.reward.id },
          rewardCancel: { id: event.event.id, reward_id: event.event.reward.id },
        };
        append({ id: event.event.id, message, actions });
      } else if (isEventType(event, 'channel.channel_points_custom_reward_redemption.update')) {
        let message = `[${event.event.status}] ${event.event.user_name} just redeemed (updated) "${event.event.reward.title}" (${event.event.reward.cost})`;
        if (event.event.user_input) {
          message += ` saying "${event.event.user_input}"`;
        }
        update(event.event.id, message) || append({ message });
      } else if (isEventType(event, 'channel.channel_points_automatic_reward_redemption.add')) {
        let message = `${event.event.user_name} just redeemed "${event.event.reward.type}" (${event.event.reward.channel_points})`;
        if (event.event.message) {
          message += ` saying "${event.event.message.text}"`;
        }
        append({ message });
      } else if (isEventType(event, 'channel.custom_power_up_redemption.add')) {
        let message = `${event.event.user_name} just redeemed "${event.event.custom_power_up.title}" (${event.event.custom_power_up.bits})`;
        if (event.event.user_input) {
          message += ` saying "${event.event.user_input}"`;
        }
        append({ message });
      }
    } else if (isCast('info', data)) {
      append({
        message: data.payload,
      });
    }
  });
});
