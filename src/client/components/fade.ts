import { newComponent } from '../splux-host';

const TRANSITION_DURATION = 400;

const STYLES = {
  '.fader': {
    display: 'none',
    opacity: 0.1,

    '--shown': {
      display: 'block',
      transition: (TRANSITION_DURATION / 1000) + 's opacity ease-in-out',
    },

    '--active': {
      opacity: 1,
    },
  },
};

type Status = 'hidden' | 'animation' | 'visible';

export const Fade = newComponent('div.fader', function (fader) {
  const host = this.host;
  host.styles.add('fader', STYLES);
  let status: Status = 'hidden';

  return {
    splux: this,
    show() {
      return new Promise<void>(function (resolve, reject) {
        if (status !== 'hidden') {
          reject(new Error('Fader already visible'));
          return;
        }
        status = 'animation';
        fader.node.classList.add('fader--shown');
        window.requestAnimationFrame(function () {
          fader.node.classList.add('fader--active');
          setTimeout(function () {
            status = 'visible';
            resolve();
          }, TRANSITION_DURATION);
        });
      });
    },
    hide() {
      return new Promise<void>(function (resolve, reject) {
        if (status !== 'visible') {
          reject(new Error('Fader already hidden'));
          return;
        }
        status = 'animation';
        fader.node.classList.remove('fader--active');
        setTimeout(function () {
          fader.node.classList.remove('fader--shown');
          status = 'hidden';
          resolve();
        }, TRANSITION_DURATION);
      });
    },
  };
});
