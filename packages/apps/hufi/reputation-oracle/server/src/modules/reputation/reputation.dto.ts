import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsEthereumAddress,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ChainId } from '@human-protocol/sdk';
import { ReputationEntityType } from '../../common/enums';
import { Transform } from 'class-transformer';

export class ReputationCreateDto {
  @ApiProperty()
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsString()
  public address: string;

  @ApiProperty()
  @IsNumber()
  public reputationPoints: number;

  @ApiProperty()
  @IsEnum(ReputationEntityType)
  public type: ReputationEntityType;
}

export class ReputationUpdateDto {
  @ApiProperty()
  @IsNumber()
  public reputationPoints: number;
}

export class ReputationGetAllQueryDto {
  @ApiPropertyOptional({
    enum: ChainId,
  })
  @IsEnum(ChainId)
  @IsOptional()
  @Transform(({ value }) => Number(value))
  public chainId?: ChainId;
}

export class ReputationGetParamsDto {
  @ApiProperty()
  @IsString()
  @IsEthereumAddress()
  public address: string;
}

export class ReputationGetQueryDto {
  @ApiProperty({ enum: ChainId })
  @IsEnum(ChainId)
  @Transform(({ value }) => Number(value))
  public chainId: ChainId;
}
