import BodyHandler from '../body_handler';
import { InputHeader } from '../../Param/Header';

type BrowserBody =
  | string
  | Document
  | Blob
  | ArrayBufferView
  | ArrayBuffer
  | FormData
  | URLSearchParams
  | ReadableStream<Uint8Array>;

export default class BrowserBodyHandler extends BodyHandler<BrowserBody> {
  isNeedFormat(body: any) {
    return !(typeof body === 'string' || body === null);
  }

  protected createUploadBody(body: object): [FormData, InputHeader] {
    return [
      Object.entries(body).reduce((acc, [key, value]) => {
        acc.append(key, value);
        return acc;
      }, new FormData()),
      {},
    ];
  }
}
