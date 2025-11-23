export type EventPayloadData = {
  'channel.chat.message': {
    broadcaster_user_id: string;
    broadcaster_user_name: string;
    broadcaster_user_login: string;
    chatter_user_id: string;
    chatter_user_name: string;
    chatter_user_login: string;
    message_id: string;
    message: {
      text: string;
      fragments: Array<{
        type: 'text' | 'cheermote' | 'emote' | 'mention';
        text: string;
        cheermote?: null | {
          prefix: string;
          bits: number;
          tier: number;
        };
        emote?: null | {
          id: string;
          emote_set_id: string;
          owner_id: string;
          format: Array<'static' | 'animated'>;
        };
        mention?: null | {
          user_id: string;
          user_name: string;
          user_login: string;
        };
      }>;
    };
    message_type: 'text' | 'channel_points_highlighted' | 'channel_points_sub_only' | 'user_intro' | 'power_ups_message_effect' | 'power_ups_gigantified_emote';
    badges: Array<{
      set_id: string;
      id: string;
      info: string;
    }>;
    cheer?: null | {
      bits: number;
    };
    color: string;
    reply?: null | {
      parent_message_id: string; //	An ID that uniquely identifies the parent message that this message is replying to.
      parent_message_body: string; //	The message body of the parent message.
      parent_user_id: string; //	User ID of the sender of the parent message.
      parent_user_name: string; //	User name of the sender of the parent message.
      parent_user_login: string; //	User login of the sender of the parent message.
      thread_message_id: string; //	An ID that identifies the parent message of the reply thread.
      thread_user_id: string; //	User ID of the sender of the thread’s parent message.
      thread_user_name: string; //	User name of the sender of the thread’s parent message.
      thread_user_login: string; //	User login of the sender of the thread’s parent message.
    };
    channel_points_custom_reward_id: null | string;
    source_broadcaster_user_id: null | string;
    source_broadcaster_user_name: null | string;
    source_broadcaster_user_login: null | string;
    source_message_id: null | string;
    source_badges?: null | {
      set_id: string;
      id: string;
      info: string;
    };
    is_source_only?: null | boolean;
  };
  'channel.follow': {
    user_id: string;
    user_login: string;
    user_name: string;
    broadcaster_user_id: string;
    broadcaster_user_login: string;
    broadcaster_user_name: string;
    followed_at: string;
  };
  'channel.subscribe': {
    user_id: string;
    user_login: string;
    user_name: string;
    broadcaster_user_id: string;
    broadcaster_user_login: string;
    broadcaster_user_name: string;
    tier: string;
    is_gift: boolean;
  };
};

export type EventType = keyof EventPayloadData;

export type Notification<T extends keyof EventPayloadData = keyof EventPayloadData> = {
  subscription: {
    type: T;
  };
  event: EventPayloadData[T];
};

export type NotificationToast = {
  text: string;
  timeout?: number;
};
