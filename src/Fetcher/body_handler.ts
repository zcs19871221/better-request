import { FetcherInterface } from '.';
import { InputHeader } from '../Param/Header';
import { stringify } from '../Param/queryString';

export default abstract class BodyHandler<V> {
  private fetcher: FetcherInterface;
  constructor(fetcher: FetcherInterface) {
    this.fetcher = fetcher;
  }

  protected abstract createUploadBody(body: object): [V, InputHeader];
  protected abstract isNeedFormat(body: any): boolean;
  protected addContentLength(_body: V | null): object {
    return {};
  }

  format(body: V | object | null): [V, InputHeader] {
    let formatedBody: any = null;
    let formatedHeader: InputHeader = {};
    if (this.isNeedFormat(body)) {
      const contentType = this.fetcher.param.getHeader('content-type');
      if (contentType.includes('application/json')) {
        formatedBody = JSON.stringify(body);
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        formatedBody = stringify(<object>body);
      } else if (contentType.includes('multipart/form-data')) {
        [formatedBody, formatedHeader] = this.createUploadBody(<object>body);
      } else {
        throw new Error(
          `body需要string,buffer,formData类型,或者传入objectt但content-type设置application/json,application/x-www-form-urlencoded,multipart/form-data实现默认转换`,
        );
      }
    } else {
      formatedBody = body;
    }
    const lengthHeader = this.addContentLength(formatedBody);
    return [<V>formatedBody, { ...formatedHeader, ...lengthHeader }];
  }
}
