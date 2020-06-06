import Fetcher from '..';
import BrowserParam from '../../Param/browser';
import Header, { InputHeader } from '../../Param/Header';

type BrowserBody =
  | string
  | Document
  | Blob
  | ArrayBufferView
  | ArrayBuffer
  | FormData
  | URLSearchParams
  | ReadableStream<Uint8Array>;

export default class BrowserFetcher extends Fetcher<BrowserBody> {
  private req: XMLHttpRequest | null;
  public param: BrowserParam;
  private hasAborted: boolean = false;
  constructor(param: BrowserParam) {
    super(param);
    this.param = param;
    this.req = null;
  }

  clone() {
    return new BrowserFetcher(this.param);
  }

  _setResHeader(res: XMLHttpRequest): this {
    this.resHeader = new Header(
      res
        .getAllResponseHeaders()
        .split('\r\n')
        .reduce((acc, each) => {
          const [key, value] = each.split(': ');
          if (key) {
            acc[key.toLowerCase()] = value;
          }
          return acc;
        }, <any>{}),
    );
    return this;
  }

  _setStatusCode(res: XMLHttpRequest): this {
    this.statusCode = res.status;
    return this;
  }

  _send(body: BrowserBody | null, overwriteHeader: InputHeader = {}): this {
    const xhr = new XMLHttpRequest();
    this.req = xhr;
    xhr.open(this.param.getMethod(), String(this.param.getUrl()));
    Object.entries({ ...this.param.getHeader(), ...overwriteHeader }).forEach(
      ([key, value]) => {
        xhr.setRequestHeader(key, value);
      },
    );
    xhr.addEventListener('load', () => {
      if (this._next('SUCCESS')) {
        this.resolve(this.req && this.req.response);
      }
    });
    xhr.addEventListener('error', () => {
      if (this._next('ERROR')) {
        this.reject(new Error('网络错误'));
      }
    });
    xhr.addEventListener('abort', () => {
      if (this.req) {
        this.hasAborted = true;
      }
    });
    xhr.send(body);
    return this;
  }

  _abort(): this {
    if (this.req && !this.hasAborted) {
      this.req.abort();
    }
    return this;
  }
}
