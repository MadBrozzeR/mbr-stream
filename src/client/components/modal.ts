import { newComponent } from '../splux-host';

const STYLES = {
  '.modal': {
    '--title': {
      display: 'flex',
      marginBottom: '12px',
      fontSize: '24px',
      gap: '8px',
    },

    '--title_name': {
      flex: 1,
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
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

type Props = {
  onClose: () => void | boolean;
  title?: string | undefined;
};

const ModalTitle = newComponent(
  'div.modal--title',
  function (_block, { title, onClose }: { title: string; onClose: () => void }
) {
  this.dom('div.modal--title_name').params({ innerText: title });
  this.dom('div.modal--title_close').params({ innerText: '✕', onclick() { onClose() } });
});

export const Modal = newComponent('dialog.modal', function (modal, { title = '', onClose }: Props) {
  const { host } = this;
  host.styles.add('modal', STYLES);

  this.dom(ModalTitle, { title, onClose() {
    const result = onClose();

    if (result !== false) {
      modal.node.close();
    }
  } });

  return {
    content: this.dom('div.modal--content'),
    close() { modal.node.close() },
    show() { modal.node.showModal() },
  };
});
