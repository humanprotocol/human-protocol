import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsString } from 'class-validator';

import { UserRole } from '@/common/enums';
import {
  IsLowercasedEmail,
  IsLowercasedEnum,
  IsValidPassword,
  IsValidWeb3Signature,
} from '@/common/validators';

export class Web2SignUpDto {
  @ApiProperty()
  @IsLowercasedEmail()
  email: string;

  @ApiProperty()
  @IsValidPassword()
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
