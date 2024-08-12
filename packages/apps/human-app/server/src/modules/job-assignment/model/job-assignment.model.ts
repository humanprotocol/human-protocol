import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import {
  PageableData,
  PageableDto,
  PageableParams,
  PageableResponse,
} from '../../../common/utils/pageable.model';
import {
  AssignmentSortField,
  AssignmentStatus,
} from '../../../common/enums/global-common';
import { Type } from 'class-transformer';

export class JobAssignmentDto {
  @AutoMap()
  @IsString()
  @ApiProperty()
  escrow_address: string;
  @AutoMap()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ default: 80002 })
  chain_id: number;
}

export class JobAssignmentParams {
  @AutoMap()
  chainId: number;
  @AutoMap()
  escrowAddress: string;
}
export class JobAssignmentCommand {
  @AutoMap()
  data: JobAssignmentParams;
  @AutoMap()
  token: string;
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

export class JobsFetchParamsDto extends PageableDto {
  @AutoMap()
  @ApiProperty()
  oracle_address: string;
  @AutoMap()
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  assignment_id: string;
  @IsOptional()
  @AutoMap()
  @IsString()
  @ApiPropertyOptional()
  escrow_address: string;
  @AutoMap()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ default: 80002 })
  chain_id: number;
  @AutoMap()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  job_type: string;
  @AutoMap()
  @IsOptional()
  @IsEnum(AssignmentStatus)
  @ApiPropertyOptional({ enum: AssignmentStatus })
  status: AssignmentStatus;
  @AutoMap()
  @IsOptional()
  @IsEnum(AssignmentSortField)
  @ApiPropertyOptional({ enum: AssignmentSortField })
  sort_field: AssignmentSortField;
}

export class JobsFetchParams extends PageableParams {
  @AutoMap()
  escrowAddress: string;
  @AutoMap()
  chainId: number;
  @AutoMap()
  jobType: string;
  @AutoMap()
  status: AssignmentStatus;
  @AutoMap()
  sortField: AssignmentSortField;
  @AutoMap()
  assignmentId: string;
  @AutoMap()
  updatedAfter?: string;
}
export class JobsFetchParamsCommand {
  @AutoMap()
  oracleAddress: string;
  @AutoMap()
  data: JobsFetchParams;
  @AutoMap()
  token: string;
}

export class JobsFetchParamsData extends PageableData {
  @AutoMap()
  escrow_address: string;
  @AutoMap()
  assignment_id: string;
  @AutoMap()
  chain_id: number;
  @AutoMap()
  job_type: string;
  @AutoMap()
  status: AssignmentStatus;
  @AutoMap()
  sort_field: AssignmentSortField;
  @AutoMap()
  updated_after?: string;
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
  updated_at: string;
  expires_at: string;
}

export class JobsFetchResponse extends PageableResponse {
  results: JobsFetchResponseItem[];
}

export class ResignJobDto {
  @AutoMap()
  @IsString()
  @ApiProperty()
  oracle_address: string;
  @AutoMap()
  @IsString()
  @ApiProperty()
  assignment_id: string;
}

export class ResignJobCommand {
  @AutoMap()
  oracleAddress: string;
  @AutoMap()
  assignmentId: string;
  token: string;
}
export class ResignJobData {
  @AutoMap()
  assignment_id: string;
}
