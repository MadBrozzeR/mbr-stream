import { Component, Splux } from '../lib-ref/splux';
import { Host } from '../splux-host';
import type { EventType, Notification } from '../type';

export function isEventType<T extends EventType>(
  notification: Notification,
  ...types: T[]
): notification is {[K in T]: Notification<K>}[T] {
  for (let index = 0 ; index < types.length ; ++index) {
    if (notification.subscription.type === types[index]) {
      return true;
    }
  }

  return false;
}

function imageAtlasOffset (value: number) {
  return value ? ` ${-value}px` : '';
}

export function imageAtlas<K extends string> (url: string, parts: Record<K, [number, number, number, number]>) {
  const result = {} as Record<K, Record<'width' | 'height' | 'background', string>>;

  for (const key in parts) {
    result[key] = {
      width: `${parts[key][2]}px`,
      height: `${parts[key][3]}px`,
      background: `left${imageAtlasOffset(parts[key][0])} top${imageAtlasOffset(parts[key][1])} url("${url}") no-repeat`,
    };
  }

  return result;
}

export function isKeyOf<T extends {}> (key: string | number | symbol, source: T): key is keyof T {
  return key in source;
}

export function useModuleManager (
  root: Splux<any, Host>,
  components: Record<string, Component<any, Host, void, { id: string; }>>
) {
  const modules = Object.keys(components).reduce<Record<string, null | Splux<any, Host>>>(function (result, key) {
    result[key] = null;
    return result;
  }, {});

  return function (idSet: Record<string, unknown>) {
    for (const id in modules) {
      if (modules[id] && !(id in idSet)) {
        modules[id].remove();
        modules[id] = null;
      } else if (!modules[id] && id in idSet && components[id]) {
        modules[id] = root.dom(components[id], { id });
      }
    }
  }
}

export function zeroLead (value: number) {
  return value < 10 ? `0${value}` : value.toString();
}

export function changeModes (modes: Record<string, boolean>, newModes: string) {
  const newValues = newModes.split('|').reduce<Record<string, null>>(function (result, value) {
    result[value] = null;
    return result;
  }, {});

  for (const key in modes) {
    modes[key] = key in newValues;
  }

  return modes;
}

export function isDefined<T> (value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}
