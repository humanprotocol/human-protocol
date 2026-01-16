export type StakeSummaryData = {
  exchangeStake: string;
  onChainStake: string;
  exchangeError?: string;
  onChainError?: string;
};

export type StakeConfigData = {
  minThreshold: string;
  eligibilityEnabled: boolean;
};
