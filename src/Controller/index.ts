import { wait } from 'better-utils';
import { FetcherInterface } from '../Fetcher';
import Param from '../Param';
import { InputHeader } from '../Param/Header';

interface ControllerOpt {
  readonly presetParser?: boolean;
  readonly parser?: (res: string | object, header: InputHeader) => any;
  readonly retry?: number;
  readonly retryInterval?: number;
}

export { ControllerOpt };
export default abstract class Controller<V> {
  protected fetcher!: FetcherInterface;
  protected param!: Param;
  protected presetParser: boolean;
  protected parser: ControllerOpt['parser'];
  private retry: number;
  private retryInterval: number;

  constructor({
    presetParser = true,
    parser,
    retry = 2,
    retryInterval = 50,
  }: ControllerOpt) {
    this.presetParser = presetParser;
    this.parser = parser;
    this.retry = retry;
    this.retryInterval = retryInterval;
  }

  _statusCheck() {
    if (!this.fetcher.is2xx() && !this.fetcher.is3xx()) {
      throw new Error(`status code not 2xx or 3xx:${this.fetcher.statusCode}`);
    }
  }

  abstract _request(body: V, header: InputHeader): Promise<any>;
  abstract request(body: any): Promise<any>;

  async _ensureRequest(body: V, header: InputHeader): Promise<any> {
    for (let retryTimes = 0; retryTimes <= this.retry; retryTimes += 1) {
      try {
        return this._request(body, header);
      } catch (error) {
        if (retryTimes === this.retry) {
          throw error;
        }
        await wait(this.retryInterval);
      }
    }
  }
}
