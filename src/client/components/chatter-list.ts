import { StreamInfo } from '@common-types/ws-events';
import { Host, newComponent } from '../splux-host';
import { Mover } from './mover';
import { Toolbox } from './toolbar';
import { compareKeys, keyMapper } from '../utils/utils';
import { Splux } from '../lib-ref/splux';

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
  const list: Record<string, Splux<HTMLDivElement, Host>> = {};

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
      if (streamInfo) {
        const currentChatters = keyMapper(streamInfo?.chatters);
        compareKeys(list, streamInfo, function (key, status) {
          if (status === 'removed') {
            list[key]?.remove();
          } else if (status === 'new' && currentChatters[key]) {
            list[key] = wrapper.dom(Chatter, { info: currentChatters[key] });
          }
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
