import { ModuleBox, ModuleParams } from '../basic/module-box';
import { newComponent } from '/@client/splux-host';
import { NoteSvg } from '/@client/svg/note.svg';
import { PlaySvg } from '/@client/svg/play.svg';

const STYLES = {
  '.music_player': {
    '--output': {
      display: 'none',
    },

    '--wrapper': {
      display: 'flex',
      height: '100%',
      justifyItems: 'stretch',
      gap: '8px',
    },

    '--info': {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flex: 1,
    },

    '--title_line': {
      flex: 1,
      fontSize: '1em',
      lineHeight: '1em',
      display: 'flex',
      alignItems: 'center',
    },

    '--title': {
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    },

    '--icon_block': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '40px',
    },

    '--progress': {
      height: '5px',
    },

    '--progress_line': {
      height: '100%',
      backgroundColor: '#ffb',
      width: 'var(--progress, 0%)',
    },
  },
};

class Playlist {
  list: string[] = [];
  currentIndex = 0;

  add(src: string) {
    return this.list.push(src) - 1;
  }
  next() {
    let nextIndex = this.currentIndex + 1;
    this.currentIndex = this.list[nextIndex] ? nextIndex : 0;

    return this.getCurrent();
  }
  prev() {
    let prevIndex = this.currentIndex - 1;
    this.currentIndex = this.list[prevIndex] ? prevIndex : Math.max(this.list.length - 1, 0);

    return this.getCurrent();
  }
  getCurrent() {
    this.list[this.currentIndex] || '';
  }
}

function getFileName (fullname: string) {
  let slashPos = fullname.lastIndexOf('/');
  let dotPos = fullname.lastIndexOf('.');

  (slashPos === -1) ? (slashPos = 0) : ++slashPos;
  (dotPos === -1) && (dotPos = fullname.length);

  return fullname.substring(slashPos, dotPos);
}

export const MusicPlayer = newComponent('div.music_player', function (_, { id }: ModuleParams) {
  const host = this.host;
  host.styles.add('music-player', STYLES);

  const audio = this.dom('audio.music_player--output', function (audio) {
    const playlist = new Playlist();
    let currentFile = '';
    let showProgress = function (duration: number, total: number) {
      console.log(duration, total);
    }
    let showTitle = function (title: string) {
      console.log(title);
    }

    function updateProgress() {
      if (audio.node.paused) {
        return;
      }

      showProgress(audio.node.currentTime, audio.node.duration);
      requestAnimationFrame(updateProgress);
    }

    audio.node.addEventListener('canplay',function () {
      audio.node.play();
    });

    audio.node.addEventListener('playing', function () {
      updateProgress();
    });

    const ifc = {
      play(src: string | undefined) {
        if (src) {
          audio.node.src = src;
          currentFile = src;
          showTitle(getFileName(src));
        }
      },
      add(src: string) {
        playlist.add(src);
      },
      /*
      next() {
        playlist.next;
      },
      prev() {
        playlist.prev();
      },
      */
      isCurrent(file: string) {
        return file === currentFile;
      },
      showProgress(callback: (duration: number, total: number) => void) {
        showProgress = callback;
      },
      showTitle(callback: (title: string) => void) {
        showTitle = callback;
      },
    };

    return ifc;
  });

  this.dom(ModuleBox, {
    component: this,
    id,
    vars: {
      top: '20px',
      left: '20px',
      width: '120px',
      height: '80px',
      source: '',
    },
    onSetupChange(values) {
      if (values['source'] && !audio.isCurrent(values['source'])) {
        audio.play(values['source']);
      }
    }
  }).dom('div.music_player--wrapper', function () {
    this.dom('div.music_player--icon_block', function () {
      const icon = NoteSvg();
      icon.node.classList.add('music_player--icon');
      this.node.appendChild(icon.node);
    });
    this.dom('div.music_player--info', function () {
      this.dom('div.music_player--title_line', function () {
        this.dom('div.music_player--title', function (titleSpl) {
          audio.showTitle(function (title) {
            titleSpl.node.innerText = title;
          });
        });
        this.dom('div.music_player--controls', function () {
          this.node.appendChild(PlaySvg().node);
        });
      });
      this.dom('div.music_player--progress', function () {
        const line = this.dom('div.music_player--progress_line');
        audio.showProgress(function (current, total) {
          line.node.style.setProperty('--progress', ~~(current / total * 100) + '%')
        });
      });
    });
  });
});
