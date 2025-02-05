import { ChainId } from '@human-protocol/sdk';
import {
  GetOraclesCommand,
  DiscoveredOracle,
} from '../model/oracle-discovery.model';

export const response1: DiscoveredOracle = {
  id: '1',
  address: '0xd06eac24a0c47c776Ce6826A93162c4AfC029047',
  chainId: ChainId.POLYGON_AMOY,
  role: 'role1',
  url: 'common-url',
  jobTypes: ['job-type-3'],
  retriesCount: 0,
  executionsToSkip: 0,
  registrationNeeded: true,
  registrationInstructions: 'https://instructions.com',
  amountStaked: BigInt(0),
  amountLocked: BigInt(0),
  lockedUntilTimestamp: BigInt(0),
  amountWithdrawn: BigInt(0),
  amountSlashed: BigInt(0),
  reward: BigInt(0),
  amountJobsProcessed: BigInt(0),
};

export const response2: DiscoveredOracle = {
  id: '2',
  address: '0xd10c3402155c058D78e4D5fB5f50E125F06eb39d',
  chainId: ChainId.POLYGON_AMOY,
  role: 'role2',
  url: '',
  jobTypes: ['job-type-1', 'job-type-3', 'job-type-4'],
  retriesCount: 0,
  executionsToSkip: 0,
  registrationNeeded: false,
  registrationInstructions: undefined,
  amountStaked: BigInt(0),
  amountLocked: BigInt(0),
  lockedUntilTimestamp: BigInt(0),
  amountWithdrawn: BigInt(0),
  amountSlashed: BigInt(0),
  reward: BigInt(0),
  amountJobsProcessed: BigInt(0),
};

export const response3: DiscoveredOracle = {
  id: '3',
  address: '0xd83422155c058D78e4D5fB5f50E125F06eb39d',
  chainId: ChainId.POLYGON_AMOY,
  role: 'role3',
  url: 'common-url',
  jobTypes: ['job-type-2'],
  retriesCount: 0,
  executionsToSkip: 0,
  registrationNeeded: false,
  registrationInstructions: undefined,
  amountStaked: BigInt(0),
  amountLocked: BigInt(0),
  lockedUntilTimestamp: BigInt(0),
  amountWithdrawn: BigInt(0),
  amountSlashed: BigInt(0),
  reward: BigInt(0),
  amountJobsProcessed: BigInt(0),
};

export const response4: DiscoveredOracle = {
  id: '4',
  address: '0xd83422155c058D78e4D5fB5f50E125F06eb39d',
  chainId: ChainId.BSC_TESTNET,
  role: 'role3',
  url: 'common-url',
  jobTypes: ['job-type-1', 'job-type-3', 'job-type-4'],
  retriesCount: 0,
  executionsToSkip: 0,
  registrationNeeded: false,
  registrationInstructions: undefined,
  amountStaked: BigInt(0),
  amountLocked: BigInt(0),
  lockedUntilTimestamp: BigInt(0),
  amountWithdrawn: BigInt(0),
  amountSlashed: BigInt(0),
  reward: BigInt(0),
  amountJobsProcessed: BigInt(0),
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

export const reputationOracleSupportedJobTypes = 'job-type-1,job-type-4';
export const filledCommandFixture = {
  selectedJobTypes: ['job-type-1'],
} as GetOraclesCommand;
export const emptyCommandFixture = {
  selectedJobTypes: [],
} as GetOraclesCommand;
export const notSetCommandFixture = {} as GetOraclesCommand;
export const errorResponse = [];
