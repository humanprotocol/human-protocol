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
import { IsEnumWithMetadata } from '../../common/utils/enums';
export class FailedEventData {
  @ApiProperty()
  @IsString()
  @IsOptional()
  reason?: string;
}

export type EventData = FailedEventData;

export class WebhookDto {
  @ApiProperty()
  @IsEnumWithMetadata(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsEnumWithMetadata(EventType)
  public eventType: EventType;

  @ApiProperty()
  @IsString()
  public escrowAddress: string;

  @ApiProperty()
  @IsEnumWithMetadata(OracleType)
  public oracleType: OracleType;

  @ApiProperty()
  @IsBoolean()
  public hasSignature: boolean;
}

export class WebhookDataDto {
  @ApiProperty({ enum: ChainId, name: 'chain_id' })
  @IsEnumWithMetadata(ChainId)
  public chainId: ChainId;

  @ApiProperty({ name: 'escrow_address' })
  @IsString()
  @IsEthereumAddress()
  public escrowAddress: string;

  @ApiProperty({ enum: EventType, name: 'event_type' })
  @IsEnumWithMetadata(EventType)
  public eventType: EventType;

  @ApiPropertyOptional({ name: 'event_data' })
  @IsOptional()
  @IsObject()
  public eventData?: EventData;
}
