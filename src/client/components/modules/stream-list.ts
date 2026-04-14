import { WSIncomeEvent } from '@common-types/ws-events';
import { ModuleBox, ModuleParams } from '../basic/module-box';
import { newComponent } from '/@client/splux-host';
import { Broadcast, isCast } from '/@client/utils/broadcaster';
import { getDashName } from '/@client/utils/utils';
import { SYMBOL } from '/@client/constants';

const STYLES = {
  '.stream_list': {
    '--wrapper': {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },

    '--title_line': {
      display: 'flex',
      gap: '8px',
      height: '1em',
      fontSize: '2em',
    },

    '--title_line_text': {
      flex: 1,
    },

    '--title_line_controls': {
      width: '1em',
      textAlign: 'center',
      fontWeight: 900,
      lineHeight: '1em',
      cursor: 'pointer',

      ':hover': {
        color: '#00a',
      },
    },

    '--title_line_reload': {
      transform: 'rotate(135deg)',
    },

    '--title_line_left': {
    },

    '--title_line_right': {
    },

    '--content': {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },

    '--content_row': {
      flex: 1,
      display: 'flex',
      gap: '12px',
    },

    '--content_cell': {
      flex: 1,
    },

    '--item': {
      backgroundImage: 'var(--image, none)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      height: '100%',
      position: 'relative',

      ':hover': {
        transform: 'scale(1.2)',
        zIndex: 1,
      },
    },

    '--item_info': {
      position: 'absolute',
      left: 0,
      bottom: 0,
      right: 0,
      backgroundColor: '#009',
      display: 'flex',
      color: 'white',
    },

    '--item_title': {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      flex: 1,
      padding: '2px',
      lineHeight: '1em',
    },

    '--item_count': {
      backgroundColor: '#007',
      width: '3em',
      padding: '2px',
      lineHeight: '1em',
      textAlign: 'right',
    },
  },
};

const GRID_RE = /(\d+)\s*[x*]\s*(\d+)/;

type StreamListItemParams = {
  item: Broadcast['getStreams']['data'][number];
};

const StreamListItem = newComponent('div.stream_list--item', function (_, { item }: StreamListItemParams) {
  const image = 'url(' + item.thumbnail_url.replace('{width}x{height}', '320x200') + ')';
  this.node.style.setProperty('--image', image);

  this.dom('div.stream_list--item_info', function () {
    this.dom('div.stream_list--item_title').params({ innerText: item.title });
    this.dom('div.stream_list--item_count').params({ innerText: item.viewer_count.toString() });
  });
});

export const StreamList = newComponent('div.stream_list', function (_, { id }: ModuleParams) {
  const host = this.host;
  const grid = {
    width: 0,
    height: 0,
    total: 0,
  };
  let cursor = '';

  let request = function (direction: 'next' | 'prev' | 'init' = 'init') {
    const payload: WSIncomeEvent<'get-streams'>['payload'] = {
      view: getDashName() || '',
      first: grid.total,
    };

    if (cursor && direction !== 'init') {
      if (direction === 'next') {
        payload.after = cursor;
      } else {
        payload.before = cursor;
      }
    }

    host.send({ action: 'get-streams', payload });
  };

  host.styles.add('stream-list', STYLES);

  this.dom(ModuleBox, {
    component: this,
    id,
    title: 'Streams',
    vars: {
      top: '20px',
      bottom: '20px',
      right: '20px',
      left: '20px',
      grid: '4x3',
    },
    onSetupChange(values) {
      if (values['grid']) {
        const gridMatch = GRID_RE.exec(values['grid']);

        if (gridMatch && gridMatch[1] && gridMatch[2]) {
          grid.width = parseInt(gridMatch[1], 10);
          grid.height = parseInt(gridMatch[2], 10);
          grid.total = grid.height * grid.width;
        }
      }
    },
  }).dom('div.stream_list--wrapper', function () {
    this.dom('div.stream_list--title_line', function () {
      this.dom('div.stream_list--title_line_text');
      this.dom('div.stream_list--title_line_reload.stream_list--title_line_controls')
        .params({ innerText: SYMBOL.CLOCKWISE_ARROW, onclick() { request('init'); } });
      this.dom('div.stream_list--title_line_left.stream_list--title_line_controls')
        .params({ innerText: SYMBOL.LEFT_BOLD_ARROW, onclick() { request('prev'); } });
      this.dom('div.stream_list--title_line_right.stream_list--title_line_controls')
        .params({ innerText: SYMBOL.RIGHT_BOLD_ARROW, onclick() { request('next'); } });
    });
    this.dom('div.stream_list--content', function (content) {
      this.tuneIn(function (data) {
        if (isCast('getStreams', data)) {
          content.clear();
          cursor = data.payload.pagination.cursor;
          for (let rowIndex = 0 ; rowIndex < grid.height ; ++rowIndex) {
            content.dom('div.stream_list--content_row', function () {
              for (let colIndex = 0 ; colIndex < grid.width ; ++colIndex) {
                this.dom('div.stream_list--content_cell', function () {
                  const item = data.payload.data[rowIndex * grid.width + colIndex];
                  item && this.dom(StreamListItem, { item });
                });
              }
            });
          }
          // console.log(data.payload.data);
        }
      });
    });
  });
});
