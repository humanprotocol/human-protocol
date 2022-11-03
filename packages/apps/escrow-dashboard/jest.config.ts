import type { Config } from '@jest/types';

export default async (): Promise<Config.InitialOptions> => {
  return {
    verbose: true,
    moduleDirectories: ['node_modules', '<rootDir>'],
    moduleNameMapper: {
      '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
        '<rootDir>/src/__mocks__/fileMock.js',
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    transformIgnorePatterns: [
      '/node_modules/(?!d3|d3-array|internmap|delaunator|robust-predicates)',
    ],
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  };
};
