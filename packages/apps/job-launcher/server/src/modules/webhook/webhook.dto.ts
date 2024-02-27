import { ChainId } from '@human-protocol/sdk';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsValidEthereumAddress } from '../../common/validators/ethers';
import {
  IsEnum,
  IsObject,
  IsString,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { EventType, OracleType } from '../../common/enums/webhook';

export class InvalidManifest {
  @ApiProperty({ name: 'invalid_manifest' })
  @IsString()
  invalidManifest: string;

  @ApiProperty()
  @IsString()
  reason?: string;
}

export class ManifestCannotBeDownloaded {
  @ApiProperty({ name: 'manifest_cannot_be_downloaded' })
  @IsString()
  manifestCannotBeDownloaded: string;

  @ApiProperty()
  @IsString()
  reason?: string;
}

export type EventData = InvalidManifest | ManifestCannotBeDownloaded;

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
  @IsValidEthereumAddress()
  public escrowAddress: string;

  @ApiProperty({ enum: EventType, name: 'event_type' })
  @IsEnum(EventType)
  public eventType: EventType;

  @ApiPropertyOptional({ name: 'event_data' })
  @IsObject()
  public eventData?: EventData;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  public reason?: string;
}
