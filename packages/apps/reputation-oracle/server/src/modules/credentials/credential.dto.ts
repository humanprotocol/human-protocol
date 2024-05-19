import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateCredentialDto {
  @IsString()
  public reference: string;

  @IsString()
  public description: string;

  @IsString()
  public url: string;

  @IsDateString()
  public startsAt: Date;

  @IsOptional()
  @IsDateString()
  public expiresAt?: Date;
}
