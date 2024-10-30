import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { EventType, WebhookType } from '../../common/enums';
import { ChainId } from '@human-protocol/sdk';
import { IsEnumCaseInsensitive } from '../../common/decorators';

export class CreateWebhookDto {
  @ApiProperty({ name: 'chain_id' })
  @IsEnumCaseInsensitive(ChainId)
  public chainId: ChainId;

  @ApiProperty({ name: 'event_type' })
  @IsEnumCaseInsensitive(EventType)
  public eventType: EventType;

  @ApiProperty({ name: 'escrow_address' })
  @IsString()
  public escrowAddress: string;

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
