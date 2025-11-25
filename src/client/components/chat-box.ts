import { newComponent } from '../splux-host';
import type { EventPayloadData } from '../type';

const TIMEOUT = 1000;

const TEST_MODE: { isActive: boolean, message: EventPayloadData['channel.chat.message'] } = {
  isActive: true,
  message: {
    broadcaster_user_id: '',
    broadcaster_user_login: '',
    broadcaster_user_name: '',
    chatter_user_id: '',
    chatter_user_login: '',
    chatter_user_name: 'chatter',
    message_id: '',
    message_type: 'text',
    message: {
      text: 'Message text, that is not too short, but still not too long',
      fragments: [],
    },
    badges: [],
    source_broadcaster_user_id: '',
    source_broadcaster_user_login: '',
    source_broadcaster_user_name: '',
    source_message_id: '',
    color: '',
    channel_points_custom_reward_id: '',
  },
};

const STYLES = {
  '.chatbox': {
    position: 'absolute',
    height: '20%',
    width: '50%',
    bottom: '20px',
    left: '20px',
    overflow: 'hidden',

    '--log': {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
    },

    '--entry': {
      lineHeight: '24px',
      fontSize: '20px',
      padding: '2px',
      backgroundColor: 'rgba(0, 0, 12, 0.2)',
      textShadow: '-1px -1px black, 1px -1px black, -1px 1px black, 1px 1px black',
      color: 'white',

      '-dim': {
        opacity: '0.5',
        transition: '.5s opacity ease-in-out',
      },
    },
  },
};

export const ChatBox = newComponent('div', function () {
  const host = this.host;

  this.setParams({
    className: 'chatbox',
    onclick() {
      if (TEST_MODE.isActive) {
        host.appendMessage(TEST_MODE.message);
      }
    },
  });

  this.host.styles.add('chat', STYLES);

  this.dom('div', function () {
    const log = this.setParams({ className: 'chatbox--log' });

    this.host.appendMessage = function (messageEvent) {
      const entry = log.dom('div').setParams({
        className: 'chatbox--entry',
        innerText: messageEvent.chatter_user_name + ': ' + messageEvent.message.text
      });

      setTimeout(function () {
        entry.node.classList.add('chatbox--entry-dim');
      }, TIMEOUT);
    };
  });
});
