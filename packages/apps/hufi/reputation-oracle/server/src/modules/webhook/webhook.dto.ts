import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsString,
  IsUrl,
} from 'class-validator';
import { EventType, WebhookStatus } from '../../common/enums';
import { ChainId } from '@human-protocol/sdk';
import { JobRequestType } from '../../common/enums';
import { Exchange } from '../../common/enums/exchange';

export class WebhookIncomingDto {
  @ApiProperty()
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsEnum(EventType)
  public eventType: EventType;

  @ApiProperty()
  @IsString()
  public escrowAddress: string;
}

export class WebhookIncomingCreateDto {
  @IsEnum(ChainId)
  public chainId: ChainId;

  @IsString()
  public escrowAddress: string;

  @IsEnum(WebhookStatus)
  public status: WebhookStatus;

  @IsDate()
  public waitUntil: Date;

  @IsNumber()
  public retriesCount: number;
}

export class WebhookIncomingUpdateDto {
  @ApiPropertyOptional()
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiPropertyOptional()
  @IsString()
  public escrowAddress: string;

  @ApiPropertyOptional()
  @IsUrl()
  public resultsUrl: string;

  @ApiPropertyOptional()
  @IsBoolean()
  public checkPassed: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  public retriesCount: number;

  @ApiPropertyOptional({
    enum: WebhookStatus,
  })
  @IsEnum(WebhookStatus)
  public status: WebhookStatus;

  @ApiPropertyOptional()
  @IsDate()
  public waitUntil: Date;
}

export class CampaignManifestDto {
  startBlock: number;
  endBlock: number;
  exchangeName: Exchange;
  tokenA: string;
  tokenB: string;
  campaignDuration: number;
  fundAmount: number;
  requesterDescription: string;
  requestType: JobRequestType;
}

export class liquidityDto {
  chainId: ChainId;
  liquidityProvider: string;
  liquidityScore: string;
}
