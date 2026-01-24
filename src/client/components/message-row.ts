import { AnimationVariant } from '@common-types/eventsub-types';
import { newComponent } from '../splux-host';
import type { ChatMessageEvent } from '../type';
import { Emote } from './emote';

type Params = {
  message: ChatMessageEvent['message'];
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

export const MessageRow = newComponent('div.message_row', function (row, { message }: Params) {
  this.host.styles.add('message-row', STYLES);
  const emotes: Array<ReturnType<typeof Emote>> = [];

  for (let index = 0 ; index < message.fragments.length ; ++index) {
    const fragment = message.fragments[index];

    switch (fragment?.type) {
      case 'text':
      case 'cheermote':
      case 'mention':
        row.dom('span.message_row--text').params({ innerText: fragment.text });
        break;
      case 'emote':
        if (fragment.emote) {
          emotes.push(row.dom(Emote, {
            id: fragment.emote.id,
            alt: fragment.text,
            className: 'message_row--emote',
          }));
        }
        break;
    }
  }

  return {
    setAnimation(animation: AnimationVariant | 'default') {
      emotes.forEach(function (emote) {
        emote.setAnimation(animation);
      });
    },
  };
});
