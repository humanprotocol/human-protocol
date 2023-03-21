import { NetworkStatus } from "../enums/network";
import { IBase } from "./base";

export interface INetwork extends IBase {
  name: string;
  jobCount: number;
  liquidity: number;
  txCost: number;
  status: NetworkStatus;
}
