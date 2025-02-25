import { ChainId } from '@human-protocol/sdk';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEthereumAddress,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  ReputationEntityType,
  ReputationLevel,
  ReputationOrderBy,
  SortDirection,
} from '../../common/enums';
import { IsChainId, IsLowercasedEnum } from '../../common/validators';

export class ReputationCreateDto {
  @ApiProperty({ name: 'chain_id' })
  @IsChainId()
  public chainId: ChainId;

  @ApiProperty()
  @IsString()
  public address: string;

  @ApiProperty({ name: 'reputation_points' })
  @IsNumber()
  public reputationPoints: number;

  @ApiProperty()
  @IsLowercasedEnum(ReputationEntityType)
  public type: ReputationEntityType;
}

export class ReputationUpdateDto {
  @ApiProperty({ name: 'reputation_points' })
  @IsNumber()
  public reputationPoints: number;
}

export class ReputationGetAllQueryDto {
  @ApiPropertyOptional({
    enum: ChainId,
    name: 'chain_id',
  })
  @IsChainId()
  @IsOptional()
  public chainId?: ChainId;

  @ApiPropertyOptional({
    type: [ReputationEntityType],
    enum: ReputationEntityType,
    name: 'roles',
  })
  /**
   * NOTE: Order here matters
   *
   * Query param is string if single value and array if multiple
   */
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsLowercasedEnum(ReputationEntityType, { each: true })
  @IsOptional()
  public roles?: ReputationEntityType[];

  @ApiPropertyOptional({
    enum: ReputationOrderBy,
    default: ReputationOrderBy.CREATED_AT,
  })
  @IsLowercasedEnum(ReputationOrderBy)
  @IsOptional()
  public orderBy?: ReputationOrderBy;

  @ApiPropertyOptional({
    enum: SortDirection,
    default: SortDirection.DESC,
  })
  @IsLowercasedEnum(SortDirection)
  @IsOptional()
  public orderDirection?: SortDirection;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Min(1)
  @Transform(({ value }) => Number(value))
  public first?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => Number(value))
  public skip?: number;
}

export class ReputationGetParamsDto {
  @ApiProperty()
  @IsString()
  @IsEthereumAddress()
  public address: string;
}

export class ReputationGetQueryDto {
  @ApiProperty({ enum: ChainId, name: 'chain_id' })
  @IsChainId()
  public chainId: ChainId;
}

export class ReputationDto {
  @ApiProperty({ enum: ChainId, name: 'chain_id' })
  @IsChainId()
  chainId: ChainId;

  @ApiProperty()
  @IsString()
  @IsEthereumAddress()
  address: string;

  @ApiProperty({ enum: ReputationLevel })
  @IsLowercasedEnum(ReputationLevel)
  reputation: ReputationLevel;

  @ApiProperty({ enum: ReputationEntityType })
  @IsLowercasedEnum(ReputationEntityType)
  role: ReputationEntityType;
}
