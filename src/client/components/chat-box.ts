import { newComponent } from '../splux-host';

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
    },
  },
};

export const ChatBox = newComponent('div', function () {
  this.setParams({
    className: 'chatbox',
  });

  this.host.styles.add('chat', STYLES);

  this.dom('div', function () {
    const log = this.setParams({ className: 'chatbox--log' });

    this.host.appendMessage = function (messageEvent) {
      log.dom('div').setParams({
        className: 'chatbox--entry',
        innerText: messageEvent.chatter_user_name + ': ' + messageEvent.message.text
      });
    };
  });
});
