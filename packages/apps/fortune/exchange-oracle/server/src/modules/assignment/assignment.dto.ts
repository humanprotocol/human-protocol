import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import {
  AssignmentStatus,
  AssignmentSortField,
  JobSortField,
} from '../../common/enums/job';
import { PageOptionsDto } from '../../common/pagination/pagination.dto';
import { ChainId } from '@human-protocol/sdk';

export class CreateAssignmentDto {
  @ApiProperty({
    enum: ChainId,
    name: 'chain_id',
  })
  @IsEnum(ChainId)
  chainId: ChainId;

  @ApiProperty({ name: 'escrow_address' })
  @IsString()
  escrowAddress: string;
}

export class GetAssignmentsDto extends PageOptionsDto {
  @ApiPropertyOptional({ name: 'chain_id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  chainId: number;

  @ApiPropertyOptional({ name: 'job_type' })
  @IsOptional()
  @IsString()
  jobType: string;

  @ApiPropertyOptional({ name: 'escrow_address' })
  @IsOptional()
  @IsString()
  escrowAddress: string;

  @ApiPropertyOptional({ enum: AssignmentStatus })
  @IsEnum(AssignmentStatus)
  @IsOptional()
  status: AssignmentStatus;

  @ApiPropertyOptional({
    name: 'sort_field',
    enum: JobSortField,
    default: JobSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(AssignmentSortField)
  sortField?: AssignmentSortField = AssignmentSortField.CREATED_AT;
}

export class AssignmentDto {
  assignmentId: number;
  escrowAddress: string;
  chainId: number;
  jobType: string;
  status: AssignmentStatus;
  url?: string;
  rewardAmount: number;
  rewardToken: string;
  createdAt: number;
  updatedAt?: number;
  expiresAt: number;

  constructor(
    assignmentId: number,
    escrowAddress: string,
    chainId: number,
    jobType: string,
    status: AssignmentStatus,
    rewardAmount: number,
    rewardToken: string,
    createdAt: number,
    expiresAt: number,
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
