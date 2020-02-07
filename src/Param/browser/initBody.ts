import { isString, isTypedArray } from 'better-utils';
import { stringify } from '../queryString';

const bodyChecker = (value: any) => {
  const globalClasses = [
    'Document',
    'Blob',
    'ArrayBufferView',
    'ArrayBuffer',
    'FormData',
    'URLSearchParams',
    'ReadableStream',
  ];
  return globalClasses.some((globalClass: any) => {
    if (window[globalClass]) {
      return value instanceof <any>window[globalClass];
    }
    return false;
  });
};

const initBody: InitBody<BrowserBody> = (
  body: BrowserBody | object,
  method: InputMethod = 'GET',
  contentType: string = '',
): BrowserBody => {
  if (
    (method === 'POST' && body === null) ||
    (body !== null && method !== 'GET')
  ) {
    console.error('POST无body或GET有body');
  }
  if (body === null) {
    return null;
  }
  if (isString(body) || isTypedArray(body) || bodyChecker(body)) {
    return <BrowserBody>body;
  }
  if (contentType.includes('application/json')) {
    return JSON.stringify(body);
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return stringify(<any>body);
  }
  if (contentType.includes('multipart/form-data')) {
    return Object.entries(body).reduce((acc, [key, value]) => {
      acc.append(key, value);
      return acc;
    }, new FormData());
  }
  throw new Error('body是字符串或者Buffer，或者设置content-type实施默认转换');
};
export default initBody;
