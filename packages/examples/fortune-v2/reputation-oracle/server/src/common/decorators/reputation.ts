import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { IBase } from "./base";

export interface IReputationOracle extends IBase {
  chainId: number;
  publicKey: string;
  reputationPoints: number;
  type: OracleType;
}

export interface IReputationWorker extends IBase {
  chainId: number;
  publicKey: string;
  reputationPoints: number;
  type: OracleType;
}

export enum OracleType {
  JOB_LAUNCHER = "JOB_LAUNCHER",
  EXCHANGE_ORACLE = "EXCHANGE_ORACLE",
  RECORDING_ORACLE = "RECORDING_ORACLE",
  REPUTATION_ORACLE = "REPUTATION_ORACLE",
}

export const ReputationOracle = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return (request.job as IReputationOracle) || null;
});

export const ReputationWorker = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return (request.job as IReputationWorker) || null;
});
