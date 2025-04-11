import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEthereumAddress,
  IsOptional,
  IsString,
  MaxLength,
  MinDate,
} from 'class-validator';

export class QualificationResponseDto {
  @ApiProperty()
  reference: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional({ name: 'expires_at' })
  expiresAt?: string;
}

export class CreateQualificationDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  title: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  description: string;

  @ApiPropertyOptional({
    name: 'expires_at',
    example: '2025-04-09T15:30:00Z',
    description: 'Expiration date in ISO 8601 format (must be a future date)',
    format: 'date-time',
  })
  @IsOptional()
  @MinDate(new Date())
  @Type(() => Date)
  expiresAt?: Date;
}

class FailedUserQualificationOperation {
  @ApiProperty({ name: 'evm_address' })
  evmAddress: string;

  @ApiProperty()
  reason: string;
}

export class UserQualificationOperationResponseDto {
  @ApiProperty()
  success: string[];

  @ApiProperty()
  failed: FailedUserQualificationOperation[];
}

export class AssignQualificationDto {
  @ApiProperty({ name: 'worker_addresses' })
  @IsEthereumAddress({ each: true })
  workerAddresses: string[];
}

export class UnassignQualificationDto {
  @ApiProperty({ name: 'worker_addresses' })
  @IsEthereumAddress({ each: true })
  workerAddresses: string[];
}
