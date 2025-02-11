import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ name: 'refresh_token' })
  @IsUUID()
  public refreshToken: string;
}
