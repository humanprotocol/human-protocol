import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { EventType, WebhookType } from '../../common/enums';
import { ChainId } from '@human-protocol/sdk';

export class CreateWebhookDto {
  @ApiProperty({ name: 'chain_id' })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty({ name: 'escrow_address' })
  @IsString()
  public escrowAddress: string;

  @ApiProperty({ name: 'event_type' })
  @IsEnum(EventType)
  public eventType: EventType;

  @ApiPropertyOptional({ name: 'event_data' })
  @IsOptional()
  @IsObject()
  public eventData?: any;
}

export class WebhookDto extends CreateWebhookDto {
  @IsEnum(WebhookType)
  public type: WebhookType;

  @IsOptional()
  @IsString()
  public callbackUrl?: string;
}

export class SendWebhookDto {
  @IsEnum(ChainId)
  public chainId: ChainId;

  @IsEnum(EventType)
  public eventType: EventType;

  @IsString()
  public escrowAddress: string;
}
