import type { Request } from 'mbr-serv-request';
import { requestUserGrantToken } from './auth';
import { API } from './constants';
import { config } from './config';
import { getStringRecord, isDefined, jsonToUrlEncoded } from './utils';
import type { Scope } from './eventsub-types';
import { api } from './api';
import { startWSClient, startWSServer } from './ws';

const STATIC_ROOT = __dirname + '/../../static/';
const CLIENT_ROOT = __dirname + '/../client/';
const MODULES_ROOT = __dirname + '/../../node_modules/';

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

const wsServer = startWSServer();

try {
  startWSClient(function (message) {
    wsServer.send(message);
  });
} catch (error) {
  console.log(error);
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

      const { vars } = this.getUrl().getParams();
      const putParams = typeof vars === 'string' ? { put: getStringRecord(vars) || {} } : {};

      await this.sendFile(regMatch[1], { root: STATIC_ROOT, ...putParams });
    } catch (error) {
      request.status = 404;
      request.send();
    };
  })

  || request.match(/^\/dash(\/[-\w]*)?/, async function (regMatch) {
    const dashId = regMatch[1] && regMatch[1].substring(1);

    request.sendFile(STATIC_ROOT + 'dashboard.html', {
      extension: 'html',
      put: {
        dashId: dashId ? `${dashId} - ` : '',
      },
    })
  })

  || request.route({
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

    '/ws'(request) {
      wsServer.attach(request);
    },
  });
}
