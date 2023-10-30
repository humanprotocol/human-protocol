import { ApiProperty } from '@nestjs/swagger';
import { ChainId } from '@human-protocol/sdk';
import { IsBoolean, IsEnum, IsNumber, IsPositive, IsString, IsUrl } from 'class-validator';

import { IsValidEthereumAddress } from '@/common/validators';
import { Exchange } from '@/common/enums/exchange';
import { JobRequestType } from '@/common/enums/job';
import { EventType } from '@/common/enums/webhook';

export class liquidityScores {
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
  @IsUrl()
  public LiquidtyscoresUrl: string;
}
export class EscrowFailedWebhookDto {
  public chain_id: ChainId;
  public escrow_address: string;
  public event_type: EventType;
  public reason: string;
}

export class ManifestDto {
  public startBlock: number;
  public endBlock: number;
  public exchangeName: Exchange;
  public tokenA: string;
  public tokenB: string;
  public campaignDuration: number;
  public fundAmount: number;
  public requesterDescription: string;

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
export class SaveSolutionsDto {
  public url: string;
  public hash: string;
}