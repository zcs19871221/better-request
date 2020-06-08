import { FetcherInterface } from '../Fetcher';
import Param from '../Param';
import { InputHeader } from '../Param/Header';
import { ResponseHandler } from './response_handlers';
import wait from '../utils/wait';

interface ErrorHook {
  (error: Error, header: InputHeader): void;
}
interface SuccessHook {
  (data: any, header: InputHeader): void;
}
interface FinishHook {
  (header: InputHeader): void;
}
interface ControllerOpt {
  readonly errorRetry: number;
  readonly errorRetryInterval: number;
  readonly onSuccess?: SuccessHook;
  readonly onError?: ErrorHook;
  readonly onFinish?: FinishHook;
  readonly statusFilter: RegExp;
}

export { ControllerOpt };
export default abstract class Controller<V> {
  public fetcher!: FetcherInterface;
  public param!: Param;
  private onError: ErrorHook | undefined;
  private onSuccess: SuccessHook | undefined;
  private onFinish: FinishHook | undefined;
  private errorRetryTimes: number = 0;
  private errorRetry: number;
  private errorRetryInterval: number;
  private statusFilter: RegExp;
  protected responseHandlers: ResponseHandler[] = [];

  constructor({
    errorRetry,
    errorRetryInterval,
    statusFilter,
    onSuccess,
    onError,
    onFinish,
  }: ControllerOpt) {
    this.onError = onError;
    this.onSuccess = onSuccess;
    this.onFinish = onFinish;
    this.errorRetry = errorRetry;
    this.errorRetryInterval = errorRetryInterval;
    this.statusFilter = statusFilter;
  }

  getStatusFilter(): RegExp {
    return this.statusFilter;
  }

  async fetch(body: V): Promise<any>;
  async fetch(body: object): Promise<any>;
  async fetch(body: V | object): Promise<any> {
    try {
      const result = await this.ensureRequest(body);
      this.onSuccessHandler(result);
      return result;
    } catch (error) {
      this.onErrorHandler(error);
    } finally {
      this.onFinishHandler();
    }
  }

  async ensureRequest(body: V | object): Promise<any> {
    while (this.errorRetryTimes <= this.errorRetry) {
      try {
        let response = await this.fetcher.send(body);
        for (const responseHandler of this.responseHandlers) {
          response = await responseHandler(response, this);
        }
        return response;
      } catch (error) {
        if (this.errorRetryTimes === this.errorRetry) {
          throw error;
        }
        this.errorRetryTimes++;
        this.fetcher = this.fetcher.clone();
        await wait(this.errorRetryInterval);
      }
    }
  }

  private onSuccessHandler(result: any) {
    if (this.onSuccess) {
      this.onSuccess(result, this.fetcher.getResHeader());
    }
  }

  private onErrorHandler(error: Error) {
    if (this.onError) {
      this.onError(error, this.fetcher.getResHeader());
    } else {
      throw error;
    }
  }

  private onFinishHandler() {
    if (this.onFinish) {
      this.onFinish(this.fetcher.getResHeader());
    }
  }
}
