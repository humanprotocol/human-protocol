import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';
import { EventType } from '../../common/enums';
import { ChainId } from '@human-protocol/sdk';
import { IsEnumCaseInsensitive } from '../../common/decorators';

export class CreateWebhookIncomingDto {
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
