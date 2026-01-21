import { newComponent } from '../splux-host';
import type { ChatMessageEvent } from '../type';
import { useTemplate } from '../utils/utils';

type Params = {
  message: ChatMessageEvent['message'];
};

const STYLES = {
  '.message_row': {
    display: 'inline',
    verticalAlign: 'middle',

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

const EMOTE_URL = 'https://static-cdn.jtvnw.net/emoticons/v2/{{id}}/default/dark/2.0';

export const MessageRow = newComponent('div.message_row', function (_, { message }: Params) {
  this.host.styles.add('message-row', STYLES);

  for (let index = 0 ; index < message.fragments.length ; ++index) {
    const fragment = message.fragments[index];

    switch (fragment?.type) {
      case 'text':
      case 'cheermote':
      case 'mention':
        this.dom('span.message_row--text').params({ innerText: fragment.text });
        break;
      case 'emote':
        fragment.emote && this.dom('img.message_row--emote').params({
          alt: fragment.text,
          src: useTemplate(EMOTE_URL, { id: fragment.emote.id }),
        });
        break;
    }
  }
});
