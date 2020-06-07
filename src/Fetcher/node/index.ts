import { IncomingMessage } from 'http';
import Fetcher from '..';
import NodeBodyHandler from './body_handler';
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

  protected instanceBodyHandler() {
    return new NodeBodyHandler(this);
  }

  clone() {
    return new NodeFetcher(this.param);
  }

  _send(body: string | Buffer | null, overWriteHeader: InputHeader = {}): this {
    let len = 0;
    const buf: Buffer[] = [];
    this.req = this.param.client().request(
      this.param.getUrl(),
      {
        ...this.param.getOption(),
        agent: this.param.getAgent(),
        method: this.param.getMethod(),
        headers: {
          ...this.param.getHeader(),
          ...overWriteHeader,
        },
      },
      (res: IncomingMessage) => {
        this.setResHeader(new Header(<any>res.headers));
        this.statusCode = res.statusCode || 0;
        res.on('data', (chunk: Buffer) => {
          this._clearTimeout();
          buf.push(chunk);
          len += chunk.length;
        });
        res.on('end', () => {
          this.responseLen = len;
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
