import { stringify, parse } from './queryString';

it('stringify', () => {
  expect(
    stringify({
      a: 1234,
      b: 2345,
      c: ['a', 'b', 'c'],
      d: '123',
    }),
  ).toBe('a=1234&b=2345&c=a&c=b&c=c&d=123');
  expect(stringify({})).toBe('');
});

it('parse', () => {
  expect(parse('   ?a=1234&b=2345&a=456  ')).toEqual({
    a: ['1234', '456'],
    b: '2345',
  });
  expect(parse('')).toEqual({});
});
