import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsString } from 'class-validator';

import {
  IsLowercasedEmail,
  IsLowercasedEnum,
  IsValidWeb3Signature,
} from '../../../common/validators';
import { UserRole } from '../../user';
import { ValidPassword } from './password.dto';

export class Web2SignUpDto {
  @ApiProperty()
  @IsLowercasedEmail()
  public email: string;

  @ApiProperty()
  @ValidPassword()
  public password: string;

  @ApiProperty({ name: 'h_captcha_token' })
  @IsString()
  public hCaptchaToken: string;
}

export class Web3SignUpDto {
  @ApiProperty()
  @IsValidWeb3Signature()
  public signature: string;

  @ApiProperty({
    enum: UserRole,
  })
  @IsLowercasedEnum(UserRole)
  public type: UserRole;

  @ApiProperty()
  @IsEthereumAddress()
  public address: string;
}
