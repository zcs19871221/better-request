declare interface ControllerOpt {
  readonly presetParser?: boolean;
  readonly parser?: (res: string | object, header: HeaderInterface) => any;
  readonly retry?: number;
  readonly retryInterval?: number;
  readonly searchModifyer?: (
    search: { [key: string]: string },
    retry: number,
    fetcher: FetcherInterface,
  ) => { [key: string]: string };
}
