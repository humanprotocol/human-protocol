import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsUrl,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { CredentialStatus } from '../../common/enums/credential';
import { ChainId } from '@human-protocol/sdk';

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
  @ApiPropertyOptional({ enum: CredentialStatus })
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

  @ApiProperty({ enum: CredentialStatus })
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

export class AddCredentialOnChainDto {
  @ApiProperty()
  @IsNumber()
  public credential_id: number;

  @ApiProperty()
  @IsString()
  public workerAddress: string;

  @ApiProperty()
  @IsString()
  public signature: string;

  @ApiProperty({ enum: ChainId })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsString()
  public escrowAddress: string;
}

export class ValidateCredentialDto {
  @ApiProperty()
  @IsString()
  public reference: string;

  @ApiProperty()
  @IsString()
  public worker_address: string;
}
