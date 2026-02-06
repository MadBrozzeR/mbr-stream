import { Request } from 'mbr-serv-request';
import { api } from './api';
import type * as Types from './types';
import type * as ETypes from './common-types/eventsub-types';
import { areMatchedObjects, isDefined, isKeyOf } from './utils';
import { StreamInfo } from './common-types/ws-events';

let userInfo: Types.GetUsersResponse['data'][number] | null = null;

type SubResult = [keyof ETypes.EventSubType, boolean];

export async function getUserInfo (force = false) {
  if (userInfo && !force) {
    return userInfo;
  }

  const users = await api.Users.getUsers();

  if (!isDefined(users.data[0])) {
    throw new Error('User not found');
  }

  return userInfo = users.data[0];
}

export async function getUserInfoWithReconnect(request: Request) {
  try {
    return getUserInfo();
  } catch (error) {
    if (error instanceof Object && 'status' in error && error.status === 401) {
      request.redirect('/connect');
      return null;
    } else {
      throw error;
    }
  }
}

const SUBSCRIPTIONS: {
  [K in keyof ETypes.EventSubType]?: (
    condition: Types.CreateEventSubSubscriptionRequest<K>['condition']) =>
      Pick<Types.CreateEventSubSubscriptionRequest<K>, 'type' | 'version' | 'condition'>
  } = {
  'channel.chat.message': (condition) => ({
    type: 'channel.chat.message',
    version: '1',
    condition: { broadcaster_user_id: condition.broadcaster_user_id, user_id: condition.user_id },
  }),
  'channel.follow': (condition) => ({
    type: 'channel.follow',
    version: '2',
    condition: { broadcaster_user_id: condition.broadcaster_user_id, moderator_user_id: condition.moderator_user_id },
  }),
  'channel.subscribe': (condition) => ({
    type: 'channel.subscribe',
    version: '1',
    condition: { broadcaster_user_id: condition.broadcaster_user_id },
  }),
  'channel.raid': (condition) => ({
    type: 'channel.raid',
    version: '1',
    condition: { to_broadcaster_user_id: condition.to_broadcaster_user_id || '' },
  }),
};

export async function subscribe (sessionId: string) {
  try {
    const userInfo = await getUserInfo();
    const condition = {
      broadcaster_user_id: userInfo.id,
      user_id: userInfo.id,
      moderator_user_id: userInfo.id,
      to_broadcaster_user_id: userInfo.id,
    };

    const result = (await Promise.all(
      Object.keys(SUBSCRIPTIONS)
        .map(function (type) {
          if (isKeyOf(type, SUBSCRIPTIONS) && isDefined(SUBSCRIPTIONS[type])) {
            return api.EventSub.createEventSubSubscription({
              ...SUBSCRIPTIONS[type](condition),
              transport: { method: 'websocket', session_id: sessionId },
            })
              .then((): SubResult => [type, true])
              .catch((): SubResult => [type, false])
          }

          return undefined;
        })
        .filter(isDefined)
    )).reduce<Record<string, boolean>>(function (result, item) {
      result[item[0]] = item[1];
      return result;
    }, {});

    console.log('EventSub subscription result:', result);

    return result;
  } catch (error) {
    if (error instanceof Object && 'status' in error && error.status === 401) {
      console.log('Authentication error. Go to /connect to complete authentication process');
    } else {
      console.log('Failed to subscribe:', error);
    }

    return null;
  }
}

export async function getStreamInfo () {
  const result: StreamInfo = {
    viewers: 0,
    isOnline: false,
    chatters: [],
    userId: '',
    title: '',
  };

  try {
    const userInfo = await getUserInfo();
    result.userId = userInfo.id;
    const [streams, chatters] = await Promise.all([
      api.Streams.getStreams({ user_id: userInfo.id }),
      api.Chat.getChatters({ broadcaster_id: userInfo.id, moderator_id: userInfo.id }),
    ]);
    if (streams.data[0]) {
      result.isOnline = true;
      result.viewers = streams.data[0].viewer_count;
      result.title = streams.data[0].title;
    }
    result.chatters = chatters.data.map((chatter) => ({
      id: chatter.user_id,
      name: chatter.user_name,
      login: chatter.user_login,
    }));
  } catch (error) {
    console.log(error);
  }

  return result;
}

export function createPolling<R> (
  interval: number, callback: () => Promise<R | null> | R | null,
  apply: (value: R) => void
) {
  let result: R | null = null;

  function action () {
    let promise = callback();

    if (!(promise instanceof Promise)) {
      promise = Promise.resolve(promise);
    }

    promise.then(function (response) {
      if (!response) {
        return null;
      }

      if (!result || !areMatchedObjects(result, response)) {
        result = response;

        return result;
      }

      return null;
    }).then(function (result) {
      result && apply(result);
    });
  }

  setInterval(action, interval);
  action();

  return {
    get() {
      return result;
    },
  };
}

export function dataStorage<R> (apiRequest: () => Promise<R | null>) {
  let lastResult: R | null = null;

  return function (force?: boolean) {
    if (lastResult && !force) {
      return Promise.resolve(lastResult);
    }

    return apiRequest().then(function (result) {
      if (result === null) {
        return result;
      }

      return lastResult = result;
    });
  };
}

export function dataStorageKeys<R> (apiRequest: (key: string) => Promise<R | null>) {
  const results: Record<string, R> = {};

  return function (key: string, force?: boolean) {
    if (results[key] && !force) {
      return results[key];
    }

    return apiRequest(key).then(function (response) {
      if (response === null) {
        return response;
      }

      return results[key] = response;
    });
  }
}

/*
export function apiDataStorage<S extends Record<string, () => Promise<any>>>(apis: S) {
  const result = {} as { [K in keyof S]: {
    get: () => ReturnType<S[K]>;
    getForced: () => ReturnType<S[K]>;
  } };

  for (const key in apis) {
    const api = apis[key];
    let resultData: any = null;

    if (api) {
      result[key] = {
        get: function () {
          if (resultData) {
            return Promise.resolve(resultData);
          }

          return api().then(function (data) {
            resultData = data;
            return data;
          });
        },
        getForced: function () {
          return api().then(function (data) {
            resultData = data;
            return data;
          });
        }
      };
    }
  }
}
*/
