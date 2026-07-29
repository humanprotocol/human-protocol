import { responseFixture } from './jobs-discovery.fixtures';

export const jobsDiscoveryServiceMock = {
  getJobs: jest.fn().mockReturnValue(responseFixture),
};
