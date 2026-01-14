import type { EventSubMessageMap } from './eventsub-types';

type Chatter = {
  id: string;
  name: string;
  login: string;
};

export type StreamInfo = {
  isOnline: boolean;
  viewers: number;
  chatters: Chatter[];
};

export type WSEventsMap = {
  keepalive: {};
  notification: EventSubMessageMap['notification']['payload'];
  streamInfo: StreamInfo;
};

export type WSEvents = {
  [K in keyof WSEventsMap]: WSEvent<K>;
}[keyof WSEventsMap];

export type WSEvent<K extends keyof WSEventsMap = keyof WSEventsMap> = {
  type: K;
  payload: WSEventsMap[K];
};
