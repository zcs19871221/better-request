import Fetcher from '..';
import BrowserParam from '../../Param/browser';
import Header, { InputHeader } from '../../Param/Header';
import BodyHandler from './body_handler';

export type BrowserBody =
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

  protected instanceBodyHandler() {
    return new BodyHandler(this);
  }

  doSend(body: BrowserBody | null, overwriteHeader: InputHeader = {}): this {
    const xhr = new XMLHttpRequest();
    this.req = xhr;
    xhr.open(this.param.getMethod(), String(this.param.getUrl()));
    Object.entries({ ...this.param.getHeader(), ...overwriteHeader }).forEach(
      ([key, value]) => {
        xhr.setRequestHeader(key, value);
      },
    );
    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState === 2) {
        this.statusCode = xhr.status;
        this.setResHeader(
          new Header(
            xhr
              .getAllResponseHeaders()
              .split('\r\n')
              .reduce((acc, each) => {
                const [key, value] = each.split(': ');
                if (key) {
                  acc[key.toLowerCase()] = value;
                }
                return acc;
              }, <any>{}),
          ),
        );
      }
    });
    xhr.addEventListener('load', () => {
      if (this.moveNextStatus('SUCCESS')) {
        this.resolve(this.req && this.req.response);
      }
    });
    xhr.addEventListener('error', () => {
      if (this.moveNextStatus('ERROR')) {
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

  doAbort(): this {
    if (this.req && !this.hasAborted) {
      this.req.abort();
    }
    return this;
  }
}
