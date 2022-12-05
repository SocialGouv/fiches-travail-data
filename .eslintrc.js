module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'jest'],
  root: true,
  "env": {
    "jest/globals": true,
    "node": true
  },
  rules: {
    "@typescript-eslint/no-var-requires": "warn",
  }
};
