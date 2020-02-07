import { wait } from 'better-utils';

export default abstract class Controller {
  protected fetcher!: FetcherInterface;
  protected presetParser: boolean;
  protected parser: ControllerOpt['parser'];
  private searchModifyer: ControllerOpt['searchModifyer'];
  private retry: number;
  private retryInterval: number;

  constructor({
    presetParser = true,
    parser,
    retry = 2,
    retryInterval = 50,
    searchModifyer,
  }: ControllerOpt) {
    this.presetParser = presetParser;
    this.parser = parser;
    this.retry = retry;
    this.retryInterval = retryInterval;
    this.searchModifyer = searchModifyer;
  }

  _statusCheck() {
    if (!this.fetcher.is2xx() && !this.fetcher.is3xx()) {
      throw new Error(`status code not 2xx or 3xx:${this.fetcher.statusCode}`);
    }
  }

  _jsonParser(res: string, contentType: string): object | string {
    if (contentType.includes('application/json')) {
      return JSON.parse(res);
    }
    return res;
  }

  abstract _request(): Promise<any>;

  async request(): Promise<any> {
    for (let retryTimes = 0; retryTimes <= this.retry; retryTimes += 1) {
      try {
        return this._request();
      } catch (error) {
        await this._reBuildFetcher(error, retryTimes);
      }
    }
  }

  async _reBuildFetcher(error: Error, retryTimes: number): Promise<void> {
    if (retryTimes === this.retry) {
      throw error;
    }
    await wait(this.retryInterval);
    if (this.searchModifyer) {
      const search = await this.searchModifyer(
        this.fetcher.param.getSearch(),
        retryTimes,
        this.fetcher,
      );
      this._replaceFetcher(this.fetcher.param.setSearch(search));
    }
  }

  abstract _replaceFetcher(search: { [key: string]: any }): void;
}
