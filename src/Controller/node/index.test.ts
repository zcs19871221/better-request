import http from 'http';
import Controller from './';

let timers: any[] = [];
let server: any = null;
const port = 5656;
const domain = `http://localhost:${port}`;
beforeAll(() => {
  let visited = 0;
  let timer;
  server = http
    .createServer((req, res) => {
      if (req.url === '/errorRetry') {
        visited += 1;
        clearTimeout(timer);
        if (visited < 3) {
          timer = setTimeout(() => {
            res.end('success at:' + visited);
          }, 5000);
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
        res.end('error');
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

test('send 3:1,2 fail and 3 success', async () => {
  const co = new Controller({
    url: `${domain}/errorRetry`,
    method: 'GET',
    retry: 2,
    retryInterval: 0,
  });
  const res = await co.request(null);
  expect(res).toBe('success at:3');
});

test('success hooks', async () => {
  let mesg = '';
  const co = new Controller({
    url: `${domain}/success`,
    method: 'GET',
    onSuccess: (res, header) => {
      mesg += res;
      mesg += '-' + header['x-tmp'];
    },
  });
  await co.request(null);
  expect(mesg).toBe('success-tmp');
});
test('error hooks', async () => {
  let mesg = '';
  const co = new Controller({
    url: `${domain}/success`,
    method: 'GET',
    onSuccess: (res, header) => {
      mesg += res;
      mesg += '-' + header['x-tmp'];
    },
  });
  await co.request(null);
  expect(mesg).toBe('success-tmp');
});
