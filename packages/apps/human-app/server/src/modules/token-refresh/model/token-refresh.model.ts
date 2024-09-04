import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { AutoMap } from '@automapper/classes';

export class TokenRefreshDto {
  @AutoMap()
  @ApiProperty({ example: 'string' })
  @IsString()
  refresh_token: string;
}

export class TokenRefreshCommand {
  @AutoMap()
  refreshToken: string;
}

export class TokenRefreshData {
  @AutoMap()
  refresh_token: string;
}

export class TokenRefreshResponse {
  refresh_token: string;
  access_token: string;
}
