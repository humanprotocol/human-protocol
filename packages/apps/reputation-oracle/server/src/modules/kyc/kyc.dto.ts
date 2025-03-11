import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { KycStatus } from './constants';

export class StartSessionResponseDto {
  @ApiProperty({ name: 'url' })
  @IsUrl()
  public url: string;
}

export class DocumentData {
  @ApiProperty({ nullable: true })
  @IsString()
  @IsOptional()
  public country: string | null;
}

export class VerificationData {
  @ApiProperty()
  @IsUUID()
  public id: string;

  @ApiProperty()
  @IsString()
  public vendorData: string;

  @ApiProperty()
  @IsEnum(KycStatus)
  public status: KycStatus;

  @ApiProperty({ nullable: true })
  @IsString()
  @IsOptional()
  public reason: string | null;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => DocumentData)
  public document: DocumentData;
}

export class UpdateKycStatusDto {
  @ApiProperty()
  @IsString()
  public status: string;

  @ApiProperty({ type: VerificationData })
  @IsObject()
  @ValidateNested()
  @Type(() => VerificationData)
  public verification: VerificationData;
}

export class KycSignedAddressDto {
  @ApiProperty({ name: 'key' })
  @IsString()
  key: string;

  @ApiProperty({ name: 'value' })
  @IsString()
  value: string;
}
