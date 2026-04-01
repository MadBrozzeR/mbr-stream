import { newComponent } from '/@client/splux-host';
import { getExtension } from '/@client/utils/utils';

const STYLES = {
  '.canvas_clip': {
    height: '100%',

    '--video': {
      display: 'none',
    },

    '--canvas': {
      height: '100%',
    },
  },
};

type Chromakey = [number, number, number] | [number, number, number, number];

type Params = {
  src: string;
  type?: string;
  width?: number;
  audio?: string;
  chromakey?: Chromakey;
};

const TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/mov',
  webm: 'video/webm',
};

const ROOT_PATH = '/static/';

function isWithinThreshhold (value: number, target: number, threshold: number) {
  return value > (target - threshold) && value < (target + threshold);
}

function applyChromakey(context: CanvasRenderingContext2D, chromakey: Chromakey) {
  const threshold = chromakey[3] || 0;
  const width = context.canvas.width;
  const height = context.canvas.height;
  const imageData = context.getImageData(0, 0, width, height);
  const pixelData = imageData.data;

  for (let index = 0 ; index < pixelData.length ; index += 4) {
    const red = pixelData[index];
    const green = pixelData[index + 1];
    const blue = pixelData[index + 2];

    if (
      isWithinThreshhold(red || 0, chromakey[0], threshold)
      && isWithinThreshhold(green || 0, chromakey[1], threshold)
      && isWithinThreshhold(blue || 0, chromakey[2], threshold)
    ) {
      pixelData[index + 3] = 0;
    }
  }
  context.putImageData(imageData, 0, 0);
}

export const CanvasClip = newComponent('div.canvas_clip', function (_, { src, width, type, audio, chromakey }: Params) {
  const host = this.host;
  host.styles.add('canvas-clip', STYLES);
  let resolver: (() => void) | null = null;

  const video = this.dom('video.canvas_clip--video', function () {
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
  });
  const canvas = this.dom('canvas.canvas_clip--canvas');
  const context = canvas.node.getContext('2d', { willReadFrequently: true });
  if (width) {
    canvas.node.width = width;
  }

  video.node.addEventListener('canplaythrough', function () {
    if (context) {
      context.canvas.width = video.node.videoWidth;
      context.canvas.height = video.node.videoHeight;
    }
  });

  function drawImage() {
    if (context) {
      context.drawImage(video.node, 0, 0);
      chromakey && applyChromakey(context, chromakey);

      video.node.requestVideoFrameCallback(drawImage);
    }
  }

  video.node.requestVideoFrameCallback(drawImage);

  return {
    splux: this,
    play() {
      return new Promise<void>(function (resolve, reject) {
        if (resolver) {
          reject(new Error('Clip is already running'));
          return;
        }
        resolver = resolve;
        video.node.play();
        audio && host.play(ROOT_PATH + audio);
      });
    },
    rewind() {
      video.node.currentTime = 0;
    },
  };
});
