import { newComponent } from '/@client/splux-host';

const FLOATER_SIZE = '16px';

const STYLES = {
  '@keyframes floater1': {
    '0%': {
      top: '0%',
      left: '0%',
    },
    '50%': {
      top: '0%',
      left: '100%',
    },
    '100%': {
      top: '100%',
      left: '100%',
    },
  },

  '@keyframes floater2': {
    '0%': {
      top: '100%',
      left: '100%',
    },
    '50%': {
      top: '100%',
      left: '0%',
    },
    '100%': {
      top: '0%',
      left: '0%',
    },
  },

  '.loader_cover': {
    position: 'absolute',
    boxSizing: 'border-box',
    top: 0,
    bottom: 0,
    left: 0,
    width: '0%',
    padding: '24px',
    backgroundColor: 'rgba(50 50 50 / 80%)',
    opacity: 0,
    transition: '.2s opacity ease-in-out, .2s width step-end',

    '-visible': {
      opacity: 1,
      width: '100%',
      transition: '.2s opacity ease-in-out, .2s width step-start',
    },

    '--content': {
      width: '100%',
      height: '100%',
      position: 'relative',

      ':before': {
        position: 'absolute',
        display: 'block',
        width: FLOATER_SIZE,
        height: FLOATER_SIZE,
        border: '1px solid black',
        backgroundColor: '#ddd',
        content: '""',
        transform: 'translate(-50%, -50%)',
        animation: '1s floater1 infinite ease-in-out',
      },

      ':after': {
        position: 'absolute',
        display: 'block',
        width: FLOATER_SIZE,
        height: FLOATER_SIZE,
        border: '1px solid black',
        backgroundColor: '#ddd',
        content: '""',
        transform: 'translate(-50%, -50%)',
        animation: '1s floater2 infinite ease-in-out',
      },
    },
  },
};

export const LoaderCover = newComponent('div.loader_cover', function (loader) {
  this.host.styles.add('loader-cover', STYLES);
  this.dom('div.loader_cover--content');

  return function<T> (promise: Promise<T>) {
    loader.node.classList.add('loader_cover-visible');
    promise.finally(function () {
      loader.node.classList.remove('loader_cover-visible');
    });
    return promise;
  }
});
