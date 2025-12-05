import { newComponent } from '../splux-host';
import { FrameSvg } from '../svg/frame.svg';
import { Timer } from '../utils/timer';
import { zeroLead } from '../utils/utils';
import { Mover } from './mover';
import { Toolbox } from './toolbar';

type Props = {
  id: string;
};

const FINISH_TEXT = 'I\'m about to start!';

const STYLES = {
  '.countdown': {
    '--content': {
      position: 'relative',
      width: '100%',
      height: '100%',
      padding: '8px',
      boxSizing: 'border-box',
    },

    '--frame': {
      position: 'absolute',
      zIndex: -1,
      top: 0,
      left: 0,
    },

    '--display': {
      width: '100%',
      height: '100%',
      color: 'white',
    },

    '--display_time': {
      display: 'flex',
      fontSize: '42px',
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'monospace',

      '-hidden': {
        display: 'none',
      },
    },

    '--display_text': {
      display: 'flex',
      fontSize: '32px',
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'monospace',
      whiteSpace: 'nowrap',

      '-hidden': {
        display: 'none',
      },
    },
  },
};

const DisplayDigits = newComponent('div.countdown--digits', function (digits, { text }: { text: string }) {
  function set (value: string) {
    digits.params({ innerText: value })
  }

  set(text);

  return set;
});

const TimerDisplay = newComponent('div.countdown--display', function () {
  const timeDisplay = this.dom('div.countdown--display_time', function (display) {
    const hoursDisplay = this.dom(DisplayDigits, { text: '00' });
    this.dom(DisplayDigits, { text: ':' });
    const minutesDisplay = this.dom(DisplayDigits, { text: '00' });
    this.dom(DisplayDigits, { text: ':' });
    const secondsDisplay = this.dom(DisplayDigits, { text: '00' });

    return {
      set(timeLeft: number) {
        let rest = ~~(timeLeft / 1000);
        const seconds = rest % 60;
        rest = ~~(rest / 60);
        const minutes = rest % 60;
        rest = ~~(rest / 60);
        const hours = rest;

        hoursDisplay(zeroLead(hours));
        minutesDisplay(zeroLead(minutes));
        secondsDisplay(zeroLead(seconds));

        this.setState(true);
      },
      setState(state: boolean) {
        if (state) {
          display.node.classList.remove('countdown--display_time-hidden');
        } else {
          display.node.classList.add('countdown--display_time-hidden');
        }
      }
    };
  });

  const textDisplay = this.dom('div.countdown--display_text', function (display) {
    return {
      set(value: string) {
        display.params({ innerText: value });
        this.setState(true);
      },
      setState(state: boolean) {
        if (state) {
          display.node.classList.remove('countdown--display_text-hidden');
        } else {
          display.node.classList.add('countdown--display_text-hidden');
        }
      }
    };
  });

  return {
    splux: this,
    set(timeLeft: number) {
      timeDisplay.set(timeLeft);
      textDisplay.setState(false);
    },
    text(value: string) {
      textDisplay.set(value);
      timeDisplay.setState(false);
    },
  };
});

export const Countdown = newComponent('div.countdown', function (_div, { id }: Props) {
  const { host } = this;
  host.styles.add('countdown', STYLES);
  const timer = new Timer(function () {});
  let resizeFrame = function (width: string, height: string) { width; height; };

  const mover = this.dom(Mover, {
    component: this,
    id,
    title: 'Countdown',
    vars: {
      top: '20px',
      left: '20px',
      width: '400px',
      height: '60px',
      time: '2025-12-05T21:00:00.000+03:00',
    },
    onSetupChange(values) {
      const date = new Date(values['time'] || '').valueOf();
      if (values['width'] && values['height']) {
        resizeFrame(values['width'], values['height']);
      }

      if (!isNaN(date) && date !== timer.finishTime) {
        timer.set(date);
      }
    },
  });

  this.dom(Toolbox, { items: {
    pause() {
      if (timer.status === 'run') {
        timer.stop();
      } else {
        timer.set(timer.finishTime);
      }
    },
    setup() {
      mover.show();
    },
  } }).dom('div.countdown--content', function () {
    this.dom('div.countdown--frame', function () {
      const frameSvg = FrameSvg({ width: 400, height: 60, type: 'dark_blue_orange' });
      this.node.appendChild(frameSvg.splux.node);

      resizeFrame = function (width: string, height: string) {
        frameSvg.set({ width: parseInt(width, 10), height: parseInt(height, 10) });
      };
    });
    const display = this.dom(TimerDisplay);

    timer.callback = function (current, status) {
      switch (status) {
        case 'complete':
          display.text(FINISH_TEXT);
          break;
        case 'run':
          display.set(this.finishTime - current);
          break;
      }
    };
  });
});
