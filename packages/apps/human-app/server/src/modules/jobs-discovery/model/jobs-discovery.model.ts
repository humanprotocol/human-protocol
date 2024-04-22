import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import {
  JobDiscoveryFieldName,
  JobDiscoverySortField,
  JobType,
} from '../../../common/enums/global-common.interface';
import {
  PageableData,
  PageableDto,
  PageableParams,
} from '../../../common/interfaces/pageable.interface';

export class JobsDiscoveryParamsDto extends PageableDto {
  @AutoMap()
  @IsString()
  @ApiProperty()
  address?: string;
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
  @IsEnum(JobDiscoverySortField)
  @ApiPropertyOptional({ enum: JobDiscoverySortField })
  sort_field?: JobDiscoverySortField;
  @AutoMap()
  @IsEnum(JobType)
  @ApiPropertyOptional({ enum: JobType })
  job_type?: JobType;
  @AutoMap()
  @IsOptional()
  @IsEnum(JobDiscoveryFieldName, { each: true })
  @ApiPropertyOptional({ enum: JobDiscoveryFieldName, isArray: true })
  fields: JobDiscoveryFieldName[];
}

export class JobsDiscoveryParams extends PageableParams {
  @AutoMap()
  escrowAddress?: string;
  @AutoMap()
  chainId?: number;
  @AutoMap()
  sortField?: JobDiscoverySortField;
  @AutoMap()
  jobType?: JobType;
  @AutoMap()
  fields: JobDiscoveryFieldName[];
}
export class JobsDiscoveryParamsData extends PageableData {
  @AutoMap()
  escrow_address?: string;
  @AutoMap()
  chain_id?: number;
  @AutoMap()
  sort_field?: JobDiscoverySortField;
  @AutoMap()
  job_type?: JobType;
  @AutoMap()
  fields: JobDiscoveryFieldName[];
}
export class JobsDiscoveryParamsCommand {
  @AutoMap()
  address: string;
  @AutoMap()
  token: string;
  @AutoMap()
  data: JobsDiscoveryParams;
}

export class JobsDiscoveryParamsDetails {
  exchangeOracleUrl: string;
  @AutoMap()
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
