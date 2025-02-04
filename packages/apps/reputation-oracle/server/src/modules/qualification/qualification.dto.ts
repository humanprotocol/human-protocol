import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEthereumAddress,
} from 'class-validator';

export class QualificationDto {
  @ApiProperty()
  public reference: string;
  @ApiProperty()
  public title: string;
  @ApiProperty()
  public description: string;
  @ApiProperty()
  public expiresAt?: string;
}

export class CreateQualificationDto {
  @ApiProperty()
  @IsString()
  public reference: string;

  @ApiProperty()
  @IsString()
  public title: string;

  @ApiProperty()
  @IsString()
  public description: string;

  @ApiPropertyOptional({ name: 'expires_at' })
  @IsOptional()
  @IsDateString()
  public expiresAt?: string;
}

export class AssignQualificationDto {
  @ApiProperty({ name: 'worker_addresses' })
  @IsEthereumAddress({ each: true })
  public workerAddresses: string[];
}

export class UnassignQualificationDto {
  @ApiProperty({ name: 'worker_addresses' })
  @IsEthereumAddress({ each: true })
  public workerAddresses: string[];
}
