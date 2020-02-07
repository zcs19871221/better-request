import { parse, stringify } from './queryString';

export default function(
  url: InputURL,
  path: string = '',
  search: InputSearch = '',
): URL {
  if (typeof url === 'string') {
    url = new URL(url);
  } else {
    url = new URL(url.toString());
  }
  path = path.trim();
  if (typeof search === 'string') {
    search = search.trim().replace(/^\?/u, '');
  } else {
    search = stringify(search);
  }
  if (search) {
    url.search = stringify({
      ...parse(url.search.replace(/^\?/u, '')),
      ...parse(search.replace(/^\?/u, '')),
    });
  }
  if (path) {
    url.pathname = path;
  }
  return url;
}
