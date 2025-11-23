import { Splux } from '../lib-ref/splux';
import { Host, newComponent } from '../splux-host';
import type { NotificationToast } from '../type';
import { imageAtlas } from '../utils';

const toastAtlas = imageAtlas('/static/images/toast.png', {
  topLeft: [0, 0, 150, 16],
  topRight: [0, 16, 38, 8],
  bottomLeft: [0, 24, 30, 8],
  bottomRight: [0, 32, 150, 16],
  background: [0, 48, 244, 84],
});

const TIMEOUT = 5000;

const STYLES = {
  '@keyframes toast-enter': {
    '0%': {
      transform: 'translateX(150%)',
    },

    '20%': {
      transform: 'translateX(0%)',
    },
  },

  '@keyframes toast-bottom-right': {
    '0%,20%': {
      transform: 'translate(-60px, -64px)',
    },

    '40%': {
      transform: 'translate(0, 0)',
    },
  },

  '@keyframes toast-bottom-left': {
    '0%,20%': {
      transform: 'translate(8px, -64px)',
    },

    '40%': {
      transform: 'translate(68px, 0)',
    },

    '60%': {
      transform: 'translate(0, 0)',
    },
  },

  '@keyframes toast-top-right': {
    '0%,60%': {
      transform: 'translate(-33px, 0)',
    },

    '60%': {
      transform: 'translate(0, 0)',
    }
  },

  '@keyframes toast-background': {
    '0%,60%': {
      opacity: 0,
    },

    '100%': {
      opacity: 1,
    },
  },

  '.notification_box': {
    position: 'absolute',
    top: '20px',
    right: 0,
    paddingRight: '20px',
    overflow: 'hidden',
  },

  '.notification_popup': {
    width: '244px',
    height: '88px',
    position: 'relative',
    paddingBottom: '4px',
    boxSizing: 'border-box',
    animation: '1s ease-in-out toast-enter',

    '--foreground': {
      position: 'absolute',
      top: '2px',
      left: '2px',
      width: '240px',
      height: '80px',
      zIndex: 1,

      '_part1': {
        position: 'absolute',
        left: 0,
        top: 0,
        ...toastAtlas.topLeft,
      },

      '_part2': {
        position: 'absolute',
        left: '175px',
        top: 0,
        ...toastAtlas.topRight,
        animation: '1s ease-in-out toast-top-right',
      },

      '_part3': {
        position: 'absolute',
        left: 0,
        bottom: 0,
        ...toastAtlas.bottomLeft,
        animation: '1s ease-in-out toast-bottom-left',
      },

      '_part4': {
        position: 'absolute',
        right: 0,
        bottom: 0,
        ...toastAtlas.bottomRight,
        animation: '1s ease-in-out toast-bottom-right',
      },
    },

    '--info': {
      ...toastAtlas.background,
      padding: '14px',
      boxSizing: 'border-box',
      color: '#ddd',
      animation: '1s ease-in-out toast-background',
    },

    '.notification_popup-hide': {
      transition: '0.3s transform ease-in-out',
      transform: 'translateX(150%)',
    },
  },
};

const Popup = newComponent('div', function (
  _popup,
  { text, timeout = TIMEOUT, audio, onEnd }: NotificationToast & { onEnd: (this: Splux<HTMLDivElement, Host>) => void }
) {
  const popup = this;

  this.params({
    className: 'notification_popup',
  });
  this.dom('div', foreground => {
    foreground.params({
      className: 'notification_popup--foreground',
    });
    foreground.dom('div').params({ className: 'notification_popup--foreground_part1' });
    foreground.dom('div').params({ className: 'notification_popup--foreground_part2' });
    foreground.dom('div').params({ className: 'notification_popup--foreground_part3' });
    foreground.dom('div').params({ className: 'notification_popup--foreground_part4' });
  });
  this.dom('div', block => {
    block.params({
      className: 'notification_popup--info',
      innerText: text,
    });
  });

  if (audio) {
    this.host.play(audio);
  }

  setTimeout(function () {
    popup.node.classList.add('notification_popup-hide');
  }, timeout);

  setTimeout(function () {
    popup.remove();
    onEnd.call(popup);
  }, timeout + 300);
});

export const NotificationBox = newComponent('div', function () {
  const host = this.host;
  const root = this;
  this.params({ className: 'notification_box' })
  host.styles.add('notifications', STYLES);

  const notificationList = {
    pending: [] as Array<NotificationToast>,
    max: 3,
    current: 0,
    push(data: NotificationToast) {
      this.pending.push(data);
      if (this.current < this.max) {
        this.action();
      }
    },
    action() {
      const popup = this.pending.shift();

      if (popup) {
        ++notificationList.current;
        root.dom(Popup, { ...popup, onEnd() {
          --notificationList.current;
          notificationList.action();
        } });
      }
    },
  };

  host.pushNotification = function (data) {
    notificationList.push(data);
  };
});
