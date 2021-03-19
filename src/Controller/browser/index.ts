import redirect from './redirect';
import NodeFetcher from '../../Fetcher/browser';
import Controller, { ControllerOpt } from '../';
import { ParamOpt } from '../../Param';
import BrowserParam from '../../Param/browser';
import {
  ResponseHandler,
  checkStatusCode,
  parseJson,
} from '../response_handlers';
import { Readable } from 'stream';

type NodeBody = string | Buffer | null | Readable;
type Handler = keyof typeof ResponseHandlerName | ResponseHandler;
type Partial<T> = {
  [P in keyof T]?: T[P];
};

declare interface NodeControllerOpt extends Partial<ControllerOpt> {
  readonly maxRedirect?: number;
  responseHandlers?: Handler | Handler[];
}

enum ResponseHandlerName {
  'status',
  'redirect',
  'json',
}
export default class NodeController extends Controller<NodeBody> {
  private rediectTimes: number = 0;
  private readonly maxRedirect: number;
  public fetcher: NodeFetcher;
  constructor({
    maxRedirect = 5,
    errorRetry = 0,
    errorRetryInterval = 50,
    responseHandlers = ['status', 'redirect', 'json'],
    onSuccess,
    onError,
    statusFilter = /^[23]\d\d$/,
    onFinish,
    ...rest
  }: NodeControllerOpt & ParamOpt) {
    super({
      errorRetry,
      errorRetryInterval,
      onSuccess,
      onError,
      onFinish,
      statusFilter,
    });
    this.param = new BrowserParam(rest);
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
    opt: NodeControllerOpt & ParamOpt,
    body: NodeBody | object,
  ): Promise<any> {
    return new NodeController(opt).fetch(<any>body);
  }

  protected cloneFetcher() {
    this.fetcher = new NodeFetcher(this.param);
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
        case 'json':
          return parseJson;
        default:
          return handler;
      }
    });
  }
}
