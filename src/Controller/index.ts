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
  readonly parser?: customParser | undefined;
}

interface customParser {
  (response: any, header: InputHeader): any;
}
export { ControllerOpt };
export default abstract class Controller<V> {
  public fetcher!: FetcherInterface;
  public param!: Param;
  private onError: ErrorHook | undefined;
  private onSuccess: SuccessHook | undefined;
  private onFinish: FinishHook | undefined;
  private retry: number;
  private retryInterval: number;
  private status: RegExp;
  private parser: customParser | undefined;

  constructor({
    retry = 2,
    retryInterval = 50,
    status = /^[23]\d\d$/,
    onSuccess,
    onError,
    onFinish,
    parser,
  }: ControllerOpt = {}) {
    this.onError = onError;
    this.onSuccess = onSuccess;
    this.onFinish = onFinish;
    this.retry = retry;
    this.retryInterval = retryInterval;
    this.status = status;
    this.parser = parser;
  }

  async request(body: V): Promise<any>;
  async request(body: object): Promise<any>;
  async request(body: V | object): Promise<any> {
    try {
      const result = await this.ensureRequest(body);
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

  protected abstract needRedirect(): boolean;
  protected abstract redirect(): Promise<any>;

  protected abstract formatRequestBodyAndHeader(
    body: V | object,
  ): [V, InputHeader];
  protected abstract presetParse(response: any): Promise<any>;
  protected abstract replaceFetcher(): void;

  protected async ensureRequest(body: V | object): Promise<any> {
    for (let retryTimes = 0; retryTimes <= this.retry; retryTimes += 1) {
      try {
        const [formatedBody, overWriteHeader] = this.formatRequestBodyAndHeader(
          body,
        );
        const rawData = await this.fetcher.send(formatedBody, overWriteHeader);
        this.statusCodeCheck();
        if (this.needRedirect()) {
          return this.redirect();
        }
        let result = await this.presetParse(rawData);
        if (this.parser) {
          result = await this.parser(result, this.fetcher.getResHeader());
        }
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
