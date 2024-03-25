import { ApiProperty } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import {
  JobFields,
  SortField,
  SortOrder,
} from '../../../common/enums/jobs-discovery';

export class JobsDiscoveryParamsDto {
  @AutoMap()
  @ApiProperty({ example: 'string' })
  exchange_oracle_url: string;
  @AutoMap()
  @ApiProperty({ example: 'string' })
  escrow_address: string;
  @AutoMap()
  @ApiProperty({ example: 0 })
  chain_id: number;
  @AutoMap()
  @ApiProperty({ example: 5, default: 5, maximum: 10 })
  page_size: number;
  @AutoMap()
  @ApiProperty({ example: 0, default: 0 })
  page: number;
  @AutoMap()
  @ApiProperty({ example: 'ASC', default: 'ASC' })
  sort: SortOrder;
  @AutoMap()
  @ApiProperty({ example: 'created_at', default: 'created_at' })
  sort_field: SortField;
  @AutoMap()
  @ApiProperty({ example: 'job type' })
  job_type: string;
  @AutoMap()
  @ApiProperty({ example: ['job_title'] })
  fields: JobFields[];
}

export class JobsDiscoveryParams {
  @AutoMap()
  escrowAddress: string;
  @AutoMap()
  chainId: number;
  @AutoMap()
  pageSize: number;
  @AutoMap()
  page: number;
  @AutoMap()
  sort: SortOrder;
  @AutoMap()
  sortField: SortField;
  @AutoMap()
  jobType: string;
  @AutoMap()
  fields: JobFields[];
}
export class JobsDiscoveryParamsData {
  @AutoMap()
  escrow_address: string;
  @AutoMap()
  chain_id: number;
  @AutoMap()
  page_size: number;
  @AutoMap()
  page: number;
  @AutoMap()
  sort: SortOrder;
  @AutoMap()
  sort_field: SortField;
  @AutoMap()
  job_type: string;
  @AutoMap()
  fields: JobFields[];
}
export class JobsDiscoveryParamsCommand {
  @AutoMap()
  exchangeOracleUrl: string;
  token: string;
  @AutoMap()
  data: JobsDiscoveryParams;
}

export class JobsDiscoveryResponseItem {
  escrow_address: string;
  chain_id: number;
  job_type: string;
  job_title: string;
  job_description: string;
  reward_amount: string;
  reward_token: string;
  created_at: string;
}

export class JobsDiscoveryResponse {
  data: JobsDiscoveryResponseItem[];
}
