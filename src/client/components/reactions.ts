import { newComponent } from '../splux-host';
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

export const Reactions = newComponent('div.reactions', function (_, { id }: Params) {
  this.host.styles.add('reactions', STYLES);

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
    }
  }).dom('div.reactions--wrapper', function () {
    this.dom(LurkClip);
  });
});
