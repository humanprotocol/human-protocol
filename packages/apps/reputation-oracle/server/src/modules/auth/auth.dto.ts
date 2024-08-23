import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsEthereumAddress,
  IsString,
  IsUUID,
  IsOptional,
  MinLength,
} from 'class-validator';
import { TokenType } from '../auth/token.entity';
import { UserEntity } from '../user/user.entity';
import { Role } from '../../common/enums/user';

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email: string;

  @ApiProperty({ name: 'h_captcha_token' })
  @IsString()
  public hCaptchaToken: string;
}

export class SignInDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email: string;

  @ApiProperty()
  @IsString()
  public password: string;

  @ApiPropertyOptional({ name: 'h_captcha_token' })
  @IsOptional()
  @IsString()
  public hCaptchaToken?: string;
}

export class RefreshDto {
  @ApiProperty({ name: 'refresh_token' })
  @IsUUID()
  public refreshToken: string;
}

export class ValidatePasswordDto {
  @MinLength(8, {
    message: 'Password must be at least 8 characters long.',
  })
  @ApiProperty()
  public password: string;
}

export class ResendEmailVerificationDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email: string;

  @ApiProperty({ name: 'h_captcha_token' })
  @IsString()
  public hCaptchaToken: string;
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
  @IsString()
  public refreshToken: string;

  @ApiProperty({ name: 'access_token' })
  @IsString()
  public accessToken: string;
}

export class AuthCreateDto {
  public user: UserEntity;
  public refreshToken: string;
  public accessToken: string;
}

export class AuthUpdateDto {
  public refreshToken: string;
  public accessToken: string;
}

export class TokenCreateDto {
  public tokenType: TokenType;
  public user: UserEntity;
}

export class Web3SignUpDto {
  @ApiProperty()
  @IsString()
  public signature: string;

  @ApiProperty({
    enum: Role,
  })
  @IsEnum(Role)
  public type: Role;

  @ApiProperty()
  @IsString()
  @IsEthereumAddress()
  public address: string;
}

export class Web3SignInDto {
  @ApiProperty()
  @IsString()
  @IsEthereumAddress()
  public address: string;

  @ApiProperty()
  @IsString()
  public signature: string;
}
