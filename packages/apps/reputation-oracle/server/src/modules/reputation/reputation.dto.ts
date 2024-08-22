import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsEthereumAddress,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ChainId } from '@human-protocol/sdk';
import { ReputationEntityType, ReputationLevel } from '../../common/enums';
import { Transform } from 'class-transformer';

export class ReputationCreateDto {
  @ApiProperty({ name: 'chain_id' })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsString()
  public address: string;

  @ApiProperty({ name: 'reputation_points' })
  @IsNumber()
  public reputationPoints: number;

  @ApiProperty()
  @IsEnum(ReputationEntityType)
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
  @IsEnum(ChainId)
  @IsOptional()
  @Transform(({ value }) => Number(value))
  public chainId?: ChainId;

  @ApiPropertyOptional({
    type: [ReputationEntityType],
    enum: ReputationEntityType,
    name: 'roles',
  })
  @IsEnum(ReputationEntityType, { each: true })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  public roles?: ReputationEntityType[];
}

export class ReputationGetParamsDto {
  @ApiProperty()
  @IsString()
  @IsEthereumAddress()
  public address: string;
}

export class ReputationGetQueryDto {
  @ApiProperty({ enum: ChainId, name: 'chain_id' })
  @IsEnum(ChainId)
  @Transform(({ value }) => Number(value))
  public chainId: ChainId;
}

export class ReputationDto {
  @ApiProperty({ enum: ChainId, name: 'chain_id' })
  @IsEnum(ChainId)
  @Transform(({ value }) => Number(value))
  chainId: ChainId;

  @ApiProperty()
  @IsString()
  @IsEthereumAddress()
  address: string;

  @ApiProperty({ enum: ReputationLevel })
  @IsEnum(ReputationLevel)
  @Transform(({ value }) => Number(value))
  reputation: ReputationLevel;
}
