import { ModuleBox } from '../basic/module-box';
import { newComponent } from '/@client/splux-host';

type Params = {
  id: string;
};

const TWITCH_PLAYER_DIV_ID = 'twitch-player-embed-id';

// TODO FIX this nuisance
type Instance<T> = T extends new (...args: any[]) => infer C ? C : never;
type Player = Instance<typeof Twitch.Player>;

// UNUSED YET, AS CLIPS ARE NOT SUPPORTED
export const TwitchPlayer = newComponent('div.twitch_player', function (_, { id }: Params) {
  let player: Player | null = null;
  const size = {
    width: 400,
    height: 300,
  };
  let currentVideo = '';

  const ifc = this.dom(ModuleBox, {
    component: this,
    id,
    title: 'Clip',
    vars: {
      width: '400px',
      height: '300px',
      left: '100px',
      top: '100px',
      video: '',
    },
    onSetupChange(values) {
      if (values['width']) {
        size.width = parseInt(values['width'], 10);
      }
      if (values['height']) {
        size.height = parseInt(values['height'], 10);
      }
      if (values['video']) {
        ifc.play({ video: values['video'] });
      }
    },
  }).dom('div.twitch_clip--player', function () {
    this.params({ id: TWITCH_PLAYER_DIV_ID });

    return {
      play({ video }: { video: string }) {
        if (!video || currentVideo === video) {
          return;
        }

        currentVideo = video;
        if (!player) {
          player = new Twitch.Player(TWITCH_PLAYER_DIV_ID, {
            video,
            height: size.height,
            width: size.width,
          });
        } else {
          player.setVideo(video, 0);
        }
      }
    };
  });

  return ifc;
});
