import { ChainId } from '@human-protocol/sdk';
import {
  OracleDiscoveryCommand,
  OracleDiscoveryResult,
} from '../model/oracle-discovery.model';

const response1: OracleDiscoveryResult = {
  address: '0xd06eac24a0c47c776Ce6826A93162c4AfC029047',
  chainId: ChainId.POLYGON_AMOY,
  role: 'role1',
  url: 'common-url',
  jobTypes: ['job-type-3'],
  retriesCount: 0,
  executionsToSkip: 0,
  registrationNeeded: true,
  registrationInstructions: 'https://instructions.com',
};
const response2: OracleDiscoveryResult = {
  address: '0xd10c3402155c058D78e4D5fB5f50E125F06eb39d',
  chainId: ChainId.POLYGON_AMOY,
  role: 'role2',
  jobTypes: ['job-type-1', 'job-type-3', 'job-type-4'],
  retriesCount: 0,
  executionsToSkip: 0,
  registrationNeeded: false,
  registrationInstructions: undefined,
};
const response3: OracleDiscoveryResult = {
  address: '0xd83422155c058D78e4D5fB5f50E125F06eb39d',
  chainId: ChainId.POLYGON_AMOY,
  role: 'role3',
  url: 'common-url',
  jobTypes: ['job-type-2'],
  retriesCount: 0,
  executionsToSkip: 0,
  registrationNeeded: false,
  registrationInstructions: undefined,
};
const response4: OracleDiscoveryResult = {
  address: '0xd83422155c058D78e4D5fB5f50E125F06eb39d',
  chainId: ChainId.MOONBASE_ALPHA,
  role: 'role3',
  url: 'common-url',
  jobTypes: ['job-type-1', 'job-type-3', 'job-type-4'],
  retriesCount: 0,
  executionsToSkip: 0,
  registrationNeeded: false,
  registrationInstructions: undefined,
};

export function generateGetReputationNetworkOperatorsResponseByChainId(
  chainId: ChainId,
) {
  return [response1, response2, response3, response4].filter(
    (oracle) => oracle.chainId === chainId,
  );
}

export function generateOracleDiscoveryResponseBodyByChainId(chainId: ChainId) {
  return [response1, response3, response4].filter(
    (oracle) => oracle.chainId === chainId,
  );
}

export function generateOracleDiscoveryResponseBody() {
  return [response1, response3, response4];
}

export function generateOracleDiscoveryResponseBodyByJobType(jobType: string) {
  return [response1, response3, response4].filter(
    (oracle) =>
      oracle.jobTypes !== undefined && oracle.jobTypes.indexOf(jobType) >= 0,
  );
}

export const reputationOracleSupportedJobTypes = 'job-type-1, job-type-4';
export const filledCommandFixture = {
  selectedJobTypes: ['job-type-1'],
} as OracleDiscoveryCommand;
export const emptyCommandFixture = {
  selectedJobTypes: [],
} as OracleDiscoveryCommand;
export const notSetCommandFixture = {} as OracleDiscoveryCommand;
export const errorResponse = [];
