import iconvLite from 'iconv-lite';
import { ResponseHandler } from '../response_handlers';
import NodeController from '.';

const iconv: ResponseHandler = (
  res: Buffer,
  controller: NodeController,
): any => {
  const contentType = controller.fetcher.getResHeader('content-type');
  const _tmp = /charset=(.*?)($|;)/iu.exec(contentType);
  const charset = (_tmp && _tmp[1] ? _tmp[1] : 'utf-8').trim();
  if (charset.toLowerCase() !== 'utf-8') {
    return iconvLite.decode(res, charset);
  }
  return String(res);
};
export default iconv;
