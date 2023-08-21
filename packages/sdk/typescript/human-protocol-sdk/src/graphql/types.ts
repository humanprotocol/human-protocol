export type EscrowData = {
  id: string;
  address: string;
  amountPaid: string;
  balance: string;
  count: string;
  factoryAddress: string;
  finalResultsUrl?: string;
  intermediateResultsUrl?: string;
  launcher: string;
  manifestHash?: string;
  manifestUrl?: string;
  recordingOracle?: string;
  recordingOracleFee?: string;
  reputationOracle?: string;
  reputationOracleFee?: string;
  status: string;
  token: string;
  totalFundedAmount: string;
};

export type RewardAddedEventData = {
  escrowAddress: string;
  staker: string;
  slasher: string;
  amount: string;
};
