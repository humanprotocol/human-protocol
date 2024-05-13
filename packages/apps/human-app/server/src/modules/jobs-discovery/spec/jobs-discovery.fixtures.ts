import {
  JobsDiscoveryParams,
  JobsDiscoveryParamsCommand,
  JobsDiscoveryParamsData,
  JobsDiscoveryParamsDetails,
  JobsDiscoveryParamsDto,
  JobsDiscoveryResponseItem,
} from '../model/jobs-discovery.model';
import {
  JobDiscoveryFieldName,
  JobDiscoverySortField,
  JobStatus,
  SortOrder,
} from '../../../common/enums/global-common';
const EXCHANGE_ORACLE_URL = 'https://www.test_url.org';
const ESCROW_ADDRESS = 'test_address';
const CHAIN_ID = 1;
const PAGE_SIZE = 10;
const PAGE = 1;
const SORT = SortOrder.ASC;
const SORT_FIELD = JobDiscoverySortField.CREATED_AT;
const JOB_TYPE = 'FORTUNE';
const FIELDS = [
  JobDiscoveryFieldName.CreatedAt,
  JobDiscoveryFieldName.JobDescription,
];
const TOKEN = 'test-token';
const JOB_DESCRIPTION = 'Description of the test job';
const REWARD_AMOUNT = '100';
const REWARD_TOKEN = 'ETH';
const CREATED_AT = '2024-03-01T12:00:00Z';
const JOB_TITLE = 'test job';
const EXCHANGE_ORACLE_ADDRESS = '0x3dfa342';
const STATUS = JobStatus.ACTIVE;
export const jobsDiscoveryOracleUrlFixture = EXCHANGE_ORACLE_URL;
export const jobDiscoveryToken = TOKEN;
export const dtoFixture: JobsDiscoveryParamsDto = {
  oracle_address: EXCHANGE_ORACLE_ADDRESS,
  escrow_address: ESCROW_ADDRESS,
  chain_id: CHAIN_ID,
  page_size: PAGE_SIZE,
  page: PAGE,
  sort: SORT,
  sort_field: SORT_FIELD,
  job_type: JOB_TYPE,
  fields: FIELDS,
  status: STATUS,
};

const dataFixture: JobsDiscoveryParams = {
  escrowAddress: ESCROW_ADDRESS,
  chainId: CHAIN_ID,
  pageSize: PAGE_SIZE,
  page: PAGE,
  sort: SORT,
  sortField: SORT_FIELD,
  jobType: JOB_TYPE,
  fields: FIELDS,
  status: STATUS,
};
const paramsDataFixture: JobsDiscoveryParamsData = {
  escrow_address: ESCROW_ADDRESS,
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
export const jobsDiscoveryParamsCommandFixture: JobsDiscoveryParamsCommand = {
  data: dataFixture,
  oracleAddress: EXCHANGE_ORACLE_ADDRESS,
  token: TOKEN,
};
export const jobsDiscoveryParamsDetailsFixture: JobsDiscoveryParamsDetails = {
  data: dataFixture,
  exchangeOracleUrl: EXCHANGE_ORACLE_URL,
  token: TOKEN,
};
export const responseItemFixture: JobsDiscoveryResponseItem = {
  escrow_address: ESCROW_ADDRESS,
  chain_id: CHAIN_ID,
  job_type: JOB_TYPE,
  job_title: JOB_TITLE,
  job_description: JOB_DESCRIPTION,
  reward_amount: REWARD_AMOUNT,
  reward_token: REWARD_TOKEN,
  created_at: CREATED_AT,
};

export const responseFixture: JobsDiscoveryResponseItem[] = [
  responseItemFixture,
];
