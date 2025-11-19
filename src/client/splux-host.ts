import { Splux } from 'splux';
import { Styles } from 'mbr-style';
import { EventPayloadData } from './type';

export const host = {
  styles: Styles.create(),
  appendMessage: (message: EventPayloadData['channel.chat.message']) => {
    console.log(message);
  },
};

export type Host = typeof host;

export const newComponent = Splux.createComponent<Host>();
