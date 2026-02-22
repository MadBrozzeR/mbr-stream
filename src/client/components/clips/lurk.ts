import { newComponent } from '../../splux-host';
import { isCast } from '../../utils/broadcaster';
import { Clip } from '../clip';
import { Fade } from '../fade';

const STYLES = {
  '.lurk_clip': {
    height: '100%',
    width: '140px',
    display: 'flex',
    justifyContent: 'center',
    filter: 'url(#chromakey-green1)',
    position: 'relative',

    '--name_line': {
      position: 'absolute',
      bottom: '40%',
      left: 0,
      right: 0,
      textAlign: 'center',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },

    '--name_text': {
      backgroundColor: 'rgba(20, 20, 20, 0.8)',
      color: 'white',
      fontWeight: '900',
    },
  },
};

export const LurkClip = newComponent('div.lurk_clip', function () {
  const host = this.host;
  host.styles.add('lurk-clip', STYLES);

  const fader = this.dom(Fade);

  const clip = fader.splux.dom(Clip, {
    src: 'video/shulker_lurk-2500.webm',
    audio: 'video/shulker_lurk-2500-audio.ogg',
  });

  const setName = fader.splux.dom('div.lurk_clip--name_line', function () {
    const name = this.dom('span.lurk_clip--name_text');
    return function setName (value: string) {
      name.params({ innerText: value });
    };
  });

  function play (name: string) {
    setName(name);
    fader.show().then(function () {
      clip.play().then(function () {
        fader.hide().then(function () {
          clip.rewind();
        });
      });
    });
  }

  this.tuneIn(function (data) {
    if (isCast('eventSubEvent', data)) {
      const command = data.payload.command;
      if (command && command.cmd === '!lurk') {
        play(data.payload.user?.name || '');
      }
    }
  });
});
