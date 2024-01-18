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
  reason?: string;

  @ApiProperty()
  @IsString()
  service: string;

  @ApiProperty({ name: 'session_id' })
  @IsString()
  public sessionId: string;

  @ApiProperty({
    enum: KYCStatus,
  })
  @IsEnum(KYCStatus)
  public status: KYCStatus;
}
