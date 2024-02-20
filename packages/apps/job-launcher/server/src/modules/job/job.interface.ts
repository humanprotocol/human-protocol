import { JobRequestType } from '../../common/enums/job';
import { CreateJob } from './job.dto';

export interface RequestAction {
  calculateFundAmount: (dto: CreateJob, rate: number) => Promise<number>;
  createManifest: (
    dto: CreateJob,
    requestType: JobRequestType,
    fundAmount: number,
  ) => Promise<any>;
}
