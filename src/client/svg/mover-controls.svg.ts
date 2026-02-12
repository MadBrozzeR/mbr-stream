import { SpluxSVG } from '../utils/svg';
import { Styles } from '../lib-ref/mbr-style';

const RESIZER_WIDTH = 5;
const RESIZER_MARGIN = 10;
const RESIZER_OFFSET = 2;
const MOVER_OFFSET = 2;
const MIDDLE_WIDTH = 30;
const MIDDLE_HEIGHT = MIDDLE_WIDTH;

const STYLES = Styles.compile({
  '.controls': {
    fill: '#002',

    ':hover': {
      fill: '#00a',
    },
  },

  '.resizer_horizontal': {
    cursor: 'col-resize',
  },

  '.resizer_vertical': {
    cursor: 'row-resize',
  },

  '.mover': {
    cursor: 'move',
  },

  '.middle': {
    cursor: 'pointer',
  },
});

type HandleName = 'resize-left' | 'resize-top' | 'resize-right' | 'resize-bottom' | 'move-top-left' | 'move-top-right' | 'move-bottom-left' | 'move-bottom-right' | 'click-middle';

type GeometryProps = {
  width: number;
  height: number;
};

type Props = {
  onAction: (handle: HandleName) => void;
};

export function MoverControlSvg (props: Props) {
  const halfOffset = MOVER_OFFSET / 2;
  const halfMiddleWidth = MIDDLE_WIDTH / 2;
  const halfMiddleHeight = MIDDLE_HEIGHT / 2;

  function createActionListener (name: HandleName) {
    return function () {
      props.onAction(name);
    }
  }

  return SpluxSVG.createSvg({ width: 0, height: 0 }, function (svg) {
    this.dom('style', function () {
      this.node.innerHTML = STYLES;
    });
    const resizer = this.dom('g', function () {
      const dom = {
        left: this.dom('path.controls.resizer_horizontal'),
        top: this.dom('path.controls.resizer_vertical'),
        right: this.dom('path.controls.resizer_horizontal'),
        bottom: this.dom('path.controls.resizer_vertical'),
      };

      dom.left.node.onmousedown = createActionListener('resize-left');
      dom.top.node.onmousedown = createActionListener('resize-top');
      dom.right.node.onmousedown = createActionListener('resize-right');
      dom.bottom.node.onmousedown = createActionListener('resize-bottom');

      return function ({ width, height }: GeometryProps) {
        dom.left.params({ d: `M0,${RESIZER_MARGIN} l${RESIZER_WIDTH},${RESIZER_WIDTH} V${height - RESIZER_MARGIN - RESIZER_WIDTH} l-${RESIZER_WIDTH},${RESIZER_WIDTH} Z` });
        dom.top.params({ d: `M${RESIZER_MARGIN},0 l${RESIZER_WIDTH},${RESIZER_WIDTH} H${width - RESIZER_MARGIN - RESIZER_WIDTH} l${RESIZER_WIDTH},-${RESIZER_WIDTH} Z` });
        dom.right.params({ d: `M${width},${RESIZER_MARGIN} l-${RESIZER_WIDTH},${RESIZER_WIDTH} V${height - RESIZER_MARGIN - RESIZER_WIDTH} l${RESIZER_WIDTH},${RESIZER_WIDTH} Z` });
        dom.bottom.params({ d: `M${RESIZER_MARGIN},${height} l${RESIZER_WIDTH},-${RESIZER_WIDTH} H${width - RESIZER_MARGIN - RESIZER_WIDTH} l${RESIZER_WIDTH},${RESIZER_WIDTH} Z` });
      };
    });

    const mover = this.dom('g', function () {
      const dom = {
        topLeft: this.dom('path.controls.mover'),
        topRight: this.dom('path.controls.mover'),
        bottomLeft: this.dom('path.controls.mover'),
        bottomRight: this.dom('path.controls.mover'),
        middle: this.dom('rect.controls.middle'),
      };

      dom.topLeft.node.onmousedown = createActionListener('move-top-left');
      dom.topRight.node.onmousedown = createActionListener('move-top-right');
      dom.bottomLeft.node.onmousedown = createActionListener('move-bottom-left');
      dom.bottomRight.node.onmousedown = createActionListener('move-bottom-right');
      dom.middle.node.onclick = createActionListener('click-middle');

      return function ({ width, height }: GeometryProps) {
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        dom.topLeft.params({ d:
          `M${RESIZER_WIDTH + RESIZER_OFFSET},${RESIZER_WIDTH + RESIZER_OFFSET}` +
          `H${halfWidth - halfOffset}` +
          `V${halfHeight - halfMiddleHeight - MOVER_OFFSET}` +
          `H${halfWidth - halfMiddleWidth - MOVER_OFFSET}` +
          `V${halfHeight - halfOffset}` +
          `H${RESIZER_WIDTH + RESIZER_OFFSET}`
        });
        dom.topRight.params({ d:
          `M${width - RESIZER_WIDTH - RESIZER_OFFSET},${RESIZER_WIDTH + RESIZER_OFFSET}` +
          `H${halfWidth + halfOffset}` +
          `V${halfHeight - halfMiddleHeight - MOVER_OFFSET}` +
          `H${halfWidth + halfMiddleWidth + MOVER_OFFSET}` +
          `V${halfHeight - halfOffset}` +
          `H${width - RESIZER_WIDTH - RESIZER_OFFSET}`
        });
        dom.bottomLeft.params({ d:
          `M${RESIZER_WIDTH + RESIZER_OFFSET},${height - RESIZER_WIDTH - RESIZER_OFFSET}` +
          `H${halfWidth - halfOffset}` +
          `V${halfHeight + halfMiddleHeight + MOVER_OFFSET}` +
          `H${halfWidth - halfMiddleWidth - MOVER_OFFSET}` +
          `V${halfHeight + halfOffset}` +
          `H${RESIZER_WIDTH + RESIZER_OFFSET}`
        });
        dom.bottomRight.params({ d:
          `M${width - RESIZER_WIDTH - RESIZER_OFFSET},${height - RESIZER_WIDTH - RESIZER_OFFSET}` +
          `H${halfWidth + halfOffset}` +
          `V${halfHeight + halfMiddleHeight + MOVER_OFFSET}` +
          `H${halfWidth + halfMiddleWidth + MOVER_OFFSET}` +
          `V${halfHeight + halfOffset}` +
          `H${width - RESIZER_WIDTH - RESIZER_OFFSET}`
        });
        dom.middle.params({
          x: halfWidth - halfMiddleWidth,
          y: halfHeight - halfMiddleHeight,
          width: MIDDLE_WIDTH,
          height: MIDDLE_HEIGHT,
        });
      }
    });

    function set (props: GeometryProps) {
      svg.params({ width: props.width, height: props.height, viewBox: `0 0 ${props.width} ${props.height}` });
      resizer(props);
      mover(props);
    };

    return {
      splux: this,
      set,
    };
  });
}
