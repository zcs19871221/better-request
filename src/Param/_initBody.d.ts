declare interface InitBody<T> {
  (body: T | object, method?: InputMethod, contentType?: string): T;
}

declare type NodeBody = string | Buffer | null;

declare type BrowserBody =
  | BufferSource
  | Blob
  | FormData
  | URLSearchParams
  | ReadableStream
  | string
  | Document
  | null;

declare type InputMethod =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'CONNECT'
  | 'OPTIONS'
  | 'TRACE'
  | 'PATCH';
