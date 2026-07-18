// jest.config.js
const jestExpoPreset = require('jest-expo/jest-preset');

module.exports = {
  preset: 'jest-expo',
  setupFiles: [require.resolve('./jest.setup-early.js'), ...(jestExpoPreset.setupFiles || [])],
  setupFilesAfterEnv: [require.resolve('./jest.setup.js')],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))',
  ],
  // Git worktrees live under .claude/worktrees inside this checkout; without
  // this, jest discovers their duplicate suites and reports phantom failures.
  testPathIgnorePatterns: ['/node_modules/', '/.claude/', '\\\\.claude\\\\'],
};
