import type { ComponentSplux, Splux } from '../lib-ref/splux';
import { Host, newComponent } from '../splux-host';
import { debounce } from '../utils/utils';

const DEBOUNCE_DELAY = 1000;

const STYLES = {
  '.form': {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    fontSize: '24px',
    gap: '12px',

    '--row': {
      display: 'flex',
      marginBottom: '4px',
      alignItems: 'center',

      '-error': {
        color: 'red',
      },

      ':hover': {
        ' .form--clear_input': {
          display: 'block',
        },
      },
    },

    '--row_label': {
      display: 'inline-block',
      width: '100px',
      fontSize: '1em',
      lineHeight: '30px',
    },

    '--row_content': {
      width: '300px',
      height: '30px',
      fontSize: '1em',
    },

    '--button_row': {
      height: '1.5em',
      display: 'flex',
      gap: '8px',
    },

    '--button': {
      flex: 1,
      cursor: 'pointer',
      boxSizing: 'border-box',
      fontSize: '1em',
      height: '1.5em',
      border: '1px solid black',
      borderRadius: '4px',

      '-await': {
        ':before': {
          content: '"⧖"',
          display: 'inline',
        },
      },
    },

    '--content': {
      flex: 1,
    },

    '--input': {
      boxSizing: 'border-box',
      width: '100%',
      height: '100%',

      '-hidden': {
        display: 'none',
      },
    },

    '--select': {
      display: 'inline-block',
      width: '100%',
      height: '100%',
    },

    '--select_display': {
      display: 'inline-block',
      width: '100%',
      height: '100%',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },

    '--select_option': {
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },

    '--curtain': {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      backgroundColor: '#ccc',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #aaa',

      '-hidden': {
        display: 'none',
      },
    },

    '--curtain_title': {
      height: '1em',
      position: 'relative',
      display: 'flex',
    },

    '--curtain_content': {
      overflow: 'auto',
      flex: 1,
    },

    '--curtain_close': {
      position: 'absolute',
      width: '1em',
      height: '1em',
      top: 0,
      right: 0,
      lineHeight: '1em',
      textAlign: 'center',
      cursor: 'pointer',
    },

    '--curtain_search': {
      border: '1px solid #aaa',
      height: '100%',
      flex: 1,
      marginRight: '2em',
      boxSizing: 'border-box',
      outline: 'none',

      '-hidden': {
        display: 'none',
      },
    },
  },
};

type SelectOption = { text?: string, value: string };
type Values<T = string | SelectOption> = Record<string, T>;

type Field = {
  type?: 'text';
  label?: string;
  value: string;
} | {
  type: 'select';
  search?: boolean;
  label?: string;
  value: string;
};

type Button = {
  action?: () => void | Promise<void>;
  className?: string;
};

type Params = {
  fields: Record<string, Field>;
  onChange?: (name: string, value: string) => void;
  buttons?: Record<string, Button>;
  onGetOptions?: (name: string, query: string) => Promise<SelectOption[]>;
};

type InputInterface = {
  get: () => string;
  set: (value: string | SelectOption) => void;
};

type RowInterface = ComponentSplux<typeof FormRow>;

function iterateInputs (
  inputs: Record<string, RowInterface>,
  callback: (input: RowInterface, name: string) => void
) {
  for (const name in inputs) if (inputs[name]) {
    callback(inputs[name], name);
  }
}

const FormRow = newComponent('label.form--row', function (_, { label, setInterface }: {
  label: string,
  setInterface: (content: Splux<HTMLSpanElement, Host>) => InputInterface
}) {
  this.dom('span.form--row_label').params({ innerText: label });
  const content = this.dom('span.form--row_content');
  const ifc = setInterface(content);

  return {
    content,
    ifc,
  };
});

