import type { BadgeData } from '@common-types/ws-events';
import { newComponent } from '/@client/splux-host';
import { Badges } from './badges';

const STYLES = {
  '.user_name': {
    '--name': {
      lineHeight: '1em',
      color: 'var(--color, inherit)',
      verticalAlign: 'middle',

      '-clickable': {
        cursor: 'pointer',
        userSelect: 'none',

        ':hover': {
          color: '#00a',
        },
      },
    },
  },
};

export type UserInfo = {
  name: string;
  id: string;
};

type Params = {
  user: string | UserInfo;
  color?: string | undefined;
  badges?: BadgeData[] | undefined;
  onClick?: (user: string | UserInfo) => void;
};

export const UserName = newComponent('span.user_name', function (_, { user, color, badges, onClick }: Params) {
  this.host.styles.add('user-name', STYLES);

  if (badges) {
    this.dom(Badges, { badges });
  }

  const userName = typeof user === 'string' ? user : user.name;
  const nameSpl = this.dom('span.user_name--name').params({ innerText: userName });

  if (onClick) {
    nameSpl.params({ onclick() {
      onClick(user);
    } });
    nameSpl.node.classList.add('user_name--name-clickable');
  }

  color && nameSpl.node.style.setProperty('--color', color);
});
