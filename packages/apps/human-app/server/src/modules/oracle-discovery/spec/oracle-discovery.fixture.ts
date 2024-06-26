import {
  OracleDiscoveryCommand,
  OracleDiscoveryResponse,
} from '../model/oracle-discovery.model';

export function generateOracleDiscoveryResponseBody() {
  const response1: OracleDiscoveryResponse = {
    address: '0xd06eac24a0c47c776Ce6826A93162c4AfC029047',
    role: 'role1',
    jobTypes: ['job-type-3'],
  };
  const response2: OracleDiscoveryResponse = {
    address: '0xd10c3402155c058D78e4D5fB5f50E125F06eb39d',
    role: 'role2',
    jobTypes: ['job-type-1', 'job-type-3', 'job-type-4'],
  };
  return [response1, response2];
}

export const filledCommandFixture = {
  selectedJobTypes: ['job-type-1', 'job-type-2'],
} as OracleDiscoveryCommand;
export const emptyCommandFixture = {
  selectedJobTypes: [],
} as OracleDiscoveryCommand;
export const notSetCommandFixture = {} as OracleDiscoveryCommand;
