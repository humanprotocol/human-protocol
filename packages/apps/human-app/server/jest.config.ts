module.exports = {
  preset: 'ts-jest/presets/default-esm', // Use this preset for ESM support
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', // Add this line if you're importing ESM modules using .js extensions in your TypeScript files
    '^uuid$': require.resolve('uuid'),
    '^typeorm$': require.resolve('typeorm'),
  },
  // Specify file extensions for modules using ESM
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    // Use ts-jest for ts / tsx files
    '^.+\\.tsx?$': 'ts-jest',
  },
  coverageDirectory: '../coverage',
  collectCoverageFrom: ['**/*.(t|j)s'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transformIgnorePatterns: [
    'node_modules/(?!@nestjs/config/node_modules/uuid)'
  ],
};
