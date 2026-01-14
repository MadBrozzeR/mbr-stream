import type { EventSubMessageMap } from './eventsub-types';

export type WSEventsMap = {
  keepalive: {};
  notification: EventSubMessageMap['notification']['payload'];
};

export type WSEvents = {
  [K in keyof WSEventsMap]: WSEvent<K>;
}[keyof WSEventsMap];

export type WSEvent<K extends keyof WSEventsMap = keyof WSEventsMap> = {
  type: K;
  payload: WSEventsMap[K];
};
