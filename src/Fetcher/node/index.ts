import { IncomingMessage } from 'http';
import Fetcher from '..';
import NodeParam from '../../Param/node';
import Header, { InputHeader } from '../../Param/Header';

export default class NodeFetcher extends Fetcher<string | Buffer> {
  private req: any;
  public param: NodeParam;
  constructor(param: NodeParam) {
    super(param);
    this.param = param;
    this.req = null;
  }

  _setResHeader(res: any): this {
    this.resHeader = new Header(res.headers);
    return this;
  }

  _setStatusCode(res: any): this {
    this.statusCode = res.statusCode || 0;
    return this;
  }

  _send(body: string | Buffer | null, overWriteHeader: InputHeader = {}): this {
    let len = 0;
    const buf: Buffer[] = [];
    this.req = this.param.client().request(
      this.param.getUrl(),
      {
        agent: this.param.getAgent(),
        method: this.param.getMethod(),
        headers: {
          ...this.param.getHeader(),
          ...overWriteHeader,
        },
      },
      (res: IncomingMessage) => {
        this._setResHeader(res);
        this._setStatusCode(res);
        res.on('data', (chunk: Buffer) => {
          this._clearTimeout();
          buf.push(chunk);
          len += chunk.length;
        });
        res.on('end', () => {
          if (this._next('SUCCESS')) {
            this.resolve(Buffer.concat(buf, len));
          }
        });
      },
    );
    this.req.on('error', (catchedError: Error = new Error('网络错误')) => {
      if (this._next('ERROR')) {
        this.reject(catchedError);
      }
    });
    if (body !== null) {
      this.req.write(body);
    }
    this.req.end();
    return this;
  }

  _abort(): this {
    if (this.req && !this.req.aborted) {
      this.req.abort();
    }
    return this;
  }
}
