import type { EventSubType } from '@eventsub-types';

export type EventType = keyof EventSubType;

export type EventPayloadData = {
  [K in keyof EventSubType]: EventSubType[K]['payload'];
};

export type Notification<T extends keyof EventPayloadData = keyof EventPayloadData> = {
  subscription: {
    type: T;
  };
  event: EventPayloadData[T];
};

export type NotificationToast = {
  text: string;
  timeout?: number;
  audio?: string;
};
