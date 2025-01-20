import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChainId, OrderDirection } from '@human-protocol/sdk';

import { IsRoleValid } from './validation/role-validation';
import { LeadersOrderBy } from 'src/common/enums/leader';

export class LeadersPaginationDto {
  @ApiProperty({ enum: ChainId })
  @IsEnum(ChainId)
  @IsIn(Object.values(ChainId).filter((id) => id !== ChainId.ALL))
  @Transform(({ value }) => parseInt(value))
  public chainId: ChainId;

  @ApiPropertyOptional({
    enum: LeadersOrderBy,
    default: LeadersOrderBy.AMOUNT_STAKED,
  })
  @IsEnum(LeadersOrderBy)
  @IsIn(Object.values(LeadersOrderBy))
  @IsOptional()
  public orderBy?: LeadersOrderBy = LeadersOrderBy.AMOUNT_STAKED;

  @ApiPropertyOptional({
    enum: OrderDirection,
    default: OrderDirection.DESC,
  })
  @IsEnum(OrderDirection)
  @IsIn(Object.values(OrderDirection))
  @IsOptional()
  public orderDirection?: OrderDirection = OrderDirection.DESC;

  @ApiPropertyOptional({
    minimum: 1,
    default: 10,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  @IsOptional()
  public first?: number = 10;
}

export class DetailsTransactionsPaginationDto {
  @ApiProperty({ enum: ChainId })
  @IsEnum(ChainId)
  @IsIn(Object.values(ChainId))
  @Transform(({ value }) => parseInt(value))
  public chainId: ChainId;

  @ApiPropertyOptional({
    minimum: 0,
    default: 10,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  @IsOptional()
  public first?: number = 10;

  @ApiPropertyOptional({
    minimum: 0,
    default: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  @IsOptional()
  public skip?: number = 0;
}

export class DetailsEscrowsPaginationDto {
  @ApiProperty({ enum: ChainId })
  @IsEnum(ChainId)
  @IsIn(Object.values(ChainId))
  @Transform(({ value }) => parseInt(value))
  public chainId: ChainId;

  @ApiProperty()
  @IsString()
  @IsRoleValid()
  public role: string;

  @ApiPropertyOptional({
    minimum: 0,
    default: 10,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  @IsOptional()
  public first?: number = 10;

  @ApiPropertyOptional({
    minimum: 0,
    default: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  @IsOptional()
  public skip?: number = 0;
}
