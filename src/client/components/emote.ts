import { AnimationVariant } from '@common-types/eventsub-types';
import { newComponent } from '../splux-host';
import { useTemplate } from '../utils/utils';

type Size = '1.0' | '2.0' | '3.0' | '4.0';
type Animation = AnimationVariant | 'default';

type Params = {
  id: string;
  alt: string;
  animation?: Animation | undefined;
  size?: Size | undefined;
  theme?: 'light' | 'dark' | undefined;
  className?: string | undefined;
};

const EMOTE_URL = 'https://static-cdn.jtvnw.net/emoticons/v2/{{id}}/{{animation}}/dark/{{size}}';

function preloadImage (src: string) {
  const image = new Image();
  image.src = src;
  return src;
}

export const Emote = newComponent('img', function (emote, {
  id,
  alt,
  className,
  animation = 'default',
  size = '2.0',
  theme = 'dark',
}: Params) {
  const preload = {
    default: preloadImage(useTemplate(EMOTE_URL, { id, animation: 'default', size, theme })),
    animated: preloadImage(useTemplate(EMOTE_URL, { id, animation: 'animated', size, theme })),
    static: preloadImage(useTemplate(EMOTE_URL, { id, animation: 'static', size, theme })),
  };

  this.params({ alt, src: preload[animation] });
  className && this.node.classList.add(className);

  return {
    setAnimation(animation: Animation) {
      emote.params({ src: preload[animation] });
    },
    splux: this,
  };
});
