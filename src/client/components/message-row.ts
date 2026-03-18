import { newComponent } from '../splux-host';
import type { ChatMessageEvent } from '../type';
import { Emote } from './emote';

type Params = {
  message: ChatMessageEvent;
  scaleEmotesFor?: number;
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
      transition: '.3s transform ease-in-out',

      ':hover': {
        transform: 'scale(2)',
      },

      '-scaled': {
        transform: 'scale(2)',
      },
    },
  },
};

export const MessageRow = newComponent('div.message_row', function (row, { message, scaleEmotesFor = 0 }: Params) {
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
          const emote = row.dom(Emote, {
            id: fragment.emote.id,
            alt: fragment.text,
            className: 'message_row--emote',
          });
          if (scaleEmotesFor) {
            emote.splux.node.classList.add('message_row--emote-scaled');
          }
          emotes.push(emote);
        }
        break;
    }
  }

  if (scaleEmotesFor) {
    setTimeout(function () {
      emotes.forEach(function (emote) {
        emote.splux.node.classList.remove('message_row--emote-scaled');
      });
    }, scaleEmotesFor);
  }

  return {
    setAnimation(animation: 'static' | 'default') {
      emotes.forEach(function (emote) {
        emote.setAnimation(animation);
      });
    },
  };
});
