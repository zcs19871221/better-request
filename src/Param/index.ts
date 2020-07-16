import { parse } from './queryString';
import Header, { InputHeader } from './Header';
import initUrl, { InputURL, InputSearch } from './initUrl';

type InputMethod =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'CONNECT'
  | 'OPTIONS'
  | 'TRACE'
  | 'PATCH';
type ParamOpt = {
  url: InputURL;
  path?: string;
  search?: InputSearch;
  method: InputMethod;
  header?: InputHeader;
  timeout?: number;
};

interface ParamInterface {
  getUrl(): URL;
  getMethod(): InputMethod;
  getHeader(key?: string | string[]): InputHeader | string | string[];
  getTimeout(): number;
  setSearch(search: { [key: string]: string }): this;
  getSearch(): { [key: string]: string };
}
export { ParamOpt };
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

  getHeader(): InputHeader;
  getHeader(key: string): string;
  getHeader(key: string[]): string[];
  getHeader(key?: any): any {
    if (key === undefined) {
      return this.header.getAll();
    }
    if (typeof key === 'string') {
      return this.header.get(key);
    }
    return this.header.gets(key);
  }

  setHeader(key: string, value: string) {
    this.header.set(key, value);
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
}
