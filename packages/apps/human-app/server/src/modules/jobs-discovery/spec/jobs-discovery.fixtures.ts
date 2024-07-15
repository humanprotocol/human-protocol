import {
  JobsDiscoveryParams,
  JobsDiscoveryParamsCommand,
  JobsDiscoveryParamsData,
  JobsDiscoveryParamsDto,
  JobsDiscoveryResponse,
  JobsDiscoveryResponseItem,
} from '../model/jobs-discovery.model';
import {
  JobDiscoveryFieldName,
  JobDiscoverySortField,
  JobStatus,
  SortOrder,
} from '../../../common/enums/global-common';

const EXCHANGE_ORACLE_URL = 'https://www.test_url.org';
const ESCROW_ADDRESS1 = 'test_address1';
const ESCROW_ADDRESS2 = 'test_address2';
const ESCROW_ADDRESS3 = 'test_address3';
const CHAIN_ID = 1;
const PAGE_SIZE = 10;
const PAGE = 1;
const TOTAL = 34;
const TOTAL_PAGES = 4;
const SORT = SortOrder.ASC;
const SORT_FIELD = JobDiscoverySortField.CREATED_AT;
const JOB_TYPE = 'FORTUNE';
const FIELDS = [
  JobDiscoveryFieldName.CreatedAt,
  JobDiscoveryFieldName.JobDescription,
];
const TOKEN = 'test-token';
const EXCHANGE_ORACLE_ADDRESS = '0x3dfa342';
const STATUS = JobStatus.ACTIVE;
export const jobsDiscoveryOracleUrlFixture = EXCHANGE_ORACLE_URL;
export const jobDiscoveryToken = TOKEN;
export const dtoFixture: JobsDiscoveryParamsDto = {
  oracle_address: EXCHANGE_ORACLE_ADDRESS,
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
  chainId: CHAIN_ID,
  pageSize: PAGE_SIZE,
  page: PAGE,
  sort: SORT,
  sortField: SORT_FIELD,
  jobType: JOB_TYPE,
  fields: FIELDS,
  status: STATUS,
};
export const paramsDataFixture: JobsDiscoveryParamsData = {
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
export const responseItemFixture1: JobsDiscoveryResponseItem = {
  escrow_address: ESCROW_ADDRESS1,
  chain_id: CHAIN_ID,
  job_type: JOB_TYPE,
  status: JobStatus.ACTIVE,
};
export const responseItemFixture2: JobsDiscoveryResponseItem = {
  escrow_address: ESCROW_ADDRESS2,
  chain_id: CHAIN_ID,
  job_type: JOB_TYPE,
  status: JobStatus.COMPLETED,
};
export const responseItemFixture3: JobsDiscoveryResponseItem = {
  escrow_address: ESCROW_ADDRESS3,
  chain_id: CHAIN_ID,
  job_type: JOB_TYPE,
  status: JobStatus.ACTIVE,
};
export const responseItemsFixture: JobsDiscoveryResponseItem[] = [
  responseItemFixture1,
  responseItemFixture2,
  responseItemFixture3,
];
export const responseFixture: JobsDiscoveryResponse = {
  results: responseItemsFixture,
  page: PAGE,
  page_size: PAGE_SIZE,
  total_pages: TOTAL_PAGES,
  total_results: TOTAL,
};
