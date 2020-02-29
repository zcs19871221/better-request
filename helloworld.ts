import Controller from './src/Controller/Node';
const co = new Controller({
  url: `http://localhost:9978/presets`,
  method: 'GET',
  parsers: ['iconv', 'json'],
  parser: (response, header) => {
    return `body:${response.name} header:${header['content-type']}`;
  },
});
co.request(null).then(value => {
  console.log(value);
});

interface A {
  readonly get: () => string;
}
class X implements A {
  get() {
    return 'zcs';
  }
}
class B extends X {
  get() {}
}
