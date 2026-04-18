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
  | { [key: string]: RequestParamValue<V> }[]
  | undefined;

export type RequestParams = Record<string, RequestParamValue>;
export type RESTMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type RequestUrl = string | [string, RequestParams] | [string, string, RequestParams];
export type Notification<T extends keyof EventSubType = keyof EventSubType> = EventSubNotification<T>['payload'];

export type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: Scope[];
  token_type: 'bearer';
};

export type CommandGroup = 'broadcaster' | 'moderator' | 'chatter' | 'artist';

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

export type GetChannelGuestStarSettingsRequest = {
  broadcaster_id: string;
  moderator_id: string;
};

export type GetChannelGuestStarSettingsResponse = {
  is_moderator_send_live_enabled: boolean;
  slot_count: number;
  is_browser_source_audio_enabled: boolean;
  group_layout: string;
  browser_source_token: string;
};

export type UpdateChannelGuestStarSettingsRequestParams = {
  broadcaster_id: string;
};

export type UpdateChannelGuestStarSettingsRequest = {
  is_moderator_send_live_enabled?: boolean;
  slot_count?: number;
  is_browser_source_audio_enabled?: boolean;
  group_layout?: string;
  regenerate_browser_sources?: boolean;
};

export type UpdateChannelGuestStarSettingsResponse = void;

export type GetGuestStarSessionRequest = {
  broadcaster_id: string;
  moderator_id: string;
};

export type GetGuestStarSessionResponse = {
  data: Array<{
    id: string;
    guests: Array<{
      slot_id: string;
      is_live: boolean;
      user_id: string;
      user_display_name: string;
      user_login: string;
      volume: number;
      assigned_at: string;
      audio_settings: {
        is_host_enabled: boolean;
        is_guest_enabled: boolean;
        is_available: boolean;
      };
      video_settings: {
        is_host_enabled: boolean;
        is_guest_enabled: boolean;
        is_available: boolean;
      };
    }>;
  }>;
};

export type CreateGuestStarSessionRequest = {
  broadcaster_id: string;
};

export type CreateGuestStarSessionResponse = {
  data: Array<{
    id: string;
    guests: Array<{
      slot_id: string;
      is_live: boolean;
      user_id: string;
      user_display_name: string;
      user_login: string;
      volume: number;
      assigned_at: string;
      audio_settings: {
        is_host_enabled: boolean;
        is_guest_enabled: boolean;
        is_available: boolean;
      };
      video_settings: {
        is_host_enabled: boolean;
        is_guest_enabled: boolean;
        is_available: boolean;
      };
    }>;
  }>;
};

export type EndGuestStarSessionRequest = {
  broadcaster_id: string;
  session_id: string;
};

export type EndGuestStarSessionResponse = {
  data: Array<{
    id: string;
    guests: Array<{
      slot_id: string;
      is_live: boolean;
      user_id: string;
      user_display_name: string;
      user_login: string;
      volume: number;
      assigned_at: string;
      audio_settings: {
        is_host_enabled: boolean;
        is_guest_enabled: boolean;
        is_available: boolean;
      };
      video_settings: {
        is_host_enabled: boolean;
        is_guest_enabled: boolean;
        is_available: boolean;
      };
    }>;
  }>;
};

export type GetGuestStarInvitesRequest = {
  broadcaster_id: string;
  moderator_id: string;
  session_id: string;
};

export type GetGuestStarInvitesResponse = {
  data: Array<{
    user_id: string;
    invited_at: string;
    status: 'INVITED' | 'ACCEPTED' | 'READY';
    is_video_enabled: boolean;
    is_audio_enabled: boolean;
    is_video_available: boolean;
    is_audio_available: boolean;
  }>;
};

export type SendGuestStarInviteRequest = {
  broadcaster_id: string;
  moderator_id: string;
  session_id: string;
  guest_id: string;
};

export type SendGuestStarInviteResponse = void;

export type DeleteGuestStarInviteRequest = {
  broadcaster_id: string;
  moderator_id: string;
  session_id: string;
  guest_id: string;
};

export type DeleteGuestStarInviteResponse = void;

export type AssignGuestStarSlotRequest = {
  broadcaster_id: string;
  moderator_id: string;
  session_id: string;
  guest_id: string;
  slot_id: string;
};

export type AssignGuestStarSlotResponse = void;

export type UpdateGuestStarSlotRequest = {
  broadcaster_id: string;
  moderator_id: string;
  session_id: string;
  source_slot_id: string;
  destination_slot_id: string;
};

