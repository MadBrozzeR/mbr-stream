import { newComponent } from '/@client/splux-host';
import { FrameSvg } from '/@client/svg/frame.svg';
import { animation } from '/@client/utils/animation';
import { Timer } from '/@client/utils/timer';
import { addTime, getDateFromString, getTimeString, zeroLead } from '/@client/utils/utils';
import { ModuleBox } from '../basic/module-box';

type Props = {
  id: string;
};

const FINISH_TEXT = 'I\'m about to start!';
const ANIMATION_PARAMS = {
  threshold: 3000,
  duration: 400,
  step: 10,
};

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
      fontSize: 'var(--font-size, 42px)',
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'var(--font-family, monospace)',

      '-hidden': {
        display: 'none',
      },
    },

    '--display_text': {
      display: 'flex',
      fontSize: 'var(--font-size-text, 32px)',
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'var(--font-family, monospace)',
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
    let lastTime = 0;

    const ifc = {
      setAnimated(timeLeft: number) {
        const prevLastTime = lastTime;
        lastTime = timeLeft;
        const step = timeLeft - prevLastTime;

        if (Math.abs(step) > ANIMATION_PARAMS.threshold) {
          animation(function (value) {
            const current = (step * value) + prevLastTime;
            ifc.set(~~current);
          }, { duration: ANIMATION_PARAMS.duration, step: ANIMATION_PARAMS.step });
        } else {
          ifc.set(timeLeft);
        }
      },
      set(timeLeft: number) {
        let rest = Math.round(timeLeft / 1000);
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

    return ifc;
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
      timeDisplay.setAnimated(timeLeft);
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
  let resizeFrame = function ({ width, height }: { width?: string | undefined, height?:  string | undefined }) { width; height; };

  this.dom(ModuleBox, {
    component: this,
    id,
    title: 'Countdown',
    vars: {
      top: '20px',
      left: '20px',
      width: '400px',
      height: '60px',
      font: 'monospace',
      fontSize: '42px',
      textFontSize: '32px',
      time: '2025-12-05T21:00:00.000+03:00',
    },
    varsToCSS: {
      fontSize: '--font-size',
      textFontSize: '--font-size-text',
      font: '--font-family',
    },
    onPreview(values) {
      resizeFrame(values);
    },
    prepareValues(values) {
      const date = addTime(values['time'] || '', timer.finishTime);

      if (date && date !== timer.finishTime) {
        return {
          time: getTimeString(date),
        };
      }

      return values;
    },
    onSetupChange(values) {
      if (values['width'] && values['height']) {
        resizeFrame(values);
      }

      if (values['time']) {
        const time = getDateFromString(values['time']);
        time && timer.set(time);
      }

      return;
    },
    toolbarItems: {
      pause() {
        if (timer.status === 'run') {
          timer.stop();
        } else {
          timer.set(timer.finishTime);
        }
      },
    },
  }).dom('div.countdown--content', function () {
    this.dom('div.countdown--frame', function () {
      const frameSvg = FrameSvg({ width: 400, height: 60, type: 'dark_blue_orange' });
      this.node.appendChild(frameSvg.splux.node);

      resizeFrame = function ({ width, height }) {
        frameSvg.set({ width: width && parseInt(width, 10) || undefined, height: height && parseInt(height, 10) || undefined });
      };
    });
    const display = this.dom(TimerDisplay);

    timer.callback = function (timeLeft) {
      if (timeLeft > 0) {
        display.set(timeLeft);
      } else {
        display.text(FINISH_TEXT);
      }
    };
  });
});
