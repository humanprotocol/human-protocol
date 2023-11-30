import { JobStatus } from '../enums/job';
import { IBase } from './base';

export interface IJob extends IBase {
  userId: number;
  chainId: number;
  fee: number;
  fundAmount: number;
  escrowAddress: string;
  manifestUrl: string;
  manifestHash: string;
  status: JobStatus;
  failedReason?: string;
  retriesCount?: number;
  waitUntil: Date;
}
