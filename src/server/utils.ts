import { IncomingMessage, OutgoingHttpHeaders } from 'http';
import https from 'https';
import http from 'http';
import { Logger } from 'mbr-logger';
import type { RequestParams, RequestUrl, RESTMethod, Notification, CommandGroup } from './types';
import { config } from './config';
import type { BadgeInfo, EventSubMessageMap, EventSubNotification, EventSubType } from './common-types/eventsub-types';
import type { BadgeData, BadgeStore } from './common-types/ws-events';

export function jsonToUrlEncoded<D extends RequestParams> (data: D) {
  let result = '';

  for (const key in data) if (data[key] !== undefined) {
    if (data[key] instanceof Array) {
      data[key].forEach((value) => {
        if (typeof value === 'object') {
          result += `${result ? '&' : ''}${key}=${encodeURIComponent(JSON.stringify(value))}`;
        } else {
          result += `${result ? '&' : ''}${key}=${encodeURIComponent(value)}`;
        }
      });
    } else if (data[key] instanceof Object) {
      result += `${result ? '&' : ''}${key}=${encodeURIComponent(JSON.stringify(data[key]))}`;
    } else {
      result += `${result ? '&' : ''}${key}=${encodeURIComponent(data[key])}`;
    }
  }

  return result;
}

export function getResponseData (response: IncomingMessage) {
  const result: Buffer[] = [];
  let length = 0;

  return new Promise<Buffer>(function (resolve, reject) {
    response.on('data', function (chunk) {
      result.push(chunk);
      length += chunk.length;
    }).on('end', function () {
      resolve(Buffer.concat(result, length));
    }).on('error', reject);
  });
}

function getResponseJson (response: IncomingMessage) {
  return getResponseData(response).then(function (data) {
    return data.length ? JSON.parse(data.toString()) : undefined;
  });
}

function urlWithParams (url: string, params: RequestParams = {}) {
  const requestParams = jsonToUrlEncoded(params);

  return requestParams ? `${url}?${requestParams}` : url;
}

export function doRequest (
  url: RequestUrl,
  method: RESTMethod = 'GET',
  data: string = '',
  headers: OutgoingHttpHeaders = {}
) {
  return new Promise<IncomingMessage>(function (resolve, reject) {
    const requestUrl = typeof url === 'string'
      ? url
      : url.length === 2
        ? urlWithParams(url[0], url[1])
        : urlWithParams(url[0] + url[1], url[2]);
    log(`Request ${method} ${requestUrl}`);
    const isTls = requestUrl.substring(0, 5) === 'https';
    log(`Data: ${data}`);

    (isTls ? https : http)
      .request(requestUrl, {
        method,
        headers,
      })
      .on('response', async function (response) {
        log(`Request ${method} ${requestUrl} returned status ${response.statusCode}`);

        try {
          if (response.statusCode && response.statusCode < 400) {
            resolve(response);
          } else {
            const status = response.statusCode;
            const data = response;
            reject({ status, data });
          }
        } catch (error) {
          reject(error);
        }
      })
      .on('error', function (error) {
        log(`Request ${method} ${requestUrl} error with message ${error.message}`);
      })
      .end(data);
  });
}

export function apiRequest<R> (
  url: RequestUrl,
  method: RESTMethod = 'GET',
  params: RequestParams = {},
  headers: OutgoingHttpHeaders = {},
): Promise<R> {
  const data = headers['content-type'] === 'application/json' ? JSON.stringify(params) : jsonToUrlEncoded(params);
  return doRequest(url, method, data, { 'content-type': 'application/x-www-form-urlencoded', ...headers, })
    .then(function (response) {
      return getResponseJson(response);
    }).catch(async function (error) {
      const errorData = error.data;
      if (errorData instanceof IncomingMessage) {
        const data = await getResponseJson(errorData);
        log(`Error ${error.status}: ${JSON.stringify(data)}`)
        throw { status: error.status, data };
      } else {
        throw error;
      }
    });
}

export async function parseError (error: any) {
  if (error instanceof IncomingMessage) {
    const data = await getResponseData(error);

    return { status: error.statusCode, data };
  }

  return error;
}

const logger = new Logger(config.logFile, {
  listeners: {
    error: console.log,
    fallback: console.log,
  }
});

export function log(message: string, type: string = 'log') {
  logger.put(`[${new Date().toJSON()}]${type}|${message}`)
};

export const isKeyOf = <T extends {}>(key: string | number | symbol, source: T): key is keyof T => key in source;
export const isDefined = <T>(value: T | undefined): value is T => !(value === undefined);

export function getStringRecord (source?: string) {
  if (!source) {
    return null;
  }

  try {
    const data = JSON.parse(source);
    const result: Record<string, string> = {};

    for (const key in data) if (data[key] && typeof data[key] === 'string') {
      result[key] = data[key];
    }

    return result;
  } catch (error) {
    return null;
  }
}

export function isEventSubMessageType<K extends keyof EventSubMessageMap> (
  data: EventSubMessageMap[keyof EventSubMessageMap],
  type: K
): data is EventSubMessageMap[K] {
  return data.metadata.message_type === type;
};

export function isEventSubNotificationType<T extends keyof EventSubType>(
  data: EventSubNotification<any>,
  type: T
): data is EventSubNotification<T> {
  return isEventSubMessageType(data, 'notification') && isEventType(data.payload, type);
}

export function isEventType<T extends keyof EventSubType>(
  notification: Notification<any>,
  ...types: T[]
): notification is { [K in T]: Notification<K> }[T] {
  for (let index = 0 ; index < types.length ; ++index) {
    if (notification.subscription.type === types[index]) {
      return true;
    }
  }

  return false;
}

export function areMatchedObjects (object1: object, object2: object) {
  return JSON.stringify(object1) === JSON.stringify(object2);
}

export function getUserBadges (badges: BadgeInfo[], badgeStore: BadgeStore) {
  const result: BadgeData[] = [];

  badges.forEach(function (badgeInfo) {
    const data = badgeStore[badgeInfo.set_id]?.[badgeInfo.id];
    if (data) {
      result.push(data);
    }
  });

  return result;
}

export function wait (time: number) {
  return time ? new Promise(function (resolve) {
    setTimeout(resolve, time);
  }) : Promise.resolve();
}

export function consoleLogOptimized (timeout = 0, handler = console.log) {
  type Params = Parameters<typeof console.log>;
  let params: Params | null = null;
  let timeoutRef: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Params) {
    params = args;
    timeoutRef && clearTimeout(timeoutRef);

    timeoutRef = setTimeout(function () {
      params && handler(...params);
      timeoutRef && clearTimeout(timeoutRef);
      timeoutRef = null;
      params = null;
    }, timeout);
  }
}

export function getGroupFromBadges (badges: BadgeInfo[]) {
  let group: CommandGroup = 'chatter';

  badges.some(function (badge) {
    switch (badge.set_id) {
      case 'broadcaster':
        group = 'broadcaster';
        return true;
      case 'moderator':
        group = 'moderator';
        return true;
    }

    return false;
  });

  return group;
}
