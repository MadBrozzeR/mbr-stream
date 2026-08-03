type TimerStatus = 'idle' | 'run' | 'stopped' | 'complete';

export class Timer {
  callback: (this: Timer, current: number) => void;
  ref: null | ReturnType<typeof setTimeout> = null;
  finishTime = 0;
  step = 1000;
  status: TimerStatus = 'idle';

  constructor(callback: (this: Timer, current: number) => void) {
    this.callback = callback;
    this.tickFunction = this.tickFunction.bind(this);
  }

  set(time: number) {
    this.finishTime = time;

    if (this.status !== 'run') {
      this.status = 'run';
      this.tickFunction();
    }
  }

  tickFunction() {
    const timeLeft = this.finishTime - Date.now();
    if (timeLeft > 0) {
      this.callback(timeLeft);
      this.reset(Math.min(this.step, timeLeft));
    } else {
      this.finish();
    }
  }

  finish() {
    this.status = 'complete';
    this.reset(0);
    this.finishTime = 0;
    this.callback.call(this, 0);
  }

  stop() {
    this.status = 'stopped';
    this.reset(0);
    this.callback.call(this, this.finishTime - Date.now());
  }

  reset(time: number) {
    this.ref && clearTimeout(this.ref);

    if (time) {
      this.ref = setTimeout(this.tickFunction, time);
    }
  }
}

export class Timer2 {
  ref: ReturnType<typeof setTimeout> | null = null;
  timeout = 0;
  callback: () => void;

  constructor(callback: () => void = function () {}) {
    this.callback = callback;
  }

  set(timeout?: number) {
    const timer = this;

    if (timeout !== undefined) {
      this.timeout = timeout;
    }

    this.stop();
    if (this.timeout) {
      this.ref = setTimeout(function () {
        timer.stop();
        timer.callback();
      }, this.timeout);
    }
  }

  stop() {
    this.ref && clearTimeout(this.ref);
    this.ref = null;
  }

  isActive() {
    return !!this.ref;
  }
}

