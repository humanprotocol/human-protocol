import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

import { IsLowercasedEmail } from '@/common/validators';

export function ValidPassword() {
  return applyDecorators(
    IsString(),
    MinLength(8, {
      message: 'Password must be at least 8 characters long.',
    }),
  );
}

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
  @ValidPassword()
  password: string;

  @ApiProperty()
  @IsUUID()
  token: string;

  @ApiProperty({ name: 'h_captcha_token' })
  @IsString()
  hCaptchaToken: string;
}
