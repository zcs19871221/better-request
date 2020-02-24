import Request from '../src/Controller/node';
type typeA = string | Buffer;
type typeB = string[];

function istypeA(input: typeA | typeB): input is typeA {
  return typeof input === 'string' || Buffer.isBuffer(input);
}

const main = (input: typeA | typeB): string => {
  if (istypeA(input)) {
    return 'sdfds';
  }
  return input.map(each => each).join('ss');
};
