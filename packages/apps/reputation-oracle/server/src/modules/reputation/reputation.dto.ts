import { ChainId } from '@human-protocol/sdk';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEthereumAddress, IsOptional, Max, Min } from 'class-validator';

import { SortDirection } from '@/common/enums';
import { IsChainId, IsLowercasedEnum } from '@/common/validators';

import {
  MAX_REPUTATION_ITEMS_PER_PAGE,
  ReputationEntityType,
  ReputationLevel,
} from './constants';

export enum GetReputationQueryOrderBy {
  CREATED_AT = 'created_at',
  REPUTATION_POINTS = 'reputation_points',
}

export class GetReputationsQueryDto {
  @ApiPropertyOptional({
    enum: ChainId,
    name: 'chain_id',
  })
  @IsChainId()
  @IsOptional()
  chainId?: ChainId;

  @ApiPropertyOptional()
  @IsEthereumAddress()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    type: [ReputationEntityType],
    enum: ReputationEntityType,
    name: 'roles',
  })
  /**
   * NOTE: Order of decorators here matters
   *
   * Query param is parsed as string if single value passed
   * and as array if multiple
   */
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsLowercasedEnum(ReputationEntityType, { each: true })
  @IsOptional()
  roles?: ReputationEntityType[];

  @ApiPropertyOptional({
    name: 'order_by',
    enum: GetReputationQueryOrderBy,
    default: GetReputationQueryOrderBy.CREATED_AT,
  })
  @IsLowercasedEnum(GetReputationQueryOrderBy)
  @IsOptional()
  orderBy?: GetReputationQueryOrderBy;

  @ApiPropertyOptional({
    name: 'order_direction',
    enum: SortDirection,
    default: SortDirection.DESC,
  })
  @IsLowercasedEnum(SortDirection)
  @IsOptional()
  orderDirection?: SortDirection;

  @ApiPropertyOptional({
    type: Number,
    default: MAX_REPUTATION_ITEMS_PER_PAGE,
  })
  @IsOptional()
  @Min(1)
  @Max(MAX_REPUTATION_ITEMS_PER_PAGE)
  @Transform(({ value }) => Number(value))
  first?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => Number(value))
  skip?: number;
}

export class ReputationResponseDto {
  @ApiProperty({ enum: ChainId, name: 'chain_id' })
  chainId: ChainId;

  @ApiProperty()
  address: string;

  @ApiProperty({ enum: ReputationLevel })
  level: ReputationLevel;

  @ApiProperty({ enum: ReputationEntityType })
  role: ReputationEntityType;
}
