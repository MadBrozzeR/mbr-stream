import { Splux } from './lib-ref/splux';
import { State } from './lib-ref/mbr-state';
import { Styles } from './lib-ref/mbr-style';
import type { Broadcast } from './utils/broadcaster';
import type { StreamInfo, WSIncomeEvent, WSIncomeEventActions, WSIncomeEventResponse } from '@common-types/ws-events';

export function newHost () {
  const host = {
    styles: Styles.create(),
    state: {
      streamInfo: new State<StreamInfo | null>(null),
    },
    play(src: string) {
      console.log(src);
    },
    cast<T extends keyof Broadcast> (type: T, payload: Broadcast[T]) {
      console.log(type, payload);
    },
    wsSend(message: WSIncomeEvent) {
      console.log(message);
    },
    send<T extends WSIncomeEventActions>(message: WSIncomeEvent<T>) {
      return fetch('/action', {
        method: 'POST',
        body: JSON.stringify(message),
      }).then(function (response) {
        if (!response.ok) {
          throw response;
        }

        let result: any;

        try {
          result = response.json();
        } catch (error) {
          result = undefined;
        }

        return result as WSIncomeEventResponse<T>;
      });
    }
  };

  return host;
}

export type Host = ReturnType<typeof newHost>;

export const newComponent = Splux.createComponent<Host>();
