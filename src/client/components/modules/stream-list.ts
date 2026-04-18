import { WSIncomeEvent } from '@common-types/ws-events';
import { ModuleBox, ModuleParams } from '../basic/module-box';
import { newComponent } from '/@client/splux-host';
import { Broadcast, isCast } from '/@client/utils/broadcaster';
import { debounce, getDashName, splitByFirst } from '/@client/utils/utils';
import { SYMBOL } from '/@client/constants';
import { ComponentSplux } from '/@client/lib-ref/splux';

const STYLES = {
  '.stream_list': {
    '--wrapper': {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',

      ':hover .stream_list--title_line': {
        opacity: 1,
      },
    },

    '--title_line': {
      display: 'flex',
      gap: '8px',
      height: '1em',
      fontSize: '2em',
      opacity: 0,
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
      transition: '0.2s transform ease-in-out',
      cursor: 'pointer',

      '-hover': {
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
      paddingLeft: '8px',
      lineHeight: '1em',
    },

    '--item_count': {
      backgroundColor: '#007',
      width: '3em',
      padding: '2px',
      paddingRight: '8px',
      lineHeight: '1em',
      textAlign: 'right',
    },

    '--player': {
      position: 'absolute',
      left: '20px',
      top: '20px',
      right: '20px',
      bottom: '20px',
      zIndex: 2,

      '-hidden': {
        display: 'none',
      },

      ':hover .stream_list--player_controls': {
        display: 'flex',
      },
    },

    '--player_controls': {
      display: 'none',
      position: 'absolute',
      left: 0,
      top: 0,
      right: 0,
      justifyContent: 'end',
      gap: '8px',
    },

    '--player_raid': {
      cursor: 'pointer',
      color: 'white',
      fontSize: '2em',
      lineHeight: '1em',
    },

    '--player_close': {
      width: '1em',
      height: '1em',
      fontSize: '2em',
      cursor: 'pointer',
      color: 'white',
      lineHeight: '1em',
      textAlign: 'center',
    },
  },
};

const GRID_RE = /(\d+)\s*[x*]\s*(\d+)/;
const HOVER_DEBOUNCE_DELAY = 400;

type StreamListItemInfo = Broadcast['getStreams']['data'][number];

type StreamListItemParams = {
  item: StreamListItemInfo;
  onClick: (item: StreamListItemInfo) => void;
  onHover: (item: StreamListItemInfo, hover: boolean) => void;
};

const StreamListItem = newComponent(
  'div.stream_list--item',
  function (_, { item, onClick, onHover }: StreamListItemParams
) {
  const image = 'url(' + item.thumbnail_url.replace('{width}x{height}', '320x200') + ')';
  this.node.style.setProperty('--image', image);
  const classList = this.node.classList;

  this.params({
    onclick() {
      onClick(item);
    },
    onmouseover() {
      onHover(item, true);
      classList.add('stream_list--item-hover');
    },
    onmouseout() {
      onHover(item, false);
      classList.remove('stream_list--item-hover');
    },
  })

  this.dom('div.stream_list--item_info', function () {
    this.dom('div.stream_list--item_title').params({ innerText: item.title });
    this.dom('div.stream_list--item_count').params({ innerText: item.viewer_count.toString() });
  });

  return {
    info: item,
    setHover(state: boolean) {
      if (state) {
        classList.add('stream_list--item-hover');
      } else {
        classList.remove('stream_list--item-hover');
      }
    }
  };
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
    const streamListLast = host.state.streamList.find(function (item) {
      return !!item.title;
    });
    const streamInfo = host.state.streamInfo.state && host.state.streamInfo.state.info || streamListLast;

    const payload: WSIncomeEvent<'get-streams'>['payload'] = {
      view: getDashName() || '',
      first: grid.total,
    };

    if (streamInfo) {
      const gameInfo = splitByFirst(streamInfo.category, '|');
      payload.language = streamInfo.language;
      gameInfo[0] && (payload.game_id = gameInfo[0]);
    }

    if (cursor && direction !== 'init') {
      if (direction === 'next') {
        payload.after = cursor;
      } else {
        payload.before = cursor;
      }
    }

    host.send({ action: 'get-streams', payload });
  };

  const hoverItem = debounce(HOVER_DEBOUNCE_DELAY, function (channel: string) {
    host.send({ action: 'broadcast', payload: { type: 'stream-list-hover', payload: channel } });
  });

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
    let currentItems: Record<string, ComponentSplux<typeof StreamListItem>> = {};
    let currentlyHovered: ComponentSplux<typeof StreamListItem> | null = null;

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
          currentItems = {};

          for (let rowIndex = 0 ; rowIndex < grid.height ; ++rowIndex) {
            content.dom('div.stream_list--content_row', function () {
              for (let colIndex = 0 ; colIndex < grid.width ; ++colIndex) {
                this.dom('div.stream_list--content_cell', function () {
                  const item = data.payload.data[rowIndex * grid.width + colIndex];
                  const itemSplux = item && this.dom(StreamListItem, {
                    item,
                    onClick(item) {
                      host.send({
                        action: 'broadcast',
                        payload: { type: 'stream-list-watch', payload: item.id },
                      });
                    },
                    onHover(item, state) {
                      hoverItem(state ? item.id : '');
                    },
                  });
                  itemSplux && (currentItems[item.id] = itemSplux);
                });
              }
            });
          }
        } else if (isCast('broadcast', data)) {
          switch (data.payload.type) {
            case 'stream-list-watch':
              const item = currentItems[data.payload.payload];
              item && videoPlayer.play(item.info);
              break;
            case 'stream-list-hover':
              const selectedItem = currentItems[data.payload.payload];

              if (selectedItem === currentlyHovered) {
                return;
              }

              if (currentlyHovered) {
                currentlyHovered.setHover(false);
              }

              if (selectedItem) {
                selectedItem.setHover(true);
                currentlyHovered = selectedItem;
              }
              break;
            case 'stream-list-stop-watching':
              videoPlayer.stop();
              break;
          }
        }
      });
    });

    const videoPlayer = this.dom('div.stream_list--player.stream_list--player-hidden', function (videoPlayer) {
      const id = this.node.id = 'STREAM_LIST_PLAYER';
      let player: InstanceType<typeof Twitch.Player> | null = null;
      const classList = this.node.classList;
      let current: null | StreamListItemInfo = null;

      this.dom('div.stream_list--player_controls', function () {
        this.dom('div.stream_list--player_raid').params({ innerText: 'RAID', onclick() {
          if (current) {
            host.send({ action: 'raid-channel', payload: current.id });
          }
        } });
        this.dom('div.stream_list--player_close').params({ innerText: SYMBOL.CLOSE, onclick() {
          ifc.stop();
          host.send({ action: 'broadcast', payload: { type: 'stream-list-stop-watching' } });
        } });
      });

      const ifc = {
        play(item: StreamListItemInfo) {
          current = item;
          classList.remove('stream_list--player-hidden');
          requestAnimationFrame(function () {
            if (!player) {
              const box = host.getModulePosition(videoPlayer);

              player = new Twitch.Player(id, {
                channel: item.user_login,
                width: box.width,
                height: box.height,
              });
              player.addEventListener('ended', function () {
                ifc.stop();
              });
            } else {
              player.setChannel(item.user_login);
            }
          });
        },

        stop() {
          player && player.pause();
          classList.add('stream_list--player-hidden');
          current = null;
        },
      };

      return ifc;
    });
  });
});
