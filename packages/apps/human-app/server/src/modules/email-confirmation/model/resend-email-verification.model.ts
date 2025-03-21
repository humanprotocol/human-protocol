import { AutoMap } from '@automapper/classes';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendEmailVerificationDto {
  @AutoMap()
  @IsString()
  @ApiProperty({ example: 'string' })
  h_captcha_token: string;
}

export class ResendEmailVerificationParams {
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
  h_captcha_token: string;
}
