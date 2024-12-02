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
  @Expose()
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
  @Transform(({ value }) => value?.toString())
  @IsString()
  @Expose()
  public amountStaked: string;

  @ApiProperty({ example: 'High' })
  @Transform(({ value }) => value?.toString())
  @IsString()
  @Expose()
  public reputation: string;

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

  @ApiProperty({ example: 'https://example.test' })
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @Expose()
  public website?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Expose()
  public amountJobsProcessed: number;
}
