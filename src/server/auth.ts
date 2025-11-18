import { config, tokenStorage } from './config';
import { API } from './constants';
import type { TokenResponse } from './types';
import { apiRequest } from './utils';

export async function requestAppGrantToken () {
  const response = await apiRequest<TokenResponse>(API.TOKEN, 'POST', {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'client_credentials',
  });

  return tokenStorage.update('app', response);
}

export async function getAppGrantToken () {
  const tokens = tokenStorage.get('app');

  if (tokens.access_token) {
    return tokens.access_token;
  }

  const response = await requestAppGrantToken();
  return response.access_token;
}

export async function requestUserGrantToken (code: string) {
  const response = await apiRequest<TokenResponse>(API.TOKEN, 'POST', {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
  });

  return tokenStorage.update('user', response);
}

export async function refreshUserToken () {
  const refreshToken = tokenStorage.get('user').refresh_token;

  if (!refreshToken) {
    throw new Error('Refresh token is empty');
  }

  const response = await apiRequest<TokenResponse>(API.TOKEN, 'POST', {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  return tokenStorage.update('user', response);
}
