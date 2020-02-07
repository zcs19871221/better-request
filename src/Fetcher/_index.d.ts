declare interface FetcherInterface {
  statusCode: number;
  resHeader: HeaderInterface;
  param: ParamInterface;
  abort(): this;
  isAborted(): boolean;
  isTimeout(): boolean;
  isError(): boolean;
  isSuccess(): boolean;
  is2xx(): boolean;
  is3xx(): boolean;
  is4xx(): boolean;
  is5xx(): boolean;
  send(body?: any): any;
}
