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

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const MockIcon = ({ name }) => React.createElement(Text, null, name ?? 'icon');

  return {
    Feather: MockIcon,
  };
});

jest.mock('@expo/vector-icons/MaterialIcons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return ({ name }) => React.createElement(Text, null, name ?? 'icon');
});

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
