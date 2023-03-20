import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JobMode, JobRequestType, JobStatus } from "../enums/job";
import { IBase } from "./base";

export interface IJob extends IBase {
  userId: number;
  chainId: number;
  dataUrl: string;
  labels: string[];
  submissionsRequired: number;
  requesterTitle: string;
  requesterDescription: string;
  requesterAccuracyTarget: number;
  escrowAddress: string;
  price: number;
  mode: JobMode;
  requestType: JobRequestType;
  status: JobStatus;
  retriesCount?: number;
  waitUntil: Date;
}

export const Job = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return (request.job as IJob) || null;
});
