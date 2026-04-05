import { ModuleBox, ModuleBoxParams } from '../basic/module-box';
import { newComponent } from '/@client/splux-host';

const STYLES = {};

export const ChannelPoints = newComponent('div.channel_points', function (_, { id }: ModuleBoxParams) {
  const host = this.host;
  host.styles.add('channel-points', STYLES);

  this.dom(ModuleBox, {
    component: this,
    id,
    title: 'Channel Points',
    vars: {
      width: '600px',
      height: '400px',
      left: '20px',
      top: '20px',
    },
  }).dom('div.channel_points--wrapper', function () {
    this.dom('div.channel_points--content', function (content) {
      host.send({ action: 'get-channel-rewards' }).then(function (response) {
        content.clear();
        console.log(response);
      });
    });
    this.dom('div.channel_points--buttons', function () {});
  });
});
