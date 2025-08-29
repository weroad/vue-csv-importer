import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default tseslint.config(
  // Ignore patterns
  {
    ignores: ['dist/**/*', 'node_modules/**/*'],
  },

  // Base JavaScript configuration
  js.configs.recommended,

  // TypeScript configuration
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,

  // Vue configuration
  ...pluginVue.configs['flat/essential'],
  ...pluginVue.configs['flat/recommended'],
  ...pluginVue.configs['flat/strongly-recommended'],

  // Global language options
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
  },

  // TypeScript files configuration with project reference
  {
    files: ['src/**/*.ts', 'src/**/*.mts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },

  // Root TypeScript files without strict project reference
  {
    files: ['*.ts', '*.mts'],
    ignores: ['src/**/*'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        sourceType: 'module',
      },
    },
  },

  // Vue files configuration with TypeScript support
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: pluginVue.parser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
  },

  // Custom rules for all files
  {
    rules: {
      // General rules
      'no-console': process.env.NODE_ENV !== 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV !== 'production' ? 'warn' : 'off',
      indent: ['error', 2],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      curly: ['error', 'all'],
      'brace-style': ['error', '1tbs', { allowSingleLine: false }],
      'comma-dangle': 'off',
      'eol-last': ['error', 'always'],
      'padding-line-between-statements': [
        'error',
        // blank line before if when preceded by another statement (not at block start)
        { blankLine: 'always', prev: '*', next: 'if' },
        // blank line after if when followed by another statement (not at block end)
        { blankLine: 'always', prev: 'if', next: '*' },
        // but allow no blank line when at start/end of a block
        { blankLine: 'any', prev: 'block-like', next: 'if' },
        { blankLine: 'any', prev: 'if', next: 'block-like' },
      ],

      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-definitions': 'off',

      // Vue specific rules
      'vue/no-v-html': 'off',
      'vue/max-attributes-per-line': [
        'error',
        {
          singleline: 99,
          multiline: 1,
        },
      ],
      'vue/object-curly-spacing': ['error', 'always'],
      'vue/component-definition-name-casing': ['error', 'kebab-case'],
      'vue/attributes-order': [
        'error',
        {
          order: [
            'DEFINITION',
            'LIST_RENDERING',
            'CONDITIONALS',
            'RENDER_MODIFIERS',
            'GLOBAL',
            'UNIQUE',
            'TWO_WAY_BINDING',
            'OTHER_DIRECTIVES',
            'OTHER_ATTR',
            'EVENTS',
            'CONTENT',
          ],
        },
      ],
      'vue/html-indent': ['error', 2],
      'vue/html-closing-bracket-spacing': 'error',
      'vue/html-quotes': ['error', 'double'],
      'vue/html-self-closing': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
      'vue/require-default-prop': 'error',
      'vue/require-prop-types': 'error',
      'vue/no-unused-components': 'error',
      'vue/no-unused-vars': 'error',
      'vue/valid-template-root': 'error',
      'vue/no-parsing-error': 'error',
    },
  },
);
