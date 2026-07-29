import { AutoMap } from '@automapper/classes';
import { JobStatus } from '../../../common/enums/global-common';
import {
  PageableData,
  PageableParams,
  PageableResponse,
} from '../../../common/utils/pageable.model';

export enum FetchJobsFieldName {
  JobDescription = 'job_description',
  RewardAmount = 'reward_amount',
  RewardToken = 'reward_token',
  CreatedAt = 'created_at',
}

export enum FetchJobsSortField {
  CHAIN_ID = 'chain_id',
  JOB_TYPE = 'job_type',
  REWARD_AMOUNT = 'reward_amount',
  CREATED_AT = 'created_at',
}

export class FetchJobsParams extends PageableParams {
  @AutoMap()
  escrowAddress?: string;

  @AutoMap()
  chainId?: number;

  @AutoMap()
  sortField?: FetchJobsSortField;

  @AutoMap()
  jobType?: string;

  @AutoMap()
  fields: FetchJobsFieldName[];

  @AutoMap()
  status: JobStatus;

  @AutoMap()
  updatedAfter?: string;

  qualifications?: string[];
}

export class FetchJobsCommand {
  @AutoMap()
  oracleAddress: string;
  @AutoMap()
  token: string;
  @AutoMap()
  data: FetchJobsParams;
}

export class FetchJobsParamsData extends PageableData {
  @AutoMap()
  escrow_address?: string;

  @AutoMap()
  chain_id?: number;

  @AutoMap()
  sort_field?: FetchJobsSortField;

  @AutoMap()
  job_type?: string;

  @AutoMap()
  fields: FetchJobsFieldName[];

  @AutoMap()
  status: JobStatus;

  @AutoMap()
  updated_after?: string;
}

export type FetchJobsResponseItem = {
  escrow_address: string;
  chain_id: number;
  job_type: string;
  status: JobStatus;
  job_description?: string;
  reward_amount?: string;
  reward_token?: string;
  created_at?: string;
  updated_at?: string;
  qualifications: string[];
};

export class FetchJobsResponse extends PageableResponse {
  results: FetchJobsResponseItem[];
}
