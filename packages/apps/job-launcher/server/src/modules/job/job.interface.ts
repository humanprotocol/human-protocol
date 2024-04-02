import { JobRequestType } from '../../common/enums/job';
import { CreateJob, CvatDataDto, Label } from './job.dto';

export interface RequestAction {
  calculateFundAmount: (dto: CreateJob, rate: number) => Promise<number>;
  createManifest: (
    dto: CreateJob,
    requestType: JobRequestType,
    fundAmount: number,
  ) => Promise<any>;
}

export interface DatasetAction {
  getElementsCount: (
    requestType: JobRequestType,
    data: CvatDataDto,
  ) => Promise<number>;
}

export interface EscrowAction {
  getTrustedHandlers: () => string[];
}

export interface OracleAction {
  getOracleAddresses: () => OracleAddresses;
}

export interface OracleAddresses {
  exchangeOracle: string;
  recordingOracle: string;
  reputationOracle: string;
}

export class CvatCalculateJobBounty {
  requestType: JobRequestType;
  elementsCount: number;
  fundAmount: number;
  nodesTotal?: number;
}
