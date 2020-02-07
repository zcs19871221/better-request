import initUrl from './initUrl';

it('test initUrl', () => {
  expect(initUrl('http://www.baidu.com')).toEqual(
    new URL('http://www.baidu.com'),
  );
  const url = new URL('http://www.baidu.com');
  const after = initUrl(url, '/agent', {
    a: ['123', '456'],
    b: '234',
  });
  url.search = '?a=1234';
  expect(after).toEqual(new URL('http://www.baidu.com'));
});
