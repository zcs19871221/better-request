export default class Header implements HeaderInterface {
  private header: InputHeader;

  constructor(header: InputHeader = {}) {
    if (!header) {
      this.header = {};
    } else {
      this.header = Object.keys(header).reduce(
        (acc: InputHeader, prop: string) => {
          acc[this.initKey(prop)] = header[prop];
          return acc;
        },
        {},
      );
    }
  }

  initKey(key: string) {
    return key.trim().toLowerCase();
  }

  getAll(): InputHeader {
    return { ...this.header };
  }

  get(key: string) {
    return this.header[this.initKey(key)] || '';
  }

  gets(keys: string[]) {
    return keys.map(key => {
      return this.get(key);
    });
  }

  set(key: string, value: string): this {
    this.header[key] = value;
    return this;
  }
}
