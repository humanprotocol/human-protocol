import { ChainId } from '@human-protocol/sdk';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsString,
  IsBoolean,
  IsOptional,
  IsEthereumAddress,
} from 'class-validator';
import { EventType, OracleType } from '../../common/enums/webhook';
import { IsEnumCaseInsensitive } from '../../common/utils/enums';
export class FailedEventData {
  @ApiProperty()
  @IsString()
  @IsOptional()
  reason?: string;
}

export type EventData = FailedEventData;

export class WebhookDto {
  @ApiProperty()
  @IsEnumCaseInsensitive(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsEnumCaseInsensitive(EventType)
  public eventType: EventType;

  @ApiProperty()
  @IsString()
  public escrowAddress: string;

  @ApiProperty()
  @IsEnumCaseInsensitive(OracleType)
  public oracleType: OracleType;

  @ApiProperty()
  @IsBoolean()
  public hasSignature: boolean;
}

export class WebhookDataDto {
  @ApiProperty({ enum: ChainId, name: 'chain_id' })
  @IsEnumCaseInsensitive(ChainId)
  public chainId: ChainId;

  @ApiProperty({ name: 'escrow_address' })
  @IsString()
  @IsEthereumAddress()
  public escrowAddress: string;

  @ApiProperty({ enum: EventType, name: 'event_type' })
  @IsEnumCaseInsensitive(EventType)
  public eventType: EventType;

  @ApiPropertyOptional({ name: 'event_data' })
  @IsOptional()
  @IsObject()
  public eventData?: EventData;
}
