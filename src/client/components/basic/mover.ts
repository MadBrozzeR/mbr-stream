import type { ComponentSplux, Splux } from '/@client/lib-ref/splux';
import { Host, newComponent } from '/@client/splux-host';
import { isCast } from '/@client/utils/broadcaster';
import { urlState } from '/@client/utils/url-state';
import { getDashName, isKeyOf, splitByFirst } from '/@client/utils/utils';
import type { Values } from '/@client/type';
import { ParamsDialog } from './params-dialog';

type Props = {
  id: string;
  title?: string | undefined;
  vars?: Values | undefined;
  varsToCSS?: Record<string, string> | undefined;
  onSetupChange?: ((values: Values) => void) | undefined;
  prepareValues?: ((values: Values) => Values) | undefined;
  onPreview?: ((values: Values) => void) | undefined;
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
    display: 'none',
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },

  '.show_mover_controls .mover_controls': {
    display: 'block',
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
const DEFAULT_VARS_CSS: Record<string, string> = {
  top: '--mover-top',
  bottom: '--mover-bottom',
  left: '--mover-left',
  right: '--mover-right',
  width: '--mover-width',
  height: '--mover-height',
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

function applyVars (
  vars: Values | undefined,
  cssPropertyNames: Record<string, string>,
  element: Splux<HTMLElement, Host>,
  prevVars?: Values
) {
  const newPosition = (prevVars && vars) ? adoptPosition(prevVars, vars, element) : vars;
  for (const key in newPosition) if (newPosition[key] !== undefined) {
    const name = cssPropertyNames[key] || key;
    element.node.style.setProperty(name, newPosition[key]);
  }
  if (newPosition !== vars) {
    window.requestAnimationFrame(function () {
      applyVars(vars, cssPropertyNames, element);
    });
  }
}

function validate (dialog: ComponentSplux<typeof ParamsDialog>) {
  const values = dialog.getValues();

  if (values['left'] && values['right'] && values['width']) {
    dialog.setErrors({ left: true, right: true, width: true });
  } else {
    dialog.setErrors({ left: false, right: false, width: false });
  }

  if (values['top'] && values['bottom'] && values['height']) {
    dialog.setErrors({ top: true, bottom: true, height: true });
  } else {
    dialog.setErrors({ top: false, bottom: false, height: false });
  }
}

export const Mover = newComponent(`${ParamsDialog.tag}.mover`, function (_, {
  id,
  title,
  component,
  vars: initialVars,
  varsToCSS,
  onSetupChange,
  onPreview,
  prepareValues,
}: Props) {
  const host = this.host;
  const cssPropertyNames = varsToCSS ? Object.assign({}, DEFAULT_VARS_CSS, varsToCSS) : DEFAULT_VARS_CSS;
  host.styles.add('mover', STYLES);
  component.node.classList.add(CLASS_NAME);
  const initialValues = { ...DEFAULT_VARS, ...initialVars };
  let currentVars = initialValues;
  applyVars(currentVars, cssPropertyNames, component);
  const [, elementName] = splitByFirst(id, '+');
  const dashName = getDashName();

  function preview (values: Values) {
    applyVars(values, cssPropertyNames, component);
    onPreview && onPreview(values);
  }

  function resetPreview () {
    applyVars(currentVars, cssPropertyNames, component);
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
    onChange() {
      validate(dialog);
    },
    onApply(values, prevValues) {
      const valueChange = prepareValues ? Object.assign({}, values, prepareValues(values)) : values;
      onSetupChange && onSetupChange(valueChange);
      currentVars = Object.assign({}, currentVars, valueChange);
      applyVars(currentVars, cssPropertyNames, component, prevValues);
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
      applyVars(currentVars, cssPropertyNames, component, prevValues);
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

