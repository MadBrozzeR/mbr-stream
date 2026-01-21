import { newComponent } from '../splux-host';
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
  },
};

type LogEntryParams = {
  user: string;
  message: string;
  userColor?: string;
};

export const LogEntry = newComponent('div.event_log--entry', function (
  entry,
  { user, message, userColor }: LogEntryParams
) {
  const name = entry.dom('span.event_log--entry_name').params({ innerText: user });
  entry.dom('span').params({ innerText: ': ' });
  entry.dom('span').params({ innerText: message });

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
      append({ user: 'testMessage', message: 'Message text, that is not too short, but still not too long' });
    },
    move() { mover.show() },
  } }).dom('div.event_log--log', function (log) {
    append = function (params) {
      log.dom(LogEntry, params);
      log.node.scrollTo(0, log.node.scrollHeight);
    };
  });
});