export const Form = newComponent('form.form', function (_, { fields, onChange, buttons, onGetOptions }: Params) {
  const host = this.host;
  host.styles.add('form', STYLES);
  const inputs: Record<string, RowInterface> = {};
  let searchInput: Splux<HTMLInputElement, Host> | null = null;
  let currentName = '';

  const curtain = this.dom('div.form--curtain', function (curtain) {
    function show() {
      curtain.node.classList.remove('form--curtain-hidden');
    }

    function hide() {
      curtain.node.classList.add('form--curtain-hidden');
    }

    function toggleSearch (isShown: boolean) {
      if (!searchInput) {
        return;
      }

      if (isShown) {
        searchInput.node.classList.remove('form--curtain_search-hidden');
        searchInput.node.value = '';
      } else {
        searchInput.node.classList.add('form--curtain_search-hidden');
      }
    }

    const handleSearcChange = debounce(DEBOUNCE_DELAY, function (value: string) {
      requestOptions(value);
    });

    function requestOptions (query: string) {
      onGetOptions?.(currentName, query).then(function (options) {
        content.clear();
        options.forEach(function (option) {
          const text = option.text || option.value;

          content.dom('div.form--select_option').params({
            innerText: text,
            onclick() {
              const input = inputs[currentName];
              input && input.ifc.set(option);
              onChange && onChange(currentName, option.value);
              hide();
            },
          });
        });
      });
    }

    function getOptions(name: string, query: string) {
      const fieldParams = fields[name];

      if (!onGetOptions || !fieldParams || fieldParams.type !== 'select') {
        return;
      }
      toggleSearch(!!fieldParams.search);
      currentName = name;
      content.clear();
      show();

      requestOptions(query);
    };

    this.dom('div.form--curtain_title', function () {
      const input = this.dom('input.form--curtain_search').params({
        oninput() {
          handleSearcChange(input.node.value);
        },
      });
      searchInput = input;
      this.dom('div.form--curtain_close').params({
        innerText: '✕',
        onclick() {
          hide();
        },
      });
    });

    const content = this.dom('div.form--curtain_content');

    hide();

    return {
      show,
      getOptions,
    };
  });

  this.dom('div.form--content', function () {
    for (const name in fields) {
      const field = fields[name];

      if (!field) continue;

      if (field.type === 'select') {
        inputs[name] = this.dom(FormRow, {
          label: field.label || name,
          setInterface(content) {
            const dom = content.dom('span.form--select', function () {
              const input = this.dom('input.form--input.form--input-hidden').params({ value: fields[name]?.value });
              const display = this.dom('span.form--select_display').params({
                onclick() {
                  curtain.getOptions(name, '');
                },
              });

              return { input, display };
            });

            return {
              set(value) {
                if (typeof value === 'string') {
                  dom.display.node.innerText = value;
                  dom.input.node.value = value;
                } else {
                  dom.display.node.innerText = value.text || value.value;
                  dom.input.node.value = value.value;
                }
              },
              get() {
                return dom.input.node.value;
              },
            };
          },
        });
      } else {
        inputs[name] = this.dom(FormRow, {
          label: field.label || name,
          setInterface(content) {
            const input = content.dom('input.form--input').params({
              value: field.value,
              oninput() {
                onChange && onChange(name, input.node.value);
              },
            });

            return {
              set(value) {
                input.node.value = typeof value === 'string' ? value : value.value;
              },
              get() {
                return input.node.value;
              }
            };
          },
        });
      }
    }
  });

  if (buttons) {
    this.dom('div.form--button_row', function () {
      for (const text in buttons) {
        const buttonParams = buttons[text];
        if (buttonParams) {
          const button = this.dom('button.form--button').params({ innerText: text, onclick(event) {
            event.preventDefault();
            const promise = buttonParams.action && buttonParams.action();

            if (promise) {
              button.node.disabled = true;
              button.node.classList.add('form--button-await');

              promise.finally(function () {
                button.node.disabled = false;
                button.node.classList.remove('form--button-await');
              });
            }
          } });

          if (buttonParams.className) {
            button.node.classList.add(buttonParams.className);
          }
        }
      }
    });
  }

  return {
    get() {
      const result: Values<string> = {};

      iterateInputs(inputs, function (input, name) {
        result[name] = input.ifc.get();
      });

      return result;
    },

    set(values: Values) {
      iterateInputs(inputs, function (input, name) {
        if (name in values && values[name] !== undefined) {
          input.ifc.set(values[name]);
        }
      });
    },
  };
});
