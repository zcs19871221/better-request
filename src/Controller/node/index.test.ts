import http from 'http';
import path from 'path';
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
    retry: 2,
    timeout: 100,
    retryInterval: 0,
  });
  const res = await co.request(null);
  expect(res).toBe('success at:3');
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
  await co.request(null);
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
  await co.request(null);
  expect(mesg[0] instanceof Error).toBe(true);
  expect(mesg[1]).toBe('error');
  expect(mesg[2]).toBe('finish');
});

test('string body', async () => {
  const co = new Controller({
    url: `${domain}/body`,
    method: 'POST',
    parsers: [],
  });
  const res = await co.request('i am body');
  expect(String(res)).toBe('i am body');
});
test('Buffer body', async () => {
  const co = new Controller({
    url: `${domain}/body`,
    method: 'POST',
    parsers: [],
  });
  const res = await co.request(Buffer.from('buffer body'));
  expect(String(res)).toBe('buffer body');
});
test('json body', async () => {
  const co = new Controller({
    url: `${domain}/body`,
    header: {
      'content-type': 'application/json',
    },
    method: 'POST',
    parsers: [],
  });
  const res = await co.request({ name: 'zcs' });
  expect(String(res)).toBe(JSON.stringify({ name: 'zcs' }));
});
test('urlencode body', async () => {
  const co = new Controller({
    url: `${domain}/body`,
    header: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
    parsers: [],
  });
  const res = await co.request({ name: 'zcs', gender: 'man' });
  expect(String(res)).toBe(JSON.stringify({ name: 'zcs', gender: 'man' }));
});
test('upload file body', async () => {
  const co = new Controller({
    url: `${domain}/body`,
    header: {
      'content-type': 'multipart/form-data',
    },
    method: 'POST',
    parsers: [],
  });
  const targetFile = path.join(__dirname, '../../../.gitignore');
  const res = await co.request({
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
