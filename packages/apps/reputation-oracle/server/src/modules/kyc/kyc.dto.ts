import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';
import { KycStatus } from '../../common/enums/user';

export class KycSessionDto {
  @ApiProperty({ name: 'url' })
  @IsUrl()
  public url: string;
}

export class KycDocumentDto {
  @ApiProperty()
  @IsString()
  public country: string;
}

export class KycVerificationDto {
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
  public document: KycDocumentDto;
}

export class TechnicalDataDto {
  @ApiProperty({ nullable: true })
  @IsString()
  @IsOptional()
  public ip: string | null;
}

export class KycStatusDto {
  @ApiProperty()
  @IsString()
  public status: string;

  @ApiProperty({ type: KycVerificationDto })
  @IsObject()
  public verification: KycVerificationDto;

  @ApiProperty({ type: TechnicalDataDto })
  @IsObject()
  public technicalData: TechnicalDataDto;
}

export class KycSignedAddressDto {
  @ApiProperty({ name: 'key' })
  @IsString()
  key: string;

  @ApiProperty({ name: 'value' })
  @IsString()
  value: string;
}
