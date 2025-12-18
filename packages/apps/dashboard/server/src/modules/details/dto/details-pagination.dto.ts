import { OrderDirection } from '@human-protocol/sdk';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { OperatorsOrderBy } from '../../../common/enums/operator';
import { IsRoleValid } from './validation/role-validation';
import { ChainIdDto } from './common.dto';

export class OperatorsPaginationDto extends ChainIdDto {
  @ApiPropertyOptional({
    enum: OperatorsOrderBy,
    default: OperatorsOrderBy.STAKED_AMOUNT,
  })
  @IsEnum(OperatorsOrderBy)
  @IsIn(Object.values(OperatorsOrderBy))
  @IsOptional()
  public orderBy?: OperatorsOrderBy = OperatorsOrderBy.STAKED_AMOUNT;

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

export class DetailsTransactionsPaginationDto extends ChainIdDto {
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

export class DetailsEscrowsPaginationDto extends ChainIdDto {
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
