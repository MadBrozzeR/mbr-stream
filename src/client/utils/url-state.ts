type UrlStateItemData = { [key: string]: string; } | null;
type State = {
  raw: Record<string, string>;
  parsed: Record<string, UrlStateItemData>;
};

const RE = /[?&]([-\w+]+)(?:=([^&]+))?/g;
const EMPTY_STATE: State = { raw: {}, parsed: {} };

function parseUrl (current: State = EMPTY_STATE) {
  const result: State = {
    raw: {},
    parsed: {},
  };

  let regMatch: RegExpExecArray | null = null;

  while (regMatch = RE.exec(window.location.hash)) if (regMatch[1]) {
    const key = regMatch[1];
    const rawData = regMatch[2] || '';
    result.raw[key] = rawData;
    try {
      const parsedData = rawData === ''
        ? null
        : rawData === current.raw[key] && current.parsed[key]
          ? current.parsed[key]
          : JSON.parse(decodeURIComponent(rawData));

      result.parsed[key] = parsedData;
    } catch (error) {
      result.parsed[key] = null;
    }
  }

  return result;
}

function setUrl (values: Record<string, string>) {
  window.location.hash = Object.keys(values).reduce(function (result, key) {
    result += (result ? '&' : '#?') + `${key}=${values[key]}`;

    return result;
  }, '');
}

export const urlState = {
  state: EMPTY_STATE,

  update() {
    this.state = parseUrl(this.state);
  },

  get() {
    return this.state.parsed;
  },

  set(name: string, value: UrlStateItemData) {
    const values = { ...this.state.raw, [name]: encodeURIComponent(JSON.stringify(value)) };

    setUrl(values);
  },

  remove(name: string) {
    const values = { ...this.state.raw };

    delete values[name];

    setUrl(values);
  },

  listen(callback: (state: Record<string, Record<string, string> | null>) => void) {
    urlState.update();
    callback(urlState.get());

    window.addEventListener('hashchange', function () {
      urlState.update();
      callback(urlState.get());
    });
  }
};
