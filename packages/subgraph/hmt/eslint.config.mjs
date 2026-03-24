import eslint from '@eslint/js';
import { configs as graphqlConfigs } from '@graphql-eslint/eslint-plugin';
import globals from 'globals';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

const graphqlOperations = graphqlConfigs['flat/operations-recommended'];

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
    rules: {
      'no-useless-assignment': 'off',
      'preserve-caught-error': 'off',
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
  }
);
