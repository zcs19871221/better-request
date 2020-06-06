interface A {}

class A1 implements A {
  private name: string = '1233123';
}

class A2 implements A {
  private gender: string = '1233123';
}
interface Parser {
  (a: A): any;
}
const parser1 = (a: A) => {
  console.log(a);
};
const parser2 = (a: A) => {
  console.log(a);
};
