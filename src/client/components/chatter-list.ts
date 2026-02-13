import { StreamInfo } from '@common-types/ws-events';
import { newComponent } from '../splux-host';
import { Mover } from './mover';
import { Toolbox } from './toolbar';

const STYLES = {};

type Params = {
  id: string;
};

type ChatterInfo = StreamInfo['chatters'][number];

type ChatterParams = {
  info: ChatterInfo;
};

const Chatter = newComponent('div.chatters--chater', function (_, { info }: ChatterParams) {
  this.params({ innerText: info.name });
});

export const ChatterList = newComponent('div.chatters', function (_, { id }: Params) {
  const host = this.host;
  host.styles.add('chatters', STYLES);
  let updateFromStreamInfo = function update (streamInfo: StreamInfo | null) {
    streamInfo;
  }

  const mover = this.dom(Mover, {
    id,
    title: 'Chatter List',
    component: this,
    vars: {
      width: '20%',
      height: '90%',
      right: '0',
      bottom: '0',
    },
  });

  this.dom(Toolbox, { items: {
    setup() { mover.show(); },
  } }).dom('div.chatters--wrapper', function (wrapper) {
    updateFromStreamInfo = function (streamInfo) {
      wrapper.clear();
      if (streamInfo) {
        streamInfo.chatters.forEach(function (info) {
          wrapper.dom(Chatter, { info });
        });
      }
    }
  });

  host.state.streamInfo.listen(updateFromStreamInfo)

  this.on({
    remove() {
      host.state.streamInfo.unlisten(updateFromStreamInfo);
    },
  });
});
