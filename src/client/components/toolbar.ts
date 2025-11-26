import { newComponent } from '../splux-host';

type Params = {
  items: Record<string, () => void>;
  position?: 'top' | 'bottom';
};

const STYLES = {
  '.toolbox': {
    position: 'relative',
    width: '100%',
    height: '100%',

    '--row': {
      position: 'absolute',
      right: 0,
      display: 'none',
      gap: '4px',
      fontSize: '24px',

      '-top': {
        bottom: '100%',
      },

      '-bottom': {
        top: '100%',
      },
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

export const Toolbox = newComponent('div.toolbox', function (toolbox, { items, position = 'top' }: Params) {
  toolbox.host.styles.add('toolbox', STYLES);

  toolbox.dom('div.toolbox--row', function () {
    switch (position) {
      case 'top':
        this.node.classList.add('toolbox--row-top');
        break;
      case 'bottom':
        this.node.classList.add('toolbox--row-bottom');
        break;
    }

    for (const key in items) if (items[key]) {
      this.dom('div.toolbox--button').params({ innerText: key, onclick: items[key] });
    };
  });

  return this.dom('div.toolbox--content');
});
