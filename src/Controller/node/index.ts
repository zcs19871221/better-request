import fs from 'fs';
import path from 'path';
import iconvLite from 'iconv-lite';
import { mockUuid } from 'better-utils';
import NodeFetcher from '../../Fetcher/node';
import Controller, { ControllerOpt } from '../';
import NodeParam, { NodeParamOpt } from '../../Param/node';
import { InputHeader } from '../../Param/Header';
import { stringify } from '../../Param/queryString';

type NodeBody = string | Buffer | null;
declare interface NodeControllerOpt extends ControllerOpt {
  readonly redirect?: boolean;
  readonly maxRedirect?: number;
}

function _isNodeBody(body: NodeBody | object): body is NodeBody {
  return Buffer.isBuffer(body) || typeof body === 'string' || body === null;
}
export default class NodeController extends Controller<NodeBody> {
  private rediectTimes: number = 0;
  private redirect: boolean;
  private maxRedirect: number;
  protected fetcher: NodeFetcher;
  protected param: NodeParam;
  constructor({
    presetParser = true,
    parser,
    retry = 2,
    retryInterval,
    redirect = true,
    maxRedirect = 10,
    url,
    path,
    search,
    method,
    header,
    timeout,
    agent,
  }: NodeControllerOpt & NodeParamOpt) {
    super({ presetParser, parser, retry, retryInterval });
    this.param = new NodeParam({
      url,
      path,
      search,
      method,
      header,
      timeout,
      agent,
    });
    this.fetcher = new NodeFetcher(this.param);
    this.redirect = redirect;
    this.maxRedirect = maxRedirect;
  }

  static send(
    opt: NodeControllerOpt & NodeParamOpt,
    body: NodeBody,
  ): Promise<any>;
  static send(
    opt: NodeControllerOpt & NodeParamOpt,
    body: object,
  ): Promise<any>;
  static send(
    opt: NodeControllerOpt & NodeParamOpt,
    body: NodeBody | object,
  ): Promise<any> {
    if (_isNodeBody(body)) {
      return new NodeController(opt).request(body);
    }
    return new NodeController(opt).request(body);
  }

  _iconv(res: Buffer, contentType: string): string {
    const _tmp = /charset=(.*?)($|;)/iu.exec(contentType);
    let charset = 'utf-8';
    if (_tmp && _tmp[1] && _tmp[1] !== 'utf-8') {
      return iconvLite.decode(res, charset);
    }
    return String(res);
  }

  _createFileBody(opt: object): [string, string] {
    const boundary = mockUuid();
    const contentBlock = Object.entries(opt).map(([name, filePath]) => {
      const fileName = path.basename(filePath);
      const contentType = guess(path.extname(filePath));
      const content = fs.readFileSync(filePath, 'utf-8');
      return `--${boundary}\r\nContent-Disposition: form-data;name="${name}"${
        fileName ? ` fileName="${fileName}"` : ''
      }\r\n${
        contentType ? `content-type="${contentType}"` : ''
      }\r\n\r\n${content}`;
    });
    return [contentBlock.join('\r\n'), boundary];
  }

  async request(body: NodeBody): Promise<any>;
  async request(body: object): Promise<any>;
  async request(body: NodeBody | object): Promise<any> {
    const header = this.param.getHeader();
    let formated: string | NodeBody;
    if (_isNodeBody(body)) {
      formated = body;
    } else {
      formated = this._formatBody(body, header);
    }
    header['content-length'] =
      formated === null ? '0' : String(Buffer.byteLength(formated));
    return this._ensureRequest(formated, header);
  }

  private _formatBody(body: object, header: { [key: string]: string }) {
    const contentType = this.param.getHeader('content-type');
    let resString = '';
    switch (contentType) {
      case 'aplication/json':
        resString = JSON.stringify(body);
        break;
      case 'application/x-www-form-urlencoded':
        resString = stringify(body);
        break;
      case 'multipart/form-data':
        {
          const res = this._createFileBody(body);
          header['content-type'] = `multipart/form-data; boundary=${res[1]}`;
          resString = res[0];
        }
        break;
      default:
        throw new Error(
          'body是字符串或者Buffer，或者设置content-type实施默认转换',
        );
    }
    return resString;
  }

  async _request(body: NodeBody, header?: InputHeader): Promise<any> {
    const fetchRes: Buffer = await this.fetcher.send(body, header);
    const contentType: string = this.fetcher.getResHeader('content-type') || '';

    await this._statusCheck();
    if (
      this.redirect &&
      this.fetcher.is3xx() &&
      this.fetcher.getResHeader('location') &&
      this.rediectTimes < this.maxRedirect
    ) {
      this.rediectTimes += 1;
      this.fetcher = new NodeFetcher(
        new NodeParam({
          url: this.fetcher.getResHeader('location'),
          method: 'GET',
          timeout: 5 * 1000,
        }),
      );
      return this.request(body);
    }
    let parsed: string | object = '';
    if (this.presetParser) {
      parsed = await this._iconv(fetchRes, contentType);
      if (contentType.includes('application/json')) {
        parsed = JSON.parse(parsed);
      }
    }
    if (this.parser) {
      return this.parser(parsed, this.fetcher.getResHeader());
    }
    return parsed;
  }
}
