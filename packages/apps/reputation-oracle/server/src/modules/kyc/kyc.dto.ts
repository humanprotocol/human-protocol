import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { KYCStatus } from '../../common/enums/user';

export class KYCSessionDto {
  @ApiProperty({ name: 'session_id' })
  @IsString()
  public sessionId: string;
}

export class KYCStatusDto {
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
    enum: KYCStatus,
  })
  @IsEnum(KYCStatus)
  public state: KYCStatus;
}

export class KYCUpdateWebhookQueryDto {
  @ApiProperty()
  @IsString()
  public secret: string;
}
