import type { EventSubMessageMap, MessageFragment } from './eventsub-types';

type Chatter = {
  id: string;
  name: string;
  login: string;
};

export type StreamInfo = {
  isOnline: boolean;
  viewers: number;
  chatters: Chatter[];
  title: string;
  userId: string;
};

export type BadgeData = {
  url: string;
  title: string;
  description: string;
  click: { url: string; text: string; } | null;
};

export type BadgeStore = {
  [id: string]: {
    [id: string]: BadgeData;
  };
};

export type UserStore = {
  name: string;
  image: string;
  description: string;
};

export type ChatCommand = {
  cmd: string;
  params: MessageFragment[];
};

export type WSEventsMap = {
  keepalive: {};
  notification: {
    event: EventSubMessageMap['notification']['payload'];
    user: UserStore | null;
    badges: BadgeData[];
    command: ChatCommand | null;
  };
  streamInfo: StreamInfo;
  interfaceAction: 'chat-clear';
  moduleSetup: { module: string; setup: Record<string, string> | null; };
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
  'module-setup': {
    request: { view: string; module: string; setup: Record<string, string> | null; }
    response: void;
  };
  'bot-say': {
    request: string;
    response: void;
  };
};

export type WSIncomeEvent<T extends keyof WSIncomeEventParams = keyof WSIncomeEventParams> = {
  [K in T]: WSIncomeEventParams[K]['request'] extends void ? {
    action: K;
  } : {
    action: K;
    payload: WSIncomeEventParams[K]['request'];
  }
}[T];

export type WSIncomeEventActions = keyof WSIncomeEventParams;

export type WSIncomeEventResponse<T extends WSIncomeEventActions> = Promise<WSIncomeEventParams[T]['response']>;
