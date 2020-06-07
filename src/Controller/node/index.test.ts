import http from 'http';
import path from 'path';
import iconv from 'iconv-lite';
import fs from 'fs';
import querystring from 'querystring';
import formidable from 'formidable';
import Controller from '.';

let timers: any[] = [];
let server: any = null;
const port = 5656;
const domain = `http://localhost:${port}`;
const tt: any = formidable;
beforeAll(() => {
  let visited = 0;
  let timer: any;
  server = http
    .createServer((req, res) => {
      if (req.url === '/errorRetry') {
        visited += 1;
        clearTimeout(timer);
        if (visited < 3) {
          timer = setTimeout(() => {
            res.end('success at:' + visited);
          }, 500);
          timers.push(timer);
          return;
        }
        res.end('success at:' + visited);
        return;
      }
      if (req.url === '/success') {
        res.setHeader('x-tmp', 'tmp');
        res.end('success');
        return;
      }
      if (req.url === '/error') {
        res.statusCode = 404;
        res.setHeader('x-error', 'error');
        res.end('error');
        return;
      }
      if (req.url === '/body') {
        const type = req.headers['content-type'];
        if (type && type.includes('form-data')) {
          const form = tt({ multiples: true });
          form.parse(req, (_err: any, fields: any, files: any) => {
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ fields, files }, null, 2));
          });
        } else {
          const body: any[] = [];
          let len = 0;
          req.on('data', chunk => {
            body.push(chunk);
            len += chunk.length;
          });
          req.on('end', () => {
            const requestBody = String(Buffer.concat(body, len));
            if (type === 'application/json') {
              res.end(JSON.stringify(JSON.parse(requestBody)));
              return;
            } else if (type === 'application/x-www-form-urlencoded') {
              res.end(JSON.stringify(querystring.parse(requestBody)));
              return;
            } else {
              res.end(requestBody);
            }
          });
        }
        return;
      }
      if (req.url && req.url.startsWith('/presets')) {
        let id: any = req.url.match(/id=(\d+)/);
        if (!id) {
          id = 0;
        } else {
          id = Number(id[1]);
        }
        if (id < 5) {
          res.statusCode = 302;
          res.setHeader(
            'location',
            `http://localhost:${port}/presets?id=${id + 1}`,
          );
          res.setHeader('content-type', 'application/json; charset=GBK');
          res.end(
            iconv.encode(
              JSON.stringify({
                msg: '重定向',
              }),
              'GBK',
            ),
          );
        } else {
          res.setHeader('content-type', 'application/json; charset=GBK');
          res.end(
            iconv.encode(
              JSON.stringify({
                name: '张成思,redirect:' + id,
              }),
              'GBK',
            ),
          );
        }
        return;
      }
      if (req.url && req.url.startsWith('/notMatch')) {
        res.end('notMatch:' + req.url);
        return;
      }
      if (req.url && req.url.startsWith('/overRideOption')) {
        res.end('overRideOption:' + req.url);
        return;
      }
    })
    .listen(port);
});
afterAll(() => {
  server.close();
  timers.forEach(timer => {
    clearTimeout(timer);
  });
  timers = [];
});

test('error retry', async () => {
  const co = new Controller({
    url: `${domain}/errorRetry`,
    method: 'GET',
    errorRetry: 2,
    timeout: 100,
    errorRetryInterval: 0,
  });
  const res = await co.fetch(null);
  expect(res).toBe('success at:3');
});
test('parse error retry', async () => {
  let index = 0;
  const co = new Controller({
    url: `${domain}/success`,
    responseHandlers: () => {
      if (index < 2) {
        index += 1;
        throw new Error('fucked');
      }
      return 'parser return success at ' + index;
    },
    method: 'GET',
    errorRetry: 2,
    timeout: 100,
    errorRetryInterval: 0,
  });
  const res = await co.fetch(null);
  expect(res).toBe('parser return success at 2');
});

test('success & finish hooks', async () => {
  let mesg = <any>[];
  const co = new Controller({
    url: `${domain}/success`,
    method: 'GET',
    onSuccess: (res, header) => {
      let msg = '';
      msg += res;
      msg += '-' + header['x-tmp'];
      mesg.push(msg);
    },
    onFinish: () => {
      mesg.push('finish');
    },
  });
  await co.fetch(null);
  expect(mesg[0]).toBe('success-tmp');
  expect(mesg[1]).toBe('finish');
});
test('error hooks', async () => {
  let mesg = <any>[];
  const co = new Controller({
    url: `${domain}/error`,
    method: 'GET',
    onError: (error, header) => {
      mesg.push(error);
      mesg.push(header['x-error']);
    },
    onFinish: () => {
      mesg.push('finish');
    },
  });
  await co.fetch(null);
  expect(mesg[0] instanceof Error).toBe(true);
  expect(mesg[1]).toBe('error');
  expect(mesg[2]).toBe('finish');
});

