import { ApiProperty } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import {
  SortField,
  SortOrder,
  StatusEnum,
} from '../../../common/enums/job-assignment';

export class JobAssignmentDto {
  @AutoMap()
  @ApiProperty({ example: 'string' })
  exchange_oracle_url: string;
  @AutoMap()
  @ApiProperty({ example: 'string' })
  escrow_address: string;
  @AutoMap()
  @ApiProperty({ example: 0 })
  chain_id: number;
}

export class JobAssignmentParams {
  @AutoMap()
  chainId: number;
  @AutoMap()
  escrowAddress: string;
}
export class JobAssignmentCommand {
  data: JobAssignmentParams;
  @AutoMap()
  token: string;
  @AutoMap()
  exchangeOracleUrl: string;
}

export class JobAssignmentData {
  @AutoMap()
  escrow_address: string;
  @AutoMap()
  chain_id: number;
}

export class JobAssignmentResponse {
  assignment_id: string;
  escrow_address: string;
  chain_id: number;
  job_type: string;
  url?: string; //Only for ACTIVE status
  status: string;
  reward_amount: string;
  reward_token: string;
  created_at: string;
  updated_at?: string; //Only for COMPLETED, EXPIRED, CANCELED and REJECTED status
  expires_at: string;
}

export class JobsFetchParamsDto {
  @AutoMap()
  @ApiProperty({ example: 'string' })
  exchange_oracle_url: string;
  @AutoMap()
  @ApiProperty({ example: 'string', required: false })
  assignment_id: string;
  @AutoMap()
  @ApiProperty({ example: 'string', required: false })
  escrow_address: string;
  @AutoMap()
  @ApiProperty({ example: 0, required: false })
  chain_id: number;
  @AutoMap()
  @ApiProperty({ example: 'job type', required: false })
  job_type: string;
  @AutoMap()
  @ApiProperty({ example: 'ACTIVE', required: false })
  status: StatusEnum;
  @AutoMap()
  @ApiProperty({ example: 5, default: 5, maximum: 10, required: false })
  page_size: number;
  @AutoMap()
  @ApiProperty({ example: 0, default: 0, required: false })
  page: number;
  @AutoMap()
  @ApiProperty({ example: 'ASC', default: 'ASC', required: false })
  sort: SortOrder;
  @AutoMap()
  @ApiProperty({
    example: 'created_at',
    default: 'created_at',
    required: false,
  })
  sort_field: SortField;
}

export class JobsFetchParams {
  @AutoMap()
  assignmentId: string;
  @AutoMap()
  escrowAddress: string;
  @AutoMap()
  chainId: number;
  @AutoMap()
  jobType: string;
  @AutoMap()
  status: StatusEnum;
  @AutoMap()
  pageSize: number;
  @AutoMap()
  page: number;
  @AutoMap()
  sort: SortOrder;
  @AutoMap()
  sortField: SortField;
}
export class JobsFetchParamsCommand {
  @AutoMap()
  exchangeOracleUrl: string;
  @AutoMap()
  data: JobsFetchParams;
}

export class JobsFetchParamsData {
  @AutoMap()
  assignment_id: string;
  @AutoMap()
  escrow_address: string;
  @AutoMap()
  chain_id: number;
  @AutoMap()
  job_type: string;
  @AutoMap()
  status: StatusEnum;
  @AutoMap()
  page_size: number;
  @AutoMap()
  page: number;
  @AutoMap()
  sort: SortOrder;
  @AutoMap()
  sort_field: SortField;
}

export class JobsFetchResponseItem {
  assignment_id: string;
  escrow_address: string;
  chain_id: number;
  job_type: string;
  url?: string; //Only for ACTIVE status
  status: string;
  reward_amount: string;
  reward_token: string;
  created_at: string;
  updated_at: string; //Only for VALIDATION, COMPLETED, EXPIRED, CANCELED and REJECTED status
  expires_at: string;
}

export class JobsFetchResponse {
  data: JobsFetchResponseItem[];
}
