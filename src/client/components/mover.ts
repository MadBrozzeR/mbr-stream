import { Splux } from '../lib-ref/splux';
import { Host, newComponent } from '../splux-host';
import { MoverControlSvg } from '../svg/mover-controls.svg';
import { isCast } from '../utils/broadcaster';
import { urlState } from '../utils/url-state';
import { getDashName, isKeyOf, splitByFirst, step } from '../utils/utils';
import { ParamsDialog } from './params-dialog';

type Values = Record<string, string>;

type Props = {
  id: string;
  title?: string | undefined;
  vars?: Values | undefined;
  onSetupChange?: ((values: Values) => void) | undefined;
  prepareValues?: ((values: Values) => Values) | undefined;
  component: Splux<HTMLElement, any>;
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

    '-animated': {
      transition: [
        '0.2s top ease-in-out',
        '0.2s bottom ease-in-out',
        '0.2s right ease-in-out',
        '0.2s left ease-in-out',
        '0.2s width ease-in-out',
        '0.2s height ease-in-out',
      ].join(','),
    },
  },

  '.mover_controls': {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
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
  prepareValues,
}: Props) {
  const host = this.host;
  host.styles.add('mover', STYLES);
  component.node.classList.add(CLASS_NAME);
  const initialValues = { ...DEFAULT_VARS, ...initialVars };
  let currentVars = initialValues;
  applyVars(currentVars, component);
  const [, elementName] = splitByFirst(id, '+');
  const dashName = getDashName();

  function preview (values: Values) {
    applyVars(values, component);
  }

  function resetPreview () {
    applyVars(currentVars, component);
  }

  function setAnimation (value: boolean) {
    const className = CLASS_NAME + '-animated';
    if (value) {
      component.node.classList.add(className);
    } else {
      component.node.classList.remove(className);
    }
  }

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
      const valueChange = prepareValues ? Object.assign({}, values, prepareValues(values)) : values;
      onSetupChange && onSetupChange(valueChange);
      currentVars = Object.assign({}, currentVars, valueChange);
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

  setAnimation(true);

  this.tuneIn(function (data) {
    if (isCast('hashStateChange', data) && id in data.payload) {
      const prevValues = currentVars === initialValues ? undefined : currentVars;
      currentVars = data.payload[id] || initialValues;
      onSetupChange && onSetupChange(currentVars);
      dialog.set(currentVars);
      applyVars(currentVars, component, prevValues);
    }
  });

  return {
    show: dialog.show,
    apply(values: Values) {
      dialog.apply(values);
    },
    preview,
    resetPreview,
    setAnimation,
  };
});

type MoverChangeParams = {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  width?: string;
  height?: string;
};

type MoverControlsProps = {
  onChange?: (params: MoverChangeParams) => void;
  onPreview?: (params: MoverChangeParams) => void;
  onSetupClick?: () => void;
  component: Splux<any, any>;
};

