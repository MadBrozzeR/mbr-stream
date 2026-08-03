import Config from 'mbr-config';
import type { TokenResponse } from './types';

const secretConfig = Config.use(__dirname + '/../../.config.secret.json', {
  clientId: '',
  clientSecret: '',
});

const sharedConfig = Config.use(__dirname + '/../../.config.json', {
  redirectUri: 'http://localhost/',
  logFile: __dirname + '/../../log.txt',
  eventSubLog: __dirname + '/../../eventsub.log',
  startChat: true,
});

export const config = {
  ...secretConfig,
  ...sharedConfig,
};

type TokenStorage = {
  app: TokenResponse;
  user: TokenResponse;
};

export const tokenStorage = {
  config: new Config<TokenStorage>(__dirname + '/../../.token.json', {
    app: {
      access_token: '',
      expires_in: 0,
      refresh_token: '',
      scope: [],
      token_type: 'bearer',
    },
    user: {
      access_token: '',
      expires_in: 0,
      refresh_token: '',
      scope: [],
      token_type: 'bearer',
    }
  }),

  update(key: keyof TokenStorage, config: TokenResponse) {
    this.config.config[key] = config;
    this.config.write();

    return this.config.config[key];
  },

  get(key: keyof TokenStorage) {
    return this.config.config[key];
  }
};
