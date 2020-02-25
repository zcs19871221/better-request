import http from 'http';
import Fetcher from './';
import Param from '../../Param/node';

let timers: any[] = [];
let server: any = null;
beforeAll(() => {
  server = http
    .createServer((req, res) => {
      if (req.url === '/success') {
        let resBody = '';
        req.on('data', chunk => {
          resBody += chunk;
        });
        req.on('end', () => {
          res.end('success;method:' + req.method + ';body:' + resBody);
        });
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Accept', '*');
        return;
      }
      if (req.url === '/abort') {
        timers.push(
          setTimeout(() => {
            res.end('abort');
          }, 10 * 1000),
        );
      }
      if (req.url === '/timeout') {
        timers.push(
          setTimeout(() => {
            res.end('timeout');
          }, 10 * 1000),
        );
        return;
      }
    })
    .listen(5678);
});
afterAll(() => {
  server.close();
  timers.forEach(timer => {
    clearTimeout(timer);
  });
  timers = [];
});

it('same param same agent', async () => {
  const param = new Param({
    url: 'http://localhost:5678/sameAgent',
    method: 'GET',
    agent: {
      keepAliveMsecs: 200,
      keepAlive: false,
      maxFreeSockets: 1,
      maxSockets: 2,
    },
  });
  const set = new Set();
  for (let i = 0; i < 2; i++) {
    const fetcher = new Fetcher(param);
    set.add(fetcher.param.getAgent());
  }
  expect(set.size).toEqual(1);
});

it('success fetch', async () => {
  const fetcher = new Fetcher(
    new Param({
      url: 'http://localhost:5678/success',
      method: 'POST',
    }),
  );
  const value = await fetcher.send('request body');
  expect(String(value)).toBe('success;method:POST;body:request body');
  expect(fetcher.statusCode).toBe(200);
  expect(fetcher.is2xx()).toBe(true);
  expect(fetcher.isSuccess()).toBe(true);
  expect(fetcher.getResHeader()['content-type']).toBe('text/html');
  expect(fetcher.getResHeader().accept).toBe('*');
  expect(fetcher.getResHeader('Content-type')).toBe('text/html');
  expect(fetcher.getResHeader(['Content-type', 'accept'])).toEqual([
    'text/html',
    '*',
  ]);
});

it('fail fetch', async () => {
  const failFetcher = new Fetcher(
    new Param({
      url: 'http://localhost:9999/fail',
      method: 'GET',
    }),
  );
  try {
    await failFetcher.send();
  } catch {}
  expect(failFetcher.isError()).toBe(true);
});

it('timeout fetch', async () => {
  const timeoutFetcher = new Fetcher(
    new Param({
      url: 'http://localhost:5678/timeout',
      method: 'GET',
      timeout: 500,
    }),
  );
  try {
    await timeoutFetcher.send();
  } catch (error) {
    expect(error instanceof Error).toBe(true);
  }
  expect(timeoutFetcher.isTimeout()).toBe(true);
});
it('abort fetch', async () => {
  const abortFetcher = new Fetcher(
    new Param({
      url: 'http://localhost:9999/abort',
      method: 'GET',
    }),
  );
  setTimeout(() => {
    abortFetcher.abort();
  }, 500);
  const res = await abortFetcher.send();
  expect(res).toBe(null);
  expect(abortFetcher.isAborted()).toBe(true);
});
