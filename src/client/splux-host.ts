import { Splux } from './lib-ref/splux';
import { Styles } from './lib-ref/mbr-style';
import { Broadcast } from './utils/broadcaster';
import type { WSIncomeEvent } from '@common-types/ws-events';

export function newHost () {
  const host = {
    styles: Styles.create(),
    play(src: string) {
      console.log(src);
    },
    cast<T extends keyof Broadcast> (type: T, payload: Broadcast[T]) {
      console.log(type, payload);
    },
    wsSend(message: WSIncomeEvent) {
      console.log(message);
    },
  };

  return host;
}

export type Host = ReturnType<typeof newHost>;

export const newComponent = Splux.createComponent<Host>();
