import { newComponent } from '../splux-host';

type Params = {
  items: Record<string, () => void>;
};

const STYLES = {
  '.toolbox': {
    position: 'relative',
    width: '100%',
    height: '100%',

    '--row': {
      position: 'absolute',
      right: 0,
      bottom: '100%',
      display: 'none',
      gap: '4px',
    },

    '--button': {
      cursor: 'pointer',
      color: '#ddd',

      ':hover': {
        color: '#ccf',
      },
    },

    '--content': {
      width: '100%',
      height: '100%',
    },

    ':hover .toolbox--row': {
      display: 'flex',
    },
  },
}

export const Toolbox = newComponent('div', function (toolbox, { items }: Params) {
  toolbox.params({ className: 'toolbox' });
  toolbox.host.styles.add('toolbox', STYLES);

  toolbox.dom('div', function () {
    this.params({ className: 'toolbox--row' });

    for (const key in items) if (items[key]) {
      this.dom('div').params({ className: 'toolbox--button', innerText: key, onclick: items[key] });
    };
  });

  return this.dom('div').params({ className: 'toolbox--content' });
});
