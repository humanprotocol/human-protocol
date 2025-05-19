import { ApiProperty } from '@nestjs/swagger';

export class PingResponseDto {
  @ApiProperty({ name: 'node_env' })
  nodeEnv: string;

  @ApiProperty({ name: 'git_hash' })
  gitHash: string;
}
