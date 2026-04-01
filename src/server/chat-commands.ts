import type { CommandGroup, Notification } from './types';
import type { ChatCommand } from './common-types/ws-events';
import { getGroupFromBadges, isKeyOf } from './utils';

export function getCommand (message: Notification<'channel.chat.message'>) {
  const fragments = message.event.message.fragments;
  const firstFragment = fragments[0];
  if (firstFragment && firstFragment.type === 'text' && firstFragment.text[0] === '!') {
    const result: ChatCommand = {
      cmd: '',
      params: [],
    };
    const splitted = firstFragment.text.trim().split(' ');
    result.cmd = splitted[0] || '';
    for (let index = 1 ; index < splitted.length ; ++index) {
      result.params.push({ type: 'text', text: splitted[index] || '' });
    }
    for (let index = 1 ; index < fragments.length ; ++index) {
      const fragment = fragments[index];
      fragment && result.params.push(fragment);
    }

    return result;
  }

  return null;
}

type CommandConfigItem = {
  description?: string;
  global?: number;
  personal?: number;
  groups?: CommandGroup[];
};

type CommandConfig<C extends string> = {
  [K in C]: CommandConfigItem;
}

type CommandStats = {
  global: number;
  personal: Record<string, number>;
};

export class CommandProcessor<C extends string> {
  config: CommandConfig<C>;
  stats: Partial<Record<C, CommandStats>> = {};

  constructor(config: CommandConfig<C>) {
    this.config = config;
  }

  getList(group: CommandGroup) {
    const result: Partial<CommandConfig<C>> = {};

    for (const key in this.config) {
      const config = this.config[key];

      if (config && (!config.groups || config.groups.indexOf(group) > -1)) {
        result[key] = this.config[key];
      }
    }

    return result;
  }

  checkAndUpdateStats(userId: string, command: C) {
    const config = this.config[command];
    const timestamp = Date.now();
    const stats = this.stats[command] || { global: 0, personal: {} };
    if (!this.stats[command]) {
      this.stats[command] = stats;
    }
    const globalStat = stats.global;
    const personalStat = stats.personal[userId] || 0;

    if (globalStat + (config.global || 0) > timestamp) {
      return 'global';
    }

    if (personalStat + (config.personal || 0) > timestamp) {
      return 'personal';
    }

    stats.global = timestamp;
    stats.personal[userId] = timestamp;

    return '';
  }

  getCommand(notification: Notification<'channel.chat.message'>) {
    const command = getCommand(notification);

    if (!command) {
      return null;
    }

    const group = getGroupFromBadges(notification.event.badges);

    const availableCommands = this.getList(group);

    if (!isKeyOf(command.cmd, availableCommands)) {
      return null;
    }

    const limitHit = this.checkAndUpdateStats(notification.event.chatter_user_id, command.cmd);

    if (limitHit) {
      return null;
    }

    return command;
  }
}

export const COMMAND_CONFIG = {
  '!lurk': {
    description: 'Let me know if you\'re lurking',
    global: 0,
    personal: 10000,
  },
  '!follow': {
    description: 'Test animation if someone is following my channel',
    global: 0,
    personal: 0,
    groups: ['broadcaster', 'moderator'],
  },
  '!so': {
    description: 'Shoutout another streamer to my audience',
    global: 0,
    personal: 0,
    groups: ['broadcaster', 'moderator'],
  },
  '!commands': {
    description: 'List all available commands',
    global: 0,
    personal: 10000,
  },
} satisfies CommandConfig<string>;