export const MoverControls = newComponent('div.mover_controls', function (moverControlsSpl, {
  onChange,
  onPreview,
  onSetupClick,
  component,
}: MoverControlsProps) {
  const host = this.host;
  const controls = MoverControlSvg({
    onAction(handle) {
      switch (handle) {
        case 'move-left': {
          const box = host.getModulePosition(moverControlsSpl);
          let value = box.left;

          host.dragger({
            move(x) {
              value = step(box.left + x, 10);
              onPreview && onPreview({ left: value + 'px', right: '' });
            },
            apply() {
              onChange && onChange({ left: value + 'px', right: '' });
              controls.anchor({ 'resize-left': true, 'resize-right':  false});
            },
            wheel(direction) {
              value += direction === 'up' ? 1 : -1;
              onPreview && onPreview({ left: value + 'px', right: '' });
            },
          });
          break;
        }
        case 'move-top': {
          const box = host.getModulePosition(moverControlsSpl);
          let value = box.top;

          host.dragger({
            move(_x, y) {
              value = step(box.top + y, 10);
              onPreview && onPreview({ top: value + 'px', bottom: '' });
            },
            apply() {
              onChange && onChange({ top: value + 'px', bottom: '' });
              controls.anchor({ 'resize-top': true, 'resize-bottom':  false});
            },
            wheel(direction) {
              value += direction === 'up' ? 1 : -1;
              onPreview && onPreview({ top: value + 'px', bottom: '' });
            },
          });
          break;
        }
        case 'move-bottom': {
          const box = host.getModulePosition(moverControlsSpl);
          let value = box.bottom;

          host.dragger({
            move(_x, y) {
              value = step(box.bottom - y, 10);
              onPreview && onPreview({ bottom: value + 'px', top: '' });
            },
            apply() {
              onChange && onChange({ bottom: value + 'px', top: '' });
              controls.anchor({ 'resize-bottom': true, 'resize-top':  false});
            },
            wheel(direction) {
              value += direction === 'up' ? 1 : -1;
              onPreview && onPreview({ bottom: value + 'px', top: '' });
            },
          });
          break;
        }
        case 'move-right': {
          const box = host.getModulePosition(moverControlsSpl);
          let value = box.right;

          host.dragger({
            move(x) {
              value = step(box.right - x, 10);
              onPreview && onPreview({ right: value + 'px', left: '' });
            },
            apply() {
              onChange && onChange({ right: value + 'px', left: '' });
              controls.anchor({ 'resize-right': true, 'resize-left':  false});
            },
            wheel(direction) {
              value += direction === 'up' ? 1 : -1;
              onPreview && onPreview({ right: value + 'px', left: '' });
            },
          });
          break;
        }
        case 'resize-left': {
          const box = host.getModulePosition(moverControlsSpl);
          let value = box.width;

          host.dragger({
            move(x) {
              value = step(box.width - x, 10);
              onPreview && onPreview({ width: value + 'px' });
              controls.set({ width: value, height: box.height });
            },
            apply() {
              onChange && onChange({ width: value + 'px' });
            },
            wheel(direction) {
              value += direction === 'up' ? 1 : -1;
              onPreview && onPreview({ width: value + 'px' });
            },
          });
          break;
        }
        case 'resize-right': {
          const box = host.getModulePosition(moverControlsSpl);
          let value = box.width;

          host.dragger({
            move(x) {
              value = step(box.width + x, 10);
              onPreview && onPreview({ width: value + 'px' });
              controls.set({ width: value, height: box.height });
            },
            apply() {
              onChange && onChange({ width: value + 'px' });
            },
            wheel(direction) {
              value += direction === 'up' ? 1 : -1;
              onPreview && onPreview({ width: value + 'px' });
            },
          });
          break;
        }
        case 'resize-top': {
          const box = host.getModulePosition(moverControlsSpl);
          let value = box.height;

          host.dragger({
            move(_x, y) {
              value = step(box.height - y, 10);
              onPreview && onPreview({ height: value + 'px' });
              controls.set({ width: box.width, height: value });
            },
            apply() {
              onChange && onChange({ height: value + 'px' });
            },
            wheel(direction) {
              value += direction === 'up' ? 1 : -1;
              onPreview && onPreview({ height: value + 'px' });
            },
          });
          break;
        }
        case 'resize-bottom': {
          const box = host.getModulePosition(moverControlsSpl);
          let value = box.height;

          host.dragger({
            move(_x, y) {
              value = step(box.height + y, 10);
              onPreview && onPreview({ height: value + 'px' });
              controls.set({ width: box.width, height: value });
            },
            apply() {
              onChange && onChange({ height: value + 'px' });
            },
            wheel(direction) {
              value += direction === 'up' ? 1 : -1;
              onPreview && onPreview({ height: value + 'px' });
            },
          });
          break;
        }
        case 'click-middle': {
          onSetupClick && onSetupClick();
        }
      }
    },
  });
  this.node.appendChild(controls.splux.node);
  let lastSizeKey = '';

  return {
    update(time = 0, values?: Values) {
      let timeLimit = -1;

      if (values) {
        controls.anchor({
          'resize-top': !!values['top'],
          'resize-bottom': !!values['bottom'],
          'resize-left': !!values['left'],
          'resize-right': !!values['right'],
        });
      }

      function callback (currentTime: number) {
        const box = host.getModulePosition(component);
        const currentSizeKey = box.width + '/' + box.height;
        if (currentSizeKey !== lastSizeKey) {
          lastSizeKey = currentSizeKey;
          controls.set({ width: box.width, height: box.height });
        }

        if (time > 0) {
          if (timeLimit === -1) {
            timeLimit = currentTime + time;
          }

          if (currentTime < timeLimit) {
            requestAnimationFrame(callback);
          }
        }
      }

      requestAnimationFrame(callback);
    }
  };
});
