import { wait } from 'better-utils';
import { FetcherInterface } from '../Fetcher';
import Param from '../Param';
import { InputHeader } from '../Param/Header';

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
  readonly retry?: number;
  readonly retryInterval?: number;
  readonly onSuccess?: SuccessHook;
  readonly onError?: ErrorHook;
  readonly onFinish?: FinishHook;
}

export { ControllerOpt };
export default abstract class Controller<V> {
  protected fetcher!: FetcherInterface;
  protected param!: Param;
  protected onError: ErrorHook | undefined;
  protected onSuccess: SuccessHook | undefined;
  protected onFinish: FinishHook | undefined;
  private retry: number;
  private retryInterval: number;

  constructor({
    retry = 2,
    retryInterval = 50,
    onSuccess,
    onError,
    onFinish,
  }: ControllerOpt = {}) {
    this.onError = onError;
    this.onSuccess = onSuccess;
    this.onFinish = onFinish;
    this.retry = retry;
    this.retryInterval = retryInterval;
  }

  protected _statusCheck() {
    if (!this.fetcher.is2xx() && !this.fetcher.is3xx()) {
      throw new Error(`status code not 2xx or 3xx:${this.fetcher.statusCode}`);
    }
  }

  abstract _request(body: V, header: InputHeader): Promise<any>;
  abstract request(body: any): Promise<any>;

  protected async _ensureRequest(body: V, header: InputHeader): Promise<any> {
    try {
      for (let retryTimes = 0; retryTimes <= this.retry; retryTimes += 1) {
        try {
          const result = this._request(body, header);
          if (this.onSuccess) {
            this.onSuccess(result, this.fetcher.getResHeader());
          }
          return result;
        } catch (error) {
          if (retryTimes === this.retry) {
            throw error;
          }
          await wait(this.retryInterval);
        }
      }
    } catch (error) {
      if (this.onError) {
        this.onError(error, this.fetcher.getResHeader());
      }
      throw error;
    } finally {
      if (this.onFinish) {
        this.onFinish(this.fetcher.getResHeader());
      }
    }
  }
}
