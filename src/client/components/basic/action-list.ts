import { newComponent } from '/@client/splux-host';

const STYLES = {
  '.action_list': {
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',

    '--row': {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      cursor: 'pointer',
      userSelect: 'none',

      ':hover': {
        color: '#00a',
      },
    },
  },
};

type ListItem = {
  text: string;
  action: () => void;
};

type Params = {
  className?: string;
};

export const ActionList = newComponent('div.action_list', function (actionList, { className }: Params) {
  const host = this.host;
  host.styles.add('action-list', STYLES);
  className && this.node.classList.add(className);

  return {
    set(list: ListItem[]) {
      actionList.clear();
      list.forEach(function (item) {
        actionList.dom('div.action_list--row').params({
          innerText: item.text,
          onclick: item.action,
        });
      });
    }
  };
});
