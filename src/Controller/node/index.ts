import fs from 'fs';
import path from 'path';
import decodeResponse from './decodeResponse';
import redirect from './redirect';
import { mockUuid } from 'better-utils';
import NodeFetcher from '../../Fetcher/node';
import Controller, { ControllerOpt } from '../';
import NodeParam, { NodeParamOpt } from '../../Param/node';
import { InputHeader } from '../../Param/Header';
import {
  ResponseHandler,
  checkStatusCode,
  parseJson,
} from '../response_handlers';
import extMapMime from './extMapMime';

type NodeBody = string | Buffer | null;
type Handler = keyof typeof ResponseHandlerName | ResponseHandler;
declare interface NodeControllerOpt extends ControllerOpt {
  readonly maxRedirect?: number;
  responseHandlers?: Handler | Handler[];
}

function _isNodeBody(body: NodeBody | object): body is NodeBody {
  return Buffer.isBuffer(body) || typeof body === 'string' || body === null;
}

enum ResponseHandlerName {
  'status',
  'redirect',
  'decode',
  'json',
}

export default class NodeController extends Controller<NodeBody> {
  private rediectTimes: number = 0;
  private readonly maxRedirect: number;
  public fetcher: NodeFetcher;
  public param: NodeParam;
  constructor({
    maxRedirect = 5,
    errorRetry = 2,
    errorRetryInterval = 50,
    responseHandlers = ['status', 'redirect', 'decode', 'json'],
    onSuccess,
    onError,
    statusFilter = /^[23]\d\d$/,
    onFinish,
    ...rest
  }: NodeControllerOpt & NodeParamOpt) {
    super({
      errorRetry,
      errorRetryInterval,
      onSuccess,
      onError,
      onFinish,
      statusFilter,
    });
    this.param = new NodeParam(rest);
    this.fetcher = new NodeFetcher(this.param);
    this.maxRedirect = maxRedirect;
    this.responseHandlers = this.standardResponseHandler(responseHandlers);
  }

  getMaxRedirect() {
    return this.maxRedirect;
  }

  getRediectTimes() {
    return this.rediectTimes;
  }

  setRediectTimes(time: number) {
    this.rediectTimes = time;
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

  private standardResponseHandler(
    responseHandlers: Handler | Handler[],
  ): ResponseHandler[] {
    if (!Array.isArray(responseHandlers)) {
      responseHandlers = [responseHandlers];
    }
    return responseHandlers.map(handler => {
      switch (handler) {
        case 'status':
          return checkStatusCode;
        case 'redirect':
          return redirect;
        case 'decode':
          return decodeResponse;
        case 'json':
          return parseJson;
        default:
          return handler;
      }
    });
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
}
