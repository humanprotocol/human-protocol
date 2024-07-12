import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChainId } from '@human-protocol/sdk';

import { IsRoleValid } from './validation/role-validation';

export class DetailsTransactionsPaginationDto {
  @ApiProperty()
  @IsEnum(ChainId)
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
  @ApiProperty()
  @IsEnum(ChainId)
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
