import iconvLite from 'iconv-lite';
import NodeFetcher from '../../Fetcher/node';
import Controller from '../';
import NodeParam from '../../Param/node';

export default class NodeController extends Controller {
  private rediectTimes: number = 0;
  private redirect: boolean;
  private maxRedirect: number;
  constructor({
    presetParser = true,
    parser,
    retry = 2,
    retryInterval,
    searchModifyer,
    redirect = true,
    maxRedirect = 10,
    url,
    path,
    search,
    method,
    header,
    timeout,
    agent,
    body,
  }: NodeControllerOpt & NodeParamOpt) {
    super({ presetParser, parser, retry, retryInterval, searchModifyer });
    this.fetcher = new NodeFetcher(
      new NodeParam({
        url,
        path,
        search,
        method,
        header,
        timeout,
        agent,
        body,
      }),
    );
    this.redirect = redirect;
    this.maxRedirect = maxRedirect;
  }

  static send(opt: NodeControllerOpt & NodeParamOpt): Promise<any> {
    return new NodeController(opt).request();
  }

  _iconv(res: Buffer, contentType: string): string {
    const _tmp = /charset=(.*?)($|;)/iu.exec(contentType);
    let charset = 'utf-8';
    if (_tmp && _tmp[1] && _tmp[1] !== 'utf-8') {
      return iconvLite.decode(res, charset);
    }
    return String(res);
  }

  async _request(): Promise<any> {
    const fetchRes: Buffer = await this.fetcher.send();
    const contentType: string = this.fetcher.resHeader.get('cotent-type') || '';
    await this._statusCheck();
    if (
      this.redirect &&
      this.fetcher.is3xx() &&
      this.fetcher.resHeader.get('location') &&
      this.rediectTimes < this.maxRedirect
    ) {
      this.rediectTimes += 1;
      this.fetcher = new NodeFetcher(
        new NodeParam({
          url: this.fetcher.resHeader.get('location'),
          body: null,
          path: '',
          search: '',
          method: 'GET',
          header: {},
          timeout: 5 * 1000,
        }),
      );
      return this.request();
    }
    let parsed: string | object = '';
    if (this.presetParser) {
      parsed = await this._iconv(fetchRes, contentType);
      if (contentType.includes('application/json')) {
        parsed = JSON.parse(parsed);
      }
    }
    if (this.parser) {
      return this.parser(parsed, this.fetcher.resHeader);
    }
    return parsed;
  }

  _replaceFetcher(search: { [key: string]: any }): void {
    this.fetcher = new NodeFetcher(
      <NodeParam>this.fetcher.param.setSearch(search),
    );
  }
}
