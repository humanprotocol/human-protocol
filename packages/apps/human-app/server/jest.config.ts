process.env['GIT_HASH'] = 'test_value_hardcoded_in_jest_config';

module.exports = {
  coverageDirectory: '../coverage',
  collectCoverageFrom: ['**/*.(t|j)s'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
    '^typeorm$': require.resolve('typeorm'),
  },
};
