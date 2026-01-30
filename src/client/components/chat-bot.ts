import { newComponent } from '../splux-host';
import { Timer } from '../utils/timer';
import { Mover } from './mover';
import { Toolbox } from './toolbar';

type Params = {
  id: string;
};

const DEFAULT_TIMEOUT = 20 * 60 * 1000;

const STYLES = {
  '.chat_bot': {
    '--setup': {
      boxSizing: 'border-box',
      border: '1px solid black',
      padding: '4px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },

    '--info_bar': {
      display: 'flex',
      justifyContent: 'space-between',

      '-checkbox': {
        verticalAlign: 'middle',
      },

      '-status': {
        verticalAlign: 'middle',
      },

      '-counter': {
        verticalAlign: 'middle',
      },
    },

    '--message': {
      flex: 1,
      whiteSpace: 'pre-wrap',
      overflowX: 'hidden',
      overflowY: 'auto',
    },
  },
};

const NEW_LINE_RE = /\\n/g;

export const ChatBot = newComponent('div.chat_bot', function (_, { id }: Params) {
  const host = this.host;
  host.styles.add('chat-bot', STYLES);
  const setup = {
    isActive: false,
    message: '',
    timeout: DEFAULT_TIMEOUT,
  };
  let display = function display (time: number) {
    console.log(time);
  }
  function send () {
    host.send({ action: 'bot-say', payload: setup.message });
  }
  let displayMessage = function () {}

  const timer = new Timer(function (current, status) {
    switch (status) {
      case 'complete':
        send();
        timer.set(Date.now() + setup.timeout);
        break;
      case 'run':
        display(this.finishTime - current);
        break;
    }
  });

  const mover = this.dom(Mover, {
    component: this,
    id,
    title: 'Chat Bot',
    vars: {
      width: '180px',
      height: '100px',
      left: '20px',
      top: '20px',
      message: '',
      timeout: DEFAULT_TIMEOUT.toString(),
    },
    onSetupChange(values) {
      const timeout = parseInt(values['timeout'] || '', 10);

      if (values['message'] && values['message'] !== setup.message) {
        setup.message = values['message'].replace(NEW_LINE_RE, '\n');
        displayMessage();
      }

      if (timeout && timeout !== setup.timeout) {
        setup.timeout = timeout;
        if (setup.isActive) {
          timer.set(Date.now() + timeout);
        }
      }
    }
  });

  this.dom(Toolbox, { items: {
    move() {
      mover.show();
    },
  } }).dom('div.chat_bot--setup', function () {
    this.dom('div.chat_bot--info_bar', function () {
      this.dom('label.chat_bot--info_bar-label', function () {
        this.dom('input.chat_bot--info_bar-checkbox').params({
          type: 'checkbox',
          checked: setup.isActive,
          onchange() {
            if (this instanceof HTMLInputElement) {
              if (this.checked) {
                setup.isActive = true;
                statusSpl.node.innerText = 'on';
                timer.set(Date.now() + setup.timeout)
              } else {
                setup.isActive = false;
                statusSpl.node.innerText = 'off';
                timer.stop();
              }
            }
          },
        });

        const statusSpl = this.dom('span.chat_bot--info_bar-status').params({
          innerText: setup.isActive ? 'on' : 'off',
        });
      });
      const displaySpl = this.dom('div.chat_bot--info_bar-counter');
      display = function (time) {
        displaySpl.node.innerText = Math.round(time / 1000).toString();
      };
      display(setup.timeout);
    });
    this.dom('div.chat_bot--message', function (message) {
      displayMessage = function () {
        message.node.innerText = setup.message;
      };
    });
  });
});
