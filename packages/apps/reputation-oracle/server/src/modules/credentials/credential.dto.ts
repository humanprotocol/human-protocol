import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsEthereumAddress,
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

  @ApiProperty()
  @IsDateString()
  public startsAt: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  public expiresAt?: Date;
}

export class CredentialDto {
  @ApiProperty()
  @IsString()
  public reference: string;

  @ApiProperty()
  @IsString()
  public description: string;

  @ApiPropertyOptional()
  @IsString()
  public url?: string;

  @ApiProperty({ enum: CredentialStatus })
  @IsEnum(CredentialStatus)
  public status: CredentialStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public certificate?: string;
}

export class ValidateCredentialDto {
  @ApiProperty()
  @IsString()
  public reference: string;

  @ApiProperty()
  @IsEthereumAddress()
  public workerAddress: string;
}

export class QueryCredentialDto {
  @ApiPropertyOptional({ enum: CredentialStatus })
  @IsEnum(CredentialStatus)
  @IsOptional()
  public status?: CredentialStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public reference?: string;
}

export class AddCertificateDto {
  @ApiProperty()
  @IsString()
  public reference: string;

  @ApiProperty()
  @IsString()
  public reputationOracleAddress: string;

  @ApiProperty()
  @IsString()
  public signedMessage: string;
}
