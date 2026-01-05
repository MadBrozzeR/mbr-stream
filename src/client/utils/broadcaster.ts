import { Notification } from '../type';

type Cast<T extends string, P extends {}> = {
  type: T;
  payload: P;
};

export type Broadcast = {
  hashStateChange: Record<string, Record<string, string> | null>;
  eventSubEvent: Notification;
};

export function createCast<K extends keyof Broadcast> (type: K, payload: Broadcast[K]): Cast<K, Broadcast[K]> {
  return { type, payload };
}

export function isCast<K extends keyof Broadcast> (type: K, data: any): data is Cast<K, Broadcast[K]> {
  return data.type === type;
}
