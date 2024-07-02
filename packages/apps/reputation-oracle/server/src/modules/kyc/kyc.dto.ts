import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { KycStatus } from '../../common/enums/user';

export class KycSessionDto {
  @ApiProperty({ name: 'session_id' })
  @IsString()
  public sessionId: string;
}

export class KycStatusDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  public reason?: string;

  @ApiProperty({ name: 'step_id' })
  @IsString()
  public stepId: string;

  @ApiProperty()
  @IsString()
  public service: string;

  @ApiProperty({ name: 'session_id' })
  @IsString()
  public sessionId: string;

  @ApiProperty({
    enum: KycStatus,
  })
  @IsEnum(KycStatus)
  public state: KycStatus;
}

export class KycUpdateWebhookQueryDto {
  @ApiProperty()
  @IsString()
  public secret: string;
}

export class KycCreateDto {
  @ApiProperty()
  @IsString()
  public sessionId: string;

  @ApiProperty({
    enum: KycStatus,
  })
  @IsEnum(KycStatus)
  public status: KycStatus;

  @ApiProperty()
  @IsNumber()
  public userId: number;
}

export class KycUpdateDto {
  @ApiProperty({
    enum: KycStatus,
  })
  @IsEnum(KycStatus)
  public status: KycStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  public message?: string;
}

export class KycSignedAddressDto {
  key: string;
  value: string;
}
