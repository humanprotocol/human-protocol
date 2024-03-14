import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, IsUUID } from 'class-validator';
import { IsPassword } from '../../common/validators';
import { UserEntity } from '../user/user.entity';

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email: string;
}

export class SignInDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email: string;

  @ApiProperty()
  @IsString()
  public password: string;

  @ApiProperty({ name: 'h_captcha_token' })
  @IsString()
  public hCaptchaToken: string;
}

export class RefreshDto {
  @ApiProperty({ name: 'refresh_token' })
  @IsUUID()
  public refreshToken: string;
}

export class ValidatePasswordDto {
  @ApiProperty()
  @IsPassword()
  public password: string;
}

export class ResendEmailVerificationDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email: string;
}

export class RestorePasswordDto extends ValidatePasswordDto {
  @ApiProperty()
  @IsString()
  public token: string;

  @ApiProperty({ name: 'h_captcha_token' })
  @IsString()
  public hCaptchaToken: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  public token: string;
}

export class AuthDto {
  @ApiProperty({ name: 'refresh_token' })
  public refreshToken: string;
  @ApiProperty({ name: 'access_token' })
  public accessToken: string;
}

export class ApiKeyDto {
  @ApiProperty({ name: 'api_key' })
  @IsString()
  public apiKey: string;
}
