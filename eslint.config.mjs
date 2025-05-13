// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': 'error',
      'no-console': ['warn', { allow: ['warn', 'error', 'clear'] }],
      'no-debugger': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-empty': 'error',
      'no-extra-semi': 'error',
      'no-func-assign': 'error',
      'no-obj-calls': 'error',
      'no-sparse-arrays': 'error',
      'no-unreachable': 'error',
      'no-unused-vars': ['error', { args: 'none' }],
      'valid-typeof': 'warn',
      curly: 'error',
      eqeqeq: 'warn',
      'no-else-return': 'warn',
      'no-eval': 'error',
      'semi-spacing': 'error',
      'keyword-spacing': 'error',
      'space-infix-ops': 'error',
      'prefer-const': 'error',
      'no-restricted-imports': [
          'error',
          {
              patterns: ['.*'],
          },
      ],
      'object-curly-spacing': ['error', 'always'],
      'padding-line-between-statements': [
          'error',
          {
              blankLine: 'always',
              prev: '*',
              next: 'return',
          },
          {
              blankLine: 'always',
              prev: ['const', 'let', 'var'],
              next: '*',
          },
          {
              blankLine: 'any',
              prev: ['const', 'let', 'var'],
              next: ['const', 'let', 'var'],
          },
          {
              blankLine: 'always',
              prev: 'directive',
              next: '*',
          },
          {
              blankLine: 'any',
              prev: 'directive',
              next: 'directive',
          },
      ],
    },
  },
);