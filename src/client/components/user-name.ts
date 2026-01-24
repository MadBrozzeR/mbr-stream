import type { BadgeData } from '@common-types/ws-events';
import { newComponent } from '../splux-host';
import { Badges } from './badges';

const STYLES = {
  '.user_name': {
    '--name': {
      lineHeight: '1em',
      color: 'var(--color, inherit)',
      verticalAlign: 'middle',
    },
  },
};

type Params = {
  name: string;
  color?: string | undefined;
  badges?: BadgeData[] | undefined;
};

export const UserName = newComponent('span.user_name', function (_, { name, color, badges }: Params) {
  this.host.styles.add('user-name', STYLES);

  if (badges) {
    this.dom(Badges, { badges });
  }

  const nameSpl = this.dom('span.user_name--name').params({ innerText: name });

  color && nameSpl.node.style.setProperty('--color', color);
});
