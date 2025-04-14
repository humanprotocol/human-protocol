import { ChainId } from '@human-protocol/sdk';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEthereumAddress, IsOptional, Min } from 'class-validator';

import {
  ReputationEntityType,
  ReputationLevel,
  ReputationOrderBy,
  SortDirection,
} from '../../common/enums';
import { IsChainId, IsLowercasedEnum } from '../../common/validators';

export class ReputationGetAllQueryDto {
  @ApiPropertyOptional({
    enum: ChainId,
    name: 'chain_id',
  })
  @IsChainId()
  @IsOptional()
  chainId?: ChainId;

  @ApiPropertyOptional({
    type: [ReputationEntityType],
    enum: ReputationEntityType,
    name: 'roles',
  })
  /**
   * NOTE: Order here matters
   *
   * Query param is parsed as string if single value and array if multiple
   */
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsLowercasedEnum(ReputationEntityType, { each: true })
  @IsOptional()
  roles?: ReputationEntityType[];

  @ApiPropertyOptional({
    enum: ReputationOrderBy,
    default: ReputationOrderBy.CREATED_AT,
  })
  @IsLowercasedEnum(ReputationOrderBy)
  @IsOptional()
  orderBy?: ReputationOrderBy;

  @ApiPropertyOptional({
    enum: SortDirection,
    default: SortDirection.DESC,
  })
  @IsLowercasedEnum(SortDirection)
  @IsOptional()
  orderDirection?: SortDirection;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Min(1)
  @Transform(({ value }) => Number(value))
  first?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => Number(value))
  skip?: number;
}

export class ReputationGetParamsDto {
  @ApiProperty()
  @IsEthereumAddress()
  address: string;
}

export class ReputationGetQueryDto {
  @ApiProperty({ enum: ChainId, name: 'chain_id' })
  @IsChainId()
  chainId: ChainId;
}

export class ReputationDto {
  @ApiProperty({ enum: ChainId, name: 'chain_id' })
  chainId: ChainId;

  @ApiProperty()
  address: string;

  @ApiProperty({ enum: ReputationLevel })
  reputation: ReputationLevel;

  @ApiProperty({ enum: ReputationEntityType })
  role: ReputationEntityType;
}
