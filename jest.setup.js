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

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

globalThis.__mockNavigation = {
  addListener: jest.fn(() => jest.fn()),
  dispatch: jest.fn(),
};

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => globalThis.__mockNavigation,
  };
});
