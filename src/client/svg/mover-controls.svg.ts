import { SpluxSVG } from '/@client/utils/svg';
import { Styles } from '/@client/lib-ref/mbr-style';
import { isKeyOf } from '/@client/utils/utils';

const FILL_ACTIVE = '#002';
const FILL_ACTIVE_TRANSPARENT  = 'rgba(0 0 34 / 80%)';
const FILL_LOCKED = '#777';
const FILL_HOVER = '#00a';
const RESIZER_WIDTH = 5;
const RESIZER_MARGIN = 10;
const RESIZER_OFFSET = 2;
const MOVER_OFFSET = 2;
const MIDDLE_WIDTH = 30;
const MIDDLE_HEIGHT = MIDDLE_WIDTH;

const STYLES = Styles.compile({
  '.controls': {
    fill: FILL_ACTIVE,

    ':hover': {
      fill: FILL_HOVER,
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
    fill: FILL_ACTIVE_TRANSPARENT,
  },

  '.middle': {
    cursor: 'pointer',
  },

  '.controls-locked': {
    cursor: 'not-allowed',
    fill: FILL_LOCKED,

    ':hover': {
      fill: FILL_LOCKED,
    },
  },
});

type HandleName = 'resize-left' | 'resize-top' | 'resize-right' | 'resize-bottom' | 'move-left' | 'move-top' | 'move-bottom' | 'move-right' | 'move-top-left' | 'move-top-right' | 'move-bottom-left' | 'move-bottom-right' | 'click-middle';

type GeometryProps = {
  width: number;
  height: number;
};

type Props = {
  onAction: (handle: HandleName) => void;
};

export function MoverControlSvg (props: Props) {
  const resizerSize = RESIZER_WIDTH + RESIZER_OFFSET;
  const halfOffset = MOVER_OFFSET / 2;

  const handles: { [K in HandleName]?: SpluxSVG<SVGElement> } = {}

  function createActionListener (name: HandleName) {
    return function () {
      if (name in handles && handles[name] && !handles[name].node.classList.contains('controls-locked')) {
        props.onAction(name);
      }
    }
  }

  return SpluxSVG.createSvg({ width: 0, height: 0 }, function (svg) {
    this.dom('style', function () {
      this.node.innerHTML = STYLES;
    });
    const resizer = this.dom('g', function () {
      const dom = {
        left: handles['resize-left'] = this.dom('path.controls.resizer_horizontal'),
        top: handles['resize-top'] = this.dom('path.controls.resizer_vertical'),
        right: handles['resize-right'] = this.dom('path.controls.resizer_horizontal'),
        bottom: handles['resize-bottom'] = this.dom('path.controls.resizer_vertical'),
      };

      return function ({ width, height }: GeometryProps) {
        dom.left.params({ d: `M0,${RESIZER_MARGIN} l${RESIZER_WIDTH},${RESIZER_WIDTH} V${height - RESIZER_MARGIN - RESIZER_WIDTH} l-${RESIZER_WIDTH},${RESIZER_WIDTH} Z` });
        dom.top.params({ d: `M${RESIZER_MARGIN},0 l${RESIZER_WIDTH},${RESIZER_WIDTH} H${width - RESIZER_MARGIN - RESIZER_WIDTH} l${RESIZER_WIDTH},-${RESIZER_WIDTH} Z` });
        dom.right.params({ d: `M${width},${RESIZER_MARGIN} l-${RESIZER_WIDTH},${RESIZER_WIDTH} V${height - RESIZER_MARGIN - RESIZER_WIDTH} l${RESIZER_WIDTH},${RESIZER_WIDTH} Z` });
        dom.bottom.params({ d: `M${RESIZER_MARGIN},${height} l${RESIZER_WIDTH},-${RESIZER_WIDTH} H${width - RESIZER_MARGIN - RESIZER_WIDTH} l${RESIZER_WIDTH},${RESIZER_WIDTH} Z` });
      };
    });

    const mover = this.dom('g', function () {
      const dom = {
        topLeft: handles['move-top-left'] = this.dom('path.controls.mover'),
        topRight: handles['move-top-right'] = this.dom('path.controls.mover'),
        bottomLeft: handles['move-bottom-left'] = this.dom('path.controls.mover'),
        bottomRight: handles['move-bottom-right'] = this.dom('path.controls.mover'),
        left: handles['move-left'] = this.dom('path.controls.mover'),
        top: handles['move-top'] = this.dom('path.controls.mover'),
        bottom: handles['move-bottom'] = this.dom('path.controls.mover'),
        right: handles['move-right'] = this.dom('path.controls.mover'),
        middle: handles['click-middle'] = this.dom('rect.controls.middle'),
      };

      return function ({ width, height }: GeometryProps) {
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const linearMoverWidth = width / 5;
        const linearMoverHeight = height / 5;
        const halfLinearMoverWidth = linearMoverWidth / 2;
        const halfLinearMoverHeight = linearMoverHeight / 2;
        const currentMiddleWidth = Math.min(MIDDLE_WIDTH, linearMoverWidth);
        const currentMiddleHeight = Math.min(MIDDLE_HEIGHT, linearMoverHeight);
        const halfMiddleWidth = currentMiddleWidth / 2;
        const halfMiddleHeight = currentMiddleHeight / 2;

        dom.left.params({ d:
          `M${resizerSize},${halfHeight - halfLinearMoverHeight}` +
          `H${resizerSize + linearMoverWidth}` +
          `V${halfHeight + halfLinearMoverHeight}` +
          `H${resizerSize}`
        });
        dom.top.params({ d:
          `M${halfWidth - halfLinearMoverWidth},${resizerSize}` +
          `V${resizerSize + linearMoverHeight}` +
          `H${halfWidth + halfLinearMoverWidth}` +
          `V${resizerSize}`
        });
        dom.bottom.params({ d:
          `M${halfWidth - halfLinearMoverWidth},${height - resizerSize}` +
          `V${height - resizerSize - linearMoverHeight}` +
          `H${halfWidth + halfLinearMoverWidth}` +
          `V${height - resizerSize}`
        });
        dom.right.params({ d:
          `M${width - resizerSize},${halfHeight - halfLinearMoverHeight}` +
          `H${width - resizerSize - linearMoverWidth}` +
          `V${halfHeight + halfLinearMoverHeight}` +
          `H${width - resizerSize}`
        });
        dom.topLeft.params({ d:
          `M${resizerSize},${resizerSize}` +
          `H${halfWidth - halfLinearMoverWidth - MOVER_OFFSET}` +
          `V${resizerSize + linearMoverHeight + MOVER_OFFSET}` +
          `H${halfWidth - MOVER_OFFSET}` +
          `V${halfHeight - halfMiddleHeight - MOVER_OFFSET}` +
          `H${halfWidth - halfMiddleWidth - MOVER_OFFSET}` +
          `V${halfHeight - halfOffset}` +
          `H${resizerSize + linearMoverWidth + MOVER_OFFSET}` +
          `V${halfHeight - halfLinearMoverHeight - MOVER_OFFSET}` +
          `H${resizerSize}`
        });
        dom.topRight.params({ d:
          `M${width - resizerSize},${resizerSize}` +
          `H${halfWidth + halfLinearMoverWidth + MOVER_OFFSET}` +
          `V${resizerSize + linearMoverHeight + MOVER_OFFSET}` +
          `H${halfWidth + halfOffset}` +
          `V${halfHeight - halfMiddleHeight - MOVER_OFFSET}` +
          `H${halfWidth + halfMiddleWidth + MOVER_OFFSET}` +
          `V${halfHeight - halfOffset}` +
          `H${width - resizerSize - linearMoverWidth - MOVER_OFFSET}` +
          `V${halfHeight - halfLinearMoverHeight - MOVER_OFFSET}` +
          `H${width - resizerSize}`
        });
        dom.bottomLeft.params({ d:
          `M${resizerSize},${height - resizerSize}` +
          `H${halfWidth - halfLinearMoverWidth - MOVER_OFFSET}` +
          `V${height - resizerSize - linearMoverHeight - MOVER_OFFSET}` +
          `H${halfWidth - halfOffset}` +
          `V${halfHeight + halfMiddleHeight + MOVER_OFFSET}` +
          `H${halfWidth - halfMiddleWidth - MOVER_OFFSET}` +
          `V${halfHeight + halfOffset}` +
          `H${resizerSize + linearMoverWidth + MOVER_OFFSET}` +
          `V${halfHeight + halfLinearMoverHeight + MOVER_OFFSET}` +
          `H${resizerSize}`
        });
        dom.bottomRight.params({ d:
          `M${width - resizerSize},${height - resizerSize}` +
          `H${halfWidth + halfLinearMoverWidth + MOVER_OFFSET}` +
          `V${height - resizerSize - linearMoverHeight - MOVER_OFFSET}` +
          `H${halfWidth + halfOffset}` +
          `V${halfHeight + halfMiddleHeight + MOVER_OFFSET}` +
          `H${halfWidth + halfMiddleWidth + MOVER_OFFSET}` +
          `V${halfHeight + halfOffset}` +
          `H${width - resizerSize - linearMoverWidth - MOVER_OFFSET}` +
          `V${halfHeight + halfLinearMoverHeight + MOVER_OFFSET}` +
          `H${width - resizerSize}`
        });
        dom.middle.params({
          x: halfWidth - halfMiddleWidth,
          y: halfHeight - halfMiddleHeight,
          width: currentMiddleWidth,
          height: currentMiddleHeight,
        });
      }
    });

    for (const key in handles) if (isKeyOf(key, handles) && handles[key]) {
      handles[key].node.onmousedown = createActionListener(key);
    }

    function set (props: GeometryProps) {
      svg.params({ width: props.width, height: props.height, viewBox: `0 0 ${props.width} ${props.height}` });
      resizer(props);
      mover(props);
    };

    function anchor (handleNames: Partial<Record<HandleName, boolean | undefined>>) {
      for (const key in handles) if (isKeyOf(key, handles) && handles[key]) {
        if (handleNames[key] === true) {
          handles[key].node.classList.add('controls-locked');
        } else if (handleNames[key] === false) {
          handles[key].node.classList.remove('controls-locked');
        }
      }
    }

    return {
      splux: this,
      anchor,
      set,
    };
  });
}
