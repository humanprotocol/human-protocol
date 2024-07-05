import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
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
  public status: KycStatus;
}

export class KycUpdateWebhookQueryDto {
  @ApiProperty()
  @IsString()
  public secret: string;
}

export class KycSignedAddressDto {
  @ApiProperty({ name: 'key' })
  @IsString()
  key: string;

  @ApiProperty({ name: 'value' })
  @IsString()
  value: string;
}
