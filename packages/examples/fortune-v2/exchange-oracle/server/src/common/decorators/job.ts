import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { IBase } from "./base";

export interface IJob extends IBase {
  userId: number;
  networkId: string;
  dataUrl: string;
  datasetLength: number;
  labels: string[];
  annotationsPerImage: number;
  requesterDescription: string;
  requesterAccuracyTarget: number;
  recordingOracleAddress: string;
  reputationOracleAddress: string;
  exchangeOracleAddress: string;
  recordingOracleUrl: string;
  reputationOracleUrl: string;
  exchangeOracleUrl: string;
  tokenAddress: string;
  price: number;
  fee: number;
  mode: JobMode;
  requestType: JobRequestType;
  status: JobStatus;
}

export enum JobStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  ESCROW_CREATED = "ESCROW_CREATED",
  ESCROW_SETUP = "ESCROW_SETUP",
  LAUNCHED = "LAUNCHED",
  COMPLETE = "COMPLETE",
  CANCELLED = "CANCELLED",
  REJECTED = "REJECTED",
}

export enum EscrowStatus {
  LAUNCHED = 0,
  PENDING = 1,
  PAID = 2,
  COMPLETE = 3,
  CANCELLED = 4,
}

export enum JobMode {
  BATCH = "BATCH",
}

export enum JobRequestType {
  IMAGE_LABEL_BINARY = "IMAGE_LABEL_BINARY",
}

export const Job = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return (request.job as IJob) || null;
});
