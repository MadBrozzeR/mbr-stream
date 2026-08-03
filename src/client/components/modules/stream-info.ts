import type { StreamInfo as StreamInfoData } from '@common-types/ws-events';
import { newComponent } from '/@client/splux-host';
import { ModuleBox } from '../basic/module-box';
import { ChangeStreamInfo } from '../basic/change-stream-info';

const STYLES = {
  '.stream_info': {
    '--panel': {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      height: '100%',
      padding: '0 4px',
    },

    '--status': {
      width: '1em',
      height: '1em',
      borderRadius: '50%',

      '-online': {
        backgroundColor: '#0e0',
      },

      '-offline': {
        backgroundColor: '#a00',
      },
    },

    '--viewers:before': {
      content: '"V: "',
      display: 'inline',
    },

    '--chatters:before': {
      content: '"C: "',
      display: 'inline',
    },

    '--title': {
      flex: 1,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      paddingLeft: '1em',

      '-await': {
        opacity: 0.8,

        ':before': {
          content: '"⧖"',
          display: 'inline',
          marginRight: '8px',
        }
      },
    },

    '--edit': {
      width: '1.5em',
      height: '1.5em',
    },
  },
};

type Props = {
  id: string;
};

const STATUS = {
  ONLINE: 'stream_info--status-online',
  OFFLINE: 'stream_info--status-offline',
} as const;

export const StreamInfo = newComponent('div.stream_info', function (_, { id }: Props) {
  const host = this.host;
  host.styles.add('stream-info', STYLES);

  this.dom(ModuleBox, {
    component: this,
    id,
    title: 'Stream Info',
    vars: {
      width: '100%',
      height: '40px',
      top: '0',
      left: '0',
    },
    toolbarPosition: 'bottom',
  }).dom('div.stream_info--panel', function () {
    const status = this.dom('div.stream_info--status');
    const viewers = this.dom('div.stream_info--viewers');
    const chatters = this.dom('div.stream_info--chatters');
    const title = this.dom('div.stream_info--title', function (title) {
      let current = '';
      let updated = '';

      function compare() {
        title.node.innerText = updated || current;

        if (current === updated) {
          title.node.classList.remove('stream_info--title-await');
        } else {
          title.node.classList.add('stream_info--title-await');
        }
      }

      return {
        setCurrent (title: string) {
          current = title;
          compare();
        },
        setUpdated (title: string) {
          updated = title;
          compare();
        }
      };
    });
    this.dom('div.stream_info--edit', function () {
      this.dom(ChangeStreamInfo, {});
    });

    status.node.classList.add(STATUS.OFFLINE);

    function set (streamInfo: StreamInfoData | null) {
      if (!streamInfo) {
        return;
      }

      if (streamInfo.isOnline && status.node.classList.contains(STATUS.OFFLINE)) {
        status.node.classList.replace(STATUS.OFFLINE, STATUS.ONLINE);
      } else if (!streamInfo.isOnline && status.node.classList.contains(STATUS.ONLINE)) {
        status.node.classList.replace(STATUS.ONLINE, STATUS.OFFLINE);
      }

      viewers.node.innerText = streamInfo.viewers.toString();

      chatters.node.innerText = streamInfo.chatters.length.toString();

      title.setCurrent(streamInfo.info.title);
    }

    const unlistenStreamInfo = host.state.streamInfo.listen(set);
    const unlistenStreamList = host.state.streamList.state.listen(function (list: Array<StreamInfoData['info']>) {
      const last = list[list.length - 1];
      if (last) {
        title.setUpdated(last.title);
      }
    });

    this.on({
      remove() {
        unlistenStreamInfo();
        unlistenStreamList();
      },
    })
  });

});
