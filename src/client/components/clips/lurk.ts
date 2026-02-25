import { newComponent } from '../../splux-host';
import { classNameToggler } from '../../utils/utils';
import { Clip } from '../clip';
import { Fade } from '../fade';

const STYLES = {
  '.lurk_clip': {
    height: '100%',
    width: '140px',
    justifyContent: 'center',
    filter: 'url(#chromakey-green1)',
    position: 'relative',
    display: 'none',

    '--visible': {
      display: 'flex',
    },

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
      backgroundColor: 'rgba(20 20 20 / 80%)',
      color: 'white',
      fontWeight: '900',
      padding: '1px 8px',
    },
  },
};

export const LurkClip = newComponent('div.lurk_clip', function () {
  const host = this.host;
  host.styles.add('lurk-clip', STYLES);
  const toggleVisibility = classNameToggler(this.node, 'lurk_clip--visible') ;

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
    return new Promise<void>(function (resolve) {
      setName(name);
      toggleVisibility(true);
      fader.show().then(function () {
        clip.play().then(function () {
          fader.hide().then(function () {
            clip.rewind();
            toggleVisibility(false);
            resolve();
          });
        });
      });
    });
  }

  return { play };
});
