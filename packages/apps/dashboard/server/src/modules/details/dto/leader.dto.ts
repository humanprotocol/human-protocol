import { Expose, Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsString,
  IsUrl,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChainId, Role } from '@human-protocol/sdk';

export class LeaderDto {
  @ApiProperty({ example: ChainId.POLYGON_AMOY })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty({ example: '0xb794f5ea0ba39494ce839613fffba74279579268' })
  @IsString()
  public address: string;

  @ApiProperty({ example: '0.07007358932392' })
  @IsString()
  public balance: string;

  @ApiProperty({ example: Role.JobLauncher })
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Expose()
  public role?: string;

  @ApiProperty({ example: '0.07007358932392' })
  @Transform(({ value }) => value.toString())
  @IsString()
  @Expose()
  public amountStaked: string;

  @ApiProperty({ example: '0.07007358932392' })
  @Transform(({ value }) => value.toString())
  @IsString()
  @Expose()
  public amountAllocated: string;

  @ApiProperty({ example: '0.07007358932392' })
  @Transform(({ value }) => value.toString())
  @IsString()
  @Expose()
  public amountLocked: string;

  @ApiProperty({ example: 1720526098 })
  @IsNumber()
  @Expose()
  public lockedUntilTimestamp: number;

  @ApiProperty({ example: 1 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Expose()
  public reputation: number;

  @ApiProperty({ example: 3 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Expose()
  public fee: number;

  @ApiProperty({ example: ['Bounding Box', 'Skeletons'] })
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @Expose()
  public jobTypes?: string[];

  @ApiProperty({ example: 'https://example.test' })
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @Expose()
  public url?: string;

  @ApiProperty({ example: '0.07007358932392' })
  @Transform(({ value }) => value.toString())
  @IsString()
  @Expose()
  public reward: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Expose()
  public amountJobsLaunched: number;
}
