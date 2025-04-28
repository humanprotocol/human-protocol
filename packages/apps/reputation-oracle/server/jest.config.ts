import { createDefaultPreset } from 'ts-jest';

process.env['GIT_HASH'] = 'test_value_hardcoded_in_jest_config';

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
    '^typeorm$': require.resolve('typeorm'),
  },
};
