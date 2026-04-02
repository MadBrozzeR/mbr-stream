import { Clip } from './clip';
import { newComponent } from '/@client/splux-host';

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
  audio?: string;
  chromakey?: Chromakey;
};

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

export const CanvasClip = newComponent('div.canvas_clip', function (_, { src, type, audio, chromakey }: Params) {
  const host = this.host;
  host.styles.add('canvas-clip', STYLES);

  const video = this.dom(Clip, { src, type, audio, className: 'canvas_clip--video' });
  const canvas = this.dom('canvas.canvas_clip--canvas');
  const context = canvas.node.getContext('2d', { willReadFrequently: true });

  video.splux.node.addEventListener('canplaythrough', function () {
    if (context) {
      context.canvas.width = video.splux.node.videoWidth;
      context.canvas.height = video.splux.node.videoHeight;
    }
  });

  function drawImage() {
    if (context) {
      context.drawImage(video.splux.node, 0, 0);
      chromakey && applyChromakey(context, chromakey);

      video.splux.node.requestVideoFrameCallback(drawImage);
    }
  }

  video.splux.node.requestVideoFrameCallback(drawImage);

  return {
    splux: this,
    play() {
      return video.play();
    },
    rewind() {
      video.splux.node.currentTime = 0;
    },
  };
});
