declare type ParamOpt = {
  url: InputURL;
  path?: string;
  search?: InputSearch;
  method: InputMethod;
  header?: InputHeader;
  timeout?: number;
};

declare interface ParamInterface {
  getUrl(): URL;
  getMethod(): InputMethod;
  getHeader(): InputHeader;
  getTimeout(): number;
  setSearch(search: { [key: string]: string }): this;
  getSearch(): { [key: string]: string };
}
