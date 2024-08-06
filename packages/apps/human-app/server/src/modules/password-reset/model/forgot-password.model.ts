import { AutoMap } from '@automapper/classes';
import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @AutoMap()
  @IsEmail()
  @ApiProperty({ example: 'string' })
  email: string;
  @AutoMap()
  @IsString()
  @ApiProperty({ example: 'string' })
  h_captcha_token: string;
}

export class ForgotPasswordCommand {
  @AutoMap()
  email: string;
  @AutoMap()
  hCaptchaToken: string;
}

export class ForgotPasswordData {
  @AutoMap()
  email: string;
  @AutoMap()
  h_captcha_token: string;
}
