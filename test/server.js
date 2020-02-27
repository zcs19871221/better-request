const http = require('http');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
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
    if (req.url && req.url.startsWith('/presets')) {
      let id = req.url.match(/id=(\d+)/);
      if (!id) {
        id = 0;
      } else {
        id = Number(id[1]);
      }
      console.log(id);
      if (id < 5) {
        res.statusCode = 302;
        res.setHeader('location', `http://localhost:9978/presets?id=${id + 1}`);
        res.end('redirect');
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
  })
  .listen(9978);
