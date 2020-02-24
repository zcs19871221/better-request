const http = require('http');
const fs = require('fs');
const path = require('path');

http
  .createServer((req, res) => {
    if (req.url.endsWith('.html')) {
      const file = fs.readFileSync(path.join(__dirname, './test.html'));
      res.setHeader('content-type', 'text/html');
      return res.end(file);
    }
    let str = '';
    req.on('data', chunk => {
      str += chunk;
    });
    req.on('end', chunk => {
      if (str && req.method.toLowerCase() === 'post') {
        fs.writeFileSync(path.join(__dirname, 'body.txt'), str);
      }
      return res.end(req.method + 'get it');
    });
  })
  .listen(80);
