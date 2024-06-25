import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEthereumAddress,
  IsEmail,
} from 'class-validator';

export class QualificationDto {
  public reference: string;
  public title: string;
  public description: string;
  public expiresAt?: Date | null;
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
  public expiresAt?: Date;
}

export class AssignQualificationDto {
  @ApiProperty()
  @IsString()
  public reference: string;

  @ApiPropertyOptional({ name: 'worker_addresses' })
  @IsOptional()
  @IsEthereumAddress({ each: true })
  public workerAddresses?: string[];

  @ApiPropertyOptional({ name: 'worker_emails' })
  @IsOptional()
  @IsEmail({}, { each: true })
  public workerEmails?: string[];
}

export class UnassignQualificationDto {
  @ApiProperty()
  @IsString()
  public reference: string;

  @ApiPropertyOptional({ name: 'worker_addresses' })
  @IsOptional()
  @IsEthereumAddress({ each: true })
  public workerAddresses?: string[];

  @ApiPropertyOptional({ name: 'worker_emails' })
  @IsOptional()
  @IsEmail({}, { each: true })
  public workerEmails?: string[];
}
