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
