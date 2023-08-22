import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches } from 'class-validator';
import { IsConfirm, IsPassword } from '../../common/validators';
import { TokenType } from '../auth/token.entity';
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
}

export class ValidatePasswordDto {
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/, {
    message:
      'Password is not strong enough. Password must be at least eight characters long and contain 1 upper, 1 lowercase, 1 number and 1 special character.',
  })
  @ApiProperty()
  @IsPassword()
  public password: string;

  @ApiProperty()
  @IsConfirm()
  public confirm: string;
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
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  public token: string;
}

export class AuthDto {
  public refreshToken: string;
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
