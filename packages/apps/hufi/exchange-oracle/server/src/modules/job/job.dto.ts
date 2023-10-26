import { ApiProperty } from '@nestjs/swagger';
import { ChainId } from '@human-protocol/sdk';
import { IsEnum, IsString, IsNumber, IsPositive } from 'class-validator';
import { IsValidEthereumAddress } from '../../common/validators';
import { EventType } from '../../common/enums/webhook';
import { Exchange } from '../../common/enums/exchange';
import { JobRequestType } from '../../common/enums/jobs';

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

export class campaignDetailsDto {
  escrowAddress: string;
  chainId: number;
  manifest: CampaignManifestDto;
}

export class EscrowFailedWebhookDto {
  public chain_id: ChainId;
  public escrow_address: string;
  public event_type: EventType;
  public reason: string;
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
}
