import { UserType } from '../../../common/enums/user';
import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SignupOperatorDto {
  @AutoMap()
  @ApiProperty({ example: 'string' })
  @IsString()
  address: string;
  @AutoMap()
  @ApiProperty({ example: 'string' })
  @IsString()
  signature: string;
}

export class SignupOperatorCommand {
  @AutoMap()
  address: string;
  @AutoMap()
  signature: string;
  @AutoMap()
  type: UserType;

  constructor(address: string, signature: string) {
    this.address = address;
    this.signature = signature;
    this.type = UserType.OPERATOR;
  }
}

export class SignupOperatorData {
  @AutoMap()
  address: string;
  @AutoMap()
  signature: string;
  @AutoMap()
  type: string;
}
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
