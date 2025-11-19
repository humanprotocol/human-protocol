import eslint from '@eslint/js';
import globals from 'globals';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
// @ts-expect-error - package does not provide type definitions
import jestPlugin from 'eslint-plugin-jest';
import tseslint from 'typescript-eslint';
import { flatConfigs as graphqlFlatConfigs } from '@graphql-eslint/eslint-plugin';
const graphqlOperations = graphqlFlatConfigs['operations-recommended'];

export default tseslint.config(
  {
    ignores: ['build', 'generated', 'schema.graphql'],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      jest: jestPlugin,
    },
    rules: {
      'no-console': 'warn',
      '@/quotes': [
        'error',
        'single',
        { avoidEscape: true, allowTemplateLiterals: true },
      ],
    },
  },
  {
    files: ['**/*.graphql'],
    languageOptions: {
      ...(graphqlOperations.languageOptions ?? {}),
      parserOptions: {
        ...(graphqlOperations.languageOptions?.parserOptions ?? {}),
        schema: './schema.graphql',
      },
    },
    rules: graphqlOperations.rules,
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    plugins: {
      jest: jestPlugin,
    },
  }
);
