import { SpluxSVG } from '../utils/svg';
import { Styles } from '../lib-ref/mbr-style';

const STYLES = Styles.compile({
  '.placeholder': { fill: 'none' },
  '.glow': { fill: 'yellow', filter: 'url(#wire-glow)' },
  '.wire': { fill: 'white' },
  '.frame': { fill: '#ff6633', stroke: 'none' },
  '.dark': { fill: '#000', opacity: 0.2 },
  '.dark2': { fill: '#000', opacity: 0.35 },
  '.light': { fill: '#fff', opacity: 0.2 },
  '.light2': { fill: '#fff', opacity: 0.35 },
});

const WIRE_OFFSET = 4;
const WIRE_CORNER = 5;
const FRAME_OFFSET = 1;

export function FrameSvg (width: number, height: number) {
  return SpluxSVG.createSvg({ width, height }, function (svg) {
    this.dom('style', function () {
      this.node.innerHTML = STYLES;
    });
    this.dom('defs', function () {
      this.dom('filter', function () {
        this.params({ id: 'wire-glow' });
        this.dom('feGaussianBlur').params({ stdDeviation: 1.65 });
      });
    });
    const wire = this.dom('g', function () {
      const dom = {
        placeholder: this.dom('rect.placeholder'),
        glow: this.dom('path.glow'),
        wire: this.dom('path.wire'),
      };

      return function (width: number, height: number) {
        dom.placeholder.params({ width, height, x: 0, y: 0 });
        dom.glow.params({ d: `M ${WIRE_OFFSET},${WIRE_OFFSET} V ${height - 4} H ${width - 4} V ${WIRE_OFFSET + WIRE_CORNER} l -${WIRE_CORNER},-${WIRE_CORNER} z m 2,2 H ${width - WIRE_OFFSET - WIRE_CORNER - 1} l ${WIRE_CORNER - 1},${WIRE_CORNER - 1} V ${height - WIRE_OFFSET - 2} H ${WIRE_OFFSET + 2} Z` });
        dom.wire.params({ d: `M ${WIRE_OFFSET},${WIRE_OFFSET} V ${height - 4} H ${width - 4} V ${WIRE_OFFSET + WIRE_CORNER} l -${WIRE_CORNER},-${WIRE_CORNER} z m 2,2 H ${width - WIRE_OFFSET - WIRE_CORNER - 1} l ${WIRE_CORNER - 1},${WIRE_CORNER - 1} V ${height - WIRE_OFFSET - 2} H ${WIRE_OFFSET + 2} Z` });
      };
    });
    const frame1 = this.dom('g', function () {
      this.params({ transform: `translate(${FRAME_OFFSET}, ${FRAME_OFFSET})` });

      const dom = {
        frame: this.dom('path.frame'),
        shade1: this.dom('path.dark2'),
        shade2: this.dom('path.dark'),
        shade3: this.dom('path.dark'),
        shade4: this.dom('path.dark'),
        shade5: this.dom('path.light'),
        shade6: this.dom('path.light'),
      };

      return function (width: number) {
        const length = Math.ceil(width * 0.55);

        dom.frame.params({ d: `M 0,16 V 0 h ${length} l -8,8 H 8 v 8 z` });
        dom.shade1.params({ d: `m ${length - 8},8 8,-8 -2.4,1 -6,6 z` });
        dom.shade2.params({ d: `M 8,8 H ${length - 8} L ${length - 8.4},7 H 7 Z` });
        dom.shade3.params({ d: 'M 8,16 V 8 L 7,7 v 8 z' });
        dom.shade4.params({ d: 'M 7,15 H 1 l -1,1 h 8 z' });
        dom.shade5.params({ d: 'M 0,0 V 16 L 1,15 V 1 Z' });
        dom.shade6.params({ d: `M 1,1 H ${length - 2.4} L ${length},0 H 0 Z` });
      };
    });
    const frame2 = this.dom('g', function () {
      const dom = {
        group: this,
        frame: this.dom('path.frame'),
        shade1: this.dom('path.light2'),
        shade2: this.dom('path.dark'),
        shade3: this.dom('path.dark2'),
        shade4: this.dom('path.light'),
      };

      return function (width: number) {
        const length = Math.ceil(width * 0.1) + 8;

        dom.group.params({ transform: `translate(${width * 0.75},${FRAME_OFFSET})` });
        dom.frame.params({ d: `M 8,0 H ${length} L ${length - 8},8 H 0 Z` });
        dom.shade1.params({ d: 'M 2.4,7 8.4,1 8,0 0,8 Z' });
        dom.shade2.params({ d: `M ${length - 8.4},7 H 2.4 L 0,8 h ${length - 8} z` });
        dom.shade3.params({ d: `m ${length - 2.4},1 -6,6 0.4,1 8,-8 z` });
        dom.shade4.params({ d: `M 8.4,1 H ${length - 2.4} L ${length},0 H 8 Z` });
      };
    });
    const frame3 = this.dom('g', function () {
      const dom = {
        group: this,
        frame: this.dom('path.frame'),
        shade1: this.dom('path.dark2'),
        shade2: this.dom('path.light'),
        shade3: this.dom('path.dark'),
        shade4: this.dom('path.light'),
      };

      return function (width: number, height: number) {
        const length = Math.ceil(width * 0.1);

        dom.group.params({ transform: `translate(${FRAME_OFFSET}, ${height - 8 - FRAME_OFFSET})` });
        dom.frame.params({ d: `M 0,0 V 8 H ${length - 8} L ${length},0 Z` });
        dom.shade1.params({ d: `m ${length - 2.4},1 -6,6 0.4,1 8,-8 z` });
        dom.shade2.params({ d: `M ${length},0 H 0 l 1,1 h ${length - 3.4} z` });
        dom.shade3.params({ d: `M 0,8 H ${length - 8} L ${length - 8.4},7 H 1 Z` });
        dom.shade4.params({ d: 'M 0,0 V 8 L 1,7 V 1 Z' });
      };
    });
    const frame4 = this.dom('g', function () {
      const dom = {
        group: this,
        frame: this.dom('path.frame'),
        shade1: this.dom('path.light'),
        shade2: this.dom('path.light2'),
        shade3: this.dom('path.dark'),
        shade4: this.dom('path.dark'),
        shade5: this.dom('path.light2'),
      };

      return function (width: number, height: number) {
        const length = Math.ceil(width * 0.55);

        dom.group.params({ transform: `translate(${width - length - FRAME_OFFSET}, ${height - 16 - FRAME_OFFSET})` });
        dom.frame.params({ d: `m ${length},0 -8,8 H 8 l -8,8 h ${length} z` });
        dom.shade1.params({ d: `m 8.4,9 h ${length - 16} L ${length - 8},8 H 8 Z` });
        dom.shade2.params({ d: 'M 2.4,15 8.4,9 8,8 0,16 Z' });
        dom.shade3.params({ d: `M ${length - 1},2.4 V 15 l 1,1 V 0 Z` });
        dom.shade4.params({ d: `m 0,16 h ${length} l -1,-1 H 2.4 Z` });
        dom.shade5.params({ d: `m ${length},0 -8,8 0.4,1 6.6,-6.6 z` });
      };
    });

    function set(width: number, height: number) {
      svg.params({ width, height, viewBox: `0 0 ${width} ${height}` });
      wire(width, height);
      frame1(width);
      frame2(width);
      frame3(width, height);
      frame4(width, height);
    }

    set(width, height);

    return {
      splux: this,
      set,
    };
  });
}
