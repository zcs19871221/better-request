import Header from './Header';

test('test Header', () => {
  const header = new Header({
    ' conTent-type ': ' application/json ',
    Accept: '*/html',
    cookie: 'afsdfdsf',
  });
  expect(header.getAll()).toEqual({
    'content-type': ' application/json ',
    accept: '*/html',
    cookie: 'afsdfdsf',
  });
  expect(header.get(' accepT ')).toEqual('*/html');
  expect(header.gets([' accepT ', 'Cookie '])).toEqual(['*/html', 'afsdfdsf']);
});
