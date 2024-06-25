import {
  IsString,
  IsOptional,
  IsDateString,
  IsEthereumAddress,
} from 'class-validator';

export class CreateQualificationDto {
  @IsString()
  public reference: string;

  @IsString()
  public title: string;

  @IsString()
  public description: string;

  @IsOptional()
  @IsDateString()
  public expiresAt?: Date;
}

export class AssignQualificationDto {
  @IsString()
  public reference: string;

  @IsOptional()
  @IsEthereumAddress()
  public workerAddresses?: string[];

  @IsOptional()
  @IsString()
  public workerEmails?: string[];
}

export class UnassignQualificationDto {
  @IsString()
  public reference: string;

  @IsOptional()
  @IsEthereumAddress()
  public workerAddresses?: string[];

  @IsOptional()
  @IsString()
  public workerEmails?: string[];
}
