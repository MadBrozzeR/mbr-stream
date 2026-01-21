import { newComponent } from '../splux-host';
import type { ChatMessageEvent } from '../type';
import { isCast } from '../utils/broadcaster';
import { isEventType } from '../utils/utils';
import { MessageRow } from './message-row';
import { Mover } from './mover';
import { Toolbox } from './toolbar';

type Params = {
  id: string;
};

const STYLES = {
  '.event_log': {
    '--log': {
      height: '100%',
      overflow: 'auto',
    },

    '--entry_name': {
      lineHeight: '1em',
      verticalAlign: 'middle',
      color: 'var(--color, inherit)',
    },

    '--entry_separator': {
      lineHeight: '1em',
      verticalAlign: 'middle',
    },

    '--entry_text': {
      lineHeight: '1em',
      verticalAlign: 'middle',
    },
  },
};

const TEST_MESSAGE: ChatMessageEvent['message'] = {
  text: 'Message text, that is not too short, but still not too long',
  fragments: [{"type":"text","text":"3 emoji ","cheermote":null,"emote":null,"mention":null},{"type":"emote","text":"PopNemo","cheermote":null,"emote":{"id":"emotesv2_5d523adb8bbb4786821cd7091e47da21","emote_set_id":"0","owner_id":"0","format":["static","animated"]},"mention":null},{"type":"text","text":" ya-ya ","cheermote":null,"emote":null,"mention":null},{"type":"emote","text":"SirSword","cheermote":null,"emote":{"id":"301544922","emote_set_id":"300374282","owner_id":"139075904","format":["static"]},"mention":null}],
};

type LogEntryParams = {
  user: string;
  message: string | ChatMessageEvent['message'];
  userColor?: string;
};

export const LogEntry = newComponent('div.event_log--entry', function (
  entry,
  { user, message, userColor }: LogEntryParams
) {
  const name = entry.dom('span.event_log--entry_name').params({ innerText: user });
  entry.dom('span.event_log--entry_separator').params({ innerText: ': ' });
  if (typeof message === 'string') {
    entry.dom('span.event_log--entry_text').params({ innerText: message });
  } else {
    entry.dom(MessageRow, { message });
  }

  if (userColor) {
    name.node.style.setProperty('--color', userColor);
  }
});

export const EventLog = newComponent('div.event_log', function (_, { id }: Params) {
  const host = this.host;
  host.styles.add('event-log', STYLES);

  let append = function (params: LogEntryParams) { console.log(params) };

  const mover = this.dom(Mover, {
    component: this,
    id,
    title: 'Event Log',
    vars: {
      width: '100%',
      height: '90%',
      bottom: '0',
      left: '0',
    },
  });

  this.dom(Toolbox, { items: {
    test() {
      append({ user: 'testMessage', message: TEST_MESSAGE});
    },
    move() { mover.show() },
  } }).dom('div.event_log--log', function (log) {
    append = function (params) {
      log.dom(LogEntry, params);
      log.node.scrollTo(0, log.node.scrollHeight);
    };
  });

  this.tuneIn(function (data) {
    if (isCast('eventSubEvent', data)) {
      if (isEventType(data.payload, 'channel.chat.message')) {
        append({
          user: data.payload.event.chatter_user_name,
          message: data.payload.event.message,
          userColor: data.payload.event.color,
        });
      } else if (isEventType(data.payload, 'channel.follow')) {
        append({
          user: '[INFO]',
          message: `${data.payload.event.user_name} is now FOLLOWING!`,
        });
      } else if (isEventType(data.payload, 'channel.subscribe')) {
        append({
          user: '[INFO]',
          message: `${data.payload.event.user_name} is now SUBSCRIBED!`,
        });
      } else if (isEventType(data.payload, 'channel.raid')) {
        append({
          user: '[INFO]',
          message: `${data.payload.event.from_broadcaster_user_name} RAIDED your stream!` +
            ` (${data.payload.event.viewers} viewers)`,
        });
      }
    }
  });
});
