import { generateOracleDiscoveryResponseBody } from './oracle-discovery.fixture';

export const oracleDiscoveryServiceMock = {
  getOracles: jest
    .fn()
    .mockResolvedValue(generateOracleDiscoveryResponseBody()),
};
