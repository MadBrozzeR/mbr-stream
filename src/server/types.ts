import type { Condition, Merge, OmitNever } from './type-helpers';

export type RequestParamValue = string | number | Array<string | number> | { [key: string]: RequestParamValue } | undefined;
export type RequestParams = Record<string, RequestParamValue>;
export type RESTMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type RequestUrl = string | [string, RequestParams];
/*
 * From here https://dev.twitch.tv/docs/authentication/scopes/
 * RegExp to parse: /<code class=".+?">(.+?)</code>.+\n.+?<td>([^<]+)/g
 * Replace with: "  | '$1' // $2\n"
 */
export type Scope =
  | 'analytics:read:extensions' // View analytics data for the Twitch Extensions owned by the authenticated account.
  | 'analytics:read:games' // View analytics data for the games owned by the authenticated account.
  | 'bits:read' // View Bits information for a channel.
  | 'channel:bot' // Joins your channel’s chatroom as a bot user, and perform chat-related actions as that user.
  | 'channel:manage:ads' // Manage ads schedule on a channel.
  | 'channel:read:ads' // Read the ads schedule and details on your channel.
  | 'channel:manage:broadcast' // Manage a channel’s broadcast configuration, including updating channel configuration and managing stream markers and stream tags.
  | 'channel:read:charity' // Read charity campaign details and user donations on your channel.
  | 'channel:manage:clips' // Manage Clips for a channel.
  | 'channel:edit:commercial' // Run commercials on a channel.
  | 'channel:read:editors' // View a list of users with the editor role for a channel.
  | 'channel:manage:extensions' // Manage a channel’s Extension configuration, including activating Extensions.
  | 'channel:read:goals' // View Creator Goals for a channel.
  | 'channel:read:guest_star' // Read Guest Star details for your channel.
  | 'channel:manage:guest_star' // Manage Guest Star for your channel.
  | 'channel:read:hype_train' // View Hype Train information for a channel.
  | 'channel:manage:moderators' // Add or remove the moderator role from users in your channel.
  | 'channel:read:polls' // View a channel’s polls.
  | 'channel:manage:polls' // Manage a channel’s polls.
  | 'channel:read:predictions' // View a channel’s Channel Points Predictions.
  | 'channel:manage:predictions' // Manage of channel’s Channel Points Predictions
  | 'channel:manage:raids' // Manage a channel raiding another channel.
  | 'channel:read:redemptions' // View Channel Points custom rewards and their redemptions on a channel.
  | 'channel:manage:redemptions' // Manage Channel Points custom rewards and their redemptions on a channel.
  | 'channel:manage:schedule' // Manage a channel’s stream schedule.
  | 'channel:read:stream_key' // View an authorized user’s stream key.
  | 'channel:read:subscriptions' // View a list of all subscribers to a channel and check if a user is subscribed to a channel.
  | 'channel:manage:videos' // Manage a channel’s videos, including deleting videos.
  | 'channel:read:vips' // Read the list of VIPs in your channel.
  | 'channel:manage:vips' // Add or remove the VIP role from users in your channel.
  | 'channel:moderate' // Perform moderation actions in a channel.
  | 'clips:edit' // Manage Clips for a channel.
  | 'editor:manage:clips' // Manage Clips as an editor.
  | 'moderation:read' // View a channel’s moderation data including Moderators, Bans, Timeouts, and Automod settings.
  | 'moderator:manage:announcements' // Send announcements in channels where you have the moderator role.
  | 'moderator:manage:automod' // Manage messages held for review by AutoMod in channels where you are a moderator.
  | 'moderator:read:automod_settings' // View a broadcaster’s AutoMod settings.
  | 'moderator:manage:automod_settings' // Manage a broadcaster’s AutoMod settings.
  | 'moderator:read:banned_users' // Read the list of bans or unbans in channels where you have the moderator role.
  | 'moderator:manage:banned_users' // Ban and unban users.
  | 'moderator:read:blocked_terms' // View a broadcaster’s list of blocked terms.
  | 'moderator:read:chat_messages' // Read deleted chat messages in channels where you have the moderator role.
  | 'moderator:manage:blocked_terms' // Manage a broadcaster’s list of blocked terms.
  | 'moderator:manage:chat_messages' // Delete chat messages in channels where you have the moderator role
  | 'moderator:read:chat_settings' // View a broadcaster’s chat room settings.
  | 'moderator:manage:chat_settings' // Manage a broadcaster’s chat room settings.
  | 'moderator:read:chatters' // View the chatters in a broadcaster’s chat room.
  | 'moderator:read:followers' // Read the followers of a broadcaster.
  | 'moderator:read:guest_star' // Read Guest Star details for channels where you are a Guest Star moderator.
  | 'moderator:manage:guest_star' // Manage Guest Star for channels where you are a Guest Star moderator.
  | 'moderator:read:moderators' // Read the list of moderators in channels where you have the moderator role.
  | 'moderator:read:shield_mode' // View a broadcaster’s Shield Mode status.
  | 'moderator:manage:shield_mode' // Manage a broadcaster’s Shield Mode status.
  | 'moderator:read:shoutouts' // View a broadcaster’s shoutouts.
  | 'moderator:manage:shoutouts' // Manage a broadcaster’s shoutouts.
  | 'moderator:read:suspicious_users' // Read chat messages from suspicious users and see users flagged as suspicious in channels where you have the moderator role.
  | 'moderator:read:unban_requests' // View a broadcaster’s unban requests.
  | 'moderator:manage:unban_requests' // Manage a broadcaster’s unban requests.
  | 'moderator:read:vips' // Read the list of VIPs in channels where you have the moderator role.
  | 'moderator:read:warnings' // Read warnings in channels where you have the moderator role.
  | 'moderator:manage:warnings' // Warn users in channels where you have the moderator role.
  | 'user:bot' // Join a specified chat channel as your user and appear as a bot, and perform chat-related actions as your user.
  | 'user:edit' // Manage a user object.
  | 'user:edit:broadcast' // View and edit a user’s broadcasting configuration, including Extension configurations.
  | 'user:read:blocked_users' // View the block list of a user.
  | 'user:manage:blocked_users' // Manage the block list of a user.
  | 'user:read:broadcast' // View a user’s broadcasting configuration, including Extension configurations.
  | 'user:read:chat' // Receive chatroom messages and informational notifications relating to a channel’s chatroom.
  | 'user:manage:chat_color' // Update the color used for the user’s name in chat.
  | 'user:read:email' // View a user’s email address.
  | 'user:read:emotes' // View emotes available to a user
  | 'user:read:follows' // View the list of channels a user follows.
  | 'user:read:moderated_channels' // Read the list of channels you have moderator privileges in.
  | 'user:read:subscriptions' // View if an authorized user is subscribed to specific channels.
  | 'user:read:whispers' // Receive whispers sent to your user.
  | 'user:manage:whispers' // Receive whispers sent to your user, and send whispers on your user’s behalf.
  | 'user:write:chat' // Send chat messages to a chatroom.
  | 'chat:edit' // Send chat messages to a chatroom using an IRC connection.
  | 'chat:read' // View chat messages sent in a chatroom using an IRC connection.
  | 'whispers:read'; // Receive whisper messages for your user using PubSub.

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

