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
  @AutoMap()
  @ApiProperty({example: 'string'})
  @IsString()
  h_captcha_token: string;
}

export class SignupWorkerCommand {
  @AutoMap()
  email: string;
  @AutoMap()
  password: string;
  @AutoMap()
  type: UserType;
  @AutoMap()
  hCaptchaToken: string;

  constructor(email: string, password: string, token: string) {
    this.email = email;
    this.password = password;
    this.type = UserType.WORKER;
    this.hCaptchaToken = token;
  }
}

export class SignupWorkerData {
  @AutoMap()
  email: string;
  @AutoMap()
  password: string;
  @AutoMap()
  type: string;
  @AutoMap()
  h_captcha_token: string;
}
