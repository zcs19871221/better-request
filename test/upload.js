const http = require('http');
const fs = require('fs');
const path = require('path');
let visited = 0;

const server = http
  .createServer((req, res) => {
    if (req.url === '/upload') {
      let str = '';
      req.on('data', chunk => {
        str += chunk;
      });
      req.on('end', () =>
        res.end(fs.writeFileSync(path.join(__dirname, 'body.txt'), str)),
      );
    } else {
      res.setHeader('content-type', 'text/html');
      res.end(fs.readFileSync(path.join(__dirname, './test.html')));
    }
  })
  .listen(9978);
