import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEthereumAddress, IsOptional, IsString } from 'class-validator';
import {
  IsLowercasedEmail,
  IsValidWeb3Signature,
} from '../../../common/validators';

export class Web2SignInDto {
  @ApiProperty()
  @IsLowercasedEmail()
  public email: string;

  @ApiProperty()
  @IsString()
  public password: string;

  @ApiPropertyOptional({ name: 'h_captcha_token' })
  @IsOptional()
  @IsString()
  public hCaptchaToken?: string;
}

export class Web3SignInDto {
  @ApiProperty()
  @IsEthereumAddress()
  public address: string;

  @ApiProperty()
  @IsValidWeb3Signature()
  public signature: string;
}

export class SuccessAuthDto {
  @ApiProperty({ name: 'access_token' })
  @IsString()
  public accessToken: string;

  @ApiProperty({ name: 'refresh_token' })
  @IsString()
  public refreshToken: string;
}
