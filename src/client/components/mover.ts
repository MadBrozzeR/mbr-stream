import { Splux } from '../lib-ref/splux';
import { newComponent } from '../splux-host';
import { isCast } from '../utils/broadcaster';
import { urlState } from '../utils/url-state';
import { ParamsDialog } from './params-dialog';

type Props = {
  id: string;
  title?: string;
  vars?: Record<string, string>;
  onSetupChange?: (values: Record<string, string>) => void;
  component: Splux<any, any>;
};

const STYLES = {
  '.mover_props': {
    position: 'absolute',
    top: 'var(--mover-top, auto)',
    right: 'var(--mover-right, auto)',
    bottom: 'var(--mover-bottom, auto)',
    left: 'var(--mover-left, auto)',
    width: 'var(--mover-width, auto)',
    height: 'var(--mover-height, auto)',
  },
};

const MUTUALLY_EXCLUSIVE: Record<string, string> = {
  top: 'bottom',
  bottom: 'top',
  right: 'left',
  left: 'right',
};

const CLASS_NAME = 'mover_props';
const DEFAULT_VARS: Record<string, string> = {
  top: '',
  right: '',
  bottom: '',
  left: '',
  width: '',
  height: '',
};

function applyVars (vars: Record<string, string> | undefined, element: Splux<any, any>) {
  for (const key in vars) if (vars[key] !== undefined) {
    const name = key in DEFAULT_VARS ? `--mover-${key}` : key;
    element.node.style.setProperty(name, vars[key]);
  }
}

export const Mover = newComponent(`${ParamsDialog.tag}.mover`, function (_, {
  id,
  title,
  component,
  vars: initialVars,
  onSetupChange,
}: Props) {
  this.host.styles.add('mover', STYLES);
  component.node.classList.add(CLASS_NAME);
  let currentVars = { ...DEFAULT_VARS, ...initialVars };
  applyVars(currentVars, component);

  const dialog = ParamsDialog.call(this, this, {
    title: title || id,
    values: currentVars,
    onChange(value, name) {
      const concurrent = MUTUALLY_EXCLUSIVE[name];
      if (concurrent && value) {
        dialog.set({ [concurrent]: '' });
      }
    },
    onApply(values) {
      onSetupChange?.(values);
      currentVars = values;
      applyVars(currentVars, component);
      urlState.set(id, values);
    },
  });

  this.tuneIn(function (data) {
    if (isCast('hashStateChange', data) && id in data.payload) {
      currentVars = data.payload[id] || { ...DEFAULT_VARS, ...initialVars };
      dialog.set(currentVars);
      applyVars(currentVars, component);
    }
  });

  return {
    show: dialog.show,
  };
});
