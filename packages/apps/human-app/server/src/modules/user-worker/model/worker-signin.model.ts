import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { AutoMap } from '@automapper/classes';

export class SigninWorkerDto {
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

export class SigninWorkerCommand {
  @AutoMap()
  email: string;
  @AutoMap()
  password: string;
  @AutoMap()
  hCaptchaToken: string;
}

export class SigninWorkerData {
  @AutoMap()
  email: string;
  @AutoMap()
  password: string;
  @AutoMap()
  h_captcha_token: string;
}

export class SigninWorkerResponse {
  refresh_token: string;
  access_token: string;
}
