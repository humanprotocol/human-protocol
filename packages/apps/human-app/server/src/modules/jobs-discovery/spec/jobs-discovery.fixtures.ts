import {
  GetJobsCommand,
  GetJobsQueryDto,
  GetJobsResponseDto,
  DiscoveredJob,
  JobDiscoverySortField,
} from '../model/jobs-discovery.model';
import { JobStatus, SortOrder } from '../../../common/enums/global-common';

const ESCROW_ADDRESS1 = 'test_address1';
const ESCROW_ADDRESS2 = 'test_address2';
const ESCROW_ADDRESS3 = 'test_address3';
const JOB_DESCRIPTION = 'Test job description';
const REWARD_TOKEN_HMT = 'HMT';
const REWARD_TOKEN_USDC = 'USDC';
const CHAIN_ID = 1;
const PAGE_SIZE = 10;
const PAGE = 0;
const TOTAL = 34;
const TOTAL_PAGES = 4;
const SORT = SortOrder.ASC;
const SORT_FIELD = JobDiscoverySortField.CREATED_AT;
const JOB_TYPE = 'FORTUNE';
const EXCHANGE_ORACLE_ADDRESS = '0x3dfa342';
const STATUS = JobStatus.ACTIVE;

export const queryDtoFixture: GetJobsQueryDto = {
  oracle_address: EXCHANGE_ORACLE_ADDRESS,
  chain_id: CHAIN_ID,
  page_size: PAGE_SIZE,
  page: PAGE,
  sort: SORT,
  sort_field: SORT_FIELD,
  job_type: JOB_TYPE,
  status: STATUS,
};
export const getJobsCommandFixture: GetJobsCommand = {
  data: {
    chainId: CHAIN_ID,
    pageSize: PAGE_SIZE,
    page: PAGE,
    sort: SORT,
    sortField: SORT_FIELD,
    jobType: JOB_TYPE,
    status: STATUS,
  },
  oracleAddress: EXCHANGE_ORACLE_ADDRESS,
};
export const responseItemFixture1: DiscoveredJob = {
  escrow_address: ESCROW_ADDRESS1,
  chain_id: CHAIN_ID,
  job_type: JOB_TYPE,
  status: JobStatus.ACTIVE,
  created_at: '2025-03-18T03:00:00.000Z',
  qualifications: [],
  job_description: 'Response item fixture 1 description',
  reward_amount: '42.1',
  reward_token: 'hmt',
  updated_at: '2025-03-18T03:00:00.000Z',
};
export const responseItemFixture2: DiscoveredJob = {
  escrow_address: ESCROW_ADDRESS2,
  chain_id: CHAIN_ID,
  job_type: JOB_TYPE,
  status: JobStatus.COMPLETED,
  created_at: '2025-03-18T02:00:00.000Z',
  qualifications: [],
  job_description: 'Response item fixture 2 description',
  reward_amount: '42.2',
  reward_token: 'hmt',
  updated_at: '2025-03-18T02:00:00.000Z',
};
export const responseItemFixture3: DiscoveredJob = {
  escrow_address: ESCROW_ADDRESS3,
  chain_id: CHAIN_ID,
  job_type: JOB_TYPE,
  status: JobStatus.ACTIVE,
  created_at: '2025-03-18T01:00:00.000Z',
  qualifications: [],
  job_description: 'Response item fixture 3 description',
  reward_amount: '42.3',
  reward_token: 'hmt',
  updated_at: '2025-03-18T01:00:00.000Z',
};
export const responseItemsFixture: DiscoveredJob[] = [
  responseItemFixture1,
  responseItemFixture2,
  responseItemFixture3,
];
export const hmtRewardAmountResponseItemFixture: DiscoveredJob = {
  ...responseItemFixture1,
  escrow_address: ESCROW_ADDRESS1,
  created_at: responseItemFixture1.created_at ?? '',
  job_description: JOB_DESCRIPTION,
  reward_amount: '1',
  reward_token: REWARD_TOKEN_HMT,
  updated_at: '2025-03-18T01:00:00.000Z',
};
export const usdcRewardAmountResponseItemFixture: DiscoveredJob = {
  ...responseItemFixture1,
  escrow_address: ESCROW_ADDRESS1,
  created_at: responseItemFixture1.created_at ?? '',
  job_description: JOB_DESCRIPTION,
  reward_amount: '2',
  reward_token: REWARD_TOKEN_USDC,
  updated_at: '2025-03-18T01:00:00.000Z',
};
export const invalidRewardAmountResponseItemFixture: DiscoveredJob = {
  ...responseItemFixture1,
  escrow_address: ESCROW_ADDRESS1,
  created_at: responseItemFixture1.created_at ?? '',
  job_description: JOB_DESCRIPTION,
  reward_amount: 'NaN',
  reward_token: REWARD_TOKEN_HMT,
  updated_at: '2025-03-18T01:00:00.000Z',
};
export const validRewardAmountResponseItemFixture: DiscoveredJob = {
  ...responseItemFixture1,
  escrow_address: ESCROW_ADDRESS1,
  created_at: responseItemFixture1.created_at ?? '',
  job_description: JOB_DESCRIPTION,
  reward_amount: '1',
  reward_token: REWARD_TOKEN_HMT,
  updated_at: '2025-03-18T01:00:00.000Z',
};
export const responseFixture: GetJobsResponseDto = {
  results: responseItemsFixture,
  page: PAGE,
  page_size: PAGE_SIZE,
  total_pages: TOTAL_PAGES,
  total_results: TOTAL,
};
