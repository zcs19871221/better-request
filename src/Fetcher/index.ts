import Param from '../Param';
import Header, { InputHeader } from '../Param/Header';
import BodyHandler from './body_handler';

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
  send(body?: any): any;
  getResHeader(key: string): string;
  getResHeader(key: string[]): string[];
  getResHeader(): InputHeader;
}

export { FetcherInterface };
export default abstract class Fetcher<T> implements FetcherInterface {
  protected status: keyof typeof statusEnum;
  protected thread: Promise<any>;
  protected resolve: Function = () => {};
  protected reject: Function = () => {};
  protected timer: NodeJS.Timeout | null = null;
  public statusCode: number = 0;
  protected resHeader: Header = new Header();
  public param: Param;
  constructor(param: Param) {
    this.param = param;
    this.status = 'NOTSEND';
    this.thread = new Promise((resolve, reject) => {
      this.resolve = (res: string | Buffer | object) => {
        this.doClearTimeout();
        resolve(res);
      };
      this.reject = (error: Error) => {
        this.doAbort().doClearTimeout();
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

  abort(): this {
    if (this.moveNextStatus('ABORTED')) {
      this.doAbort().resolve(null);
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
    return this.codeEqual(2);
  }

  is3xx(): boolean {
    return this.codeEqual(3);
  }

  is4xx(): boolean {
    return this.codeEqual(4);
  }

  is5xx(): boolean {
    return this.codeEqual(5);
  }

  send(body: T | null | object = null): Promise<any> {
    const [formatedBody, overWriteHeader] = this.prepareSend(body);
    this.doSend(formatedBody, overWriteHeader);
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

  protected abstract doSend(body: T | null, overWriteHeader: InputHeader): this;
  protected abstract doAbort(): this;
  protected abstract instanceBodyHandler(): BodyHandler<T>;

  protected setResHeader(header: Header) {
    this.resHeader = header;
  }

  protected prepareSend(body: T | null | object): [T | null, InputHeader] {
    if (!this.moveNextStatus('SENDING')) {
      throw new Error('fetcher不能重复使用');
    }
    if (this.param.getTimeout() > 0) {
      this.onTimeout = this.onTimeout.bind(this);
      this.timer = setTimeout(this.onTimeout, this.param.getTimeout());
    }

    if (body !== null) {
      const bodyHandler = this.instanceBodyHandler();
      return bodyHandler.format(body);
    } else {
      return [body, {}];
    }
  }

  private onTimeout(): void {
    if (this.moveNextStatus('TIMEOUT')) {
      this.reject(new Error(`请求超时 ${this.param.getTimeout()}ms`));
    }
  }

  private codeEqual(scope: 1 | 2 | 3 | 4 | 5) {
    if (this.statusCode >= scope * 100 && this.statusCode < scope * 100 + 100) {
      return true;
    }
    return false;
  }

  protected moveNextStatus(status: keyof typeof statusEnum): boolean {
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

  protected doClearTimeout(): this {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    return this;
  }
}
