// eslint.config.js
import js from '@eslint/js';
import ts from 'typescript-eslint';
import next from 'eslint-config-next';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import unicorn from 'eslint-plugin-unicorn';
import security from 'eslint-plugin-security';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  next,
  { plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y, unicorn, security } },
  {
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'jsx-a11y/alt-text': 'warn',
      'unicorn/no-array-callback-reference': 'off',
      'security/detect-object-injection': 'off'
    },
    ignores: ['.next/**', 'dist/**', 'coverage/**']
  }
];