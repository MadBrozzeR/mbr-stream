import { Splux } from '../lib-ref/splux';
import { Host, newComponent } from '../splux-host';
import { Modal } from './modal';

type Values = Record<string, string>;

type Props = {
  title?: string;
  values: Values;
  onClose?: () => void | boolean;
  onChange?: (value: string, name: string) => void;
  onApply?: (values: Values, prevValues: Values) => void | boolean | Values;
  onDelete?: () => void;
};

const STYLES = {
  '.params_dialog': {
    '--label': {
      display: 'flex',
      marginBottom: '4px',
      height: '2em',
      alignItems: 'center',

      '-error': {
        color: 'red',
      },

      ':hover': {
        ' .params_dialog--clear_input': {
          display: 'block',
        },
      },
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

    '--buttons': {
      marginTop: '12px',
      display: 'flex',
      gap: '8px',
    },

    '--apply': {
      flex: '1',
      boxSizing: 'border-box',
      fontSize: '24px',
      height: '1.5em',
      border: '1px solid black',
      borderRadius: '4px',
    },

    '--delete': {
      height: '1.5em',
      width: '1.5em',
      boxSizing: 'border-box',
      fontSize: '24px',
      backgroundColor: '#faa',
      border: '1px solid black',
      borderRadius: '4px',
    },

    '--clear_input': {
      width: '1.5em',
      marginLeft: '-1.5em',
      textAlign: 'center',
      cursor: 'pointer',
      fontSize: '1.2em',
      display: 'none',
    },
  },
};

function iterateInputs (
  inputs: Record<string, HTMLInputElement>,
  callback: (input: HTMLInputElement, name: string) => void
) {
  Object.keys(inputs).forEach(function (key) {
    if (inputs[key]) {
      callback(inputs[key], key);
    }
  });
}

export const ParamsDialog = newComponent(`${Modal.tag}.params_dialog`, function (_, {
  title,
  values: defaultValues,
  onClose,
  onChange,
  onApply,
  onDelete,
}: Props) {
  const { host } = this;
  host.styles.add('params_dialog', STYLES);
  let currentValues = defaultValues;
  const inputs: Record<string, HTMLInputElement> = {}
  const rows: Record<string, Splux<HTMLLabelElement, Host>> = {};

  function apply(event?: Event) {
    event && event.preventDefault();
    const values: Values = {};

    iterateInputs(inputs, function (input, key) {
      values[key] = input.value;
    });

    const applyResult = onApply && onApply(values, currentValues);

    if (applyResult === false) {
      return;
    }

    currentValues = applyResult instanceof Object ? Object.assign({}, values, applyResult) : values;
    modal.close();
  }

  const modal = Modal.call(this, this, { title, onClose() {
    if (!onClose || onClose() !== false) {
      iterateInputs(inputs, function (input, name) {
        input.value = currentValues[name] || '';
      });

      return true;
    } else {
      return false;
    }
  } });

  modal.content.dom('form', function (form) {
    for (const name in defaultValues) {
      rows[name] = form.dom('label.params_dialog--label', function () {
        this.dom('span.params_dialog--property_name').params({ innerText: name });
        inputs[name] = this.dom('input.params_dialog--property_input').params({
          value: currentValues[name] || '',
          oninput() {
            if (onChange && inputs[name]) {
              const value = inputs[name].value;
              onChange(value, name);
            }
          }
        }).node;
        this.dom('div.params_dialog--clear_input').params({
          innerText: '✕',
          onclick() {
            inputs[name] && (inputs[name].value = '');
            onChange && onChange('', name);
          },
        });
      });
    }

    form.dom('div.params_dialog--buttons', function () {
      this.dom('button.params_dialog--apply').params({
        innerText: 'Apply',
        onclick: apply,
      });

      onDelete && this.dom('button.params_dialog--delete').params({
        innerHTML: '&#x1F5D1',
        onclick(event) {
          event.preventDefault();
          onDelete();
        }
      });
    });
  });

  function setErrors(values: Record<string, boolean>) {
    for (const name in values) {
      if (rows[name]) {
        if (values[name] === true) {
          rows[name].node.classList.add('params_dialog--label-error');
        } else {
          rows[name].node.classList.remove('params_dialog--label-error');
        }
      }
    }
  }

  return {
  setErrors,
    set(values: Values) {
      for (const name in values) {
        inputs[name] && (inputs[name].value = values[name] || '');
      }
    },
    apply(values: Values) {
      this.set(values);
      apply();
    },
    getValues() {
      const result: Values = {};

      iterateInputs(inputs, function (input, key) {
        result[key] = input.value;
      });

      return result;
    },
    block: this,
    show: modal.show,
  };
});
