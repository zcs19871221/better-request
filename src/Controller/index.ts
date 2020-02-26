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
  readonly status?: RegExp;
}

export { ControllerOpt };
export default abstract class Controller<V> {
  protected fetcher!: FetcherInterface;
  protected param!: Param;
  private onError: ErrorHook | undefined;
  private onSuccess: SuccessHook | undefined;
  private onFinish: FinishHook | undefined;
  private retry: number;
  private retryInterval: number;
  private status: RegExp;

  constructor({
    retry = 2,
    retryInterval = 50,
    status = /^2\d\d$/,
    onSuccess,
    onError,
    onFinish,
  }: ControllerOpt = {}) {
    this.onError = onError;
    this.onSuccess = onSuccess;
    this.onFinish = onFinish;
    this.retry = retry;
    this.retryInterval = retryInterval;
    this.status = status;
  }

  async request(body: V): Promise<any>;
  async request(body: object): Promise<any>;
  async request(body: V | object): Promise<any> {
    try {
      const [formatedBody, overWriteHeader] = this.formatRequestBodyAndHeader(
        body,
      );
      const rawData = await this.ensureRequest(formatedBody, overWriteHeader);
      const result = await this.parseResponse(rawData);
      if (this.onSuccess) {
        this.onSuccess(result, this.fetcher.getResHeader());
      }
      return result;
    } catch (error) {
      if (this.onError) {
        this.onError(error, this.fetcher.getResHeader());
      } else {
        throw error;
      }
    } finally {
      if (this.onFinish) {
        this.onFinish(this.fetcher.getResHeader());
      }
    }
  }

  protected abstract formatRequestBodyAndHeader(
    body: V | object,
  ): [V, InputHeader];
  protected abstract parseResponse(response: any): Promise<any>;
  protected abstract replaceFetcher(): void;

  protected async ensureRequest(body: V, header: InputHeader): Promise<any> {
    for (let retryTimes = 0; retryTimes <= this.retry; retryTimes += 1) {
      try {
        const result = await this.fetcher.send(body, header);
        this.statusCodeCheck();
        return result;
      } catch (error) {
        if (retryTimes === this.retry) {
          throw error;
        }
        this.replaceFetcher();
        await wait(this.retryInterval);
      }
    }
  }

  private statusCodeCheck() {
    const statusCode = this.fetcher.statusCode;
    if (!this.status.test(String(statusCode))) {
      throw new Error(
        `status code ${this.fetcher.statusCode} not match regExp ${this.status.source}`,
      );
    }
  }
}
