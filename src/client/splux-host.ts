import { Splux } from './lib-ref/splux';
import { Styles } from './lib-ref/mbr-style';
import type { EventPayloadData, NotificationToast } from './type';
import { Broadcast } from './utils/broadcaster';

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
  cast<T extends keyof Broadcast> (type: T, payload: Broadcast[T]) {
    console.log(type, payload);
  },
};

export type Host = typeof host;

export const newComponent = Splux.createComponent<Host>();
