import { newComponent } from '/@client/splux-host';
import { getExtension } from '/@client/utils/utils';

type Params = {
  src: string;
  audio?: string | undefined;
  type?: string | undefined;
  className?: string | undefined;
};

const TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/mov',
  webm: 'video/webm',
};

export const Clip = newComponent('video.clip', function (clip, { src, type, audio, className }: Params) {
  const host = this.host;
  // host.styles.add('clip', STYLES);
  let resolver: (() => void) | null = null;
  className && this.node.classList.add(className);

  let videoType: string | undefined;
  if (type) {
    videoType = TYPES[type] || type;
  } else {
    videoType = TYPES[getExtension(src)] || undefined;
  }
  this.params({
    autoplay: true,
    muted: !!audio,
    onended() {
      resolver && resolver();
      resolver = null;
    },
  });

  this.dom('source').params({ src, type: videoType });

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
        audio && host.play(audio);
      });
    },
    rewind() {
      clip.node.currentTime = 0;
    },
  };
});
