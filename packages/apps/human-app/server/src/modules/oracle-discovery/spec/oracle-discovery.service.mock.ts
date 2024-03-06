import { generateOracleDiscoveryResponseBody } from './oracle-discovery.fixture';

export const oracleDiscoveryServiceMock = {
  processOracleDiscovery: jest
    .fn()
    .mockResolvedValue(generateOracleDiscoveryResponseBody()),
};
