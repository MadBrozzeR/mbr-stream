import type { EventSubNotification, EventSubType, Message } from '@common-types/eventsub-types';

export type EventType = keyof EventSubType;

export type EventPayloadData = {
  [K in keyof EventSubType]: EventSubType[K]['payload'];
};

export type Notification<T extends EventType = EventType> = EventSubNotification<T>['payload'];

export type NotificationToast = {
  text: string | Message;
  timeout?: number;
  audio?: string;
};

export type ChatMessageEvent = Message;
