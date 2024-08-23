import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  IsUUID,
  IsOptional,
  MinLength,
} from 'class-validator';

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
  @IsOptional()
  public hCaptchaToken?: string;
}

export class RefreshDto {
  @ApiProperty({ name: 'refresh_token' })
  @IsUUID()
  public refreshToken: string;
}

export class ValidatePasswordDto {
  @ApiProperty()
  @MinLength(8, {
    message: 'Password must be at least 8 characters long.',
  })
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
  @IsUUID()
  public token: string;

  @ApiProperty({ name: 'h_captcha_token' })
  @IsString()
  public hCaptchaToken: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsUUID()
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
