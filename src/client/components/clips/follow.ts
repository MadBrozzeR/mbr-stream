import { newComponent } from '../../splux-host';
import { classNameToggler } from '../../utils/utils';

const DURATION = 8000;

const STYLES = {
  '@keyframes follow': {
    '0%': {
      left: '100%',
      transform: 'scale(1, 1)',
    },
    '50%': {
      left: '-40%',
      transform: 'scale(1, 1)',
    },
    '51%': {
      left: '-40%',
      transform: 'scale(-1, 1)',
    },
    '100%': {
      left: '100%',
      transform: 'scale(-1, 1)',
    },
  },

  '@keyframes flip-name': {
    '0%': {
      transform: 'translateX(-50%) scale(1, 1)',
    },
    '50%': {
      transform: 'translateX(-50%) scale(1, 1)',
    },
    '51%': {
      transform: 'translateX(-50%) scale(-1, 1)',
    },
    '100%': {
      transform: 'translateX(-50%) scale(-1, 1)',
    },
  },

  '.follow_clip': {
    width: '100%',
    height: '100%',
    position: 'absolute',
    overflow: 'hidden',
    top: 0,
    left: 0,
    display: 'none',

    '--visible': {
      display: 'block',
    },

    '--wrapper': {
      position: 'absolute',
      top: 0,
      left: 0,
      display: 'flex',
      gap: '20%',
      height: '100%',
      animation: (DURATION / 1000) + 's follow linear',
    },

    '--player': {
      height: '100%',
    },

    '--zombie': {
      height: '100%',
    },

    '--zombie_wrapper': {
      position: 'relative',
    },

    '--user_name': {
      position: 'absolute',
      left: '50%',
      top: 0,
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(10 10 10 / 80%)',
      color: 'white',
      fontWeight: '900',
      animation: (DURATION / 1000) + 's flip-name linear',
      padding: '1px 8px',
    },
  },
};

export const FollowClip = newComponent('div.follow_clip', function () {
  const host = this.host;
  host.styles.add('follow-clip', STYLES);
  const toggleVisibility = classNameToggler(this.node, 'follow_clip--visible') ;
  let setName = function (name: string) { name };

  this.dom('div.follow_clip--wrapper', function () {
    this.dom('img.follow_clip--player').params({ src: '/static/images/mc_chars_mbr.png' });
    this.dom('div.follow_clip--zombie_wrapper', function () {
      this.dom('img.follow_clip--zombie').params({ src: '/static/images/mc_chars_zombie.png' });
      const nameSpl = this.dom('div.follow_clip--user_name');

      setName = function (name) {
        nameSpl.params({ innerText: name });
      }
    });
  });

  return {
    play(name: string) {
      return new Promise<void>(function (resolve) {
        setName(name);
        toggleVisibility(true);
        host.play('zombie-say3.ogg');

        setTimeout(function () {
          host.play('zombie-say1.ogg');
        }, DURATION * 0.6);

        setTimeout(function () {
          toggleVisibility(false);
          resolve();
        }, DURATION);
      });
    },
  };
});
