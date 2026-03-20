import type { Splux } from '../lib-ref/splux';
import { newComponent } from '../splux-host';
import { MoverControlSvg } from '../svg/mover-controls.svg';
import type { Values } from '../type';
import { step, transitionUpdater } from '../utils/utils';

type MoverChangeParams = {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  width?: string;
  height?: string;
};

type MoverControlsProps = {
  onChange?: (params: MoverChangeParams) => void;
  onPreview?: (params: MoverChangeParams) => void;
  onSetupClick?: () => void;
  component: Splux<HTMLElement, any>;
};

export const MoverControls = newComponent('div.mover_controls', function (moverControlsSpl, {
  onChange,
  onPreview,
  onSetupClick,
  component,
}: MoverControlsProps) {
  const host = this.host;
  const controls = MoverControlSvg({
    onAction(handle) {
      switch (handle) {
        case 'move-top-left': {
          const box = host.getModulePosition(moverControlsSpl);
          const value = { x: box.left, y: box.top };

          host.dragger({
            move(x, y) {
              value.x = step(box.left + x, 10);
              value.y = step(box.top + y, 10);
              onPreview && onPreview({ left: value.x + 'px', top: value.y + 'px', right: '', bottom: '' });
            },
            apply() {
              onChange && onChange({ left: value.x + 'px', top: value.y + 'px', right: '', bottom: '' });
            },
            wheel(direction) {
              if (direction === 'up') {
                value.x += 1;
                value.y += 1;
              } else {
                value.x -= 1;
                value.y -= 1;
              }
              onPreview && onPreview({ left: value.x + 'px', top: value.y + 'px', right: '', bottom: '' });
            }
          });

          break;
        }
        case 'move-top-right': {
          const box = host.getModulePosition(moverControlsSpl);
          const value = { x: box.right, y: box.top };

          host.dragger({
            move(x, y) {
              value.x = step(box.right - x, 10);
              value.y = step(box.top + y, 10);
              onPreview && onPreview({ right: value.x + 'px', top: value.y + 'px', left: '', bottom: '' });
            },
            apply() {
              onChange && onChange({ right: value.x + 'px', top: value.y + 'px', left: '', bottom: '' });
            },
            wheel(direction) {
              if (direction === 'up') {
                value.x += 1;
                value.y += 1;
              } else {
                value.x -= 1;
                value.y -= 1;
              }
              onPreview && onPreview({ right: value.x + 'px', top: value.y + 'px',left: '', bottom: '' });
            }
          });

          break;
        }
        case 'move-bottom-left': {
          const box = host.getModulePosition(moverControlsSpl);
          const value = { x: box.left, y: box.bottom };

          host.dragger({
            move(x, y) {
              value.x = step(box.left + x, 10);
              value.y = step(box.bottom - y, 10);
              onPreview && onPreview({ left: value.x + 'px', bottom: value.y + 'px', right: '', top: '' });
            },
            apply() {
              onChange && onChange({ left: value.x + 'px', bottom: value.y + 'px', right: '', top: '' });
            },
            wheel(direction) {
              if (direction === 'up') {
                value.x += 1;
                value.y += 1;
              } else {
                value.x -= 1;
                value.y -= 1;
              }
              onPreview && onPreview({ left: value.x + 'px', bottom: value.y + 'px', right: '', top: '' });
            }
          });

          break;
        }
        case 'move-bottom-right': {
          const box = host.getModulePosition(moverControlsSpl);
          const value = { x: box.right, y: box.bottom };

          host.dragger({
            move(x, y) {
              value.x = step(box.right - x, 10);
              value.y = step(box.bottom - y, 10);
              onPreview && onPreview({ right: value.x + 'px', bottom: value.y + 'px', left: '', top: '' });
            },
            apply() {
              onChange && onChange({ right: value.x + 'px', bottom: value.y + 'px', left: '', top: '' });
            },
            wheel(direction) {
              if (direction === 'up') {
                value.x += 1;
                value.y += 1;
              } else {
                value.x -= 1;
                value.y -= 1;
              }
              onPreview && onPreview({ right: value.x + 'px', bottom: value.y + 'px', left: '', top: '' });
            }
          });

          break;
        }
        case 'move-left': {
          const box = host.getModulePosition(moverControlsSpl);
          let value = box.left;

          host.dragger({
            move(x) {
              value = step(box.left + x, 10);
              onPreview && onPreview({ left: value + 'px', right: '' });
            },
            apply() {
              onChange && onChange({ left: value + 'px', right: '' });
            },
            wheel(direction) {
              value += direction === 'up' ? 1 : -1;
              onPreview && onPreview({ left: value + 'px', right: '' });
            },
          });
          break;
        }
        case 'move-top': {
          const box = host.getModulePosition(moverControlsSpl);
          let value = box.top;

          host.dragger({
            move(_x, y) {
              value = step(box.top + y, 10);
              onPreview && onPreview({ top: value + 'px', bottom: '' });
            },
            apply() {
              onChange && onChange({ top: value + 'px', bottom: '' });
            },
            wheel(direction) {
              value += direction === 'up' ? 1 : -1;
              onPreview && onPreview({ top: value + 'px', bottom: '' });
            },
          });
          break;
        }
        case 'move-bottom': {
          const box = host.getModulePosition(moverControlsSpl);
          let value = box.bottom;

          host.dragger({
            move(_x, y) {
              value = step(box.bottom - y, 10);
              onPreview && onPreview({ bottom: value + 'px', top: '' });
            },
            apply() {
              onChange && onChange({ bottom: value + 'px', top: '' });
            },
            wheel(direction) {
              value += direction === 'up' ? 1 : -1;
              onPreview && onPreview({ bottom: value + 'px', top: '' });
            },
          });
          break;
        }
        case 'move-right': {
          const box = host.getModulePosition(moverControlsSpl);
          let value = box.right;

          host.dragger({
            move(x) {
              value = step(box.right - x, 10);
              onPreview && onPreview({ right: value + 'px', left: '' });
            },
            apply() {
              onChange && onChange({ right: value + 'px', left: '' });
            },
            wheel(direction) {
              value += direction === 'up' ? 1 : -1;
              onPreview && onPreview({ right: value + 'px', left: '' });
            },
          });
          break;
        }
        case 'resize-left': {
          const box = host.getModulePosition(moverControlsSpl);
          let value = box.width;

          host.dragger({
            move(x) {
              value = step(box.width - x, 10);
              onPreview && onPreview({ width: value + 'px' });
              controls.set({ width: value, height: box.height });
            },
            apply() {
              onChange && onChange({ width: value + 'px' });
            },
            wheel(direction) {
              value += direction === 'up' ? 1 : -1;
              onPreview && onPreview({ width: value + 'px' });
              controls.set({ width: value, height: box.height });
            },
          });
          break;
        }
        case 'resize-right': {
          const box = host.getModulePosition(moverControlsSpl);
          let value = box.width;

          host.dragger({
            move(x) {
              value = step(box.width + x, 10);
              onPreview && onPreview({ width: value + 'px' });
              controls.set({ width: value, height: box.height });
            },
            apply() {
              onChange && onChange({ width: value + 'px' });
            },
            wheel(direction) {
              value += direction === 'up' ? 1 : -1;
              onPreview && onPreview({ width: value + 'px' });
              controls.set({ width: value, height: box.height });
            },
          });
          break;
        }
        case 'resize-top': {
          const box = host.getModulePosition(moverControlsSpl);
          let value = box.height;

          host.dragger({
            move(_x, y) {
              value = step(box.height - y, 10);
              onPreview && onPreview({ height: value + 'px' });
              controls.set({ width: box.width, height: value });
            },
            apply() {
              onChange && onChange({ height: value + 'px' });
            },
            wheel(direction) {
              value += direction === 'up' ? 1 : -1;
              onPreview && onPreview({ height: value + 'px' });
              controls.set({ width: box.width, height: value });
            },
          });
          break;
        }
        case 'resize-bottom': {
          const box = host.getModulePosition(moverControlsSpl);
          let value = box.height;

          host.dragger({
            move(_x, y) {
              value = step(box.height + y, 10);
              onPreview && onPreview({ height: value + 'px' });
              controls.set({ width: box.width, height: value });
            },
            apply() {
              onChange && onChange({ height: value + 'px' });
            },
            wheel(direction) {
              value += direction === 'up' ? 1 : -1;
              onPreview && onPreview({ height: value + 'px' });
              controls.set({ width: box.width, height: value });
            },
          });
          break;
        }
        case 'click-middle': {
          onSetupClick && onSetupClick();
        }
      }
    },
  });
  this.node.appendChild(controls.splux.node);
  let lastSizeKey = '';

  return {
    update(time = 0, values?: Values) {
      if (values) {
        controls.anchor({
          'resize-top': !!values['top'],
          'resize-bottom': !!values['bottom'],
          'resize-left': !!values['left'],
          'resize-right': !!values['right'],
        });
      }

      transitionUpdater(time, function () {
        const box = host.getModulePosition(component);
        const currentSizeKey = box.width + '/' + box.height;
        if (currentSizeKey !== lastSizeKey) {
          lastSizeKey = currentSizeKey;
          controls.set({ width: box.width, height: box.height });
        }
      });
    }
  };
});

export function appendMoverShowListeners (component: Splux<HTMLElement, any>, key: number) {
  let visible = false;

  document.addEventListener('keydown', function (event) {
    if (event.keyCode === key) {
      visible = true;
      component.node.classList.add('show_mover_controls');
    }
  });
  document.addEventListener('keyup', function (event) {
    if (event.keyCode === key) {
      visible = false;
      component.node.classList.remove('show_mover_controls');
    }
  });
  document.addEventListener('visibilitychange', function () {
    if (visible) {
      visible = false;
      component.node.classList.remove('show_mover_controls');
    }
  });
}
