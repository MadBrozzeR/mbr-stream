import { BadgeData } from '@common-types/ws-events';
import { newComponent } from '../splux-host';

type Props = {
  badges: BadgeData[];
};

type BadgeProps = {
  badge: BadgeData;
};

const STYLES = {
  '.badges': {
    marginRight: '2px',
    verticalAlign: 'middle',

    '--item_wrapper': {
      height: '1em',
      width: '1em',
      display: 'inline-block',
      padding: '2px',
      verticalAlign: 'middle',
    },

    '--item': {
      height: '100%',
      boxSizing: 'border-box',
    },
  },
};

const Badge = newComponent('span.badges--item_wrapper', function (_, { badge }: BadgeProps) {
  this.dom('img.badges--item').params({
    src: badge.url,
    alt: badge.title,
  });
});

export const Badges = newComponent('span.badges', function (wrapper, { badges }: Props) {
  const host = this.host;

  host.styles.add('badges', STYLES);

  badges.forEach(function (badge) {
    wrapper.dom(Badge, { badge });
  });
});
