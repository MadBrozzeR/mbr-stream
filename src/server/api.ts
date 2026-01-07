import type { OutgoingHttpHeaders } from 'http';
import { API } from './constants';
import type * as Types from './types';
import type * as ETypes from './eventsub-types';
import { apiRequest } from './utils';
import { getAppGrantToken, refreshUserToken, requestAppGrantToken } from './auth';
import { config, tokenStorage } from './config';

function getHeaders (token: string, headers?: OutgoingHttpHeaders): OutgoingHttpHeaders {
  return {
    Authorization: `Bearer ${token}`,
    'Client-Id': config.clientId,
    ...headers,
  };
}

export async function appApiRequest<R> (
  url: Types.RequestUrl,
  method: Types.RESTMethod = 'GET',
  params: Types.RequestParams = {},
  headers: OutgoingHttpHeaders = {}
): Promise<R> {
  const token = await getAppGrantToken();

  try {
    return await apiRequest(url, method, params, getHeaders(token));
  } catch (error: any) {
    if ('status' in error && error.status === 401) {
      const token = await requestAppGrantToken();
      return await apiRequest(url, method, params, getHeaders(token.access_token, headers));
    }

    throw error;
  }
}

export async function userApiRequest<R> (
  url: Types.RequestUrl,
  method: Types.RESTMethod = 'GET',
  params: Types.RequestParams = {},
  headers: OutgoingHttpHeaders = {}
): Promise<R> {
  const { access_token, refresh_token } = tokenStorage.get('user');

  if (!access_token || !refresh_token) {
    throw { status: 401, data: 'Unautharized' };
  }

  try {
    return await apiRequest<R>(url, method, params, getHeaders(access_token, headers));
  } catch (error: any) {
    if ('status' in error && error.status === 401) {
      const { access_token } = await refreshUserToken();
      return await apiRequest<R>(url, method, params, getHeaders(access_token, headers));
    }

    throw error;
  }

  throw { status: 401, data: 'Unautharized' };
}

export const api = {
  Channels: {
    getChannelsInfo(params: Types.GetChannelsInfoRequest) {
      return userApiRequest<Types.GetChannelsInfoResponse>([API.CHANNELS, params]);
    },
    getChannelFollowers(params: Types.GetChannelFollowersRequest) {
      return userApiRequest<Types.GetChannelFollowersResponse>([`${API.CHANNELS}/followers`, params]);
    },
  },
  Streams: {
    getStreams(params: Types.GetStreamsRequest) {
      return userApiRequest<Types.GetStreamsResponse>([API.STREAMS, params]);
    },
  },
  EventSub: {
    createEventSubSubscription<K extends keyof ETypes.EventSubType>(params: Types.CreateEventSubSubscriptionRequest<K>) {
      return userApiRequest<Types.CreateEventSubSubscriptionResponse<K>>(
        `${API.EVENTSUB}/subscriptions`,
        'POST',
        params,
        { 'content-type': 'application/json' },
      );
    },
    deleteEventSubSubscription(params: Types.DeleteEventSubSubscriptionRequest) {
      return userApiRequest<Types.DeleteEventSubSubscriptionResponse>(
        [`${API.EVENTSUB}/subscriptions`, params],
        'DELETE'
      );
    },
    getEventSubSubscription(params: Types.GetEventSubSubscriptionRequest) {
      return userApiRequest<Types.GetEventSubSubscriptionResponse>(
        [`${API.EVENTSUB}/subscriptions`, params],
        'GET',
        undefined,
        { 'content-type': 'application/json' },
      );
    },
  },
  Users: {
    getUsers({ id, login }: Types.GetUsersRequest = {}) {
      return userApiRequest<Types.GetUsersResponse>([API.USERS, { id, login }]);
    },
  },
};
