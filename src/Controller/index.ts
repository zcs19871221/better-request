import { wait } from 'better-utils';
import { FetcherInterface } from '../Fetcher';
import Param from '../Param';
import { InputHeader } from '../Param/Header';
import { stringify } from '../Param/queryString';
import { ResponseHandler } from './response_handlers';

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
        const [formatedBody, overWriteHeader] = this.formatBodyAndHeader(body);
        let response = await this.fetcher.send(formatedBody, overWriteHeader);
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

  // protected abstract isStandardBodyType(body: V | object): boolean;
  protected abstract createUploadBody(body: object): [V, InputHeader];
  protected formatBodyAndHeader(body: V | object): [V, InputHeader] {
    // if (this.isStandardBodyType(body)) {
    //   return [<V>body, {}];
    // }
    const contentType = this.param.getHeader('content-type');
    let formated: string | V;
    let header: InputHeader = {};
    switch (contentType) {
      case 'application/json':
        formated = JSON.stringify(body);
        break;
      case 'application/x-www-form-urlencoded':
        formated = stringify(<object>body);
        break;
      case 'multipart/form-data':
        [formated, header] = this.createUploadBody(<object>body);
        break;
      default:
        throw new Error(
          `body需要string,buffer,formData类型,或者传入objectt但content-type设置application/json,application/x-www-form-urlencoded,multipart/form-data实现默认转换`,
        );
    }
    return [<V>formated, header];
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
