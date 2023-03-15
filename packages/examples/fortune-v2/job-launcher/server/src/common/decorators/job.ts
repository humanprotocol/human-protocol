import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { IBase } from "./base";

export interface IJob extends IBase {
  userId: number;
  chainId: number;
  dataUrl: string;
  labels: string[];
  requestsRequired: number;
  requesterTitle: string;
  requesterDescription: string;
  requesterAccuracyTarget: number;
  escrowAddress: string;
  price: number;
  mode: JobMode;
  requestType: JobRequestType;
  status: JobStatus;
}

export enum JobStatus {
  PENDING = "PENDING",
  LAUNCHED = "LAUNCHED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
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
  DESCRIPTIVE = "DESCRIPTIVE",
}

export enum JobRequestType {
  IMAGE_LABEL_BINARY = "IMAGE_LABEL_BINARY",
  FORTUNE = "FORTUNE",
}

export const Job = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return (request.job as IJob) || null;
});
