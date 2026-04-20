// Pre-define __ExpoImportMetaRegistry as a concrete value before any lazy getter
// is installed by expo's winter runtime. Fixes jest-expo 55 + Jest 30 issue where
// accessing the lazy getter outside test code throws:
// "You are trying to `import` a file outside of the scope of the test code."
if (typeof globalThis.__ExpoImportMetaRegistry === 'undefined') {
  Object.defineProperty(globalThis, '__ExpoImportMetaRegistry', {
    value: { url: '' },
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

require('@testing-library/jest-native/extend-expect');
