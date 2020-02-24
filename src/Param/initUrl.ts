import { parse, stringify, merge } from './queryString';

type InputURL = URL | string;
type value = string | number;
type InputSearch = string | { [key: string]: value | value[] };

export { InputSearch, InputURL };
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
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('url只能是http或https');
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
