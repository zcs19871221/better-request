import querystring from 'querystring';

const initBody: InitBody<NodeBody> = (
  body: NodeBody | object,
  method: InputMethod = 'GET',
  contentType: string = '',
): NodeBody => {
  if (
    (method === 'POST' && body === null) ||
    (body !== null && method !== 'GET')
  ) {
    console.error('POST无body或GET有body');
  }
  if (body === null) {
    return null;
  }
  if (Buffer.isBuffer(body) || typeof body === 'string') {
    return body;
  }
  if (contentType.includes('application/json')) {
    return JSON.stringify(body);
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return querystring.stringify(<any>body);
  }
  throw new Error('body是字符串或者Buffer，或者设置content-type实施默认转换');
};
export default initBody;
