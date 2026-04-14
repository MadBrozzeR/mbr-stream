import type { StreamInfo, WSEvent, WSEventsMap } from '@common-types/ws-events';

type Cast<T extends string, P extends {}> = {
  type: T;
  payload: P;
};

export type Broadcast = {
  hashStateChange: Record<string, Record<string, string> | null>;
  eventSubEvent: WSEvent<'notification'>['payload'];
  streamInfo: StreamInfo;
  interfaceAction: 'chat-clear';
  showClip: { id: string; duration: number };
  getStreams: WSEventsMap['getStreams'];
  info: string;
};

export function createCast<K extends keyof Broadcast> (type: K, payload: Broadcast[K]): Cast<K, Broadcast[K]> {
  return { type, payload };
}

export function isCast<K extends keyof Broadcast> (type: K, data: any): data is Cast<K, Broadcast[K]> {
  return data.type === type;
}
