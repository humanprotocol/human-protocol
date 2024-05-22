import {
  jobAssignmentResponseFixture,
  jobsFetchResponseFixture,
} from './job-assignment.fixtures';

export const jobAssignmentServiceMock = {
  processJobAssignment: jest.fn().mockReturnValue(jobAssignmentResponseFixture),
  processGetAssignedJobs: jest.fn().mockReturnValue(jobsFetchResponseFixture),
};
