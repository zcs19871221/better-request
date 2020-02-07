import { notEmptyStr, isArray, notEmptyObject } from 'better-utils';

const parse = (str: any) => {
  if (notEmptyStr(str)) {
    return str
      .trim()
      .replace(/^\?/u, '')
      .split('&')
      .reduce((acc: { [index: string]: any }, each: any) => {
        const [key, value = ''] = each.split('=');
        const decoded = decodeURIComponent(value);
        if (acc[key] === undefined) {
          acc[key] = decoded;
        } else if (isArray(acc[key])) {
          acc[key].push(decoded);
        } else {
          acc[key] = [acc[key], decoded];
        }
        return acc;
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

export { stringify, parse };
