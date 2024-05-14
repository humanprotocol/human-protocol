import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsUrl,
  IsEnum,
} from 'class-validator';
import { CredentialStatus } from '../../common/enums/credential';
export class CreateCredentialDto {
  @ApiProperty()
  @IsString()
  public reference: string;

  @ApiProperty()
  @IsString()
  public description: string;

  @ApiProperty()
  @IsString()
  public url: string;

  @ApiProperty({ name: 'start_at' })
  @IsDateString()
  public startsAt: Date;

  @ApiPropertyOptional({ name: 'expires_at' })
  @IsOptional()
  @IsDateString()
  public expiresAt?: Date;
}

export class CredentialQueryDto {
  @ApiPropertyOptional({ enum: CredentialStatus, name: 'credential_status' })
  @IsOptional()
  @IsEnum(CredentialStatus)
  public status?: CredentialStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public reference?: string;
}

export class CredentialDto {
  @ApiProperty()
  public id: number;

  @ApiProperty()
  @IsString()
  public reference: string;

  @ApiProperty()
  @IsString()
  public description: string;

  @ApiProperty()
  @IsUrl()
  public url: string;

  @ApiProperty({ enum: CredentialStatus, name: 'credential_status' })
  @IsEnum(CredentialStatus)
  public status: CredentialStatus;

  @ApiProperty({ name: 'start_at' })
  @IsDateString()
  public startsAt: Date;

  @ApiPropertyOptional({ name: 'expires_at' })
  @IsOptional()
  @IsDateString()
  public expiresAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public certificate?: string;
}
