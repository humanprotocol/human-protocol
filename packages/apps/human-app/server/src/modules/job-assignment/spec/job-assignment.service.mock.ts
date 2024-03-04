import {
  jobAssignmentResponseFixture,
  jobsAssignmentResponseFixture,
} from './job-assignment.fixtures';

export const jobAssignmentServiceMock = {
  processJobAssignment: jest.fn().mockReturnValue(jobAssignmentResponseFixture),
  processGettingAssignedJobs: jest
    .fn()
    .mockReturnValue(jobsAssignmentResponseFixture),
};
