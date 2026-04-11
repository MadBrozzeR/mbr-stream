import { newComponent } from '/@client/splux-host';

const STYLES = {
  '.fridge': {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    height: 'auto',
    minWidth: '20%',
    maxWidth: '40%',
    backgroundColor: 'rgba(220 220 220 / 80%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '8px',

    '--row': {
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      userSelect: 'none',

      ':hover': {
        color: '#00a',
      },
    },

    '-hidden': {
      display: 'none',
    },

    '--title': {
      display: 'flex',
      gap: '0.2em',
      borderBottom: '1px dashed black',
      paddingBottom: '8px',
    },

    '--title_text': {
      flex: 1,
    },

    '--title_close': {
      cursor: 'pointer',
      height: '1em',
      width: '1em',
    },

    '--content': {
      flex: 1,
    },
  },
};

type Option = {
  text: string;
  action: () => void;
};

// DEPRECATED
export const Fridge = newComponent('div.fridge.fridge-hidden', function (fridge) {
  const host = this.host;
  host.styles.add('fridge', STYLES);

  const title = this.dom('div.fridge--title', function () {
    const titleText = this.dom('div.fridge--title_text');
    this.dom('div.fridge--title_close').params({
      innerText: '✕',
      onclick() { ifc.hide() },
    });

    return titleText;
  });

  const content = this.dom('div.fridge--content');

  const ifc = {
    setTitle(text: string) {
      title.params({ innerText: text});
    },
    set(options: Option[]) {
      content.clear();
      fridge.node.classList.remove('fridge-hidden');

      options.forEach(function ({ text, action }) {
        content.dom('div.fridge--row').params({ innerText: text, onclick: action });
      });
    },
    hide() {
      fridge.node.classList.add('fridge-hidden');
    },
  };

  return ifc;
});
