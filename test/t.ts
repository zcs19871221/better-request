import path from 'path';
import fs from 'fs';
import Request from '../src/Controller/node';

const re = new Request({
  url: 'https://www.baidu.com',
  method: 'GET',
});
re.pipe(null, fs.createWriteStream(path.join(__dirname, 'baidu.html'))).catch(
  error => {
    console.error(error);
  },
);
