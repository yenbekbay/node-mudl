// flow-typed signature: 1198ae7c95a9c39e7b219fdd4e0d021c
// flow-typed version: 94e9f7e0a4/he_v1.x.x/flow_>=v0.28.x

declare module 'he' {
  declare type encodeOptions = {
    useNamedReferences?: bool,
    decimal?: bool,
    encodeEverything?: bool,
    strict?: bool,
    allowUnsafeSymbols?: bool,
  };
  declare type decodeOptions = {
    isAttributeValue?: bool,
    strict?: bool,
  };
  declare module.exports: {
    version: string,
    encode: (text: string, options?: encodeOptions) => string & {
      options: encodeOptions,
    },
    decode: (text: string, options?: decodeOptions) => string & {
      options: decodeOptions,
    },
    escape(text: string): string,
    unescape(text: string, options?: encodeOptions): string,
  }
}
