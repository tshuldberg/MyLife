module.exports = {
  extends: ['eslint:recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  rules: {
    'no-undef': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  ignorePatterns: ['dist/', '.next/', 'node_modules/'],
  overrides: [
    {
      files: [
        '**/__tests__/**/*.{ts,tsx}',
        '**/*.test.{ts,tsx}',
      ],
      globals: {
        afterEach: 'readonly',
        beforeEach: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        vi: 'readonly',
      },
    },
  ],
};
