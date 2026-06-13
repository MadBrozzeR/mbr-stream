import { SpluxSVG } from '../utils/svg';

export function PlaySvg() {
  return SpluxSVG.createSvg({ width: 32, height: 32 }, function () {
    this.dom('polygon').params({ points: '4,4 4,28 28,16' });

    return this;
  });
}
