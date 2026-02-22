import { newComponent } from '../splux-host';
import { getExtension } from '../utils/utils';

const STYLES = {
  '.clip': {
    height: '100%',
  },
};

type Params = {
  src: string;
  audio?: string,
  width?: number;
  type?: string;
};

const TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/mov',
  webm: 'video/webm',
};

const ROOT_PATH = '/static/';

export const Clip = newComponent('video.clip', function (clip, { src, width, type, audio }: Params) {
  const host = this.host;
  host.styles.add('clip', STYLES);
  let resolver: (() => void) | null = null;

  let videoType: string | undefined;
  if (type) {
    videoType = TYPES[type] || type;
  } else {
    videoType = TYPES[getExtension(src)] || undefined;
  }
  this.params({
    width,
    autoplay: true,
    muted: !!audio,
    onended() {
      resolver && resolver();
      resolver = null;
    },
  });

  this.dom('source').params({ src: ROOT_PATH + src, type: videoType });

  return {
    splux: this,
    play() {
      return new Promise<void>(function (resolve, reject) {
        if (resolver) {
          reject(new Error('Clip is already running'));
          return;
        }
        resolver = resolve;
        clip.node.play();
        audio && host.play(ROOT_PATH + audio);
      });
    },
    rewind() {
      clip.node.currentTime = 0;
    },
  };
});
