import { SpluxSVG } from '../utils/svg'

export function ChromakeySvg (values: Record<string, string>) {
  return SpluxSVG.createSvg({ width: 0, height: 0 }, function () {
    this.dom('defs', function () {
      for (const id in values) {
        this.dom('filter', function () {
          this.params({
            id,
            'color-interpolation-filters': 'sRGB',
            width: '100%',
            height: '100%',
            x: 0,
            y: 0,
          }).dom('feColorMatrix').params({
            type: 'matrix',
            values: values[id],
          });
        });
      }
    });

    return this;
  });
}
