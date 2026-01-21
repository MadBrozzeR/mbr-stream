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
  interfaceAction: 'chat-clear';
};

export type WSEvents = {
  [K in keyof WSEventsMap]: WSEvent<K>;
}[keyof WSEventsMap];

export type WSEvent<K extends keyof WSEventsMap = keyof WSEventsMap> = {
  type: K;
  payload: WSEventsMap[K];
};

export type WSIncomeEventParams = {
  'get-stream-info': {
    request: void;
    response: StreamInfo;
  };
  'clear-all-chats': {
    request: void;
    response: void;
  };
};

export type WSIncomeEvent<T extends keyof WSIncomeEventParams = keyof WSIncomeEventParams> = {
  [K in T]: WSIncomeEventParams[K]['request'] extends void ? {
    action: K;
  } : {
    action: K;
    payload: WSIncomeEventParams;
  }
}[T];

export type WSIncomeEventActions = keyof WSIncomeEventParams;

export type WSIncomeEventResponse<T extends WSIncomeEventActions> = Promise<WSIncomeEventParams[T]['response']>;
