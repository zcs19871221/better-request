import Param from '../';
import initBody from './initBody';

export default class BrowserParam extends Param {
  private body: BrowserBody;
  constructor({
    url,
    path,
    search,
    method,
    header,
    timeout,
    body,
  }: BrowserParamType) {
    super({ url, path, search, method, header, timeout });
    this.body = initBody(body, this.method, this.header.get('content-type'));
  }

  getBody(): BrowserBody {
    return this.body;
  }
}
