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
  readonly parsers?: Parser[];
}

type Redirect = ['redirect', number];
interface CustomParser {
  (res: any, header: InputHeader): any;
}
type Parser = 'status' | Redirect | 'iconv' | 'json' | CustomParser;

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
    retryInterval,
    parsers = ['status', ['redirect', 10], 'iconv', 'json'],
    url,
    path,
    search,
    method,
    header,
    timeout,
    agent,
  }: NodeControllerOpt & NodeParamOpt) {
    super({ retry, retryInterval });
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

  static send(
    opt: NodeControllerOpt & NodeParamOpt,
    body?: NodeBody,
  ): Promise<any>;
  static send(
    opt: NodeControllerOpt & NodeParamOpt,
    body?: object,
  ): Promise<any>;
  static send(
    opt: NodeControllerOpt & NodeParamOpt,
    body: NodeBody | object = null,
  ): Promise<any> {
    if (_isNodeBody(body)) {
      return new NodeController(opt).request(body);
    }
    return new NodeController(opt).request(body);
  }

  static extMapMimeType = <any>{
    '.doc': 'application/msword',
    '.docx':
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.rtf': 'application/rtf',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx':
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx':
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.pps': 'application/vnd.ms-powerpoint',
    '.ppsx':
      'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
    '.pdf': 'application/pdf',
    '.swf': 'application/x-shockwave-flash',
    '.dll': 'application/x-msdownload',
    '.exe': 'application/octet-stream',
    '.msi': 'application/octet-stream',
    '.chm': 'application/octet-stream',
    '.cab': 'application/octet-stream',
    '.ocx': 'application/octet-stream',
    '.rar': 'application/octet-stream',
    '.tar': 'application/x-tar',
    '.tgz': 'application/x-compressed',
    '.zip': 'application/x-zip-compressed',
    '.z': 'application/x-compress',
    '.wav': 'audio/wav',
    '.wma': 'audio/x-ms-wma',
    '.wmv': 'video/x-ms-wmv',
    '.mp3': 'audio/mpeg',
    '.mp2': 'audio/mpeg',
    '.mpe': 'audio/mpeg',
    '.mpeg': 'audio/mpeg',
    '.mpg': 'audio/mpeg',
    '.rm': 'application/vnd.rn-realmedia',
    '.mid': 'audio/mid',
    '.midi': 'audio/mid',
    '.rmi': 'audio/mid',
    '.bmp': 'image/bmp',
    '.gif': 'image/gif',
    '.png': 'image/png',
    '.tif': 'image/tiff',
    '.tiff': 'image/tiff',
    '.jpe': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.txt': 'text/plain',
    '.xml': 'text/xml',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.mht': 'message/rfc822',
    '.mhtml': 'message/rfc822',
  };

  private _iconv(res: Buffer, contentType: string): string | Buffer {
    const _tmp = /charset=(.*?)($|;)/iu.exec(contentType);
    let charset = 'utf-8';
    if (_tmp && _tmp[1] && _tmp[1] !== 'utf-8') {
      return iconvLite.decode(res, charset);
    }
    return String(res);
  }

  private _createFileBody(opt: object): [string, string] {
    const boundary = mockUuid();
    const contentBlock = Object.entries(opt).map(([name, filePath]) => {
      const fileName = path.basename(filePath);
      const contentType =
        NodeController.extMapMimeType[path.extname(filePath)] ||
        'application/octet-stream';
      const content = fs.readFileSync(filePath, 'utf-8');
      return `--${boundary}\r\nContent-Disposition: form-data;name="${name}"${
        fileName ? ` fileName="${fileName}"` : ''
      }\r\n${
        contentType ? `content-type="${contentType}"` : ''
      }\r\n\r\n${content}`;
    });
    return [contentBlock.join('\r\n'), boundary];
  }

  async ss() {
    try {
      const [body, header] = this._formatBodyAndHeader();
      const fetch = () => {
        this.fetcher.send(body, header);
      };
      const result = this._ensureRequest();
      this.parser(result);
    } catch (error) {
      throw error;
    } finally {
    }
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

  private needStatusCodeCheck() {
    return this.parsers.find(each => each === 'status');
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

  async _request(body: NodeBody, header?: InputHeader): Promise<any> {
    const fetchRes: Buffer = await this.fetcher.send(body, header);
    const contentType: string = this.fetcher.getResHeader('content-type') || '';
    if (this.needStatusCodeCheck()) {
      this._statusCheck();
    }
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
    let parsed: string | Buffer | object = fetchRes;
    if (this.needIconv()) {
      parsed = this._iconv(fetchRes, contentType);
    }
    if (this.needParseJson(contentType)) {
      parsed = JSON.parse(String(parsed));
    }
    const customParsers: CustomParser[] = this.getCustomParser();
    for (let i = 0, len = customParsers.length; i < len; i++) {
      parsed = customParsers[i](parsed, this.fetcher.getResHeader());
    }
    return parsed;
  }
}
