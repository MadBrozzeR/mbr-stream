import { newComponent } from '../splux-host';
import { isCast } from '../utils/broadcaster';
import { isEventType } from '../utils/utils';
import { FollowClip } from './clips/follow';
import { LurkClip } from './clips/lurk';
import { Mover } from './mover';
import { Toolbox } from './toolbar';

const STYLES = {
  '.reactions': {
    '--wrapper': {
      height: '100%',
      display: 'flex',
      justifyContent: 'end',
    },
  },
};

type Params = {
  id: string;
};

function reactionQueue () {
  type Item = () => Promise<void>;
  const queue: Item[] = [];
  let current: Item | null = null;

  function start() {
    if (!current) {
      current = queue.shift() || null;

      current && current().then(function () {
        current = null;
        start();
      });
    }
  }

  return {
    push(item: Item) {
      queue.push(item);
      start();
    },
  };
}

export const Reactions = newComponent('div.reactions', function (_, { id }: Params) {
  this.host.styles.add('reactions', STYLES);
  let test = function test() {};
  const queue = reactionQueue();

  const mover = this.dom(Mover, {
    id,
    title: 'Reactions',
    component: this,
    vars: {
      left: '0',
      bottom: '0',
      width: '100%',
      height: '200px',
    },
  });

  this.dom(Toolbox, {
    items: {
      setup() {
        mover.show();
      },
      test() {
        test();
      },
    }
  }).dom('div.reactions--wrapper', function () {
    const lurkClip = this.dom(LurkClip);
    const followClip = this.dom(FollowClip);

    test = function () {
      queue.push(function () {
        return lurkClip.play('Someone_special');
      });
    };

    this.tuneIn(function (data) {
      if (isCast('eventSubEvent', data)) {
        const command = data.payload.command;

        if (command) {
          switch (command.cmd) {
            case '!lurk':
              queue.push(function () {
                return lurkClip.play(data.payload.user && data.payload.user.name || '');
              });
              break;
            case '!follow':
              queue.push(function () {
                return followClip.play(data.payload.user && data.payload.user.name || '');
              });
              break;
          }
        } else if (isEventType(data.payload.event, 'channel.follow')) {
          const name = data.payload.event.event.user_name;
          queue.push(function () {
            return followClip.play(name)
          });
        }
      }
    });
  });
});
