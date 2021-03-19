import BrowserFetcher, { BrowserBody } from '../../Fetcher/browser';
import Controller, { ControllerOpt } from '../';
import { ParamOpt } from '../../Param';
import BrowserParam from '../../Param/browser';
import {
  ResponseHandler,
  checkStatusCode,
  parseJson,
} from '../response_handlers';

type BBody = BrowserBody | null;
type Handler = keyof typeof ResponseHandlerName | ResponseHandler;
type Partial<T> = {
  [P in keyof T]?: T[P];
};

declare interface BrowserControllerOpt extends Partial<ControllerOpt> {
  responseHandlers?: Handler | Handler[];
}

enum ResponseHandlerName {
  'status',
  'json',
}
export default class BrowserController extends Controller<BBody> {
  private rediectTimes: number = 0;
  public fetcher: BrowserFetcher;
  constructor({
    errorRetry = 0,
    errorRetryInterval = 50,
    responseHandlers = ['status', 'json'],
    onSuccess,
    onError,
    statusFilter = /^[23]\d\d$/,
    onFinish,
    ...rest
  }: BrowserControllerOpt & ParamOpt) {
    super({
      errorRetry,
      errorRetryInterval,
      onSuccess,
      onError,
      onFinish,
      statusFilter,
    });
    this.param = new BrowserParam(rest);
    this.fetcher = new BrowserFetcher(this.param);
    this.responseHandlers = this.standardResponseHandler(responseHandlers);
  }

  getRediectTimes() {
    return this.rediectTimes;
  }

  setRediectTimes(time: number) {
    this.rediectTimes = time;
  }

  static fetch(
    opt: BrowserControllerOpt & ParamOpt,
    body: BBody | object,
  ): Promise<any> {
    return new BrowserController(opt).fetch(<any>body);
  }

  protected cloneFetcher() {
    this.fetcher = new BrowserFetcher(this.param);
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
        case 'json':
          return parseJson;
        default:
          return handler;
      }
    });
  }
}
