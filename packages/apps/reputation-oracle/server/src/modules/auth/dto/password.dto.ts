import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

import { IsLowercasedEmail, IsValidPassword } from '@/common/validators';

export class ForgotPasswordDto {
  @ApiProperty()
  @IsLowercasedEmail()
  email: string;

  @ApiProperty({ name: 'h_captcha_token' })
  @IsString()
  hCaptchaToken: string;
}

export class RestorePasswordDto {
  @ApiProperty()
  @IsValidPassword()
  password: string;

  @ApiProperty()
  @IsUUID()
  token: string;

  @ApiProperty({ name: 'h_captcha_token' })
  @IsString()
  hCaptchaToken: string;
}
