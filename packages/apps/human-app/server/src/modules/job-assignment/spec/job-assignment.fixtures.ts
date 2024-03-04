import {
  JobAssignmentCommand,
  JobAssignmentData,
  JobAssignmentDto,
  JobAssignmentResponse,
  JobsAssignmentParamsCommand,
  JobsAssignmentParamsData,
  JobsAssignmentParamsDto,
  JobsAssignmentResponse,
  JobsAssignmentResponseItem,
  StatusEnum,
} from '../interfaces/job-assignment.interface';

export const jobAssignmentDtoFixture: JobAssignmentDto = {
  escrow_address: 'test_address',
  chain_id: 1,
};

export const jobAssignmentCommandFixture: JobAssignmentCommand =
  jobAssignmentDtoFixture;

export const jobAssignmentDataFixture: JobAssignmentData =
  jobAssignmentCommandFixture;

export const jobAssignmentResponseFixture: JobAssignmentResponse = {
  assignment_id: 'test_id',
  escrow_address: 'test_address',
  chain_id: 1,
  job_type: 'test_type',
  url: 'test_url',
  status: StatusEnum.ACTIVE,
  reward_amount: 'test_amount',
  reward_token: 'test_token',
  created_at: 'test_date',
  updated_at: 'test_date',
  expires_at: 'test_date',
};

export const jobsAssignmentParamsDtoFixture: JobsAssignmentParamsDto = {
  assignment_id: 'test_id',
  escrow_address: 'test_address',
  chain_id: 1,
  job_type: 'test_type',
  status: StatusEnum.ACTIVE,
  page_size: 5,
  page: 0,
  sort: 'ASC',
  sort_field: 'chain_id',
};

export const jobsAssignmentParamsCommandFixture: JobsAssignmentParamsCommand =
  jobsAssignmentParamsDtoFixture;

export const jobsAssignmentParamsDataFixture: JobsAssignmentParamsData =
  jobsAssignmentParamsCommandFixture;

export const jobsAssignmentResponseItemFixture: JobsAssignmentResponseItem = {
  assignment_id: 'test_id',
  escrow_address: 'test_address',
  chain_id: 1,
  job_type: 'test_type',
  url: 'test_url',
  status: 'test_status',
  reward_amount: 'test_amount',
  reward_token: 'test_token',
  created_at: 'test_date',
  updated_at: 'test_date',
  expires_at: 'test_date',
};

export const jobsAssignmentResponseFixture: JobsAssignmentResponse = {
  data: [jobsAssignmentResponseItemFixture],
};
