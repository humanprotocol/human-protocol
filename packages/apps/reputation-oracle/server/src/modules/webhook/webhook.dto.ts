import { ChainId } from '@human-protocol/sdk';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEthereumAddress, IsObject, IsOptional } from 'class-validator';

import { IncomingWebhookEventType } from '../../common/enums';
import { IsChainId, IsLowercasedEnum } from '../../common/validators';

export class IncomingWebhookDto {
  @ApiProperty({ name: 'chain_id' })
  @IsChainId()
  chainId: ChainId;

  @ApiProperty({ name: 'event_type' })
  @IsLowercasedEnum(IncomingWebhookEventType)
  eventType: IncomingWebhookEventType;

  @ApiProperty({ name: 'escrow_address' })
  @IsEthereumAddress()
  escrowAddress: string;

  @ApiPropertyOptional({ name: 'event_data' })
  @IsOptional()
  @IsObject()
  eventData?: Record<string, unknown>;
}

export type IncomingWebhookData = {
  chainId: ChainId;
  eventType: IncomingWebhookEventType;
  escrowAddress: string;
  eventData?: Record<string, unknown>;
};
