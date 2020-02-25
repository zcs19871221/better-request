import http, { Server } from 'http';
import Fetcher from './';
import Param from '../../Param/node';

it('test Agent with max 1 connection', async () => {
  let server: Server | null = null;
  try {
    let sockets = new Set();
    server = http
      .createServer((_req, res) => {
        res.end(String(sockets.size));
      })
      .listen(8868);
    server.on('connection', socket => {
      sockets.add(socket);
    });

    const param = new Param({
      url: 'http://localhost:8868/sameAgent',
      method: 'GET',
      agent: {
        keepAliveMsecs: 200,
        keepAlive: true,
        maxFreeSockets: 1,
        maxSockets: 1,
      },
    });
    const fetchers = [];
    for (let i = 0; i < 2; i++) {
      const fetcher = new Fetcher(param);
      fetchers.push(fetcher.send());
    }
    const value = await Promise.all(fetchers);
    server.close();
    expect(value.map(each => String(each))).toEqual(['1', '1']);
  } catch (error) {
    console.error(error);
  } finally {
    if (server) {
      server.close();
    }
  }
});

it('test interface', async () => {
  let server: Server | null = null;
  try {
    server = http
      .createServer((req, res) => {
        if (req.url === '/success') {
          console.log('getted');
          res.setHeader('Content-Type', 'text/html');
          res.setHeader('Accept', '*');
          res.end('success');
        }
      })
      .listen(5678);
    const fetcher = new Fetcher(
      new Param({
        url: 'http://localhost:5678/success',
        method: 'GET',
      }),
    );
    const value = await fetcher.send();
    server.close();
    expect(String(value)).toBe('success');
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
  } catch (error) {
    console.error(error);
  } finally {
    if (server) {
      server.close();
    }
  }
});
