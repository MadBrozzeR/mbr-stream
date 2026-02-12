import { Splux } from '../lib-ref/splux';

type Origin = { x: number, y: number };
export type DraggerListeners = {
  move?: (x: number, y: number, origin: { x: number, y: number }) => void;
  apply?: (x: number, y: number, origin: { x: number, y: number }) => void;
}

export function setDragger (root: Splux<HTMLElement, any>) {
  let currentListeners: DraggerListeners | null = null;
  let origin: Origin | null = null;

  function handleMove (event: MouseEvent) {
    event.preventDefault();
    if (origin && currentListeners && currentListeners.move) {
      currentListeners.move(event.clientX - origin.x, event.clientY - origin.y, origin);
    }
  }

  function handleMouseUp (event: MouseEvent) {
    root.node.removeEventListener('mousemove', handleMove);
    root.node.removeEventListener('mouseup', handleMouseUp);

    if (origin && currentListeners && currentListeners.apply) {
      currentListeners.apply(event.clientX - origin.x, event.clientY - origin.y, origin);
    }

    currentListeners = origin = null;
  }

  function handleMouseDown (event: MouseEvent) {
    if (currentListeners) {
      origin = { x: event.clientX, y: event.clientY };
    }
  }

  root.node.addEventListener('mousedown', handleMouseDown);

  return function (listeners: DraggerListeners) {
    currentListeners = listeners;

    root.node.addEventListener('mousemove', handleMove);
    root.node.addEventListener('mouseup', handleMouseUp);
  };
}
