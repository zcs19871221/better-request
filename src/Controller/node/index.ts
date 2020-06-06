import fs from 'fs';
import path from 'path';
import iconvLite from 'iconv-lite';
import { mockUuid } from 'better-utils';
import NodeFetcher from '../../Fetcher/node';
import Controller, { ControllerOpt } from '../';
import NodeParam, { NodeParamOpt } from '../../Param/node';
import { InputHeader } from '../../Param/Header';
import extMapMime from './extMapMime';
import iconvParser from './iconv_parser';

type NodeBody = string | Buffer | null;

declare interface NodeControllerOpt extends ControllerOpt {
  readonly maxRedirect: number;
}

function _isNodeBody(body: NodeBody | object): body is NodeBody {
  return Buffer.isBuffer(body) || typeof body === 'string' || body === null;
}

export default class NodeController extends Controller<NodeBody> {
  private rediectTimes: number = 0;
  private readonly maxRedirect: number;
  public fetcher: NodeFetcher;
  public param: NodeParam;
  constructor({
    maxRedirect = 5,
    retry = 2,
    retryInterval = 50,
    parsers = [iconvParser],
    onSuccess,
    onError,
    status = /^[23]\d\d$/,
    onFinish,
    ...rest
  }: NodeControllerOpt & NodeParamOpt) {
    super({
      retry,
      retryInterval,
      onSuccess,
      onError,
      onFinish,
      status,
      parsers,
    });
    this.param = new NodeParam(rest);
    this.fetcher = new NodeFetcher(this.param);
    this.maxRedirect = maxRedirect;
  }

  setDefaultParsers() {}

  static isStandardBodyType(body: NodeBody): boolean {
    return Buffer.isBuffer(body) || typeof body === 'string' || body === null;
  }

  static fetch(
    opt: NodeControllerOpt & NodeParamOpt,
    body: NodeBody | object,
  ): Promise<any> {
    if (_isNodeBody(body)) {
      return new NodeController(opt).fetch(body);
    }
    return new NodeController(opt).fetch(body);
  }

  private iconv(res: Buffer, contentType: string): string | Buffer {
    const _tmp = /charset=(.*?)($|;)/iu.exec(contentType);
    const charset = (_tmp && _tmp[1] ? _tmp[1] : 'utf-8').trim();
    if (charset.toLowerCase() !== 'utf-8') {
      return iconvLite.decode(res, charset);
    }
    return String(res);
  }

  protected createUploadBody(opt: object): [NodeBody, InputHeader] {
    const boundary = mockUuid();
    const block = Object.entries(opt).map(([name, target]) => {
      let fileName = '';
      let content = '';
      let contentType = '';
      if (fs.existsSync(target)) {
        fileName = path.basename(target);
        contentType =
          extMapMime[path.extname(target)] || 'application/octet-stream';
        content = fs.readFileSync(target, 'utf-8');
      } else {
        content = target;
      }
      const lineOne = `--${boundary}\r\nContent-Disposition: form-data; name="${name}"`;
      const file = fileName
        ? `; fileName="${fileName}"\r\nContent-Type: ${contentType}`
        : '';
      return lineOne + file + '\r\n\r\n' + content;
    });
    return [
      block.join('\r\n') + `\r\n--${boundary}--`,
      {
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
    ];
  }

  protected needRedirect() {
    if (
      this.fetcher.is3xx() &&
      this.fetcher.getResHeader('location') &&
      this.maxRedirect > 0
    ) {
      if (this.rediectTimes < this.maxRedirect) {
        return true;
      } else {
        throw new Error(`重定向超过${this.maxRedirect}次`);
      }
    }
    return false;
  }

  protected redirect() {
    this.rediectTimes += 1;
    this.fetcher = new NodeFetcher(
      new NodeParam({
        url: this.fetcher.getResHeader('location'),
        method: 'GET',
        timeout: 5 * 1000,
      }),
    );
    return this.ensureRequest(null);
  }

  private needIconv() {
    return this.parsers.find(each => each === 'iconv');
  }

  private needParseJson(contentType: string) {
    return (
      this.parsers.find(each => each === 'json') &&
      contentType.includes('application/json')
    );
  }

  protected replaceFetcher() {
    this.fetcher = new NodeFetcher(this.param);
  }

  protected async presetParse(
    response: Buffer,
  ): Promise<string | Buffer | object> {
    const contentType: string = this.fetcher.getResHeader('content-type') || '';
    let parsed: string | Buffer | object = response;
    if (this.needIconv()) {
      parsed = this.iconv(response, contentType);
    }
    if (this.needParseJson(contentType)) {
      parsed = JSON.parse(String(parsed));
    }
    return parsed;
  }
}
