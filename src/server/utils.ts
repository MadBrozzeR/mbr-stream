import { IncomingMessage, OutgoingHttpHeaders } from 'http';
import https from 'https';
import { Logger } from 'mbr-logger';
import type { RequestParams, RequestUrl, RESTMethod } from './types';
import { config } from './config';

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

    https
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
