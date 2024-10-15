import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEthereumAddress,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ChainId } from '@human-protocol/sdk';
import { ReputationEntityType, ReputationLevel } from '../../common/enums';
import { Transform } from 'class-transformer';
import { IsEnumCaseInsensitive } from '../../common/decorators';

export class ReputationCreateDto {
  @ApiProperty({ name: 'chain_id' })
  @IsEnumCaseInsensitive(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsString()
  public address: string;

  @ApiProperty({ name: 'reputation_points' })
  @IsNumber()
  public reputationPoints: number;

  @ApiProperty()
  @IsEnumCaseInsensitive(ReputationEntityType)
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
  @IsEnumCaseInsensitive(ChainId)
  @IsOptional()
  @Transform(({ value }) => Number(value))
  public chainId?: ChainId;

  @ApiPropertyOptional({
    type: [ReputationEntityType],
    enum: ReputationEntityType,
    name: 'roles',
  })
  @IsEnumCaseInsensitive(ReputationEntityType, { each: true })
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
  @IsEnumCaseInsensitive(ChainId)
  @Transform(({ value }) => Number(value))
  public chainId: ChainId;
}

export class ReputationDto {
  @ApiProperty({ enum: ChainId, name: 'chain_id' })
  @IsEnumCaseInsensitive(ChainId)
  @Transform(({ value }) => Number(value))
  chainId: ChainId;

  @ApiProperty()
  @IsString()
  @IsEthereumAddress()
  address: string;

  @ApiProperty({ enum: ReputationLevel })
  @IsEnumCaseInsensitive(ReputationLevel)
  @Transform(({ value }) => Number(value))
  reputation: ReputationLevel;
}
