import initUrl from './initUrl';

it('test initUrl', () => {
  expect(initUrl('http://www.baidu.com')).toEqual(
    new URL('http://www.baidu.com'),
  );
  const url = new URL('http://www.baidu.com');
  const after = initUrl(url);
  url.search = '?a=1234';
  expect(after).toEqual(new URL('http://www.baidu.com'));
  expect(
    initUrl(new URL('http://www.baidu.com'), '/agent', {
      a: ['123', '456'],
      b: '234',
    }),
  ).toEqual(new URL('http://www.baidu.com/agent?a=123&a=456&b=234'));
  expect(
    initUrl('http://www.baidu.com?a=123&a=789', '/agent', {
      a: ['123', '456'],
      b: '234',
    }),
  ).toEqual(new URL('http://www.baidu.com/agent?a=123&a=789&a=456&b=234'));
  expect(
    initUrl(
      new URL('http://www.baidu.com?a=123&a=789'),
      '/agent',
      'a=123&a=456&b=234',
    ),
  ).toEqual(new URL('http://www.baidu.com/agent?a=123&a=789&a=456&b=234'));
});
