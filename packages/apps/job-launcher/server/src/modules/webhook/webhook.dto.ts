import { ChainId } from '@human-protocol/sdk';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsString,
  IsBoolean,
  IsOptional,
  IsEthereumAddress,
} from 'class-validator';
import { EventType, OracleType } from '../../common/enums/webhook';

export class FailedEventData {
  @ApiProperty()
  @IsString()
  @IsOptional()
  reason?: string;
}

export type EventData = FailedEventData;

export class WebhookDto {
  @ApiProperty()
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsEnum(EventType)
  public eventType: EventType;

  @ApiProperty()
  @IsString()
  public escrowAddress: string;

  @ApiProperty()
  @IsEnum(OracleType)
  public oracleType: OracleType;

  @ApiProperty()
  @IsBoolean()
  public hasSignature: boolean;
}

export class WebhookDataDto {
  @ApiProperty({ enum: ChainId, name: 'chain_id' })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty({ name: 'escrow_address' })
  @IsString()
  @IsEthereumAddress()
  public escrowAddress: string;

  @ApiProperty({ enum: EventType, name: 'event_type' })
  @IsEnum(EventType)
  public eventType: EventType;

  @ApiPropertyOptional({ name: 'event_data' })
  @IsObject()
  public eventData?: EventData;
}
