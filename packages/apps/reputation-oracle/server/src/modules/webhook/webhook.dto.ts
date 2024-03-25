import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsString } from 'class-validator';
import { EventType } from '../../common/enums';
import { ChainId } from '@human-protocol/sdk';

export class WebhookDto {
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
