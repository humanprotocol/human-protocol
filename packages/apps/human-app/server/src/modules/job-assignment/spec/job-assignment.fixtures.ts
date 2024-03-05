import {
  JobAssignmentCommand,
  JobAssignmentData,
  JobAssignmentDto,
  JobAssignmentResponse,
  JobsFetchParamsCommand,
  JobsFetchParamsData,
  JobsFetchParamsDto,
  JobsFetchResponse,
  JobsFetchResponseItem,
} from '../interfaces/job-assignment.interface';
import {
  SortField,
  SortOrder,
  StatusEnum,
} from '../../../common/enums/job-assignment';

export const jobAssignmentDtoFixture: JobAssignmentDto = {
  exchange_oracle_url: 'https://www.example.com/api',
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
  status: 'test_status',
  reward_amount: 'test_amount',
  reward_token: 'test_token',
  created_at: 'test_date',
  updated_at: 'test_date',
  expires_at: 'test_date',
};

export const jobsFetchParamsDtoFixture: JobsFetchParamsDto = {
  exchange_oracle_url: 'https://www.example.com/api',
  assignment_id: 'test_id',
  escrow_address: 'test_address',
  chain_id: 1,
  job_type: 'test_type',
  status: StatusEnum.ACTIVE,
  page_size: 5,
  page: 0,
  sort: SortOrder.ASC,
  sort_field: SortField.CREATED_AT,
};

export const jobsFetchParamsCommandFixture: JobsFetchParamsCommand =
  jobsFetchParamsDtoFixture;

export const jobsFetchParamsDataFixture: JobsFetchParamsData =
  jobsFetchParamsCommandFixture;

export const jobsFetchResponseItemFixture: JobsFetchResponseItem = {
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

export const jobsFetchResponseFixture: JobsFetchResponse = {
  data: [jobsFetchResponseItemFixture],
};
