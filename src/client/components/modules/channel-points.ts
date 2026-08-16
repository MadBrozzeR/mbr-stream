import { ActionResult, WSIncomeEventRequest, WSIncomeEventResponse } from '@common-types/ws-events';
import { ModuleBox, ModuleBoxParams } from '../basic/module-box';
import { newComponent } from '/@client/splux-host';
import { Promised } from '/@client/utils/types';
import { Modal } from '../basic/modal';
import { Form } from '../basic/form';
import { isDefined } from '/@client/utils/utils';
import { Values } from '/@client/type';
import { BUCKET, RELOAD } from '/@client/constants';

const STYLES = {
  '.channel_points': {
    '--wrapper': {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },

    '--content': {
      flex: 1,
      overflowY: 'auto',
    },

    '--content_row': {
      ':hover': {
        textDecoration: 'underline',
      },

      cursor: 'pointer',
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

    '--buttons': {
      marginBottom: '8px',
    },

    '--button': {
      display: 'inline-block',
      marginRight: '4px',
      cursor: 'pointer',
      fontSize: '1.6em',
      lineHeight: '1.2em',
      width: '1.2em',
      height: '1.2em',
      textAlign: 'center',

      '_add': {
        ':before': {
          display: 'block',
          content: '"+"',
        },
      },
      '_refresh': {
        ':before': {
          display: 'block',
          content: '"' + RELOAD + '"',
        },
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
  userInput: '',
  skipQueue: '',
  enabled: 'yes',
  paused: '',
};

function getCreatePayloadFromValues(values: Values) {
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

  if (typeof values['userInput'] === 'string') {
    payload.is_user_input_required = values['userInput'] === 'yes' ? true : false;
  }

  if (typeof values['skipQueue'] === 'string') {
    payload.should_redemptions_skip_request_queue = values['skipQueue'] === 'yes' ? true : false;
  }

  if (typeof values['enabled'] === 'string') {
    payload.is_enabled = values['enabled'] === 'yes' ? true : false;
  }

  return payload;
}

function getUpdatePayloadFromValues(values: Values) {
  const payload: Partial<WSIncomeEventRequest<'update-custom-reward'>> = getCreatePayloadFromValues(values);

  if (typeof values['paused'] === 'string') {
    payload.is_paused = values['paused'] === 'yes' ? true : false;
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
      userInput: data.is_user_input_required ? 'yes' : '',
      skipQueue: data.should_redemptions_skip_request_queue ? 'yes' : '',
      enabled: data.is_enabled ? 'yes' : '',
      paused: data.is_paused ? 'yes' : '',
    }
}

type EditorParams = {
  onSuccess?: () => void;
};

const Editor = newComponent(Modal.tag, function (_, { onSuccess }: EditorParams) {
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
      userInput: { type: 'checkbox', value: INITIAL_VALUES.userInput, label: 'user input required' },
      skipQueue: { type: 'checkbox', value: INITIAL_VALUES.skipQueue, label: 'skip redemption queue' },
      enabled: { type: 'checkbox', value: INITIAL_VALUES.enabled },
      paused: { type: 'checkbox', value: INITIAL_VALUES.paused },
    },
    buttons: {
      Save: {
        action() {
          const values = form.get(true);
          let promise: Promise<ActionResult<unknown>> | null = null;
          if (currentId) {
            const payload = getUpdatePayloadFromValues(values);
            promise = host.send({ action: 'update-custom-reward', payload: { id: currentId, ...payload, } });
          } else {
            const payload = getCreatePayloadFromValues({ ...INITIAL_VALUES,  ...values });
            if (isDefined(payload.cost) && isDefined(payload.title)) {
              const title = payload.title;
              const cost = payload.cost;
              promise = host.send({ action: 'create-custom-reward', payload: { ...payload, title, cost, } });
            }
          }
          if (promise) {
            return modal.loader(promise).then(function ({ result }) {
              if (result) {
                modal.close();
                onSuccess && onSuccess();
              }
            });
          }
          return;
        },
      },
      [BUCKET]: {
        type: 'small_red',
        action() {
          if (currentId) {
            modal.loader(host.send({ action: 'remove-custom-reward', payload: { id: currentId } }))
              .then(function ({ result }) {
                if (result) {
                  modal.close();
                  onSuccess && onSuccess();
                }
            });
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

    const editor = this.dom(Editor, { onSuccess: refresh });

    this.dom('div.channel_points--buttons', function () {
      this.dom('span.channel_points--button.channel_points--button_add').params({
        onclick() {
          editor.open();
        },
      });
      this.dom('span.channel_points--button.channel_points--button_refresh').params({
        onclick() {
          refresh();
        },
      });
    });

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

    refresh();
  });
});
