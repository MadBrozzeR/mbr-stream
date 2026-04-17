import { StreamInfo } from '@common-types/ws-events';
import { Host, newComponent } from '/@client/splux-host';
import { compareKeys, keyMapper } from '/@client/utils/utils';
import { Splux } from '/@client/lib-ref/splux';
import { ModuleBox } from '../basic/module-box';
import { UserName } from '../basic/user-name';
import { UserModal } from '../basic/user-modal';

const STYLES = {};

type Params = {
  id: string;
};

type ChatterInfo = StreamInfo['chatters'][number];

type ChatterParams = {
  info: ChatterInfo;
  onClick: () => void;
};

const Chatter = newComponent('div.chatters--chater', function (_, { info, onClick }: ChatterParams) {
  this.dom(UserName, { user: info, onClick });
});

export const ChatterList = newComponent('div.chatters', function (_, { id }: Params) {
  const host = this.host;
  host.styles.add('chatters', STYLES);
  const list: Record<string, Splux<HTMLDivElement, Host>> = {};

  const userModal = this.dom(UserModal);

  this.dom(ModuleBox, {
    id,
    title: 'Chatter List',
    component: this,
    vars: {
      width: '20%',
      height: '90%',
      right: '0',
      bottom: '0',
    },
   }).dom('div.chatters--wrapper', function (wrapper) {
    const unlistenStreamInfo = host.state.streamInfo.listen(function (streamInfo) {
      if (streamInfo) {
        const currentChatters = keyMapper(streamInfo?.chatters);
        compareKeys(list, currentChatters, function (key, status) {
          if (status === 'removed') {
            list[key]?.remove();
          } else if (status === 'new' && currentChatters[key]) {
            list[key] = wrapper.dom(Chatter, { info: currentChatters[key], onClick() {
              currentChatters[key] && userModal.open(currentChatters[key]);
            } });
          }
        });
      }
    });

    this.on({
      remove() {
        unlistenStreamInfo();
      },
    });
  });
});
