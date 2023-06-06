import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { IBase } from "./base";

export interface IReputationOracle extends IBase {
  chainId: number;
  address: string;
  reputationPoints: number;
  type: ReputationEntityType;
}

export enum ReputationEntityType {
  WORKER = "WORKER",
  JOB_LAUNCHER = "JOB_LAUNCHER",
  EXCHANGE_ORACLE = "EXCHANGE_ORACLE",
  RECORDING_ORACLE = "RECORDING_ORACLE",
  REPUTATION_ORACLE = "REPUTATION_ORACLE",
}

export const ReputationOracle = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return (request.job as IReputationOracle) || null;
});
