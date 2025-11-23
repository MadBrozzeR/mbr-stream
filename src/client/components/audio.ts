import { newComponent } from '../splux-host';

const STYLES = {
  '.audio': {
    display: 'none',
  },
};

export const Audio = newComponent('audio', function () {
  const audio = this;
  audio.node.autoplay = true;
  this.host.styles.add('audio', STYLES);

  this.node.oncanplaythrough = function () {
    audio.node.play();
  };

  this.host.play = function (src) {
    const source = '/static/sound/' + src;

    if (audio.node.src === source) {
      audio.node.play();
    } else {
      audio.node.src = source;
    }
  };
});
