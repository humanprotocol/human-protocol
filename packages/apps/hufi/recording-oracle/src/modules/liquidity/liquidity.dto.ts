import { ApiProperty } from '@nestjs/swagger';
import { ChainId } from '@human-protocol/sdk';
import { IsBoolean, IsEnum, IsNumber, IsPositive, IsString } from 'class-validator';

import { IsValidEthereumAddress } from '../../common/validators';
import { JobRequestType } from '../../common/enums/job';
import { Exchange } from '../../common/enums/exchange';

export class liquidityRequestDto {
  @ApiProperty()
  @IsString()
  @IsValidEthereumAddress()
  public escrowAddress: string;

  @ApiProperty({
    enum: ChainId,
  })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsString()
  @IsValidEthereumAddress()
  public liquidityProvider: string;

  @ApiProperty()
  @IsBoolean()
  public save:boolean;
}


export class CEXLiquidityRequestDto {
  @ApiProperty()
  @IsString()
  @IsValidEthereumAddress()
  public escrowAddress: string;

  @ApiProperty({
    enum: ChainId,
  })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsString()
  @IsValidEthereumAddress()
  public liquidityProviderAPIKEY: string;

  @ApiProperty()
  @IsString()
  @IsValidEthereumAddress()
  public liquidityProviderAPISecret: string;

  @ApiProperty()
  @IsBoolean()
  public save:boolean;
}


export class SaveLiquidityDto {
  public url: string;
  public hash: string;
}

export class liquidityResponseDto{
  public liquidityScore: string;
  public liquidityProvider: string;
}

export class CampaignManifestDto {
  @IsNumber()
  @IsPositive()
  startBlock: number;
  @IsNumber()
  @IsPositive()
  endBlock: number;

  @IsString()
  @IsEnum(Exchange)
  exchangeName: Exchange;

  @IsString()
  tokenA: string;
  @IsString()
  tokenB: string;

  @IsNumber()
  @IsPositive()
  campaignDuration: number;

  @IsNumber()
  @IsPositive()
  fundAmount: number;

  @IsString()
  requesterDescription: string; // address of launcher

  @IsEnum(JobRequestType)
  requestType: JobRequestType;
}

export class liquidityDto {
  chainId: ChainId;
  liquidityProvider: string;
  liquidityScore: string;
}