import { newComponent } from '../splux-host';
import { Modal } from './modal';

type Values = Record<string, string>;

type Props = {
  title?: string;
  values: Values;
  onClose?: () => void | boolean;
  onChange?: (value: string, name: string) => void;
  onApply?: (values: Values) => void | boolean | Values;
  onDelete?: () => void;
};

const STYLES = {
  '.params_dialog': {
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
      form.dom('label.params_dialog--label', function () {
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
      });
    }

    form.dom('div.params_dialog--buttons', function () {
      this.dom('button.params_dialog--apply').params({
        innerText: 'Apply',
        onclick(event) {
          event.preventDefault();
          const values: Values = {};

          iterateInputs(inputs, function (input, key) {
            values[key] = input.value;
          });

          const applyResult = onApply && onApply(values);

          if (applyResult === false) {
            return;
          }

          currentValues = applyResult instanceof Object ? Object.assign({}, values, applyResult) : values;
          modal.close();
        }
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

  return {
    set(values: Values) {
      for (const name in values) {
        inputs[name] && (inputs[name].value = values[name] || '');
      }
    },
    block: this,
    show: modal.show,
  };
});
