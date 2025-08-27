// eslint.config.js
import js from '@eslint/js';
import ts from 'typescript-eslint';
import next from 'eslint-config-next';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import unicorn from 'eslint-plugin-unicorn';
import security from 'eslint-plugin-security';
import tailwind from 'eslint-plugin-tailwindcss';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...ts.configs.stylistic, // Enforce consistent TypeScript style
  next,
  {
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      unicorn,
      security,
      tailwindcss: tailwind, // Tailwind-specific linting
    },
    rules: {
      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Accessibility (WCAG 2.1 AA)
      'jsx-a11y/alt-text': ['error', { elements: ['img', 'object', 'area'] }],
      'jsx-a11y/label-has-associated-control': ['error', { assert: 'either' }],
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/aria-props': 'error',
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'warn', // Enforce return types for clarity
      '@typescript-eslint/consistent-type-imports': 'error', // Enforce type-only imports
      // Security
      'security/detect-object-injection': 'off', // Disabled due to false positives
      'security/detect-non-literal-fs-filename': 'error', // Prevent unsafe file operations
      // Unicorn (code quality)
      'unicorn/no-array-callback-reference': 'off', // Disabled for compatibility with functional components
      'unicorn/prevent-abbreviations': ['warn', { allowList: { props: true, ref: true } }], // Allow common React terms
      // Tailwind
      'tailwindcss/classnames-order': 'warn', // Enforce consistent Tailwind class order
      'tailwindcss/no-custom-classname': 'off', // Allow custom classes for tenant theming
      // Next.js
      'next/no-img-element': 'error', // Enforce next/image for optimization
      // Performance
      'react/no-unescaped-entities': 'error', // Prevent XSS in JSX
    },
    ignores: ['.next/**', 'dist/**', 'coverage/**', 'node_modules/**'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json', // Enable project-based TypeScript rules
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];