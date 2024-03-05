import {
  jobAssignmentResponseFixture,
  jobsAssignmentResponseFixture,
} from './job-assignment.fixtures';

export const jobAssignmentServiceMock = {
  processJobAssignment: jest.fn().mockReturnValue(jobAssignmentResponseFixture),
  processGetAssignedJobs: jest
    .fn()
    .mockReturnValue(jobsAssignmentResponseFixture),
};
