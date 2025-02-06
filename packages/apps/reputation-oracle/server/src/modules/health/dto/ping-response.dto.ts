import { ApiProperty } from '@nestjs/swagger';

export class PingResponseDto {
  @ApiProperty({ name: 'app_name' })
  public appName: string;

  @ApiProperty({ name: 'git_hash' })
  public gitHash: string;
}
