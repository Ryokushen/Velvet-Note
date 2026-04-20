// Runs via setupFiles (before the test framework is installed and before
// jest-expo's preset setup). Pre-defines the globals that expo's winter runtime
// would otherwise install as lazy getters. The lazy getters trigger
// `require(...)` during Jest teardown, which throws
// "You are trying to `import` a file outside of the scope of the test code."
// Defining non-configurable descriptors short-circuits expo's installGlobal.
const winterGlobals = {
  TextDecoder: globalThis.TextDecoder,
  TextDecoderStream: globalThis.TextDecoderStream,
  TextEncoderStream: globalThis.TextEncoderStream,
  URL: globalThis.URL,
  URLSearchParams: globalThis.URLSearchParams,
  __ExpoImportMetaRegistry: { url: '' },
  structuredClone: globalThis.structuredClone,
};

for (const [name, value] of Object.entries(winterGlobals)) {
  if (value === undefined) continue;
  Object.defineProperty(globalThis, name, {
    value,
    writable: true,
    configurable: false,
    enumerable: true,
  });
}
