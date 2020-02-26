import fs from 'fs';
import path from 'path';
import iconvLite from 'iconv-lite';
import { mockUuid } from 'better-utils';
import NodeFetcher from '../../Fetcher/node';
import Controller, { ControllerOpt } from '../';
import NodeParam, { NodeParamOpt } from '../../Param/node';
import { InputHeader } from '../../Param/Header';
import { stringify } from '../../Param/queryString';
import extMapMime from './extMapMime';

type NodeBody = string | Buffer | null;
type Redirect = ['redirect', number];
interface CustomParser {
  (res: string | Buffer | object, header: InputHeader): any;
}
type Parser = Redirect | 'iconv' | 'json' | CustomParser;
declare interface NodeControllerOpt extends ControllerOpt {
  readonly parsers?: Parser[];
}

function _isNodeBody(body: NodeBody | object): body is NodeBody {
  return Buffer.isBuffer(body) || typeof body === 'string' || body === null;
}

export default class NodeController extends Controller<NodeBody> {
  private rediectTimes: number = 0;
  private parsers: Parser[] = [];
  protected fetcher: NodeFetcher;
  protected param: NodeParam;
  constructor({
    retry = 2,
    retryInterval = 50,
    parsers = [['redirect', 10], 'iconv', 'json'],
    onSuccess,
    onError,
    status,
    onFinish,
    url,
    path,
    search,
    method,
    header,
    timeout,
    agent,
  }: NodeControllerOpt & NodeParamOpt) {
    super({
      retry,
      retryInterval,
      onSuccess,
      onError,
      onFinish,
      status,
    });
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
    this.parsers = parsers;
  }

  static fetch(
    opt: NodeControllerOpt & NodeParamOpt & { body?: NodeBody },
    body: NodeBody | object = null,
  ): Promise<any> {
    if (_isNodeBody(body)) {
      return new NodeController(opt).request(body);
    }
    return new NodeController(opt).request(body);
  }

  private iconv(res: Buffer, contentType: string): string | Buffer {
    const _tmp = /charset=(.*?)($|;)/iu.exec(contentType);
    let charset = 'utf-8';
    if (_tmp && _tmp[1] && _tmp[1] !== 'utf-8') {
      return iconvLite.decode(res, charset);
    }
    return String(res);
  }

  private createUpLoadBody(opt: object): [string, string] {
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
    return [block.join('\r\n') + `\r\n--${boundary}--`, boundary];
  }

  protected formatRequestBodyAndHeader(
    body: NodeBody | object,
  ): [NodeBody, InputHeader] {
    let formated: string | NodeBody;
    const header: InputHeader = {};
    if (_isNodeBody(body)) {
      formated = body;
    } else {
      const contentType = this.param.getHeader('content-type');
      switch (contentType) {
        case 'application/json':
          formated = JSON.stringify(body);
          break;
        case 'application/x-www-form-urlencoded':
          formated = stringify(body);
          break;
        case 'multipart/form-data':
          {
            const res = this.createUpLoadBody(body);
            header['content-type'] = `multipart/form-data; boundary=${res[1]}`;
            formated = res[0];
          }
          break;
        default:
          throw new Error(
            'body是字符串或者Buffer，或者设置content-type实施默认转换',
          );
      }
    }
    header['content-length'] =
      formated === null ? '0' : String(Buffer.byteLength(formated));
    return [formated, header];
  }

  private needRedirect() {
    const redirectOpt = <Redirect>(
      this.parsers.find(each => Array.isArray(each) && each[0] === 'redirect')
    );
    if (
      redirectOpt &&
      this.fetcher.is3xx() &&
      this.fetcher.getResHeader('location') &&
      this.rediectTimes < redirectOpt[1]
    ) {
      return true;
    }
    return false;
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

  private getCustomParser(): CustomParser[] {
    return <CustomParser[]>(
      this.parsers.filter(each => typeof each === 'function')
    );
  }

  protected replaceFetcher() {
    this.fetcher = new NodeFetcher(this.param);
  }

  protected async parseResponse(
    response: Buffer,
  ): Promise<string | Buffer | object> {
    const contentType: string = this.fetcher.getResHeader('content-type') || '';
    if (this.needRedirect()) {
      this.rediectTimes += 1;
      this.fetcher = new NodeFetcher(
        new NodeParam({
          url: this.fetcher.getResHeader('location'),
          method: 'GET',
          timeout: 5 * 1000,
        }),
      );
      return this.request(null);
    }
    let parsed: string | Buffer | object = response;
    if (this.needIconv()) {
      parsed = this.iconv(response, contentType);
    }
    if (this.needParseJson(contentType)) {
      parsed = JSON.parse(String(parsed));
    }
    const customParsers: CustomParser[] = this.getCustomParser();
    for (let i = 0, len = customParsers.length; i < len; i++) {
      parsed = await customParsers[i](parsed, this.fetcher.getResHeader());
    }
    return parsed;
  }
}
