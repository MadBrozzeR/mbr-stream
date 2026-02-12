import { ComponentParams, newComponent } from '../splux-host';
import { Mover, MoverControls } from './mover';
import { Toolbox } from './toolbar';

type MoverParams = ComponentParams<typeof Mover>;
type ToolboxParams = ComponentParams<typeof Toolbox>;

type Params = {
  component: MoverParams['component'];
  id: MoverParams['id'];
  title?: MoverParams['title'];
  vars?: MoverParams['vars'];
  onSetupChange?: MoverParams['onSetupChange'];
  toolbarItems?: ToolboxParams['items'];
  toolbarPosition?: ToolboxParams['position'];
};

export const ModuleBox = newComponent(`${Toolbox.tag || 'div'}.module_box`, function (_, params: Params) {
  const mover = this.dom(Mover, {
    component: params.component,
    id: params.id,
    title: params.title,
    vars: params.vars,
    onSetupChange: function (values) {
      params.onSetupChange && params.onSetupChange(values);
      moverControls(values);
    },
  });

  const toolbox = Toolbox.call(this, this, {
    position: params.toolbarPosition,
    items: Object.assign({}, params.toolbarItems, {
      setup() { mover.show() },
    }),
  });

  const moverControls = this.dom(MoverControls, {
    onChange(props) {
      mover.apply(props);
    }
  });

  return toolbox;
});
