import { Config } from '@jest/types';

export default async (): Promise<Config.InitialOptions> => {
  return {
    preset: 'ts-jest',
    projects: ['<rootDir>/packages/**/jest.config.ts'],
  };
};
