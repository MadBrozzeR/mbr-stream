import { WSIncomeEventRequest, WSIncomeEventResponse } from '@common-types/ws-events';
import { ModuleBox, ModuleBoxParams } from '../basic/module-box';
import { newComponent } from '/@client/splux-host';
import { Promised } from '/@client/utils/types';
import { Modal } from '../basic/modal';
import { Form } from '../basic/form';
import { isDefined } from '/@client/utils/utils';
import { Values } from '/@client/type';

const STYLES = {
  '.channel_points': {
    '--content_row': {
      display: 'flex',
      width: '100%',
    },

    '--content_row_point_amount': {
      width: '70px',
    },

    '--content_row_title': {
      flex: 1,
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    },

    '--button': {
      '_add': {
      },
    },
  },
};

const INITIAL_VALUES = {
  title: '',
  prompt: '',
  cost: '100',
  background: '', // #451093
  maxPerStream: '',
  maxPerUser: '',
  cooldown: '',
};

function getUpdatePayloadFromValues(values: Values) {
  const payload: Partial<WSIncomeEventRequest<'create-custom-reward'>> = {};
  const cost = values['cost'] && parseInt(values['cost'], 10);
  const maxPerStream = values['maxPerStream'] && parseInt(values['maxPerStream'], 10);
  const maxPerUser = values['maxPerUser'] && parseInt(values['maxPerUser'], 10);
  const cooldown = values['cooldown'] && parseInt(values['cooldown'], 10);

  values['title'] && (payload.title = values['title']);
  values['prompt'] && (payload.prompt = values['prompt']);
  cost && (payload.cost = cost);
  values['background'] && (payload.background_color = values['background']);

  if (typeof maxPerStream === 'number' && !isNaN(maxPerStream)) {
    if (maxPerStream < 0) {
      payload.is_max_per_stream_enabled = false;
    } else {
      payload.is_max_per_stream_enabled = true;
      payload.max_per_stream = maxPerStream;
    }
  }

  if (typeof maxPerUser === 'number' && !isNaN(maxPerUser)) {
    if (maxPerUser < 0) {
      payload.is_max_per_user_per_stream_enabled = false;
    } else {
      payload.is_max_per_user_per_stream_enabled = true;
      payload.max_per_user_per_stream = maxPerUser;
    }
  }

  if (typeof cooldown === 'number' && !isNaN(cooldown)) {
    if (cooldown < 0) {
      payload.is_global_cooldown_enabled = false;
    } else {
      payload.is_global_cooldown_enabled = true;
      payload.global_cooldown_seconds = cooldown;
    }
  }

  return payload;
}

type PointsResponse = Promised<WSIncomeEventResponse<'get-channel-rewards'>>;

function getValuesFromUpdateResponse(data: PointsResponse[number]): Values {
  return {
      title: data.title,
      prompt: data.prompt,
      cost: data.cost.toString(),
      background: data.background_color,
      maxPerStream: data.max_per_stream_setting.is_enabled
        ? data.max_per_stream_setting.max_per_stream.toString()
        : '-1',
      maxPerUser: data.max_per_user_per_stream_setting.is_enabled
        ? data.max_per_user_per_stream_setting.max_per_user_per_stream.toString()
        : '-1',
      cooldown: data.global_cooldown_setting.is_enabled
        ? data.global_cooldown_setting.global_cooldown_seconds.toString()
        : '-1',
    }
}

const Editor = newComponent(Modal.tag, function () {
  const host = this.host;
  const modal = Modal.call(this, this, {});
  let currentId = '';

  const form = modal.content.dom(Form, {
    fields: {
      title: { type: 'text', value: INITIAL_VALUES.title },
      prompt: { type: 'text', value: INITIAL_VALUES.prompt },
      cost: { type: 'text', value: INITIAL_VALUES.cost },
      background: { type: 'text', value: INITIAL_VALUES.background },
      maxPerStream: { type: 'text', value: INITIAL_VALUES.maxPerStream, label: 'max per stream' },
      maxPerUser: { type: 'text', value: INITIAL_VALUES.maxPerUser, label: 'max per user' },
      cooldown: { type: 'text', value: INITIAL_VALUES.cooldown, label: 'global cooldown' },
    },
    buttons: {
      save: {
        action() {
          const values = form.get(true);
          if (currentId) {
            const payload = getUpdatePayloadFromValues(values);
            modal.loader(host.send({ action: 'update-custom-reward', payload: { id: currentId, ...payload, } }));
            // console.log(payload);
          } else {
            const payload = getUpdatePayloadFromValues({ ...INITIAL_VALUES,  ...values });
            if (isDefined(payload.cost) && isDefined(payload.title)) {
              const title = payload.title;
              const cost = payload.cost;
              modal.loader(host.send({ action: 'create-custom-reward', payload: { ...payload, title, cost, } }));
              // console.log({ ...payload, title, cost, });
            }
          }
        },
      },
    },
  });

  return {
    open(data?: PointsResponse[number]) {
      if (data) {
        modal.setTitle(data.title);
        currentId = data.id;
        form.initialize(getValuesFromUpdateResponse(data));
      } else {
        modal.setTitle('Create new reward');
        currentId = '';
        form.initialize(INITIAL_VALUES);
      }
      modal.show();
    }
  };
});

export const ChannelPoints = newComponent('div.channel_points', function (_, { id }: ModuleBoxParams) {
  const host = this.host;
  host.styles.add('channel-points', STYLES);

  this.dom(ModuleBox, {
    component: this,
    id,
    title: 'Channel Points',
    vars: {
      width: '600px',
      height: '400px',
      left: '20px',
      top: '20px',
    },
  }).dom('div.channel_points--wrapper', function () {
    function refresh() {
      host.send({ action: 'get-channel-rewards' }).then(function (response) {
        content.set(response);
      });
    }

    const editor = this.dom(Editor);

    const content = this.dom('div.channel_points--content', function (content) {
      return {
        set(data: PointsResponse) {
          content.clear();
          data.forEach(function (data) {
            content.dom('div.channel_points--content_row', function () {
              this.dom('div.channel_points--content_row_point_amount').params({ innerText: data.cost.toString() });
              this.dom('div.channel_points--content_row_title').params({ innerText: data.title });

              this.params({
                onclick() {
                  editor.open(data);
                },
              });
            });
          });
        }
      };
    });
    this.dom('div.channel_points--buttons', function () {
      this.dom('div.channel_points--button.channel_points--button_add').params({
        innerText: 'Add',
        onclick() {
          editor.open();
        },
      });
    });

    refresh();
  });
});
