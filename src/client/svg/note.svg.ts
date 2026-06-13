import { SpluxSVG } from '../utils/svg';

export function NoteSvg () {
  return SpluxSVG.createSvg({ width: 32, height: 32 }, function () {
    this.dom('polygon').params({ points: '4,28 4,20 8,20 8,4 28,4 28,24 20,24 20,16 24,16 24,10 12,10 12,28' })

    return this;
  });
}
