// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['e2e/**/*.js'], // Target e2e test files
    env: {
      jest: true, // Enable Jest globals
    },
  },
]);
