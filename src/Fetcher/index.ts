import Param from '../Param';
import Header, { InputHeader } from '../Param/Header';

enum statusEnum {
  NOTSEND,
  SENDING,
  SUCCESS,
  ABORTED,
  TIMEOUT,
  ERROR,
}

interface FetcherInterface {
  statusCode: number;
  resHeader: Header;
  param: Param;
  abort(): this;
  isAborted(): boolean;
  isTimeout(): boolean;
  isError(): boolean;
  isSuccess(): boolean;
  is2xx(): boolean;
  is3xx(): boolean;
  is4xx(): boolean;
  is5xx(): boolean;
  send(body?: any, overWriteHeader?: InputHeader): any;
  getResHeader(key: string): string;
  getResHeader(key: string[]): string[];
  getResHeader(): InputHeader;
  clone(): FetcherInterface;
}

export { FetcherInterface };
export default abstract class Fetcher<T> implements FetcherInterface {
  protected status: keyof typeof statusEnum;
  protected thread: Promise<any>;
  protected resolve: Function = () => {};
  protected reject: Function = () => {};
  protected timer: NodeJS.Timeout | null = null;
  public statusCode: number = 0;
  public resHeader: Header = new Header();
  public param: Param;
  public responseLen: number = 0;
  constructor(param: Param) {
    this.param = param;
    this.status = 'NOTSEND';
    this.thread = new Promise((resolve, reject) => {
      this.resolve = (res: string | Buffer | object) => {
        this._clearTimeout();
        resolve(res);
      };
      this.reject = (error: Error) => {
        this._abort()._clearTimeout();
        reject(error);
      };
    });
  }

  static order = [
    // 未发送
    [statusEnum.NOTSEND],
    // 发送中
    [statusEnum.SENDING],
    // 发送结束
    [
      statusEnum.ABORTED,
      statusEnum.TIMEOUT,
      statusEnum.ERROR,
      statusEnum.SUCCESS,
    ],
  ];

  abstract clone(): FetcherInterface;
  abort(): this {
    if (this._next('ABORTED')) {
      this._abort().resolve(null);
    }
    return this;
  }

  isAborted(): boolean {
    return this.status === 'ABORTED';
  }

  isTimeout(): boolean {
    return this.status === 'TIMEOUT';
  }

  isError(): boolean {
    return this.status === 'ERROR';
  }

  isSuccess(): boolean {
    return this.status === 'SUCCESS';
  }

  is2xx(): boolean {
    return this._codeEqual(2);
  }

  is3xx(): boolean {
    return this._codeEqual(3);
  }

  is4xx(): boolean {
    return this._codeEqual(4);
  }

  is5xx(): boolean {
    return this._codeEqual(5);
  }

  send(body: T | null = null, overWriteHeader: InputHeader = {}): Promise<any> {
    this._prepareSend();
    this._send(body, overWriteHeader);
    return this.thread;
  }

  getResHeader(): InputHeader;
  getResHeader(key: string): string;
  getResHeader(key: string[]): string[];
  getResHeader(key?: string | string[]): InputHeader | string | string[] {
    if (key === undefined) {
      return this.resHeader.getAll();
    }
    if (typeof key === 'string') {
      return this.resHeader.get(key);
    }
    return this.resHeader.gets(key);
  }

  abstract _send(body: T | null, overWriteHeader: InputHeader): this;
  abstract _abort(): this;
  abstract _setResHeader(res: any): this;
  abstract _setStatusCode(res: any): this;

  _prepareSend(): void {
    if (!this._next('SENDING')) {
      throw new Error('fetcher不能重复使用');
    }
    if (this.param.getTimeout() > 0) {
      this._onTimeout = this._onTimeout.bind(this);
      this.timer = setTimeout(this._onTimeout, this.param.getTimeout());
    }
  }

  _onTimeout(): void {
    if (this._next('TIMEOUT')) {
      this.reject(new Error(`请求超时 ${this.param.getTimeout()}ms`));
    }
  }

  _codeEqual(scope: 1 | 2 | 3 | 4 | 5) {
    if (this.statusCode >= scope * 100 && this.statusCode < scope * 100 + 100) {
      return true;
    }
    return false;
  }

  _next(status: keyof typeof statusEnum): boolean {
    const src = Fetcher.order.findIndex(config =>
      config.includes(statusEnum[this.status]),
    );
    const dest = Fetcher.order.findIndex(config =>
      config.includes(statusEnum[status]),
    );
    if (src === -1 || dest === -1) {
      throw new Error('状态码错误');
    }
    if (dest - src === 1) {
      this.status = status;
      return true;
    }
    return false;
  }

  _clearTimeout(): this {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    return this;
  }
}
