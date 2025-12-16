import { stakeSummaryResponseFixture } from './staking.fixtures';

export const stakingServiceMock = {
  getStakeSummary: jest.fn().mockReturnValue(stakeSummaryResponseFixture),
};
