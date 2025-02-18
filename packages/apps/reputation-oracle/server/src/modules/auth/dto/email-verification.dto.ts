import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import { IsLowercasedEmail } from '../../../common/validators';

export class ResendVerificationEmailDto {
  @ApiProperty()
  @IsLowercasedEmail()
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
