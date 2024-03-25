import { responseFixture } from './jobs-discovery.fixtures';

export const jobsDiscoveryServiceMock = {
  processJobsDiscovery: jest.fn().mockReturnValue(responseFixture),
};
