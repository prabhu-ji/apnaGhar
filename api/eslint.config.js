import globals from 'globals';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    languageOptions: {
      globals: {
        ...globals.node, // Add Node.js globals like `process`
      },
    },
  },
  js.configs.recommended,
  prettier,
];
