import { JobStatus, SortOrder } from '../../../common/enums/global-common';
import {
  FetchJobsCommand,
  FetchJobsFieldName,
  FetchJobsParamsData,
  FetchJobsResponse,
  FetchJobsResponseItem,
  FetchJobsSortField,
} from '../model/exchange-oracle.model';

const ESCROW_ADDRESS = 'test_address';
const CHAIN_ID = 1;
const PAGE_SIZE = 10;
const PAGE = 0;
const SORT = SortOrder.ASC;
const SORT_FIELD = FetchJobsSortField.CREATED_AT;
const JOB_TYPE = 'FORTUNE';
const EXCHANGE_ORACLE_ADDRESS = '0x3dfa342';
const STATUS = JobStatus.ACTIVE;
const FIELDS = [
  FetchJobsFieldName.CreatedAt,
  FetchJobsFieldName.JobDescription,
];

export const fetchJobsCommandFixture: FetchJobsCommand = {
  data: {
    chainId: CHAIN_ID,
    pageSize: PAGE_SIZE,
    page: PAGE,
    sort: SORT,
    sortField: SORT_FIELD,
    jobType: JOB_TYPE,
    status: STATUS,
    fields: FIELDS,
  },
  token: 'jwt-token',
  oracleAddress: EXCHANGE_ORACLE_ADDRESS,
};

export const paramsDataFixture: FetchJobsParamsData = {
  chain_id: CHAIN_ID,
  page_size: PAGE_SIZE,
  page: PAGE,
  sort: SORT,
  sort_field: SORT_FIELD,
  job_type: JOB_TYPE,
  fields: FIELDS,
  status: STATUS,
};
export const paramsDataFixtureAsString = `?escrow_address=${paramsDataFixture.escrow_address}&chain_id=${paramsDataFixture.chain_id}&page_size=${paramsDataFixture.page_size}&page=${paramsDataFixture.page}&sort=${paramsDataFixture.sort}&sort_field=${paramsDataFixture.sort_field}&job_type=${paramsDataFixture.job_type}&fields=${paramsDataFixture.fields.join(',')}`;

export const responseItemFixture1: FetchJobsResponseItem = {
  escrow_address: ESCROW_ADDRESS,
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
export const responseItemFixture2: FetchJobsResponseItem = {
  escrow_address: ESCROW_ADDRESS,
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
export const responseItemFixture3: FetchJobsResponseItem = {
  escrow_address: ESCROW_ADDRESS,
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
export const responseItemsFixture: FetchJobsResponseItem[] = [
  responseItemFixture1,
  responseItemFixture2,
  responseItemFixture3,
];

export const responseFixture: FetchJobsResponse = {
  results: responseItemsFixture,
  page: PAGE,
  page_size: PAGE_SIZE,
  total_pages: 34,
  total_results: 4,
};
