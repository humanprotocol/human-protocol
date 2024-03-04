import { ApiProperty } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';

export class JobAssignmentDto {
  @AutoMap()
  @ApiProperty({ example: 'string' })
  escrow_address: string;

  @AutoMap()
  @ApiProperty({ example: 0 })
  chain_id: number;
}

export class JobAssignmentCommand {
  @AutoMap()
  escrow_address: string;
  @AutoMap()
  chain_id: number;
}

export class JobAssignmentData {
  @AutoMap()
  escrow_address: string;
  @AutoMap()
  chain_id: number;
}

export class JobAssignmentResponse {
  @AutoMap()
  assignment_id: string;
  @AutoMap()
  escrow_address: string;
  @AutoMap()
  chain_id: number;
  @AutoMap()
  job_type: string;
  @AutoMap()
  url: string;
  @AutoMap()
  status: string;
  @AutoMap()
  reward_amount: string;
  @AutoMap()
  reward_token: string;
  @AutoMap()
  created_at: string;
  @AutoMap()
  updated_at: string;
  @AutoMap()
  expires_at: string;
}

export enum StatusEnum {
  ACTIVE = 'ACTIVE',
  VALIDATION = 'VALIDATION',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
  REJECTED = 'REJECTED',
}
export class JobsAssignmentParamsDto {
  @AutoMap()
  @ApiProperty({ example: 'string' })
  assignment_id: string;

  @AutoMap()
  @ApiProperty({ example: 'string' })
  escrow_address: string;

  @AutoMap()
  @ApiProperty({ example: 0 })
  chain_id: number;

  @AutoMap()
  @ApiProperty({ example: 'job type' })
  job_type: string;

  @AutoMap()
  @ApiProperty({ example: 'ACTIVE' })
  status: StatusEnum;

  @AutoMap()
  @ApiProperty({ example: 5, default: 5, maximum: 10 })
  page_size: number;

  @AutoMap()
  @ApiProperty({ example: 0, default: 0 })
  page: number;

  @AutoMap()
  @ApiProperty({ example: 'ASC', default: 'ASC' })
  sort: 'ASC' | 'DESC';

  @AutoMap()
  @ApiProperty({ example: 'created_at', default: 'created_at' })
  sort_field: 'chain_id' | 'job_type' | 'reward_amount' | 'created_at';
}

export class JobsAssignmentParamsCommand {
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
  sort: 'ASC' | 'DESC';
  @AutoMap()
  sort_field: 'chain_id' | 'job_type' | 'reward_amount' | 'created_at';
}

export class JobsAssignmentParamsData {
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
  sort: 'ASC' | 'DESC';
  @AutoMap()
  sort_field: 'chain_id' | 'job_type' | 'reward_amount' | 'created_at';
}

export class JobsAssignmentResponseItem {
  @AutoMap()
  assignment_id: string;
  @AutoMap()
  escrow_address: string;
  @AutoMap()
  chain_id: number;
  @AutoMap()
  job_type: string;
  @AutoMap()
  url: string;
  @AutoMap()
  status: string;
  @AutoMap()
  reward_amount: string;
  @AutoMap()
  reward_token: string;
  @AutoMap()
  created_at: string;
  @AutoMap()
  updated_at: string;
  @AutoMap()
  expires_at: string;
}

export class JobsAssignmentResponse {
  data: JobsAssignmentResponseItem[];
}
