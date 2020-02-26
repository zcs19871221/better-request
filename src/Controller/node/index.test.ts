import http from 'http';
import Controller from './';

let timers: any[] = [];
let server: any = null;
const port = 5656;
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
    .listen(port);
});
afterAll(() => {
  server.close();
  timers.forEach(timer => {
    clearTimeout(timer);
  });
  timers = [];
});
