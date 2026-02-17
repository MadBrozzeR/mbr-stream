import type { EventSubType } from '@common-types/eventsub-types';
import type { StreamInfo } from '@common-types/ws-events';
import type { Component, Splux } from '../lib-ref/splux';
import type { Host } from '../splux-host';
import type { EventType, Notification } from '../type';

export function isEventType<T extends EventType>(
  notification: Notification,
  ...types: T[]
): notification is {[K in T]: Notification<K>}[T] {
  for (let index = 0 ; index < types.length ; ++index) {
    if (notification.subscription.type === types[index]) {
      return true;
    }
  }

  return false;
}

function imageAtlasOffset (value: number) {
  return value ? ` ${-value}px` : '';
}

export function imageAtlas<K extends string> (url: string, parts: Record<K, [number, number, number, number]>) {
  const result = {} as Record<K, Record<'width' | 'height' | 'background', string>>;

  for (const key in parts) {
    result[key] = {
      width: `${parts[key][2]}px`,
      height: `${parts[key][3]}px`,
      background: `left${imageAtlasOffset(parts[key][0])} top${imageAtlasOffset(parts[key][1])} url("${url}") no-repeat`,
    };
  }

  return result;
}

export function isKeyOf<T extends {}> (key: string | number | symbol, source: T): key is keyof T {
  return key in source;
}

export function splitByFirst (name: string, glue: string): [string, string] {
  const position = name.indexOf(glue);

  return position > -1 ? [name.substring(0, position), name.substring(position + glue.length)] : [name, ''];
}

export function useModuleManager (
  root: Splux<any, Host>,
  components: Record<string, Component<any, Host, void, { id: string; }>>
) {
  const modules: Record<string, null | Splux<any, Host>> = {};

  return function (idSet: Record<string, unknown>) {
    const mentioned: Record<string, true> = {};

    for (const id in idSet) {
      const [componentId] = splitByFirst(id, '+');

      if (components[componentId]) {
        mentioned[id] = true;
        if (!modules[id]) {
          modules[id] = root.dom(components[componentId], { id });
        }
      }
    }

    for (const id in modules) {
      if (modules[id] && !mentioned[id]) {
        modules[id].remove();
        delete modules[id];
      }
    }
  }
}

export function zeroLead (value: number, filler = '00') {
  let result = value.toString();
  return result.length < filler.length
    ? (filler.substring(0, filler.length - result.length) + result)
    : result;
}

export function changeModes (modes: Record<string, boolean>, newModes: string) {
  const newValues = newModes.split('|').reduce<Record<string, null>>(function (result, value) {
    result[value] = null;
    return result;
  }, {});

  for (const key in modes) {
    modes[key] = key in newValues;
  }

  return modes;
}

export function isDefined<T> (value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

const DASH_NAME_RE = /^\/dash\/([^\/]+)/;

export function getDashName () {
  const dashIdMatch = DASH_NAME_RE.exec(window.location.pathname);

  return dashIdMatch ? dashIdMatch[1] : 'unnamed';
}

const TEMPLATE_KEY_RE = /\{\{(\w+)\}\}/g;

export function useTemplate (template: string, substitutions: Record<string, string | number>) {
  return template.replace(TEMPLATE_KEY_RE, function (source, key) {
    return substitutions[key] ? substitutions[key].toString() : source;
  });
}

export function checkForAutoMessage (event: EventSubType['channel.chat.message']['payload'], streamInfo: StreamInfo | null) {
  return streamInfo
    && streamInfo.userId === event.chatter_user_id
    && event.message.text.substring(0, 6) === '[AUTO]';
}

const ADD_TIME_RE = /^([+\-])(\d+)([ms])$/;
const TIME_MULTIPLIER = {
  m: 60 * 1000,
  s: 1000,
};

export function getDateFromString (time: string, base?: number) {
  const addTimeMatch = ADD_TIME_RE.exec(time);
  let result = 0;

  if (addTimeMatch && addTimeMatch[2] && addTimeMatch[3] && isKeyOf(addTimeMatch[3], TIME_MULTIPLIER)) {
    result = base || Date.now();
    const increment = parseInt(addTimeMatch[2], 10) * TIME_MULTIPLIER[addTimeMatch[3] || 's'];

    if (addTimeMatch[1] === '-') {
      result -= increment;
    } else {
      result += increment;
    }
  } else {
    result = Date.parse(time);
  };

  return isNaN(result) ? 0 : result;
}

export function getTimeString (time: number) {
  const date = new Date(time);
  return date.getFullYear() + '-' + zeroLead(date.getMonth() + 1) + '-' + zeroLead(date.getDate()) + 'T' +
    zeroLead(date.getHours()) + ':' + zeroLead(date.getMinutes()) + ':' + zeroLead(date.getSeconds()) + '.' +
    zeroLead(date.getMilliseconds(), '000') + '+03:00';
}

type CompareKeyStatus = 'removed' | 'stay' | 'new';
export function compareKeys (source: Record<string, any>, updated: Record<string, any>, callback: (key: string, status: CompareKeyStatus) => void) {
  const status: Record<string, CompareKeyStatus> = {};
  for (const key in source) {
    status[key] = 'removed';
  }
  for (const key in updated) {
    if (key in status) {
      status[key] = 'stay';
    } else {
      status[key] = 'new';
    }
  }

  for (const key in status) if (status[key]) {
    callback(key, status[key]);
  }
}

export function keyMapper<T extends Record<string, any>> (array: T[], useAsKey: string = 'id') {
  const result: Record<string, T> = {};

  for (let index = 0 ; index < array.length ; ++index) {
    const item = array[index];
    if (item && useAsKey in item) {
      result[item[useAsKey]] = item;
    }
  }

  return result;
}
