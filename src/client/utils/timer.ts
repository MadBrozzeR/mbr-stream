type TimerStatus = 'idle' | 'run' | 'stopped' | 'complete';

export class Timer {
  callback: (this: Timer, current: number, status: TimerStatus) => void;
  ref: null | ReturnType<typeof setInterval> = null;
  finishTime = 0;
  step = 1000;
  status: TimerStatus = 'idle';

  constructor(callback: (this: Timer, current: number, status: TimerStatus) => void) {
    this.callback = callback;
  }

  set(time: number) {
    this.finishTime = time;
    const timer = this;

    if (this.status !== 'run') {
      this.status = 'run';
      this.tickFunction();
      this.ref = setInterval(function () {
        timer.tickFunction();
      }, this.step);
    }
  }

  tickFunction() {
    const current = Date.now();
    if (current < this.finishTime) {
      this.callback(current, this.status);
    } else {
      this.finish();
    }
  }

  finish() {
    this.status = 'complete';
    this.ref && clearInterval(this.ref);
    this.callback.call(this, this.finishTime, this.status);
  }

  stop() {
    this.status = 'stopped';
    this.ref && clearInterval(this.ref);
    this.callback.call(this, 0, this.status);
  }
}
