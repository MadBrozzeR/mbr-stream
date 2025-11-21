import type { Request } from 'mbr-serv-request';
import { requestUserGrantToken } from './auth';
import { API } from './constants';
import { config } from './config';
import { isDefined, isKeyOf, jsonToUrlEncoded } from './utils';
import type { Scope, CreateEventSubSubscriptionRequest, EventSubType } from './types';
import { api } from './api';

const STATIC_ROOT = __dirname + '/../../static/';
const CLIENT_ROOT = __dirname + '/../client/';
const MODULES_ROOT = __dirname + '/../../node_modules/';

const SUBSCRIPTIONS: {
  [K in keyof EventSubType]?: (
    condition: CreateEventSubSubscriptionRequest<K>['condition']) =>
      Pick<CreateEventSubSubscriptionRequest<K>, 'type' | 'version' | 'condition'>
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
};

type SubResult = [keyof EventSubType, boolean];

async function getUserInfo(request: Request) {
  try {
    const user = (await api.Users.getUsers()).data[0];

    if (!isDefined(user)) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    if (error instanceof Object && 'status' in error && error.status === 401) {
      request.redirect('/connect');
      return null;
    } else {
      throw error;
    }
  }
}

export async function server (request: Request) {
  // console.log(request.request.url);
  request.match(/^\/modules\/(.+)$/, function (regMatch) {
    switch (regMatch[1]) {
      case 'lib-ref/splux':
        this.sendFile(`${MODULES_ROOT}splux/index.js`)
        break;
      case 'lib-ref/mbr-style':
        this.sendFile(`${MODULES_ROOT}mbr-style/index.js`)
        break;
      default:
        this.sendFile(`${regMatch[1]}.js`, {
          root: CLIENT_ROOT,
          extension: 'js',
        });
        break;
    }
  })
  || request.match(/^\/static\/(.+)$/, async function (regMatch) {
    try {
      if (!regMatch[1]) {
        throw '';
      }

      await this.sendFile(regMatch[1], { root: STATIC_ROOT });
    } catch (error) {
      request.status = 404;
      request.send();
    };
  })
  || request.route({
    // '/lib/mbr-style.js': `${MODULES_ROOT}mbr-style/index.js`,
    // '/lib/splux.js': `${MODULES_ROOT}splux/index.js`,

    '/chat': STATIC_ROOT + 'chat.html',
    '/connect'(request) {
      const scope: Scope[] = [
        'channel:read:subscriptions',
        'moderator:read:followers',
        'moderator:read:chatters',
        'user:read:chat',
        'user:write:chat',
      ];

      const params = jsonToUrlEncoded({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: scope.join(' '),
      });

      request.redirect(`${API.AUTHORIZE}?${params}`)
    },

    '/favicon.ico'(request) {request.send();},

    async '/'(request) {
      try {
        const userInfo = await getUserInfo(request);

        if (!userInfo) {
          return;
        }

        const followers = await api.Channels.getChannelFollowers({ broadcaster_id: userInfo.id });
        const streams = await api.Streams.getStreams({ user_id: userInfo.id });

        request.sendFile(STATIC_ROOT + 'index.html', {
          put: {
            userName: userInfo.display_name,
            followerNumber: followers.total,
            followers: followers.data.map((info) => `<div>${info.user_name}</div>`).join(''),
            status: streams.data.length ? 'ONLINE' : 'OFFLINE',
          },
        }).catch(function () {
          request.status = 500;
          request.send('index file open error');
        });

      } catch (error) {
        if (error) {
          request.redirect('/connect');
        }
      }
    },

    async '/auth'(request) {
      const { code, error, error_description } = request.getUrl().getParams();

      if (error) {
        request.send(`ERROR: ${error}: ${error_description}`);
      } else if (typeof code === 'string') {
        await requestUserGrantToken(code);
        request.send('User token successfully saved. <a href="/">go to Dashboard</a>', 'html')
      } else {
        request.status = 500;
        request.send('No "error" or "code" fields are in parameters');
      }
    },

    async '/subscribe'(request) {
      try {
        const userInfo = await getUserInfo(request);
        const { session } = request.getUrl().getParams();
        if (!userInfo) {
          return;
        }
        if (typeof session !== 'string' || !session) {
          request.status = 400;
          request.send('Wrong session id');
          return;
        }
        const condition = {
          broadcaster_user_id: userInfo.id,
          user_id: userInfo.id,
          moderator_user_id: userInfo.id,
        };

        Promise.all(
          Object.keys(SUBSCRIPTIONS).map(function (type) {
            if (isKeyOf(type, SUBSCRIPTIONS) && isDefined(SUBSCRIPTIONS[type])) {
              return api.EventSub.createEventSubSubscription({
                ...SUBSCRIPTIONS[type](condition),
                transport: { method: 'websocket', session_id: session },
              })
                .then((): SubResult => [type, true])
                .catch((): SubResult => [type, false])
            }

            return undefined;
          }).filter(isDefined)
        ).then(function (results) {
          request.send(JSON.stringify(results), 'json');
        }).catch(function (error) {
          console.log(error);
          request.status = 500;
          request.send('Error!');
        });
      } catch (error) {
        console.log(error);
        request.status = 400;
        request.send('Failed to get user');
      }
    },
  });
}
