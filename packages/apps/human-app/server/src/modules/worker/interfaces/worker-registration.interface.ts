import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { AutoMap } from '@automapper/classes';
import { UserType } from '../../../common/enums/user';

export class SignupWorkerDto {
  @AutoMap()
  @ApiProperty({ example: 'string' })
  @IsEmail()
  email: string;

  @AutoMap()
  @ApiProperty({ example: 'string' })
  @IsString()
  password: string;
}

export class SignupWorkerCommand {
  @AutoMap()
  email: string;
  @AutoMap()
  password: string;
  @AutoMap()
  type: UserType;

  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
    this.type = UserType.WORKER;
  }
}

export class SignupWorkerData {
  @AutoMap()
  email: string;
  @AutoMap()
  password: string;
  @AutoMap()
  type: string;
}
