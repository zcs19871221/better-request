import R from '../src/Controller/node';
import fs from 'fs';

R.fetchThenPipe(
  {
    url: 'http://www.baidu.com',
    method: 'GET',
  },
  null,
  fs.createWriteStream('E:\\better-request\\test\\pipe'),
);

const instance = new R({
  url: 'http://www.baidu.com',
  method: 'GET',
});
instance.fetchThenPipe(
  null,
  fs.createWriteStream('E:\\better-request\\test\\pipe2'),
);
const instance2 = new R({
  url:
    'https://active.163.com/service/form/v1/13320/submit?_charset=UTF-8&_decode=UTF-8&fresh=true',
  method: 'POST',
  header: {
    'content-type': 'application/x-www-form-urlencoded',
    referer: 'https://dada.163.com/',
  },
});
instance2
  .fetch({
    mediaId: 'okKSXvnfK6aaFVrljT0Rm-MvWtnXXowuBcuWrwREergTaxWzUAuLvWczai8KGZ4c',
    mid: 'sdffsdfds',
  })
  .then(value => {
    console.log(value);
  });
