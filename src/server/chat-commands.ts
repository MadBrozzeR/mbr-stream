import type { Notification } from './types';
import type { ChatCommand } from './common-types/ws-events';

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
