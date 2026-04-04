import type { EventSubMessageMap, MessageFragment } from './eventsub-types';
import type { GetClipsResponse } from '../types';

type Chatter = {
  id: string;
  name: string;
  login: string;
};

export type StreamInfo = {
  isOnline: boolean;
  viewers: number;
  chatters: Chatter[];
  userId: string;
  info: {
    title: string;
    category: string;
    language: string;
    tags: string;
  };
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

export type ChatCommand<T extends string = string> = {
  cmd: T;
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
  showClip: { id: string, duration: number; };
  info: string;
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
    response: StreamInfo | null;
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
  'get-categories': {
    request: { query: string; };
    response: Array<{ id: string; name: string; }>;
  },
  'update-stream-info': {
    request: { title: string; tags: string; category: string; language: string; };
    response: void;
  };
  'get-clips': {
    request: { broadcaster: string; };
    response: GetClipsResponse['data'];
  };
  'show-clip': {
    request: { id: string, duration: number; };
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
