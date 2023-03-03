import { IBase } from "./base";

export interface INetwork extends IBase {
  name: string;
  jobCount: number;
  liquidity: number;
  txCost: number;
  status: NetworkStatus;
}

export enum NetworkStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}
