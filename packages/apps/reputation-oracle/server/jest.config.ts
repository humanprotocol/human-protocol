import { createDefaultPreset, pathsToModuleNameMapper } from 'ts-jest';

import { compilerOptions } from './tsconfig.json';

process.env['GIT_HASH'] = 'test_value_hardcoded_in_jest_config';

const jestTsPreset = createDefaultPreset({});

module.exports = {
  ...jestTsPreset,
  moduleFileExtensions: ['js', 'json', 'ts'],
  roots: ['<rootDir>/src'],
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  modulePaths: [compilerOptions.baseUrl],

  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
  clearMocks: true,
};
