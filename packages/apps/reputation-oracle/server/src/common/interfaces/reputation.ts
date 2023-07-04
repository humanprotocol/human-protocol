import { ReputationEntityType } from "../enums/reputation";
import { IBase } from "./base";

export interface IReputationOracle extends IBase {
    chainId: number;
    address: string;
    reputationPoints: number;
    type: ReputationEntityType;
  }
