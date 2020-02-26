const http = require('http');
const fs = require('fs');
const path = require('path');
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
