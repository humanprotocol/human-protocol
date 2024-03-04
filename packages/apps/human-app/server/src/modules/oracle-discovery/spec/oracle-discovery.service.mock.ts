import { generateOracleDiscoveryResponseBody } from '../../../../test/fixtures/oracle-discovery.fixture';

export const oracleDiscoveryServiceMock = {
  processOracleDiscovery: jest
    .fn()
    .mockResolvedValue(generateOracleDiscoveryResponseBody()),
};
