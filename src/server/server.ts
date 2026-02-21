import type { Request } from 'mbr-serv-request';
import { requestUserGrantToken } from './auth';
import { API } from './constants';
import { config } from './config';
import { getCommand, getStringRecord, getUserBadges, isEventSubMessageType, isEventType, jsonToUrlEncoded } from './utils';
import type { Scope } from './common-types/eventsub-types';
import { api } from './api';
import { startWSClient, startWSServer } from './ws';
import { createPolling, dataStorage, dataStorageKeys, getStreamInfo, getUserInfo, getUserInfoWithReconnect } from './api-wrappers';
import type { WSIncomeEvent, BadgeStore, WSEvent } from './common-types/ws-events';
import { downloadResources } from './resource-downloader';

const STATIC_ROOT = __dirname + '/../../static/';
const CLIENT_ROOT = __dirname + '/../client/';
const MODULES_ROOT = __dirname + '/../../node_modules/';

const wsServer = startWSServer();

const streamInfoPolling = config.startChat ? createPolling(120000, getStreamInfo, function (streamInfo) {
  wsServer.sendData({ type: 'streamInfo', payload: streamInfo });
}) : null;

const apiStorage = {
  getBadges: dataStorage(function () {
    return api.Chat.getGlobalChatBadges().then(function (response) {
      return response.data.reduce<BadgeStore>(function (result, badge) {
        result[badge.set_id] = badge.versions.reduce<BadgeStore[string]>(function (result, version) {
          result[version.id] = {
            url: version.image_url_2x,
            title: version.title,
            description: version.description,
            click: (version.click_url && version.click_action) ? {
              url: version.click_url,
              text: version.click_action
            } : null,
          };
          return result;
        }, {})
        return result;
      }, {});
    });
  }),

  getUser: dataStorageKeys(function (ids) {
    return api.Users.getUsers({ id: ids }).then(function (response) {
      const result: Record<string, { name: string; description: string; image: string }> = {};

      return response.data.reduce(function (result, item) {
        result[item.id] = {
          name: item.display_name,
          description: item.description,
          image: item.profile_image_url,
        };

        return result;
      }, result);
    });
  }),
};

downloadResources().then(function (result) {
  console.log('Resources statuses:', result);
});

function processIncomingMessage (message: WSIncomeEvent) {
  switch (message.action) {
    case 'get-stream-info': {
      const info = streamInfoPolling?.get();
      info && wsServer.sendData({ type: 'streamInfo', payload: info });
      return info || null;
    }

    case 'clear-all-chats':
      wsServer.sendData({ type: 'interfaceAction', payload: 'chat-clear' })
      return null;

    case 'module-setup':
      const payload = { module: message.payload.module, setup: message.payload.setup };
      wsServer.sendData({ type: 'moduleSetup', payload }, { name: message.payload.view });
      return null;

    case 'bot-say': {
      const messageText = message.payload;
      getUserInfo().then(function (info) {
        if (info && messageText) {
          api.Chat.sendChatMessage({
            sender_id: info.id,
            broadcaster_id: info.id,
            message: '[AUTO] ' + messageText,
          }).then(function (response) {
            response.data.forEach(function (data) {
              if (!data.is_sent) {
                console.log(
                  'Message has not been sent. ' +
                  `Reason: [${data.drop_reason?.code || 'no-code'}] ${data.drop_reason?.message || 'No reason'}`
                );
              }
            });
          }).catch(function (error) {
            console.log(error);
          });
        }
      });
      return null;
    }
  }

  return null;
}

try {
  startWSClient(function (message) {
    if (isEventSubMessageType(message, 'notification')) {
      const payload: WSEvent<'notification'>['payload'] = {
        event: message.payload,
        user: null,
        badges: [],
        command: null,
      };

      const messagePayload = message.payload;
      const promise = isEventType(messagePayload, 'channel.chat.message')
        ? Promise.all([
          apiStorage.getBadges(),
          apiStorage.getUser([messagePayload.event.chatter_user_id]),
        ]).then(function ([badgeStore, user]) {
          if (badgeStore) {
            payload.badges = getUserBadges(messagePayload.event.badges, badgeStore);
          }
          payload.user = user[messagePayload.event.chatter_user_id] || null;
          payload.command = getCommand(messagePayload);
        })
        : Promise.resolve(payload);
      promise.then(function () {
        wsServer.sendData({ type: 'notification', payload });
      });
    }
  });

  wsServer.listen(function (message) {
    processIncomingMessage(message);
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
      case 'lib-ref/mbr-state':
        this.sendFile(`${MODULES_ROOT}mbr-state/index.js`)
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
        const userInfo = await getUserInfoWithReconnect(request);

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

    async '/action'(request) {
      if (request.request.method === 'POST') {
        const response = await request.getData();
        const data: WSIncomeEvent = JSON.parse(response.toString());

        const result = processIncomingMessage(data);

        if (result) {
          request.send(JSON.stringify(result));
        } else {
          request.status = 204;
          request.send();
        }
      } else {
        request.status = 405;
        request.send();
      }
    }
  });
}
