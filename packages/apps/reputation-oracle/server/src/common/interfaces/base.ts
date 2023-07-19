import { BigNumber } from "ethers";

export interface IBase {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayoutResult {
  workersPayoutAmounts: BigNumber[];
  reputationOracleFeeAmount: BigNumber;
  recordingOracleFeeAmount: BigNumber;
}