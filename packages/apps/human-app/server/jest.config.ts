process.env['GIT_HASH'] = 'test_value_hardcoded_in_jest_config';

import { createDefaultPreset } from 'ts-jest';

const jestTsPreset = createDefaultPreset({});

module.exports = {
  ...jestTsPreset,
  coverageDirectory: '../coverage',
  collectCoverageFrom: ['**/*.(t|j)s'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
  },
};
