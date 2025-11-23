import { Splux } from './lib-ref/splux';
import { Styles } from './lib-ref/mbr-style';
import type { EventPayloadData, NotificationToast } from './type';

export const host = {
  styles: Styles.create(),
  appendMessage(message: EventPayloadData['channel.chat.message']) {
    console.log(message);
  },
  pushNotification(data: NotificationToast) {
    console.log(data);
  },
};

export type Host = typeof host;

export const newComponent = Splux.createComponent<Host>();
