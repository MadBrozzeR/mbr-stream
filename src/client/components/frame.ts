import { newComponent } from '../splux-host';
import { FrameSvg } from '../svg/frame.svg';
import { Mover } from './mover';
import { Toolbox } from './toolbar';

type Props = {
  id: string;
};

export const Frame = newComponent('div.frame', function (_, { id }: Props) {
  const frameSvg = FrameSvg({ width: 400, height: 300 });
  function set(values: Record<string, string>) {
    const width = values['width'] && parseInt(values['width']) || 0;
    const height = values['height'] && parseInt(values['height']) || 0;
    frameSvg.set(width, height);
  }

  const mover = this.dom(Mover, {
    id,
    title: 'Frame',
    component: this,
    vars: {
      width: '200px',
      height: '160px',
      bottom: '20px',
      right: '20px',
    },
    onSetupChange: set,
  });
  this.dom(Toolbox, { items: {
    move() { mover.show() },
  } }).node.appendChild(frameSvg.splux.node);

  set({ width: '200px', height: '160px' });
});
