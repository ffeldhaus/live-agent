const config = require('gts/build/src/index.js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');

module.exports = defineConfig([
  {
    ignores: ['dist/**', 'dist-demo/**', 'node_modules/**', 'coverage/**', 'vite.config.ts', 'vite.demo.config.ts']
  },
  ...config,
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-empty': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      'no-prototype-builtins': 'warn'
    }
  }
]);
