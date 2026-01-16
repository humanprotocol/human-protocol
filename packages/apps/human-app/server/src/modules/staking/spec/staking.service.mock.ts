import {
  stakeConfigResponseFixture,
  stakeSummaryResponseFixture,
} from './staking.fixtures';

export const stakingServiceMock = {
  getStakeSummary: jest.fn().mockReturnValue(stakeSummaryResponseFixture),
  getStakeConfig: jest.fn().mockReturnValue(stakeConfigResponseFixture),
};
