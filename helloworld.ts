import http from 'http';
import Fetcher from './src/Fetcher/Node';
import Param from './src/Param/Node';

const main = async () => {
  http
    .createServer((_req, res) => {
      setTimeout(() => {
        console.log('response');
        res.end('sssss');
      }, 2 * 1000);
    })
    .listen(3000, async () => {
      const fetcher = new Fetcher(
        new Param({
          url: 'http://localhost:3000/success',
          method: 'GET',
        }),
      );
      setTimeout(() => {
        console.log('abort');
        fetcher.abort();
      }, 1000);
      try {
        const value = await fetcher.send();
        // console.log(String(value));
      } catch (error) {
        console.error(error);
      } finally {
        console.log(fetcher.isAborted());
      }
    });
};
main();
