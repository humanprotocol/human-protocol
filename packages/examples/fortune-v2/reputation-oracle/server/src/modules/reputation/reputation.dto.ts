import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { ChainId } from '@human-protocol/sdk';
import { ReputationEntityType } from '../../common/enums';

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
