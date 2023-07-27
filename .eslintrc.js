module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: 'airbnb-base',
  overrides: [
    {
      env: {
        node: true,
      },
      files: [
        '.eslintrc.{js,cjs}',
      ],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  ignorePatterns: ['temp.js', 'dist/**.js'],
  rules: {
    'no-plusplus': 'off',
    'import/no-cycle': 'off',
    'import/prefer-default-export': 'off',
    'no-param-reassign': 'off',
    'no-mixed-operators': 'off',
    'no-restricted-globals': 'off',
    'no-case-declarations': 'off',
    'no-continue': 'off',
  },
};
