import { LoaderCover } from './loader';
import { SYMBOL } from '/@client/constants';
import { newComponent } from '/@client/splux-host';

const STYLES = {
  '.modal': {
    position: 'relative',

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
  onClose?: () => void | boolean;
  title?: string | undefined;
};

const ModalTitle = newComponent(
  'div.modal--title',
  function (_block, { title, onClose }: { title: string; onClose: () => void }
) {
  const titleName = this.dom('div.modal--title_name').params({ innerText: title });
  this.dom('div.modal--title_close').params({ innerText: SYMBOL.CLOSE, onclick() { onClose() } });

  return {
    setTitle(text: string) {
      titleName.node.innerText = text;
    },
  };
});

export const Modal = newComponent('dialog.modal', function (modal, { title = '', onClose }: Props) {
  const { host } = this;
  host.styles.add('modal', STYLES);

  const loader = this.dom(LoaderCover);

  const titleRow = this.dom(ModalTitle, { title, onClose() {
    const result = onClose ? onClose() : true;

    if (result !== false) {
      modal.node.close();
    }
  } });

  return {
    content: this.dom('div.modal--content'),
    close() { modal.node.close() },
    show() { modal.node.showModal() },
    setTitle(title: string) { titleRow.setTitle(title) },
    loader<T>(promise: Promise<T>) { return loader(promise) },
  };
});
