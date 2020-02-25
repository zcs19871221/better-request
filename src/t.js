const http = require('http');

http
  .createServer((req, res) => {
    res.end('fsfds');
  })
  .listen(5555);
