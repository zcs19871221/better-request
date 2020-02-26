import Controller from './src/Controller/Node';

const co = new Controller({
  url: 'http://localhost:9978/success',
  method: 'GET',
  onSuccess: (res, header) => {
    console.log(res, header);
  },
  timeout: 500,
});

co.request(null)
  .then(value => {
    console.log(value);
  })
  .catch(error => {
    console.log(error);
  });
co.request(null)
  .then(value => {
    console.log(value);
  })
  .catch(error => {
    console.log(error);
  });
