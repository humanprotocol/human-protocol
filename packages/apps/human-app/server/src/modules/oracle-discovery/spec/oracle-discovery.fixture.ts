import {
  OracleDiscoveryCommand,
  OracleDiscoveryResponse,
} from '../model/oracle-discovery.model';

export function generateOracleDiscoveryResponseBody() {
  const response1: OracleDiscoveryResponse = {
    address: '0xd06eac24a0c47c776Ce6826A93162c4AfC029047',
    chainId: '4200',
    role: 'role1',
    url: 'common-url',
    jobTypes: ['job-type-3'],
    retriesCount: 0,
    executionsToSkip: 0,
  };
  const response2: OracleDiscoveryResponse = {
    address: '0xd10c3402155c058D78e4D5fB5f50E125F06eb39d',
    chainId: '4200',
    role: 'role2',
    url: 'common-url',
    jobTypes: ['job-type-1', 'job-type-3', 'job-type-4'],
    retriesCount: 0,
    executionsToSkip: 0,
  };
  const response3: OracleDiscoveryResponse = {
    address: '0xd83422155c058D78e4D5fB5f50E125F06eb39d',
    chainId: '4200',
    role: 'role3',
    url: 'common-url',
    jobTypes: ['job-type-2'],
    retriesCount: 0,
    executionsToSkip: 0,
  };
  const response4: OracleDiscoveryResponse = {
    address: '0xd83422155c058D78e4D5fB5f50E125F06eb39d',
    chainId: '4200',
    role: 'role3',
    jobTypes: ['job-type-1', 'job-type-3', 'job-type-4'],
    retriesCount: 0,
    executionsToSkip: 0,
  };
  return [response1, response2, response3, response4];
}

export const filledCommandFixture = {
  selectedJobTypes: ['job-type-1', 'job-type-2'],
} as OracleDiscoveryCommand;
export const emptyCommandFixture = {
  selectedJobTypes: [],
} as OracleDiscoveryCommand;
export const notSetCommandFixture = {} as OracleDiscoveryCommand;