test('string body', async () => {
  const co = new Controller({
    url: `${domain}/body`,
    method: 'POST',
    responseHandlers: [],
  });
  const res = await co.fetch('i am body');
  expect(String(res)).toBe('i am body');
});
test('Buffer body', async () => {
  const co = new Controller({
    url: `${domain}/body`,
    method: 'POST',
    responseHandlers: [],
  });
  const res = await co.fetch(Buffer.from('buffer body'));
  expect(String(res)).toBe('buffer body');
});
test('json body', async () => {
  const co = new Controller({
    url: `${domain}/body`,
    header: {
      'content-type': 'application/json',
    },
    method: 'POST',
    responseHandlers: [],
  });
  const res = await co.fetch({ name: 'zcs' });
  expect(String(res)).toBe(JSON.stringify({ name: 'zcs' }));
});
test('urlencode body', async () => {
  const co = new Controller({
    url: `${domain}/body`,
    header: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
    responseHandlers: [],
  });
  const res = await co.fetch({ name: 'zcs', gender: 'man' });
  expect(String(res)).toBe(JSON.stringify({ name: 'zcs', gender: 'man' }));
});
test('upload file body', async () => {
  const co = new Controller({
    url: `${domain}/body`,
    header: {
      'content-type': 'multipart/form-data',
    },
    method: 'POST',
    responseHandlers: [],
  });
  const targetFile = path.join(__dirname, '../../../.gitignore');
  const res = await co.fetch({
    file: targetFile,
    title: 'upload',
  });
  const resObj = JSON.parse(String(res));
  expect(resObj.fields).toEqual({ title: 'upload' });
  expect(resObj.files.file.name).toEqual('.gitignore');
  expect(fs.readFileSync(resObj.files.file.path, 'utf-8')).toEqual(
    fs.readFileSync(targetFile, 'utf-8'),
  );
});

test('status filter', async () => {
  const co = new Controller({
    url: `${domain}/error`,
    statusFilter: /404/,
    method: 'GET',
  });
  let hasError = null;
  try {
  } catch (error) {
    hasError = error;
  }
  await co.fetch(null);
  expect(co.fetcher.statusCode).toBe(404);
  expect(hasError).toBe(null);
  const co2 = new Controller({
    url: `${domain}/error`,
    method: 'GET',
  });
  let mayError = null;
  try {
    await co2.fetch(null);
  } catch (error) {
    mayError = error;
  }
  expect(mayError instanceof Error).toBe(true);
});

test('preset parsers and custom parser', async () => {
  const co = new Controller({
    url: `${domain}/presets`,
    method: 'GET',
    responseHandlers: [
      'redirect',
      'decode',
      'json',
      (response, controller: string) => {
        const type = controller;
        // return `body:${response.name} header:${header['content-type']}`;
      },
    ],
  });
  const res = await co.fetch(null);
  expect(res).toBe(
    'body:张成思,redirect:5 header:application/json; charset=GBK',
  );
});
test('redirect exceed', async () => {
  const co = new Controller({
    url: `${domain}/presets`,
    method: 'GET',
    parsers: [['redirect', 3], 'iconv', 'json'],
    parser: (response, header) => {
      return `body:${response.name} header:${header['content-type']}`;
    },
  });
  let catched = null;
  try {
    await co.fetch(null);
  } catch (error) {
    catched = error;
  }
  expect(catched.message).toBe('重定向超过3次');
});
// 用于参数中包含#,但又必须保留#号,不能encode的情况.这个情况实际是不对的,按道理都应该encodeURIComponent
// 因为只用http.fetch(url)的话,参数中的#号之后的部分会认为是hash而丢弃.
// 只有用http.fetch({path: '?q=1234'})才能正取传送
test('option override', async () => {
  const co = new Controller({
    url: `${domain}/notMatch`,
    search: {
      q: '#abcd',
    },
    method: 'GET',
    parsers: ['iconv', 'json'],
  });
  const res = await co.fetch(null);
  const co0 = new Controller({
    url: `${domain}/notMatch?q=#abcd`,
    method: 'GET',
    parsers: ['iconv', 'json'],
  });
  const res0 = await co0.fetch(null);
  const co2 = new Controller({
    url: `${domain}/notMatch`,
    option: {
      path: `/overRideOption?q=#abcd`,
    },
    search: {
      a: '#abcde',
    },
    method: 'GET',
    parsers: ['iconv', 'json'],
  });
  const res2 = await co2.fetch(null);
  // const co3 = new Controller({
  //   url: `${domain}/overRideOption`,
  //   option: {
  //     path: `?q=#abcd`,
  //   },
  //   search: {
  //     a: '#abcde',
  //   },
  //   method: 'GET',
  //   parsers: ['iconv', 'json'],
  // });
  // const res3 = await co3.fetch(null);
  // console.log(res3);
  expect(res).toEqual('notMatch:/notMatch?q=%23abcd');
  expect(res0).toEqual('notMatch:/notMatch?q=');
  expect(res2).toEqual('overRideOption:/overRideOption?q=#abcd');
});
