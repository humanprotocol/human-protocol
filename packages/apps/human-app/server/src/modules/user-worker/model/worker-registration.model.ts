import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { AutoMap } from '@automapper/classes';

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
  @ApiProperty({ example: 'string' })
  @IsString()
  h_captcha_token: string;
}

export class SignupWorkerCommand {
  @AutoMap()
  email: string;
  @AutoMap()
  password: string;
  @AutoMap()
  hCaptchaToken: string;

  constructor(email: string, password: string, token: string) {
    this.email = email;
    this.password = password;
    this.hCaptchaToken = token;
  }
}

export class SignupWorkerData {
  @AutoMap()
  email: string;
  @AutoMap()
  password: string;
  @AutoMap()
  h_captcha_token: string;
}
