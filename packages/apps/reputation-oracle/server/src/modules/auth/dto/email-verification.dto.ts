import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import { LowercasedEmail } from '../../../common/decorators';

export class ResendVerificationEmailDto {
  @ApiProperty()
  @LowercasedEmail()
  public email: string;

  @ApiProperty({ name: 'h_captcha_token' })
  @IsString()
  public hCaptchaToken: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsUUID()
  public token: string;
}
