import { OracleDiscoveryResponse } from '../interface/oracle-discovery.interface';

export function generateOracleDiscoveryResponseBody() {
  const response1: OracleDiscoveryResponse = {
    address: '0xd06eac24a0c47c776Ce6826A93162c4AfC029047',
    role: 'role1',
  };
  const response2: OracleDiscoveryResponse = {
    address: '0xd10c3402155c058D78e4D5fB5f50E125F06eb39d',
    role: 'role2',
  };
  return [response1, response2];
}
