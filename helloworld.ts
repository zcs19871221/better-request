import http from 'http';
import Fetcher from './src/Fetcher/Node';
import Param from './src/Param/Node';

const main = async () => {
  const server = http
    .createServer((_req, res) => {
      console.log('ffffffffffff');
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Accept', '*');
      res.end('ok');
    })
    .listen(3000, async () => {
      try {
        const fetcher = new Fetcher(
          new Param({
            url: 'http://localhost:3000/success',
            method: 'GET',
          }),
        );
        const value = await fetcher.send();
        console.log(String(value));
      } catch (error) {
        console.error(error);
      } finally {
        server.close();
      }
    });
};
main();
