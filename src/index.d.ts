declare module 'better-utils' {
  export const wait: (time: number) => Promise<any>;
  export const notEmptyObject: (target: any) => boolean;
  export const isArray: (target: any[]) => boolean;
  export const notEmptyStr: (target: any) => boolean;
  export const isString: (target: any) => boolean;
  export const isTypedArray: (target: any) => boolean;
  export const mockUuid: (target?: number) => string;
}
