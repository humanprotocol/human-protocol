import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { KycStatus } from './constants';

export class StartSessionResponseDto {
  @ApiProperty()
  url: string;
}

class DocumentData {
  @ApiProperty({ nullable: true })
  @IsString()
  @IsOptional()
  country: string | null;
}

class VerificationData {
  @ApiProperty()
  @IsUUID()
  id: string;

  // We are using vendorData to store userId
  @ApiProperty()
  @IsString()
  vendorData: string;

  @ApiProperty()
  @IsEnum(KycStatus)
  status: KycStatus;

  @ApiProperty({ nullable: true })
  @IsString()
  @IsOptional()
  reason: string | null;

  @ApiProperty()
  @ValidateNested()
  @Type(() => DocumentData)
  document: DocumentData;
}

export class UpdateKycStatusDto {
  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty({ type: VerificationData })
  @ValidateNested()
  @Type(() => VerificationData)
  verification: VerificationData;
}

export class KycSignedAddressDto {
  @ApiProperty({ name: 'key' })
  @IsString()
  key: string;

  @ApiProperty({ name: 'value' })
  @IsString()
  value: string;
}
