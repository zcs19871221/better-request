import Request from '../src/Controller/node';
const request = new Request({
  url: 'http://mp.163.com/wemedia/customer/articleList.do?_=1580872063420',
  method: 'POST',
  header: {
    'content-type': 'application/x-www-form-urlencoded',
  },
  body: {
    pageNo: 1,
    pageSize: 20,
    topicId: '00019AD9',
  },
});

request.request().then(value => {
  console.log(value);
});
