import { parse, stringify, merge } from './queryString';

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
  if (search) {
    let inputSearch = {};
    if (typeof search === 'string') {
      inputSearch = parse(search);
    } else {
      inputSearch = search;
    }
    url.search = stringify(
      Object.entries(inputSearch).reduce((acc, [key, value]) => {
        return merge(acc, key, value);
      }, parse(url.search)),
    );
  }
  if (path) {
    url.pathname = path;
  }
  return url;
}
