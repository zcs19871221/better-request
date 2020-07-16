import { IncomingMessage, ClientRequest } from 'http';
import Fetcher from '..';
import NodeBodyHandler from './body_handler';
import NodeParam from '../../Param/node';
import Header, { InputHeader } from '../../Param/Header';
import { Readable, Writable, pipeline } from 'stream';

export default class NodeFetcher extends Fetcher<string | Buffer | Readable> {
  private req: ClientRequest | null = null;
  public param: NodeParam;
  constructor(param: NodeParam) {
    super(param);
    this.param = param;
  }

  protected instanceBodyHandler() {
    return new NodeBodyHandler(this);
  }

  protected doSend(
    body: string | Buffer | Readable | null,
    overWriteHeader: InputHeader = {},
  ): this {
    return this.createAndSendRequest(
      body,
      overWriteHeader,
      (res: IncomingMessage) => {
        let len = 0;
        const buf: Buffer[] = [];
        res.on('data', (chunk: Buffer) => {
          this.doClearTimeout();
          buf.push(chunk);
          len += chunk.length;
        });
        res.on('end', () => {
          if (this.moveNextStatus('SUCCESS')) {
            this.resolve(Buffer.concat(buf, len));
          }
        });
      },
    );
  }

  private createAndSendRequest(
    body: string | Buffer | Readable | null,
    overWriteHeader: InputHeader = {},
    cb: (res: IncomingMessage) => any,
  ): this {
    const req = this.param.client().request(
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
        cb(res);
      },
    );
    this.req = req;
    req.on('error', (catchedError: Error = new Error('网络错误')) => {
      if (this.moveNextStatus('ERROR')) {
        this.reject(catchedError);
      }
    });
    if (body instanceof Readable) {
      body.pipe(req);
    } else {
      if (body !== null) {
        req.write(body);
      }
      req.end();
    }
    return this;
  }

  sendThenPipe(
    body: string | Buffer | Readable | null | object,
    dest: Writable,
  ): Promise<void> {
    const [formatedBody, overWriteHeader] = this.prepareSend(body);
    this.createAndSendRequest(
      formatedBody,
      overWriteHeader,
      (res: IncomingMessage) => {
        pipeline(res, dest, error => {
          if (error) {
            if (this.moveNextStatus('ERROR')) {
              this.reject(error);
            }
            return;
          }
          if (this.moveNextStatus('SUCCESS')) {
            this.resolve();
          }
        });
      },
    );
    return this.thread;
  }

  protected doAbort(): this {
    if (this.req && !this.req.aborted) {
      this.req.abort();
    }
    return this;
  }
}
