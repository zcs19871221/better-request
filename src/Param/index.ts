import { parse } from './queryString';
import Header from './Header';
import initUrl from './initUrl';

export default abstract class Params implements ParamInterface {
  protected url: URL;
  protected readonly method: InputMethod;
  protected readonly header: Header;
  protected readonly timeout: number;
  constructor({ url, path, search, method, header, timeout = 0 }: ParamOpt) {
    this.url = initUrl(url, path, search);
    this.method = method;
    this.header = new Header(header);
    this.timeout = timeout;
  }

  getUrl(): URL {
    return this.url;
  }

  getMethod(): InputMethod {
    return this.method;
  }

  getHeader(): InputHeader {
    return this.header.getAll();
  }

  getTimeout(): number {
    return this.timeout;
  }

  setSearch(search: { [key: string]: string }): this {
    this.url = initUrl(this.url, '', search);
    return this;
  }

  getSearch(): { [key: string]: string } {
    return parse(this.url.search);
  }

  abstract getBody(): any;
}
