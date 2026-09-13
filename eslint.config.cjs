const tseslint = require('typescript-eslint');
const vue = require('eslint-plugin-vue');
const globals = require('globals');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = tseslint.config(
  {
    ignores: [
      'eslint.config.cjs',
      '**/*.mjs',
      '**/uitest/**',
      '**/node_modules/**',
      '**/tailwind.config.js',
      '**/dist_electron/**',
      '**/*.spec.ts',
      '**/vite.config.ts',
      '**/postcss.config.js',
      'src/components/**/*.vue',
      '**/electron-builder.ts',
    ],
  },
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
        extraFileExtensions: ['.vue'],
        parser: tseslint.parser,
      },
    },
    rules: {
      'no-console': 'warn',
      'no-debugger': 'warn',
      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'warn',
      'vue/no-mutating-props': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-useless-template-attributes': 'off',
      'vue/one-component-per-file': 'off',
      'vue/no-reserved-component-names': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
      '@typescript-eslint/no-base-to-string': 'warn',
      '@typescript-eslint/no-redundant-type-constituents': 'warn',
      '@typescript-eslint/no-unsafe-unary-minus': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/prefer-promise-reject-errors': 'warn',
      'prettier/prettier': 'warn',
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
  {
    files: [
      'backend/database/core.ts',
      'src/pages/POS/POS.vue',
      'utils/translationHelpers.ts',
    ],
    rules: {
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    },
  },
  {
    files: [
      'src/errorHandling.ts',
      'src/utils/interactive.ts',
      'src/utils/printTemplates.ts',
    ],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  {
    files: ['src/pages/GetStarted.vue'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  prettierRecommended,
);
