import { JobStatus } from '../enums/job';
import { IBase } from './base';

export interface IJob extends IBase {
  userId: number;
  chainId: number;
  fee: number;
  fundAmount: number;
  escrowAddress: string | null;
  manifestUrl: string;
  manifestHash: string;
  status: JobStatus;
  failedReason: string | null;
  retriesCount: number;
  waitUntil: Date;
}
