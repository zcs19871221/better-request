import http from 'http';
import Request from '../src/Controller/node';
http
  .createServer((req, res) => {
    console.log(req.url);
    res.end('');
  })
  .listen(8888);
Request.fetch({
  url: `http://localhost:8888/abcdef?q=${encodeURI('#1234')}&f=2345`,
  method: 'GET',
});
Request.fetch({
  url: `http://localhost:8888/abcdef?q=${encodeURI('#1234')}&f=2345`,
  option: {
    path: `/abcdef?q=${encodeURI('#1234')}&f=2345`,
  },
  method: 'GET',
});
