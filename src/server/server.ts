import type { Request } from 'mbr-serv-request';
import { requestUserGrantToken } from './auth';
import { config } from './config';
import { getGroupFromBadges, getStringRecord, getUserBadges, isEventSubMessageType, isEventSubNotificationType, isKeyOf } from './utils';
import { api } from './api';
import { startWSClient, startWSServer } from './ws';
import { createPolling, dataStorage, dataStorageKeys, getStreamInfo, getUserInfo, getUserInfoWithReconnect } from './api-wrappers';
import type { WSIncomeEvent, BadgeStore, WSEvent, ChatCommand, WSIncomeEventResponse, WSIncomeEventActions } from './common-types/ws-events';
import { downloadResources, PRELOAD_RESOURCES } from './resource-downloader';
import { COMMAND_CONFIG, CommandProcessor } from './chat-commands';
import type { SendChatMessageRequest } from './types';
import type { EventSubNotification } from './common-types/eventsub-types';

const STATIC_ROOT = __dirname + '/../../static/';
const CLIENT_ROOT = __dirname + '/../client/';
const MODULES_ROOT = __dirname + '/../../node_modules/';

const wsServer = startWSServer();

const streamInfoPolling = config.startChat ? createPolling(120000, getStreamInfo, function (streamInfo) {
  wsServer.sendData({ type: 'streamInfo', payload: streamInfo });
}) : null;

const commandProcessor = new CommandProcessor(COMMAND_CONFIG);

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

downloadResources(PRELOAD_RESOURCES).then(function (result) {
  console.log('Resources statuses:', result);
});

type SendMessageOptions = {
  prefix?: string;
  replyTo?: EventSubNotification<'channel.chat.message'>;
};

function sendMessage(message: string, { prefix = '', replyTo }: SendMessageOptions = {}) {
  getUserInfo().then(function (info) {
    if (info && message) {
      const params: SendChatMessageRequest = {
        sender_id: info.id,
        broadcaster_id: info.id,
        message: prefix + message,
      };
      if (replyTo) {
        params.reply_parent_message_id = replyTo.payload.event.message_id;
      }

      api.Chat.sendChatMessage(params).then(function (response) {
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
}

const incomingMessageProcessor: {
  [T in WSIncomeEventActions]: (message: WSIncomeEvent<T>) => WSIncomeEventResponse<T>;
} = {
  async 'get-stream-info'() {
    const info = streamInfoPolling?.get();
    info && wsServer.sendData({ type: 'streamInfo', payload: info });
    return info || null;
  },

  async 'clear-all-chats'() {
    wsServer.sendData({ type: 'interfaceAction', payload: 'chat-clear' })
  },

  async 'module-setup'(message) {
    const payload = { module: message.payload.module, setup: message.payload.setup };
    wsServer.sendData({ type: 'moduleSetup', payload }, { name: message.payload.view });
  },

  async 'bot-say'(message) {
    const messageText = message.payload;

    if (!config.startChat) {
      console.log('[BOT-SAY]:', messageText);
      return;
    }

    sendMessage(messageText, { prefix: '[AUTO] ' });
  },

  async 'get-categories'(message) {
    if (!message.payload.query) {
      return [];
    }

    const response = await api.Search.searchCategories({ query: message.payload.query });
    const payload = response.data.map(function (data) {
      return {
        id: data.id,
        name: data.name,
      };
    });

    return payload;
  },

  async 'update-stream-info'({ payload }) {
    const userInfo = await getUserInfo();

    await api.Channels.modifyChannelInformation({
      broadcaster_id: userInfo.id,
      title: payload.title,
      tags: payload.tags.split(/,\s*/g),
      game_id: payload.category.split('|')[0] || '',
      broadcaster_language: payload.language,
    });

    return;
  },

  async 'get-clips'({ payload }) {
    const clips = await api.Clips.getClips({ broadcaster_id: payload.broadcaster, first: 100 });
    return clips.data.sort(function (item1, item2) {
      return item1.created_at > item2.created_at ? -1 : 1;
    });
  },

  async 'show-clip'({ payload }) {
    wsServer.sendData({ type: 'showClip', payload });
  },

  async 'get-streams'({ payload }) {
    const streams = await api.Streams.getStreams(payload);
    wsServer.sendData({ type: 'getStreams',  payload: streams });
    return streams;
  },
}

function processIncomingMessage<T extends WSIncomeEventActions> (message: WSIncomeEvent<T>) {
  return incomingMessageProcessor[message.action](message);
}

function processCommand(command: ChatCommand | null, notification: EventSubNotification<'channel.chat.message'>) {
  if (!command) {
    return;
  }

  switch (command.cmd) {
    case '!so': {
      const mention = command.params[0]?.mention;
      mention && getUserInfo().then(function (info) {
        api.Chat.sendShoutout({
          from_broadcaster_id: info.id,
          to_broadcaster_id: mention.user_id,
          moderator_id: info.id,
        }).catch(console.log);
      }).catch(console.log);
      break;
    }

    case '!commands': {
      const group = getGroupFromBadges(notification.payload.event.badges);
      const list = commandProcessor.getList(group);
      let message = '';
      for (const command in list) if (isKeyOf(command, list) && list[command] && list[command].description) {
        message += `${message ? ' / ' : ''} ${command} (${list[command].description})`;
      }
      if (message) {
        sendMessage(`Available commands for you: ${message}`, { replyTo: notification });
      } else {
        sendMessage('No commands available for you, sorry...', { replyTo: notification });
      }
    }
  }
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

      const promise = isEventSubNotificationType(message, 'channel.chat.message')
        ? Promise.all([
          apiStorage.getBadges(),
          apiStorage.getUser([message.payload.event.chatter_user_id]),
        ]).then(function ([badgeStore, user]) {
          if (badgeStore) {
            payload.badges = getUserBadges(message.payload.event.badges, badgeStore);
          }
          payload.user = user[message.payload.event.chatter_user_id] || null;
          payload.command = commandProcessor.getCommand(message.payload);
          processCommand(payload.command, message);
        })
        : Promise.resolve(payload);
      promise.then(function () {
        wsServer.sendData({ type: 'notification', payload });
      });
    } else if (isEventSubMessageType(message, 'session_reconnect')) {
      wsServer.sendData({ type: 'info', payload: 'Reconnecting to Twitch...' })
    }
  }, function (info) {
    wsServer.sendData({ type: 'info', payload: info });
  });

  wsServer.listen(function (message) {
    processIncomingMessage(message);
  });
} catch (error) {
  console.log(error);
}

export async function server (request: Request) {
  // console.log(request.request.url);
  request.match(/^\/@client\/(.+)$/, function (regMatch) {
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
      request.redirect(api.getConnectLink());
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
        try {
          const response = await request.getData();
          const data: WSIncomeEvent = JSON.parse(response.toString());
          const result = await processIncomingMessage(data);

          if (result !== undefined) {
            request.send(JSON.stringify(result));
          } else {
            request.status = 204;
            request.send();
          }
        } catch (error) {
          console.log(error);
          request.status = 500;
          request.send();
        }
      } else {
        request.status = 405;
        request.send();
      }
    },

    '/clip-test': __dirname + '/../../static/clip-embed.html',
  });
}
