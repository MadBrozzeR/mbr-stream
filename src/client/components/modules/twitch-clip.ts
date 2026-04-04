import { ModuleBox } from '../basic/module-box';
import { newComponent } from '/@client/splux-host';
import { isCast } from '/@client/utils/broadcaster';
import { useTemplate } from '/@client/utils/utils';

const STYLES = {
  '.twitch_clip': {
    '--frame': {
      width: '100%',
      height: '100%',
    },
  },
};

type Params = { id: string; };
type FrameParams = {
  id: string;
  duration: number;
};

const TWITCH_CLIP_URL = 'https://clips.twitch.tv/embed?clip={{id}}&parent=localhost&autoplay=true';
const CLOSE_DELAY = 500;

export const TwitchClip = newComponent('div.twitch_clip', function (_, { id }: Params) {
  const host = this.host;
  host.styles.add('twitch-clip', STYLES);
  let currentClipId = '';

  const moduleContents = this.dom(ModuleBox, {
    component: this,
    id,
    title: 'Twitch Clip',
    vars: {
      width: '600px',
      height: '400px',
      top: '150px',
      left: '150px',
      video: '',
    },
  });

  function addFrame ({ id, duration }: FrameParams) {
    if (!id || currentClipId === id) {
      return;
    }

    currentClipId = id;
    const frame = moduleContents.dom('iframe.twitch_clip--frame').params({
      width: '1280px',
      height: '720px',
      src: useTemplate(TWITCH_CLIP_URL, { id }),
      onload() {
        setTimeout(function () {
          frame.remove();
          currentClipId = '';
        }, duration + CLOSE_DELAY);
      },
    });
  }

  this.tuneIn(function (data) {
    if (isCast('showClip', data)) {
      addFrame(data.payload);
    }
  });
});
