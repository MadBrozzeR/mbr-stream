import { api } from './api';
import type * as Types from './types';
import type * as ETypes from './eventsub-types';
import { isDefined, isKeyOf } from './utils';

let userInfo: Types.GetUsersResponse['data'][number] | null = null;

export async function getUserInfo () {
  if (userInfo) {
    return userInfo;
  }

  const users = await api.Users.getUsers();

  if (!isDefined(users.data[0])) {
    throw new Error('User not found');
  }

  return userInfo = users.data[0];
}

type SubResult = [keyof ETypes.EventSubType, boolean];

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
