import type { EventSubNotification, EventSubType } from '@common-types/eventsub-types';

export type EventType = keyof EventSubType;

export type EventPayloadData = {
  [K in keyof EventSubType]: EventSubType[K]['payload'];
};

export type Notification<T extends EventType = EventType> = EventSubNotification<T>['payload'];

export type NotificationToast = {
  text: string;
  timeout?: number;
  audio?: string;
};

export type ChatMessageEvent = EventSubType['channel.chat.message']['payload'];
