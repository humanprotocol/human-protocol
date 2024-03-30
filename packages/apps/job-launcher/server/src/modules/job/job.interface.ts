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

export interface CvatAction {
  getElementsCount: (
    requestType: JobRequestType,
    data: CvatDataDto,
    labels?: Label[],
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
