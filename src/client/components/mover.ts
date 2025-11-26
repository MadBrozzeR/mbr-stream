import { Splux } from '../lib-ref/splux';
import { newComponent } from '../splux-host';
import { urlState } from '../url-state';
import { isKeyOf } from '../utils';

const PROPERTIES = ['top', 'right', 'bottom', 'left', 'width', 'height'] as const;

type VarProperties = typeof PROPERTIES[number];

type VarsProps = Partial<Record<VarProperties, string>>;

type Props = {
  name: string;
  vars?: VarsProps;
  component: Splux<any, any>;
};

const STYLES = {
  '.mover': {
    '_props': {
      position: 'absolute',
      top: 'var(--mover-top, auto)',
      right: 'var(--mover-right, auto)',
      bottom: 'var(--mover-bottom, auto)',
      left: 'var(--mover-left, auto)',
      width: 'var(--mover-width, auto)',
      height: 'var(--mover-height, auto)',
    },

    '--label': {
      display: 'block',
      marginBottom: '4px',
    },

    '--property_name': {
      display: 'inline-block',
      width: '100px',
      fontSize: '24px',
      lineHeight: '30px',
    },

    '--property_input': {
      width: '300px',
      height: '30px',
      fontSize: '24px',
      boxSizing: 'border-box',
    },

    '--apply': {
      width: '400px',
      boxSizing: 'border-box',
      fontSize: '24px',
      marginTop: '12px',
    },

    '--title': {
      display: 'flex',
      marginBottom: '12px',
      fontSize: '24px',
    },

    '--title_name': {
      flex: 1,
    },

    '--title_close': {
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    },
  },
};

const MUTUALLY_EXCLUSIVE: Partial<Record<VarProperties, VarProperties>> = {
  top: 'bottom',
  bottom: 'top',
  right: 'left',
  left: 'right',
};

const CLASS_NAME = 'mover_props';

function applyVars (vars: Record<string, string> | undefined, element: Splux<any, any>) {
  for (const key in vars) if (vars[key] !== undefined) {
    element.node.style.setProperty(`--mover-${key}`, vars[key]);
  }
}

function iterateInputs (
  inputs: Partial<Record<VarProperties, Splux<HTMLInputElement, any>>>,
  callback: (input: HTMLInputElement, key: VarProperties) => void
) {
  Object.keys(inputs).forEach(function (key) {
    if (isKeyOf(key, inputs) && inputs[key]) {
      callback(inputs[key].node, key);
    }
  });
}

export const Mover = newComponent('dialog', function (mover, { vars, component, name }: Props) {
  this.host.styles.add('mover', STYLES);
  component.node.classList.add(CLASS_NAME);
  let currentVars = vars;
  applyVars(currentVars, component);

  const inputs: Partial<Record<VarProperties, Splux<HTMLInputElement, any>>> = {}

  this.dom('div.mover--title', function () {
    this.dom('div.mover--title_name').params({ innerText: name });
    this.dom('div.mover--title_close').params({ innerText: '✕', onclick() {
      iterateInputs(inputs, function (input, key) {
        input.value = currentVars?.[key] || '';
      });
      mover.node.close();
    } });
  });

  this.dom('form', function (form) {
    PROPERTIES.forEach(function (property) {
      form.dom('label.mover--label', function () {
        this.dom('span.mover--property_name').params({ innerText: property });
        inputs[property] = this.dom('input.mover--property_input').params({
          value: vars?.[property] || '',
          oninput() {
            const concurrentInput = MUTUALLY_EXCLUSIVE[property] && inputs[MUTUALLY_EXCLUSIVE[property]]?.node
            if (concurrentInput && concurrentInput.value) {
              concurrentInput.value = '';
            }
          },
        });
      });
    });

    form.dom('button.mover--apply').params({ innerText: 'Apply', onclick(event) {
      event.preventDefault();
      const values: VarsProps = {};

      iterateInputs(inputs, function (input, key) {
        values[key] = input.value;
      });

      currentVars = values;
      urlState.set(name, currentVars);
      applyVars(currentVars, component);

      mover.node.close();
    } });
  });

  mover.tuneIn(function (data) {
    if (data.type === 'urlStateChange' && name in data.payload) {
      currentVars = data.payload[name];
      iterateInputs(inputs, function (input, key) {
        input.value = currentVars?.[key] || '';
      });
      applyVars(currentVars, component);
    }
  });

  return {
    show() {
      mover.node.showModal();
    },
  };
});
