import { newComponent } from '../splux-host';
import { Mover } from './mover';
import { Toolbox } from './toolbar';

type Props = {
  id: string;
};

const STYLES = {};

export const Countdown = newComponent('div.countdown', function (_div, { id }: Props) {
  const { host } = this;
  host.styles.add('countdown', STYLES);

  const mover = this.dom(Mover, {
    component: this,
    id,
    title: 'Countdown',
    vars: {
      top: '20px',
      left: '20px',
      width: '400px',
      height: '60px',
    },
  });

  this.dom(Toolbox, { items: {
    move() {
      mover.show();
    },
  } }).dom('div.countdown--content', function () {});
});
