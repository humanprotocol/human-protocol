import {
  JobsDiscoveryParamsCommand,
  JobsDiscoveryParamsDto,
  JobsDiscoveryResponseItem,
} from '../interfaces/jobs-discovery.interface';

export const dtoFixture: JobsDiscoveryParamsDto = {
  escrow_address: 'test_address',
  chain_id: 1,
  page_size: 10,
  page: 1,
  sort: 'ASC',
  sort_field: 'job_type',
  job_type: 'type',
  fields: ['field1', 'field2'],
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
