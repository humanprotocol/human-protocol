import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

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
