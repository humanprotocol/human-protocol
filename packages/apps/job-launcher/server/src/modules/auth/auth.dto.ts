import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';
import { IsPassword } from '../../common/validators';
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

export class ApiKeyDto {
  @ApiProperty({ name: 'api_key' })
  @IsString()
  public apiKey: string;
}
