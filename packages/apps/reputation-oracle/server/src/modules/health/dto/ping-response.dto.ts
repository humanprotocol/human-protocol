import { ApiProperty } from '@nestjs/swagger';

export class PingResponseDto {
  @ApiProperty({ name: 'app_name' })
  appName: string;

  @ApiProperty({ name: 'node_env' })
  nodeEnv: string;

  @ApiProperty({ name: 'git_hash' })
  gitHash: string;
}
