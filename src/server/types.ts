import type {
  EventSubNotification,
  EventSubStatus,
  EventSubType,
  EventSubTypeVersion,
  EventTypeConditions,
  Scope,
} from './common-types/eventsub-types';

export type RequestParamValue<V = string | number | boolean> =
  | V
  | V[]
  | { [key: string]: RequestParamValue<V> }
  | undefined;

export type RequestParams = Record<string, RequestParamValue>;
export type RESTMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type RequestUrl = string | [string, RequestParams];
export type Notification<T extends keyof EventSubType = keyof EventSubType> = EventSubNotification<T>['payload'];

export type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: Scope[];
  token_type: 'bearer';
};

export type GetChannelsInfoRequest = {
  broadcaster_id: string[];
};

export type GetChannelsInfoResponse = {
  data: Array<{
    broadcaster_id: string;
    broadcaster_login: string;
    broadcaster_name: string;
    broadcaster_language: string;
    game_name: string;
    game_id: string;
    title: string;
    delay: number;
    tags: string[];
    content_classification_labels: string[];
    is_branded_content: boolean;
  }>;
};

export type GetChannelFollowersRequest = {
  user_id?: string;
  broadcaster_id: string;
  first?: number;
  after?: string;
};

export type GetChannelFollowersResponse = {
  data: Array<{
    followed_at: string;
    user_id: string;
    user_login: string;
    user_name: string;
  }>;
  pagination: {
    cursor: string;
  };
  total: number;
};

export type GetStreamsRequest = {
  user_id?: string;
  user_login?: string;
  game_id?: string;
  type?: 'all' | 'live';
  language?: string;
  first?: number;
  before?: string;
  after?: string;
};

export type GetStreamsResponse = {
  data: Array<{
    id: string;
    user_id: string;
    user_login: string;
    user_name: string;
    game_id: string;
    game_name: string;
    type: 'live';
    title: string;
    tags: string[];
    viewer_count: number;
    started_at: string;
    language: string;
    thumbnail_url: string;
    is_mature: boolean;
  }>;
  pagination: {
    cursor: string;
  }
};

export type CreateEventSubSubscriptionRequest<T extends keyof EventSubType> = {
  type: T;
  version: EventSubTypeVersion<T>;
  condition: { [K in keyof EventTypeConditions<T>]: EventTypeConditions<T>[K] };
  transport: {
    method: 'webhook';
    callback: string;
    secret: string;
  } | {
    method: 'websocket';
    session_id: string;
  } | {
    method: 'conduit';
    conduit_id: string;
  };
};

export type CreateEventSubSubscriptionResponse<T extends keyof EventSubType> = {
  data: Array<{
    id: string;
    status: 'enabled' | 'webhook_callback_verification_pending';
    type: T;
    version: EventSubType[T]['version'];
    condition: { [K in keyof EventTypeConditions<T>]: EventTypeConditions<T>[K] };
    created_at: string;
    transport: { method: 'webhook'; callback: string }
      | { method: 'websocket'; session_id: string; connected_at: string }
      | { method: 'conduit'; conduit_id: string };
    cost: number;
  }>;
  total: number;
  total_cost: number;
  max_total_cost: number;
};

export type DeleteEventSubSubscriptionRequest = {
  id: string;
};

export type DeleteEventSubSubscriptionResponse = void;

export type GetEventSubSubscriptionRequest = {
  status?: EventSubStatus;
  type?: keyof EventSubType;
  user_id?: string;
  subscription_id?: string;
  after?: string;
};

export type GetEventSubSubscriptionResponse<T extends keyof EventSubType = keyof EventSubType> = {
  data: Array<{
    id: string;
    status: EventSubStatus;
    type: T;
    version: string;
    condition: { [K in keyof EventTypeConditions<T>]: EventTypeConditions<T>[K] };
    created_at: string;
    transport: {
      method: 'webhook';
      callback: string;
    } | {
      method: 'websocket';
      session_id: string;
      connected_at: string;
      disconnected_at: string;
    };
    cost: number;
  }>;
  total: number;
  total_cost: number;
  max_total_cost: number;
  pagination: {
    cursor: string;
  };
};

export type GetUsersRequest = { id?: string[], login?: string };

export type GetUsersResponse = {
  data: Array<{
    id: string;
    login: string;
    display_name: string;
    type: 'admin' | 'global_mod' | 'staff' | '';
    broadcaster_type: string;
    description: string;
    profile_image_url: string;
    offline_image_url: string;
    view_count: number;
    email?: string;
    created_at: string;
  }>;
};

export type GetChattersRequest = {
  broadcaster_id: string;
  moderator_id: string;
  first?: number;
  after?: number;
};

export type GetChattersResponse = {
  data: Array<{
    user_id: string;
    user_login: string;
    user_name: string;
  }>;
  pagination: {
    cursor: string;
  };
  total: number;
};

export type SendChatAnnouncementRequestParams = {
  broadcaster_id: string;
  moderator_id: string;
};

export type SendChatAnnouncementRequest = {
  message: string;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'primary';
};

export type SendChatAnnouncementResponse = void;

export type SendChatMessageRequest = {
  broadcaster_id: string;
  sender_id: string;
  message: string;
  reply_parent_message_id?: string;
  for_source_only?: boolean;
};

export type SendChatMessageResponse = {
  data: Array<{
    message_id: string;
    is_sent: boolean;
    drop_reason?: {
      code: string;
      message: string;
    };
  }>;
};

export type GetGlobalChatBadgesResponse = {
  data: Array<{
    set_id: string;
    versions: Array<{
      id: string;
      image_url_1x: string;
      image_url_2x: string;
      image_url_4x: string;
      title: string;
      description: string;
      click_action: string | null;
      click_url: string | null;
    }>;
  }>;
};

export type GetChannelChatBadgesRequest = {
  broadcaster_id: string;
};

export type GetChannelChatBadgesResponse = GetGlobalChatBadgesResponse;
