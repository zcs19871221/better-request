import { notEmptyStr, isArray, notEmptyObject } from 'better-utils';

const merge = (object: { [prop: string]: any }, key: any, value: any) => {
  if (object[key] === undefined) {
    object[key] = value;
  } else if (isArray(object[key])) {
    object[key] = [...new Set(object[key].concat(value))];
  } else if (object[key] !== value) {
    object[key] = [object[key], value];
  }
  return object;
};
const parse = (str: any): object => {
  if (notEmptyStr(str)) {
    return str
      .trim()
      .replace(/^\?/u, '')
      .split('&')
      .reduce((acc: { [index: string]: any }, each: any) => {
        const [key, value = ''] = each.split('=');
        const decoded = decodeURIComponent(value);
        return merge(acc, key, decoded);
      }, {});
  }
  return {};
};

const stringify = (obj: object) => {
  if (notEmptyObject(obj)) {
    return Object.entries(obj)
      .reduce((acc, [key, value]) => {
        if (value !== undefined) {
          if (!isArray(value)) {
            value = [value];
          }
          return acc.concat(
            value.map((each: any) => {
              return `${key}=${encodeURIComponent(each)}`;
            }),
          );
        }
        return acc;
      }, [])
      .join('&');
  }
  return '';
};

export { stringify, parse, merge };
