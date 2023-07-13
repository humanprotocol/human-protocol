import { JobStatus } from '../enums/job';
import { IBase } from './base';

export interface IJob extends IBase {
  userId: number;
  chainId: number;
  fee: string;
  fundAmount: string;
  escrowAddress: string;
  manifestUrl: string;
  manifestHash: string;
  status: JobStatus;
  retriesCount?: number;
  waitUntil: Date;
}

export interface IJobId {
  id: number;
}
