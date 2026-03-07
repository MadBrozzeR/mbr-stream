import type { OutgoingHttpHeaders } from 'http';
import { API } from './constants';
import type * as Types from './types';
import type * as ETypes from './common-types/eventsub-types';
import { apiRequest, jsonToUrlEncoded } from './utils';
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

const api = {
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
  Chat: {
    getChatters(params: Types.GetChattersRequest) {
      return userApiRequest<Types.GetChattersResponse>([`${API.CHAT}/chatters`, params]);
    },
    sendChatAnnouncement({
      broadcaster_id, moderator_id, message, color,
    }: Types.SendChatAnnouncementRequestParams & Types.SendChatAnnouncementRequest) {
      // moderator:manage:announcements is required
      return userApiRequest<Types.SendChatAnnouncementResponse>(
        [`${API.CHAT}/announcements`, { broadcaster_id, moderator_id }],
        'POST',
        { message, color },
      );
    },
    sendChatMessage(params: Types.SendChatMessageRequest) {
      // user:write:chat is required
      // user:bot and/or channel:bot are required for App Access Token
      return userApiRequest<Types.SendChatMessageResponse>(`${API.CHAT}/messages`, 'POST', params);
    },
    getGlobalChatBadges() {
      return userApiRequest<Types.GetGlobalChatBadgesResponse>(`${API.CHAT}/badges/global`);
    },
    getChannelChatBadges(params: Types.GetChannelChatBadgesRequest) {
      return userApiRequest<Types.GetChannelChatBadgesResponse>([`${API.CHAT}/badges/global`, params]);
    },
    sendShoutout(params: Types.SendShoutoutRequest) {
      // moderator:manage:shoutouts
      return userApiRequest<Types.SendShoutoutResponse>([`${API.CHAT}/shoutouts`, params], 'POST');
    },
  },
  GuestStar: {
    getChannelGuestStarSettings(params: Types.GetChannelGuestStarSettingsRequest) {
      // channel:read:guest_star, channel:manage:guest_star, moderator:read:guest_star or moderator:manage:guest_star
      return userApiRequest<Types.GetChannelGuestStarSettingsResponse>([`${API.GUEST_STAR}/channel_settings`, params]);
    },
    updateChannelGuestStarSettings({ broadcaster_id, ...body }:
      Types.UpdateChannelGuestStarSettingsRequestParams & Types.UpdateChannelGuestStarSettingsRequest) {
      return userApiRequest<Types.UpdateChannelGuestStarSettingsResponse>(
        [`${API.GUEST_STAR}/channel_settings`, { broadcaster_id }],
        'PUT',
        body,
      );
    },
    getGuestStarSession(params: Types.GetGuestStarSessionRequest) {
      return userApiRequest<Types.GetGuestStarSessionResponse>([`${API.GUEST_STAR}/session`, params]);
    },
    createGuestStarSession(params: Types.CreateGuestStarSessionRequest) {
      return userApiRequest<Types.CreateGuestStarSessionResponse>([`${API.GUEST_STAR}/session`, params], 'POST');
    },
    endGuestStarSession(params: Types.EndGuestStarSessionRequest) {
      return userApiRequest<Types.EndGuestStarSessionResponse>([`${API.GUEST_STAR}/session`, params], 'DELETE');
    },
    getGuestStarInvites(params: Types.GetGuestStarInvitesRequest) {
      // channel:read:guest_star, channel:manage:guest_star, moderator:read:guest_star or moderator:manage:guest_star
      return userApiRequest<Types.GetGuestStarInvitesResponse>([`${API.GUEST_STAR}/invites`, params]);
    },
    sendGuestStarInvite(params: Types.SendGuestStarInviteRequest) {
      // channel:manage:guest_star or moderator:manage:guest_star
      return userApiRequest<Types.SendGuestStarInviteResponse>([`${API.GUEST_STAR}/invites`, params], 'POST');
    },
    deleteGuestStarInvite(params: Types.DeleteGuestStarInviteRequest) {
      // channel:manage:guest_star or moderator:manage:guest_star
      return userApiRequest<Types.DeleteGuestStarInviteResponse>([`${API.GUEST_STAR}/invites`, params], 'DELETE');
    },
    assignGuestStarSlot(params: Types.AssignGuestStarSlotRequest) {
      // channel:manage:guest_star or moderator:manage:guest_star
      return userApiRequest<Types.AssignGuestStarSlotResponse>([`${API.GUEST_STAR}/slot`, params], 'POST');
    },
    updateGuestStarSlot(params: Types.UpdateGuestStarSlotRequest) {
      // channel:manage:guest_star or moderator:manage:guest_star
      return userApiRequest<Types.UpdateGuestStarSlotResponse>([`${API.GUEST_STAR}/slot`, params], 'PATCH');
    },
    deleteGuestStarSlot(params: Types.DeleteGuestStarSlotRequest) {
      // channel:manage:guest_star or moderator:manage:guest_star
      return userApiRequest<Types.DeleteGuestStarSlotResponse>([`${API.GUEST_STAR}/slot`, params], 'DELETE');
    },
    updateGuestStarSlotSettings(params: Types.UpdateGuestStarSlotSettingsRequest) {
      // channel:manage:guest_star or moderator:manage:guest_star
      return userApiRequest<Types.UpdateGuestStarSlotSettingsResponse>(
        [`${API.GUEST_STAR}/slot_settings`, params],
        'PATCH'
      );
    },
  },
};

type TwitchApiParams<S extends ETypes.Scope> = {
  clientId: string;
  redirectUri: string;
  scope: S[];
};

export class TwitchApi<S extends ETypes.Scope> {
  scope: S[];
  clientId: string;
  redirectUri: string;
  constructor(params: TwitchApiParams<S>) {
    this.clientId = params.clientId,
    this.redirectUri = params.redirectUri,
    this.scope = params.scope;
  }

  getConnectLink() {
    const params = jsonToUrlEncoded({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scope.join(' '),
    });

    return `${API.AUTHORIZE}?${params}`;
  }

  Chat = api.Chat;
  Channels = api.Channels;
  EventSub = api.EventSub;
  Streams = api.Streams;
  Users = api.Users;
  GuestStar = api.GuestStar;
};

const apiInstance = new TwitchApi({
  clientId: config.clientId,
  redirectUri: config.redirectUri,
  scope: [
    'channel:read:subscriptions',
    'moderator:read:followers',
    'moderator:read:chatters',
    'user:read:chat',
    'user:write:chat',
    'channel:manage:guest_star',
    'moderator:manage:shoutouts',
  ],
});

export { apiInstance as api };

/*
 * One idea about checking rights in scope
type A = 'a' | 'b';

type Contains<T, K> = Exclude<T, Exclude<T, K>> extends never ? false : true;

type B = Contains<A, 'd' | 'c'>;
*/
