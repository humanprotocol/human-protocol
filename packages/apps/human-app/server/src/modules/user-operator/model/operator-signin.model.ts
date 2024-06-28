import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';

export class SigninOperatorDto {
  @AutoMap()
  @ApiProperty({ example: 'string' })
  address: string;
  @AutoMap()
  @ApiProperty({ example: 'string' })
  signature: string;
}
export class SigninOperatorCommand {
  @AutoMap()
  address: string;
  @AutoMap()
  signature: string;
}

export class SigninOperatorData {
  @AutoMap()
  address: string;
  @AutoMap()
  signature: string;
}

export class SigninOperatorResponse {
  refresh_token: string;
  access_token: string;
}
