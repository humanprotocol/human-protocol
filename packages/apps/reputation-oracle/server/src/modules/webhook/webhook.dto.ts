import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsObject,
  IsString,
  IsUrl,
} from 'class-validator';
import { EventType, WebhookStatus } from '../../common/enums';
import { ChainId } from '@human-protocol/sdk';

export class WebhookIncomingDto {
  @ApiProperty({ name: 'chain_id' })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty({ name: 'event_type' })
  @IsEnum(EventType)
  public eventType: EventType;

  @ApiProperty({ name: 'escrow_address' })
  @IsString()
  public escrowAddress: string;

  @ApiPropertyOptional({ name: 'event_data' })
  @IsObject()
  public eventData?: any;
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
