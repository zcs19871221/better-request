declare interface HeaderInterface {
  getAll(): InputHeader;
  get(key: string): string;
  gets(keys: string[]): string[];
  set(key: string, value: string): this;
}
declare type InputHeader = {
  [headerKey: string]: string;
};
