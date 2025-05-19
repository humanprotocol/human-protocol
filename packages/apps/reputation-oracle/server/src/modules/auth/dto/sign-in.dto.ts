import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEthereumAddress, IsOptional, IsString } from 'class-validator';

import {
  IsLowercasedEmail,
  IsValidWeb3Signature,
} from '../../../common/validators';

export class Web2SignInDto {
  @ApiProperty()
  @IsLowercasedEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiPropertyOptional({ name: 'h_captcha_token' })
  @IsOptional()
  @IsString()
  hCaptchaToken?: string;
}

export class Web3SignInDto {
  @ApiProperty()
  @IsEthereumAddress()
  address: string;

  @ApiProperty()
  @IsValidWeb3Signature()
  signature: string;
}

export class SuccessAuthDto {
  @ApiProperty({ name: 'access_token' })
  accessToken: string;

  @ApiProperty({ name: 'refresh_token' })
  refreshToken: string;
}

export class SuccessM2mAuthDto {
  @ApiProperty({ name: 'access_token' })
  accessToken: string;
}
