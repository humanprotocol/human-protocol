import { createDefaultPreset } from 'ts-jest';

const jestTsPreset = createDefaultPreset({});

module.exports = {
  ...jestTsPreset,
  coverageDirectory: '../coverage',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testEnvironment: 'node',
  testRegex: '.spec.ts$',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^axios$': require.resolve('axios'),
    '^uuid$': require.resolve('uuid'),
  },
};
