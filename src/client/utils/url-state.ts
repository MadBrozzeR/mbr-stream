export const urlState = {
  regExp: /[?&]([-\w]+)(?:=([^&]+))?/g,

  getRaw() {
    const result: Record<string, string> = {};
    let regMatch: RegExpExecArray | null = null;

    while (regMatch = this.regExp.exec(window.location.hash)) if (regMatch[1]) {
      result[regMatch[1]] = regMatch[2] || '';
    }

    return result;
  },

  get() {
    const result: Record<string, Record<string, string> | null> = {};
    let regMatch: RegExpExecArray | null = null;

    while (regMatch = this.regExp.exec(window.location.hash)) if (regMatch[1]) {
      result[regMatch[1]] = regMatch[2] && JSON.parse(decodeURIComponent(regMatch[2])) || null;
    }

    return result;
  },

  set(name: string, value: Record<string, string>) {
    const values = {
      ...this.getRaw(),
      [name]: encodeURIComponent(JSON.stringify(value)),
    };

    window.location.hash = Object.keys(values).reduce(function (result, key) {
      result += (result ? '&' : '#?') + `${key}=${values[key]}`;

      return result;
    }, '');
  },

  listen(callback: (state: Record<string, Record<string, string> | null>) => void) {
    callback(urlState.get());

    window.addEventListener('hashchange', function () {
      callback(urlState.get());
    });
  }
};
