import { newComponent } from '../splux-host';

const STYLES = {
  '.notification_box': {
    position: 'absolute',
    top: '20px',
    right: '20px',
  },
};

export const NotificationBox = newComponent('div', function () {
  const host = this.host;
  // const root = this;
  this.params({ className: 'notification_box' })
  host.styles.add('notifications', STYLES);

  host.pushNotification = function (notification) {
    console.log(notification);
  };
});
