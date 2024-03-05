import {
  JobsDiscoveryParamsCommand,
  JobsDiscoveryParamsDto,
  JobsDiscoveryResponseItem,
} from '../interfaces/jobs-discovery.interface';
import {
  JobFields,
  SortField,
  SortOrder,
} from '../../../common/enums/jobs-discovery';

export const dtoFixture: JobsDiscoveryParamsDto = {
  exchange_oracle_url: 'test_url',
  escrow_address: 'test_address',
  chain_id: 1,
  page_size: 10,
  page: 1,
  sort: SortOrder.ASC,
  sort_field: SortField.CREATED_AT,
  job_type: 'type',
  fields: [JobFields.JOB_TITLE, JobFields.REWARD_AMOUNT],
};

export const commandFixture: JobsDiscoveryParamsCommand = dtoFixture;

export const responseItemFixture: JobsDiscoveryResponseItem = {
  escrow_address: 'test_address',
  chain_id: 1,
  job_type: 'type',
  job_title: 'Test Job',
  job_description: 'Description of the test job',
  reward_amount: '100',
  reward_token: 'ETH',
  created_at: '2024-03-01T12:00:00Z',
};

export const responseFixture: JobsDiscoveryResponseItem[] = [
  responseItemFixture,
];
