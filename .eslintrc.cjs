module.exports = {
  root: true,
  env: { browser: true, node: true, es2022: true },
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-var-requires': 'off'
  },
  ignorePatterns: ['node_modules/', '.next/', 'playwright-report/', 'test-results/'],
  settings: {
    next: { rootDir: ['web'] }
  },
  overrides: [
    {
      files: ['**/*.js','**/*.jsx','**/*.ts','**/*.tsx'],
      rules: {
        '@next/next/no-html-link-for-pages': 'off'
      }
    }
  ]
};