type EventSubTypeEntity<V extends number, C extends Record<string, Condition<any, any>>> = {
  conditions: C;
  version: V;
};

export type EventSubType = {
  'channel.follow': EventSubTypeEntity<2, {
    broadcaster_user_id: Condition;
    moderator_user_id: Condition;
  }>
  'channel.update': EventSubTypeEntity<2, {
    broadcaster_user_id: Condition;
  }>;
  'channel.chat.message': EventSubTypeEntity<1, {
    broadcaster_user_id: Condition;
    user_id: Condition;
  }>;
  'channel.chat.message_delete': EventSubTypeEntity<1, {
    broadcaster_user_id: Condition;
    user_id: Condition;
  }>;
  'channel.chat.notification': EventSubTypeEntity<1, {
    broadcaster_user_id: Condition;
    user_id: Condition;
  }>;
  'channel.subscribe': EventSubTypeEntity<1, {
    broadcaster_user_id: Condition;
  }>;
};

type EventTypeConditions<T extends keyof EventSubType> = Merge<OmitNever<{
  [K in keyof EventSubType[T]['conditions']]: EventSubType[T]['conditions'][K] extends Condition<infer T, true> ? T : never;
}> & Partial<OmitNever<{
  [K in keyof EventSubType[T]['conditions']]: EventSubType[T]['conditions'][K] extends Condition<infer T, false> ? T : never;
}>>>;

export type CreateEventSubSubscriptionRequest<T extends keyof EventSubType> = {
  type: T;
  version: `${EventSubType[T]['version']}`;
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

type EventSubStatus = 'enabled'
  | 'webhook_callback_verification_pending'
  | 'webhook_callback_verification_failed'
  | 'notification_failures_exceeded'
  | 'authorization_revoked'
  | 'moderator_removed'
  | 'user_removed'
  | 'chat_user_banned'
  | 'version_removed'
  | 'beta_maintenance'
  | 'websocket_disconnected'
  | 'websocket_failed_ping_pong'
  | 'websocket_received_inbound_traffic'
  | 'websocket_connection_unused'
  | 'websocket_internal_error'
  | 'websocket_network_timeout'
  | 'websocket_network_error'
  | 'websocket_failed_to_reconnect';

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

export type GetUsersRequest = { id?: string, login?: string };

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
