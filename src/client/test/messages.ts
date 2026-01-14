/*
import type { Notification } from '../type';

export const MESSAGE: Notification<'channel.chat.message'> = {
  subscription: {
    type: 'channel.chat.message',
  },
  event: {
    broadcaster_user_id: '',
    broadcaster_user_login: '',
    broadcaster_user_name: '',
    chatter_user_id: '11111',
    chatter_user_name: '11112',
    chatter_user_login: '11113',
    channel_points_custom_reward_id: '',
    message_id: '',
    message_type: 'text',
    badges: [],
    message: {
      text: 'message text',
      fragments: [
        { type: 'text', text: 'message' },
        { type: 'text', text: 'text' },
      ],
    },
    color: '#FF0000',
    source_broadcaster_user_id: '',
    source_broadcaster_user_login: '',
    source_broadcaster_user_name: '',
    source_message_id: '',
  },
};

export function testMessage (handler: (message: Notification) => void) {
  (window as any).testMessage = function (event: Partial<Notification<'channel.chat.message'>['event']>) {
    handler({ ...MESSAGE, event: { ...MESSAGE.event, ...event } });
  }
  return handler;
}
*/
