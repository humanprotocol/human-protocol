import { ChainId } from '@human-protocol/sdk';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEthereumAddress } from 'class-validator';
import {
  IsEnum,
  IsObject,
  IsString,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { EventType, OracleType } from '../../common/enums/webhook';

export class EventData {
  @ApiProperty({ name: 'invalid_manifest', required: false })
  @IsString()
  @IsOptional()
  invalidManifest?: string;

  @ApiProperty({
    name: 'manifest_cannot_be_downloaded',
    required: false,
  })
  @IsString()
  @IsOptional()
  manifestCannotBeDownloaded?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  reason?: string;
}

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

  @ApiProperty()
  @IsString()
  @IsOptional()
  public reason?: string;
}
