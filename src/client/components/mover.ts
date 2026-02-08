import { Splux } from '../lib-ref/splux';
import { Host, newComponent } from '../splux-host';
import { isCast } from '../utils/broadcaster';
import { urlState } from '../utils/url-state';
import { getDashName, isKeyOf, splitByFirst } from '../utils/utils';
import { ParamsDialog } from './params-dialog';

type Props = {
  id: string;
  title?: string;
  vars?: Record<string, string>;
  onSetupChange?: (values: Record<string, string>) => void | Record<string, string>;
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

    transition: [
      '0.2s top ease-in-out',
      '0.2s bottom ease-in-out',
      '0.2s right ease-in-out',
      '0.2s left ease-in-out',
      '0.2s width ease-in-out',
      '0.2s height ease-in-out',
    ].join(','),
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

type Values = Record<string, string>;

function adoptPosition (oldValues: Values, newValues: Values, element: Splux<HTMLElement, Host>) {
  let result = newValues;
  let elementBox: ReturnType<typeof element.host.getModulePosition> | null = null;
  for (const key in newValues) {
    if (MUTUALLY_EXCLUSIVE[key] && MUTUALLY_EXCLUSIVE[key] in oldValues) {
      (result === newValues) && (result = Object.assign({}, result));
      elementBox || (elementBox = element.host.getModulePosition(element));
      isKeyOf(key, elementBox) && (result[key] = elementBox[key] + 'px');

    }
  }
  return result;
}

function applyVars (vars: Values | undefined, element: Splux<HTMLElement, Host>, prevVars?: Values) {
  const newPosition = (prevVars && vars) ? adoptPosition(prevVars, vars, element) : vars;
  for (const key in newPosition) if (newPosition[key] !== undefined) {
    const name = key in DEFAULT_VARS ? `--mover-${key}` : key;
    element.node.style.setProperty(name, newPosition[key]);
  }
  if (newPosition !== vars) {
    window.requestAnimationFrame(function () {
      applyVars(vars, element);
    });
  }
}

export const Mover = newComponent(`${ParamsDialog.tag}.mover`, function (_, {
  id,
  title,
  component,
  vars: initialVars,
  onSetupChange,
}: Props) {
  const host = this.host;
  host.styles.add('mover', STYLES);
  component.node.classList.add(CLASS_NAME);
  const initialValues = { ...DEFAULT_VARS, ...initialVars };
  let currentVars = initialValues;
  applyVars(currentVars, component);
  const [, elementName] = splitByFirst(id, '+');
  const dashName = getDashName();

  const dialog = ParamsDialog.call(this, this, {
    title: (title || id) + (elementName ? ` (${elementName})` : ''),
    values: currentVars,
    onChange(value, name) {
      const concurrent = MUTUALLY_EXCLUSIVE[name];
      if (concurrent && value) {
        dialog.set({ [concurrent]: '' });
      }
    },
    onApply(values, prevValues) {
      const valueChange = onSetupChange?.(values);
      currentVars = valueChange ? Object.assign({}, values, valueChange) : values;
      applyVars(currentVars, component, prevValues);
      urlState.set(id, currentVars);
      if (dashName) {
        host.send({ action: 'module-setup', payload: { view: dashName, module: id, setup: currentVars } });
      }

      if (valueChange) {
        return valueChange;
      }

      return;
    },
    onDelete() {
      urlState.remove(id);
    },
  });

  this.tuneIn(function (data) {
    if (isCast('hashStateChange', data) && id in data.payload) {
      const prevValues = currentVars === initialValues ? undefined : currentVars;
      currentVars = data.payload[id] || initialValues;
      onSetupChange?.(currentVars);
      dialog.set(currentVars);
      applyVars(currentVars, component, prevValues);
    }
  });

  return {
    show: dialog.show,
  };
});

export const MoverControls = newComponent('div', function () {});
