import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChainId } from '@human-protocol/sdk';

export class DetailsPaginationDto {
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
