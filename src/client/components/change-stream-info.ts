import type { StreamInfo } from '@common-types/ws-events';
import { newComponent } from '../splux-host';
import { Form } from './form';
import { Modal } from './modal';

type Params = {
  className?: string;
}

const STYLES = {
  '.change_stream_info': {
    width: '100%',
    height: '100%',

    '--button': {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    },
  },
}

function stringToOption (text: string) {
  var index = text.indexOf('|');

  if (index > -1) {
    return {
      value: text,
      text: text.substring(index + 1),
    };
  } else {
    return {
      value: text,
    };
  }
}

export const ChangeStreamInfo = newComponent('div.change_stream_info', function (_, { className }: Params) {
  const host = this.host;
  host.styles.add('change-stream-info', STYLES);
  className && this.node.classList.add(className);

  const modal = this.dom(Modal, {
    title: 'Edit Stream Info',
  });

  this.dom('div.change_stream_info--button').params({
    innerText: '✎',
    onclick() {
      modal.show();
    },
  });

  let set = function (info: StreamInfo['info']) {
    form.set({
      preset: info.title,
      title: info.title,
      category: stringToOption(info.category),
      tags: info.tags,
      language: info.language,
    });
  }

  const form = modal.content.dom(Form, {
    fields: {
      preset: {
        type: 'select',
        label: 'Preset',
        value: '',
      },
      title: {
        label: 'Title',
        value: '',
      },
      category: {
        type: 'select',
        search: true,
        label: 'Game',
        value: '',
      },
      tags: {
        label: 'Tags',
        value: '',
      },
      language: {
        label: 'language',
        value: '',
      },
    },
    onGetOptions(name, query) {
      if (name === 'preset') {
        const options = host.state.streamList.get({ clone: true }).reverse().map(function (info) {
          return {
            value: info.title,
          };
        });
        return Promise.resolve(options);
      }

      if (name === 'category') {
        return host.send({ action: 'get-categories', payload: { query } }).then(function (response) {
          return response.map(function (info) {
            return {
              value: info.id + '|' + info.name,
              text: info.name,
            };
          });
        });
      }

      return Promise.resolve([]);
    },
    onChange(name, value) {
      if (name === 'preset') {
        const info = host.state.streamList.get().find(function (info) { return info.title === value });

        if (info) {
          set({
            title: info.title,
            language: info.language,
            tags: info.tags,
            category: info.category,
          });
        }
      }
    },
    buttons: {
      'Send': {
        action() {
          const values = form.get();
          if (values['title']) {
            host.state.streamList.put({
              title: values['title'],
              category: values['category'] || '',
              language: values['language'] || '',
              tags: values['tags'] || '',
            });
          }
        },
      },
    },
  });

  function updateFromList (values: typeof host.state.streamList.state.state) {
    const last = values[values.length - 1];

    if (last) {
      set(last);
    }
  }

  host.state.streamList.state.listen(updateFromList);

  this.on({
    remove() {
      host.state.streamList.state.unlisten(updateFromList);
    },
  });
});
