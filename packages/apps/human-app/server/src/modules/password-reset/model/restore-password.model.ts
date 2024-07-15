import { AutoMap } from '@automapper/classes';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RestorePasswordDto {
  @AutoMap()
  @IsString()
  @ApiProperty({ example: 'string' })
  password: string;
  @AutoMap()
  @IsString()
  @ApiProperty({ example: 'string' })
  token: string;
  @AutoMap()
  @IsString()
  @ApiProperty({ example: 'string' })
  h_captcha_token: string;
}

export class RestorePasswordCommand {
  @AutoMap()
  password: string;
  @AutoMap()
  token: string;
  @AutoMap()
  hCaptchaToken: string;
}

export class RestorePasswordData {
  @AutoMap()
  password: string;
  @AutoMap()
  token: string;
  @AutoMap()
  hCaptchaToken: string;
}
