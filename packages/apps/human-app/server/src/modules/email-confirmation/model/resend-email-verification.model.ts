import { AutoMap } from '@automapper/classes';
import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendEmailVerificationDto {
  @AutoMap()
  @IsEmail()
  @ApiProperty({ example: 'string' })
  email: string;
  @AutoMap()
  @IsString()
  @ApiProperty({ example: 'string' })
  h_captcha_token: string;
}

export class ResendEmailVerificationParams {
  @AutoMap()
  email: string;
  @AutoMap()
  hCaptchaToken: string;
}
export class ResendEmailVerificationCommand {
  @AutoMap()
  data: ResendEmailVerificationParams;
  token: string;
}

export class ResendEmailVerificationData {
  @AutoMap()
  email: string;
  @AutoMap()
  h_captcha_token: string;
}
