import type { Request } from 'mbr-serv-request';
import { requestUserGrantToken } from './auth';
import { API } from './constants';
import { config } from './config';
import { jsonToUrlEncoded } from './utils';
import { Scope } from './types';
import { api } from './api';

const STATIC_ROOT = __dirname + '/../../static/';

export async function server (request: Request) {
  request.route({
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

    async '/'(request) {
      try {
        const userInfo = (await api.Users.getUsers()).data[0];

        if (!userInfo) {
          request.status = 500;
          request.send('No user data');
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
  });
}
