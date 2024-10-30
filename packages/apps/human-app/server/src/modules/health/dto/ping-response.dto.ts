import { ApiProperty } from '@nestjs/swagger';

export class PingResponseDto {
  @ApiProperty()
  public appName: string;

  @ApiProperty()
  public gitHash: string;
}
