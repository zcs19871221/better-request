import http from 'http';
import Controller from './src/Controller/Node';

let visited = 0;
const server = http
  .createServer((req, res) => {
    let timer;
    if (req.url === '/errorRetry') {
      visited += 1;
      clearTimeout(timer);
      if (visited < 3) {
        timer = setTimeout(() => {
          res.end('success at:' + visited);
        }, 5000);
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
  .listen(9978);
const co = new Controller({
  url: 'http://localhost:9978/success',
  method: 'GET',
  onSuccess: (res, header) => {
    console.log(res, header);
  },
  timeout: 500,
});

co.request(null)
  .then(value => {
    console.log(value);
  })
  .catch(error => {
    console.log(error);
  })
  .finally(() => {
    server.close();
  });
