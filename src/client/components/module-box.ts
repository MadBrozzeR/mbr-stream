import { ComponentParams, newComponent } from '../splux-host';
import { Mover } from './mover';
import { MoverControls } from './mover-controls';
import { Toolbox } from './toolbar';

type MoverParams = ComponentParams<typeof Mover>;
type ToolboxParams = ComponentParams<typeof Toolbox>;

type Params = {
  component: MoverParams['component'];
  id: MoverParams['id'];
  title?: MoverParams['title'];
  vars?: MoverParams['vars'];
  prepareValues?: MoverParams['prepareValues'];
  onSetupChange?: MoverParams['onSetupChange'];
  onPreview?: MoverParams['onPreview'];
  toolbarItems?: ToolboxParams['items'];
  toolbarPosition?: ToolboxParams['position'];
};

export const ModuleBox = newComponent(`${Toolbox.tag || 'div'}.module_box`, function (_, params: Params) {
  const mover = this.dom(Mover, {
    component: params.component,
    id: params.id,
    title: params.title,
    vars: params.vars,
    prepareValues: params.prepareValues,
    onSetupChange: function (values) {
      params.onSetupChange && params.onSetupChange(values);
      moverControls.update(200, values);
    },
    onPreview: params.onPreview,
  });

  const toolbox = Toolbox.call(this, this, {
    position: params.toolbarPosition,
    items: Object.assign({}, params.toolbarItems, {
      setup() { mover.show() },
    }),
  });

  const moverControls = this.dom(MoverControls, {
    component: params.component,
    onChange(props) {
      mover.apply(props);
      mover.setAnimation(true);
    },
    onPreview(props) {
      mover.preview(props);
      mover.setAnimation(false);
    },
    onSetupClick() {
      mover.show();
    }
  });

  return toolbox;
});
