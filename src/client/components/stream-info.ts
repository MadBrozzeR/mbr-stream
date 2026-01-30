import type { StreamInfo as StreamInfoData } from '@common-types/ws-events';
import { newComponent } from '../splux-host';
import { Mover } from './mover';
import { Toolbox } from './toolbar';

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

  const mover = this.dom(Mover, {
    component: this,
    id,
    title: 'Stream Info',
    vars: {
      width: '100%',
      height: '40px',
      top: '0',
      left: '0',
    },
  });

  this.dom(Toolbox, {
    items: {
      move() { mover.show() },
    },
    position: 'bottom',
  }).dom('div.stream_info--panel', function () {
    const status = this.dom('div.stream_info--status');
    const viewers = this.dom('div.stream_info--viewers');
    const chatters = this.dom('div.stream_info--chatters');

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
    }

    host.state.streamInfo.listen(set);

    this.on({
      remove() {
        host.state.streamInfo.unlisten(set);
      },
    })
  });

});
