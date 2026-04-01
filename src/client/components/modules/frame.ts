import { newComponent } from '/@client/splux-host';
import { FrameSvg } from '/@client/svg/frame.svg';
import { ModuleBox } from '../basic/module-box';

type Props = {
  id: string;
};

export const Frame = newComponent('div.frame', function (_, { id }: Props) {
  const frameSvg = FrameSvg({ width: 400, height: 300 });
  function set(values: Record<string, string>) {
    const width = values['width'] && parseInt(values['width'], 10) || undefined;
    const height = values['height'] && parseInt(values['height'], 10) || undefined;
    const type = values['type'];
    frameSvg.set({ width, height, type });
  }

  this.dom(ModuleBox, {
    id,
    title: 'Frame',
    component: this,
    vars: {
      width: '200px',
      height: '160px',
      bottom: '20px',
      right: '20px',
      type: 'transparent_orange',
    },
    onPreview(values) {
      set(values);
    },
    onSetupChange: set,
  }).node.appendChild(frameSvg.splux.node);

  set({ width: '200px', height: '160px' });
});
