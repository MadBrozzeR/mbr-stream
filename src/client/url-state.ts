export const urlState = {
  regExp: /[?&]([-\w]+)(?:=([^&]+))?/g,

  get() {
    const result: Record<string, object> = {};
    let regMatch: RegExpExecArray | null = null;

    while (regMatch = this.regExp.exec(window.location.hash)) if (regMatch[1]) {
      result[regMatch[1]] = regMatch[2] && JSON.parse(decodeURIComponent(regMatch[2])) || '';
    }

    return result;
  },

  set(name: string, value: object) {
    const values = {
      ...this.get(),
      [name]: value,
    };

    window.location.hash = Object.keys(values).reduce(function (result, key) {
      const value = encodeURIComponent(JSON.stringify(values[key]));

      result += (result ? '&' : '#?') + `${key}=${value}`;

      return result;
    }, '');
  },

  listen(callback: (state: Record<string, object>) => void) {
    callback(urlState.get());

    window.addEventListener('hashchange', function () {
      callback(urlState.get());
    });
  }
};