export type UpdateGuestStarSlotResponse = void;

export type DeleteGuestStarSlotRequest = {
  broadcaster_id: string;
  moderator_id: string;
  session_id: string;
  guest_id: string;
  slot_id: string;
  should_reinvite_guest?: string;
};

export type DeleteGuestStarSlotResponse = void;

export type UpdateGuestStarSlotSettingsRequest = {
  broadcaster_id: string;
  moderator_id: string;
  session_id: string;
  slot_id: string;
  is_audio_enabled?: boolean;
  is_video_enabled?: boolean;
  is_live?: boolean;
  volume?: number;
};

export type UpdateGuestStarSlotSettingsResponse = void;

export type SendShoutoutRequest = {
  from_broadcaster_id: string;
  to_broadcaster_id: string;
  moderator_id: string;
};

export type SendShoutoutResponse = void;

export type SearchCategoriesRequest = {
  query: string;
  first?: number;
  after?: string;
};

export type SearchCategoriesResponse = {
  data: Array<{
    box_art_url: string;
    name: string;
    id: string;
  }>;
};

export type ModifyChannelInformationRequestParams = {
  broadcaster_id: string;
};

export type ModifyChannelInformationRequest = {
  game_id?: string;
  broadcaster_language?: string;
  title?: string;
  delay?: number;
  tags?: string[];
  content_classification_labels?: Array<{
    id: string;
    is_enabled: boolean;
  }>;
  is_branded_content?: boolean;
};

export type ModifyChannelInformationResponse = void;

export type GetClipsRequest = {
  broadcaster_id?: string;
  game_id?: string;
  id?: string;
  started_at?: string;
  ended_at?: string;
  first?: number;
  before?: string;
  after?: string;
  is_featured?: boolean;
};

export type GetClipsResponse = {
  data: Array<{
    id: string;
    url: string;
    embed_url: string;
    broadcaster_id: string;
    broadcaster_name: string;
    creator_id: string;
    creator_name: string;
    video_id: string;
    game_id: string;
    language: string;
    title: string;
    view_count: number;
    created_at: string;
    thumbnail_url: string;
    duration: number;
    vod_offset: number;
    is_featured: boolean;
  }>;
  pagination: {
    cursor: string;
  };
};

export type CreateCustomRewardsRequestParams = {
  broadcaster_id: string;
};

export type CreateCustomRewardsRequest = {
  title: string;
  cost: number;
  prompt?: string;
  is_enabled?: boolean;
  background_color?: string;
  is_user_input_required?: boolean;
  is_max_per_stream_enabled?: boolean;
  max_per_stream?: number;
  is_max_per_user_per_stream_enabled?: boolean;
  max_per_user_per_stream?: number;
  is_global_cooldown_enabled?: boolean;
  global_cooldown_seconds?: number;
  should_redemptions_skip_request_queue?: boolean;
};

export type CreateCustomRewardsResponse = {
  data: Array<{
    broadcaster_id: string;
    broadcaster_login: string;
    broadcaster_name: string;
    id: string;
    title: string;
    prompt: string;
    cost: number;
    image: {
      url_1x: string;
      url_2x: string;
      url_4x: string;
    };
    default_image: {
      url_1x: string;
      url_2x: string;
      url_4x: string;
    };
    background_color: string;
    is_enabled: string;
    is_user_input_required: string;
    max_per_stream_setting: {
      is_enabled: boolean;
      max_per_stream: number;
    };
    max_per_user_per_stream_setting: {
      is_enabled: boolean;
      max_per_user_per_stream: number;
    };
    global_cooldown_setting: {
      is_enabled: boolean;
      global_cooldown_seconds: number;
    };
    is_paused: boolean;
    is_in_stock: boolean;
    should_redemptions_skip_request_queue: boolean;
    redemptions_redeemed_current_stream: number;
    cooldown_expires_at: string;
  }>;
};

export type DeleteCustomRewardRequest = {
  broadcaster_id: string;
  id: string;
};

export type DeleteCustomRewardResponse = void;

export type GetCustomRewardRequest = {
  broadcaster_id: string;
  id?: string;
  only_manageable_rewards?: boolean;
};

