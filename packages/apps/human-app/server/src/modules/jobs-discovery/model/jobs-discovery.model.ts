import { AutoMap } from '@automapper/classes';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { IsEnumCaseInsensitive } from '../../../common/decorators';
import { JobStatus } from '../../../common/enums/global-common';
import {
  PageableDto,
  PageableParams,
  PageableResponse,
} from '../../../common/utils/pageable.model';
import { FetchJobsResponseItem } from '../../../integrations/exchange-oracle/model/exchange-oracle.model';

export enum JobDiscoverySortField {
  REWARD_AMOUNT = 'reward_amount',
  CREATED_AT = 'created_at',
}

export class GetJobsQueryDto extends PageableDto {
  @AutoMap()
  @IsString()
  @ApiProperty()
  oracle_address: string;

  @AutoMap()
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  escrow_address?: string;

  @AutoMap()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  chain_id?: number;

  @AutoMap()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  job_type?: string;

  @AutoMap()
  @ApiPropertyOptional({ enum: JobStatus })
  @IsEnumCaseInsensitive(JobStatus)
  @IsOptional()
  status: JobStatus;

  @AutoMap()
  @IsOptional()
  @IsEnumCaseInsensitive(JobDiscoverySortField)
  @ApiPropertyOptional({ enum: JobDiscoverySortField })
  sort_field?: JobDiscoverySortField;
}

export class GetJobsParams extends PageableParams {
  @AutoMap()
  escrowAddress?: string;

  @AutoMap()
  chainId?: number;

  @AutoMap()
  jobType?: string;

  @AutoMap()
  status: JobStatus;

  @AutoMap()
  sortField?: JobDiscoverySortField;

  qualifications?: string[];
}

export class GetJobsCommand {
  @AutoMap()
  oracleAddress: string;

  @AutoMap()
  data: GetJobsParams;
}

export class DiscoveredJob implements Required<FetchJobsResponseItem> {
  @ApiProperty()
  escrow_address: string;

  @ApiProperty()
  chain_id: number;

  @ApiProperty()
  job_type: string;

  @ApiProperty()
  status: JobStatus;

  @ApiProperty()
  job_description: string;

  @ApiProperty()
  reward_amount: string;

  @ApiProperty()
  reward_token: string;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;

  @ApiProperty()
  qualifications: string[];
}

export class GetJobsResponseDto extends PageableResponse {
  @ApiProperty({
    type: DiscoveredJob,
    isArray: true,
  })
  results: DiscoveredJob[];
}
