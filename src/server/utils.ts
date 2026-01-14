import { IncomingMessage, OutgoingHttpHeaders } from 'http';
import https from 'https';
import http from 'http';
import { Logger } from 'mbr-logger';
import type { RequestParams, RequestUrl, RESTMethod } from './types';
import { config } from './config';
import { EventSubMessageMap } from './common-types/eventsub-types';

export function jsonToUrlEncoded<D extends RequestParams> (data: D) {
  let result = '';

  for (const key in data) if (data[key] !== undefined) {
    if (data[key] instanceof Array) {
      data[key].forEach((value) => {
        result += `${result ? '&' : ''}${key}=${encodeURIComponent(value)}`
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
    return JSON.parse(data.toString());
  });
}

function urlWithParams (url: string, params: RequestParams = {}) {
  const requestParams = jsonToUrlEncoded(params);

  return requestParams ? `${url}?${requestParams}` : url;
}

export function apiRequest<R> (
  url: RequestUrl,
  method: RESTMethod = 'GET',
  params: RequestParams = {},
  headers: OutgoingHttpHeaders = {},
): Promise<R> {
  return new Promise(function (resolve, reject) {
    const data = headers['content-type'] === 'application/json' ? JSON.stringify(params) : jsonToUrlEncoded(params);
    const requestUrl = typeof url === 'string' ? url : urlWithParams(url[0], url[1]);
    log(`Request ${method} ${requestUrl}`);
    const isTls = requestUrl.substring(0, 5) === 'https';
    log(`Data: ${data}`);

    (isTls ? https : http)
      .request(requestUrl, {
        method,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          ...headers,
        },
      })
      .on('response', async function (response) {
        log(`Request ${method} ${requestUrl} returned status ${response.statusCode}`);

        try {
          if (response.statusCode && response.statusCode < 400) {
            resolve(await getResponseJson(response));
          } else {
            const status = response.statusCode;
            const data = await getResponseJson(response);
            log(`Error ${status}: ${JSON.stringify(data)}`)
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

export function areMatchedObjects (object1: object, object2: object) {
  return JSON.stringify(object1) === JSON.stringify(object2);
}
