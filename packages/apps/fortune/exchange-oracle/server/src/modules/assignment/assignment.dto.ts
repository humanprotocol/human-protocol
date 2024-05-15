import { ChainId } from '@human-protocol/sdk';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import {
  AssignmentSortField,
  AssignmentStatus,
  JobSortField,
  JobType,
} from '../../common/enums/job';
import { PageOptionsDto } from '../../common/pagination/pagination.dto';

export class CreateAssignmentDto {
  @ApiProperty({
    enum: ChainId,
    name: 'chain_id',
    required: false,
  })
  @IsEnum(ChainId)
  chainId: ChainId;

  @ApiProperty({ name: 'escrow_address' })
  @IsString()
  escrowAddress: string;
}

export class GetAssignmentsDto extends PageOptionsDto {
  @ApiPropertyOptional({
    name: 'sort_field',
    enum: JobSortField,
    default: JobSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(AssignmentSortField)
  sortField?: AssignmentSortField = AssignmentSortField.CREATED_AT;

  @ApiPropertyOptional({ name: 'chain_id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  chainId?: number;

  @ApiPropertyOptional({ name: 'job_type', enum: JobType })
  @IsEnum(JobType)
  @IsOptional()
  jobType?: JobType;

  @ApiPropertyOptional({ name: 'escrow_address' })
  @IsOptional()
  @IsString()
  escrowAddress?: string;

  @ApiPropertyOptional({ enum: AssignmentStatus })
  @IsEnum(AssignmentStatus)
  @IsOptional()
  status?: AssignmentStatus;

  @ApiPropertyOptional({ name: 'assignment_id' })
  @IsOptional()
  @IsString()
  assignmentId?: string;
}

export class AssignmentDto {
  @ApiProperty({ name: 'assignment_id' })
  assignmentId: number;

  @ApiProperty({ name: 'escrow_address' })
  escrowAddress: string;

  @ApiProperty({ name: 'chain_id' })
  chainId: number;

  @ApiProperty({ name: 'job_type' })
  jobType: string;

  @ApiProperty()
  status: AssignmentStatus;

  @ApiPropertyOptional()
  url?: string;

  @ApiProperty({ name: 'reward_amount' })
  rewardAmount: number;

  @ApiProperty({ name: 'reward_token' })
  rewardToken: string;

  @ApiProperty({ name: 'created_at' })
  createdAt: string;

  @ApiPropertyOptional({ name: 'updated_at' })
  updatedAt?: string;

  @ApiProperty({ name: 'expires_at' })
  expiresAt: string;

  constructor(
    assignmentId: number,
    escrowAddress: string,
    chainId: number,
    jobType: string,
    status: AssignmentStatus,
    rewardAmount: number,
    rewardToken: string,
    createdAt: string,
    expiresAt: string,
  ) {
    this.assignmentId = assignmentId;
    this.escrowAddress = escrowAddress;
    this.chainId = chainId;
    this.jobType = jobType;
    this.status = status;
    this.rewardAmount = rewardAmount;
    this.rewardToken = rewardToken;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
  }
}
