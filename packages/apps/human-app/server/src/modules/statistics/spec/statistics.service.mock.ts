import {
  oracleStatsResponseFixture,
  userStatsResponseFixture,
} from './statistics.fixtures';

export const statisticsServiceMock = {
  getUserStats: jest.fn().mockResolvedValue(userStatsResponseFixture),
  getOracleStats: jest.fn().mockResolvedValue(oracleStatsResponseFixture),
};
