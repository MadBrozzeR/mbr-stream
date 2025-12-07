import { Splux } from './lib-ref/splux';
import { Styles } from './lib-ref/mbr-style';
import type { EventPayloadData, NotificationToast } from './type';
import { Broadcast } from './utils/broadcaster';

type Config = { startChat: boolean };

export const host = {
  styles: Styles.create(),
  appendMessage(message: EventPayloadData['channel.chat.message']) {
    host.cast('chatMessage', message);
  },
  pushNotification(data: NotificationToast) {
    host.cast('notification', data);
  },
  play(src: string) {
    console.log(src);
  },
  getConfig: (function (): Promise<Config | null> {
    let config: null | Config = null;

    if (config) {
      return Promise.resolve(config);
    }

    return fetch('/config').then(function (response) {
      if (response.ok) {
        return response.json();
      }

      return Promise.reject();
    }).then(function (result) {
      return config = result;
    }).catch(function (error) {
      console.error('Failed to fetch config', error)
    });
  }),
  cast<T extends keyof Broadcast> (type: T, payload: Broadcast[T]) {
    console.log(type, payload);
  },
};

export type Host = typeof host;

export const newComponent = Splux.createComponent<Host>();
