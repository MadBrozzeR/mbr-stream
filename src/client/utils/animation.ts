type AnimationParams = {
  step: number;
  duration: number;
  func: (value: number) => number;
};

export const ANIMATION_FUNC = {
  LINEAR: function (value: number) { return value },
  EASE_IN: function (value: number) { return value * value * value },
  EASE_OUT: function (value: number) { const x = 1 - value; return -(x * x * x) + 1 },
  EASE_IN_OUT: function (value: number) {
    return (1 - Math.cos(Math.PI * value)) / 2;
  },
};

const DEFAULTS: AnimationParams = {
  step: 100,
  duration: 1000,
  func: ANIMATION_FUNC.EASE_IN_OUT,
};

export function animation (callback: (value: number) => void, params: Partial<AnimationParams> = {}) {
  const mergedParams = Object.assign({}, DEFAULTS, params);
  let start = 0;
  let lastStepTime = 0;

  function animationProcess (time: number) {
    if (!start) {
      start = time;
    }

    if (time - lastStepTime > mergedParams.step) {
      lastStepTime = time;
      const current = Math.min((time - start) / mergedParams.duration, 1);
      callback(mergedParams.func(current));

      if (current < 1) {
        requestAnimationFrame(animationProcess);
      }
    } else {
      requestAnimationFrame(animationProcess);
    }
  }

  requestAnimationFrame(animationProcess);
}
