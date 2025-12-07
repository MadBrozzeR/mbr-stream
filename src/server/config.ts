import Config from 'mbr-config';
import type { TokenResponse } from './types';

export const config = Config.use(__dirname + '/../../.config.json', {
  clientId: '',
  clientSecret: '',
  redirectUri: 'http://localhost/',
  logFile: __dirname + '/../../log.txt',
  eventSubLog: __dirname + '/../../eventsub.log',
  startChat: true,
});

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
