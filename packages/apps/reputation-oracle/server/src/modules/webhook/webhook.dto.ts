import { ChainId } from '@human-protocol/sdk';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEthereumAddress, IsObject, IsOptional } from 'class-validator';
import { EventType } from '../../common/enums';
import { IsChainId, IsLowercasedEnum } from '../../common/validators';

export class IncomingWebhookDto {
  @ApiProperty({ name: 'chain_id' })
  @IsChainId()
  public chainId: ChainId;

  @ApiProperty({ name: 'event_type' })
  @IsLowercasedEnum(EventType)
  public eventType: EventType;

  @ApiProperty({ name: 'escrow_address' })
  @IsEthereumAddress()
  public escrowAddress: string;

  @ApiPropertyOptional({ name: 'event_data' })
  @IsOptional()
  @IsObject()
  public eventData?: any;
}
