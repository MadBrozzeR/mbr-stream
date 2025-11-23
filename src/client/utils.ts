import type { EventType, Notification } from './type';

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
