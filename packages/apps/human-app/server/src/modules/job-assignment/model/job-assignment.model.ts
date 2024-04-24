import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import {
  PageableData,
  PageableDto,
  PageableParams,
} from '../../../common/interfaces/pageable.interface';
import {
  AssignmentSortField,
  AssignmentStatus,
} from '../../../common/enums/global-common.interface';
import { Type } from 'class-transformer';

export class JobAssignmentDto {
  @AutoMap()
  @IsString()
  @ApiProperty()
  address: string;
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
  @AutoMap()
  address: string;
}

export class JobAssignmentDetails {
  @AutoMap()
  data: JobAssignmentParams;
  @AutoMap()
  token: string;
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

export class JobsFetchParamsDto extends PageableDto {
  @AutoMap()
  @ApiProperty()
  address: string;
  @AutoMap()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  assignment_id: number;
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
  @IsEnum(AssignmentSortField, { each: true })
  @ApiPropertyOptional({ enum: AssignmentSortField, isArray: true })
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
  assignmentId: number;
}
export class JobsFetchParamsCommand {
  @AutoMap()
  address: string;
  @AutoMap()
  data: JobsFetchParams;
  @AutoMap()
  token: string;
}
export class JobsFetchParamsDetails {
  exchangeOracleUrl: string;
  @AutoMap()
  data: JobsFetchParams;
  @AutoMap()
  token: string;
}

export class JobsFetchParamsData extends PageableData {
  @AutoMap()
  escrow_address: string;
  @AutoMap()
  assignment_id: number;
  @AutoMap()
  chain_id: number;
  @AutoMap()
  job_type: string;
  @AutoMap()
  status: AssignmentStatus;
  @AutoMap()
  sort_field: AssignmentSortField;
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
