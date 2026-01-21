import { AnimationVariant } from '@common-types/eventsub-types';
import { newComponent } from '../splux-host';
import type { ChatMessageEvent } from '../type';
import { useTemplate } from '../utils/utils';

type Params = {
  message: ChatMessageEvent['message'];
  animation?: AnimationVariant | 'default';
};

const STYLES = {
  '.message_row': {
    display: 'inline',

    '--text': {
      lineHeight: '1em',
      verticalAlign: 'middle',
    },

    '--emote': {
      height: '1em',
      verticalAlign: 'middle',
    },
  },
};

const EMOTE_URL = 'https://static-cdn.jtvnw.net/emoticons/v2/{{id}}/{{animation}}/dark/2.0';

export const MessageRow = newComponent('div.message_row', function (row, { message, animation = 'default' }: Params) {
  this.host.styles.add('message-row', STYLES);

  function draw (message: ChatMessageEvent['message'], animation: AnimationVariant | 'default') {
    row.clear();

    for (let index = 0 ; index < message.fragments.length ; ++index) {
      const fragment = message.fragments[index];

      switch (fragment?.type) {
        case 'text':
        case 'cheermote':
        case 'mention':
          row.dom('span.message_row--text').params({ innerText: fragment.text });
          break;
        case 'emote':
          fragment.emote && row.dom('img.message_row--emote').params({
            alt: fragment.text,
            src: useTemplate(EMOTE_URL, { id: fragment.emote.id, animation }),
          });
          break;
      }
    }
  }

  draw(message, animation);

  return {
    setAnimation(animation: AnimationVariant | 'default') {
      draw(message, animation);
    },
  };
});
