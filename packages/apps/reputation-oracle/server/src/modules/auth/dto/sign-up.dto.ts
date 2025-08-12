import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsString } from 'class-validator';

import {
  IsLowercasedEmail,
  IsLowercasedEnum,
  IsValidWeb3Signature,
} from '@/common/validators';
import { UserRole } from '@/modules/user';

import { ValidPassword } from './password.dto';

export class Web2SignUpDto {
  @ApiProperty()
  @IsLowercasedEmail()
  email: string;

  @ApiProperty()
  @ValidPassword()
  password: string;

  @ApiProperty({ name: 'h_captcha_token' })
  @IsString()
  hCaptchaToken: string;
}

export class Web3SignUpDto {
  @ApiProperty()
  @IsValidWeb3Signature()
  signature: string;

  @ApiProperty({
    enum: UserRole,
  })
  @IsLowercasedEnum(UserRole)
  type: UserRole;

  @ApiProperty()
  @IsEthereumAddress()
  address: string;
}