export type GetCustomRewardResponse = {
  data: Array<{
    broadcaster_id: string;
    broadcaster_login: string;
    broadcaster_name: string;
    id: string;
    title: string;
    prompt: string;
    cost: number;
    image: {
      url_1x: string;
      url_2x: string;
      url_4x: string;
    };
    default_image: {
      url_1x: string;
      url_2x: string;
      url_4x: string;
    };
    background_color: string;
    is_enabled: string;
    is_user_input_required: string;
    max_per_stream_setting: {
      is_enabled: boolean;
      max_per_stream: number;
    };
    max_per_user_per_stream_setting: {
      is_enabled: boolean;
      max_per_user_per_stream: number;
    };
    global_cooldown_setting: {
      is_enabled: boolean;
      global_cooldown_seconds: number;
    };
    is_paused: boolean;
    is_in_stock: boolean;
    should_redemptions_skip_request_queue: boolean;
    redemptions_redeemed_current_stream: number;
    cooldown_expires_at: string;
  }>;
};

export type GetCustomRewardRedemptionRequest = {
  broadcaster_id: string;
  reward_id: string;
  status?: 'CANCELED' | 'FULFILLED' | 'UNFULFILLED';
  id?: string;
  sort?: string;
  after?: string;
  first?: string;
};

export type GetCustomRewardRedemptionResponse = {
  data: Array<{
    broadcaster_id: string;
    broadcaster_login: string;
    broadcaster_name: string;
    id: string;
    user_login: string;
    user_id: string;
    user_input: string;
    status: 'CANCELED' | 'FULFILLED' | 'UNFULFILLED';
    redeemed_at: string;
    reward: {
      id: string;
      title: string;
      prompt: string;
      cost: number;
    };
  }>;
};

export type UpdateCustomRewardRequestParams = {
  broadcaster_id: string;
  id: string;
};

export type UpdateCustomRewardRequest = {
  title: string;
  prompt?: string;
  cost: number;
  background_color?: string;
  is_enabled?: boolean;
  is_user_input_required?: boolean;
  is_max_per_stream_enabled?: boolean;
  max_per_stream?: number;
  is_max_per_user_per_stream_enabled?: boolean;
  max_per_user_per_stream?: number;
  is_global_cooldown_enabled?: boolean;
  global_cooldown_seconds?: number;
  is_paused?: boolean;
  should_redemptions_skip_request_queue?: boolean;
};

export type UpdateCustomRewardResponse = {
  data: Array<{
    broadcaster_id: string;
    broadcaster_login: string;
    broadcaster_name: string;
    id: string;
    title: string;
    prompt: string;
    cost: number;
    image: {
      url_1x: string;
      url_2x: string;
      url_4x: string;
    };
    default_image: {
      url_1x: string;
      url_2x: string;
      url_4x: string;
    };
    background_color: string;
    is_enabled: string;
    is_user_input_required: string;
    max_per_stream_setting: {
      is_enabled: boolean;
      max_per_stream: number;
    };
    max_per_user_per_stream_setting: {
      is_enabled: boolean;
      max_per_user_per_stream: number;
    };
    global_cooldown_setting: {
      is_enabled: boolean;
      global_cooldown_seconds: number;
    };
    is_paused: boolean;
    is_in_stock: boolean;
    should_redemptions_skip_request_queue: boolean;
    redemptions_redeemed_current_stream: number;
    cooldown_expires_at: string;
  }>;
};

export type UpdateRedemptionStatusRequestParams = {
  id: string;
  broadcaster_id: string;
  reward_id: string;
};

export type UpdateRedemptionStatusRequest = {
  status: 'CANCELED' | 'FULFILLED';
}

export type UpdateRedemptionStatusResponse = {
  data: Array<{
    broadcaster_id: string;
    broadcaster_login: string;
    broadcaster_name: string;
    id: string;
    user_id: string;
    user_name: string;
    user_login: string;
    reward: {
      id: string;
      title: string;
      prompt: string;
      cost: number;
    };
    user_input: string;
    status: 'CANCELED' | 'FULFILLED' | 'UNFULFILLED';
    redeemed_at: string;
  }>;
};

export type StartRaidRequest = {
  from_broadcaster_id: string;
  to_broadcaster_id: string;
};

export type StartRaidResponse = {
  data: Array<{
    created_at: string;
    is_mature: boolean;
  }>;
};

export type CancelRaidRequest = {
  broadcaster_id: string;
};

export type CancelRaidResponse = void;

/*
MACRO
:s/ //gIexport type ARequest = {};hiVkkkyPjjjjj:s/Request/Response/^wwyiwjjop^~:s/Response//>>>>A(params: Types.m18k02wyiw`1pa) {  return userApiRequest<Types.m15k02wyiw`1pa>();},0xx
*/
