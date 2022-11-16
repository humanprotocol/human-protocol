import type { Config } from 'jest';

const config: Config = {
    verbose: true,
    testEnvironment: 'jsdom',
    preset: 'ts-jest',
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
          '<rootDir>/src/__mocks__/fileMock.js',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
};

export default config;