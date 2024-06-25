import {
  IsString,
  IsOptional,
  IsDateString,
  IsEthereumAddress,
  IsEmail,
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
  @IsEthereumAddress({ each: true })
  public workerAddresses?: string[];

  @IsOptional()
  @IsEmail({}, { each: true })
  public workerEmails?: string[];
}

export class UnassignQualificationDto {
  @IsString()
  public reference: string;

  @IsOptional()
  @IsEthereumAddress({ each: true })
  public workerAddresses?: string[];

  @IsOptional()
  @IsEmail({}, { each: true })
  public workerEmails?: string[];
}
