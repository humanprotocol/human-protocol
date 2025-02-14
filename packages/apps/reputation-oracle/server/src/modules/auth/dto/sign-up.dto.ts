import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsString } from 'class-validator';
import {
  IsEnumCaseInsensitive,
  IsValidWeb3Signature,
  LowercasedEmail,
} from '../../../common/decorators';
import { Role } from '../../../common/enums/user';
import { ValidPassword } from './password.dto';

export class Web2SignUpDto {
  @ApiProperty()
  @LowercasedEmail()
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
    enum: Role,
  })
  @IsEnumCaseInsensitive(Role)
  public type: Role;

  @ApiProperty()
  @IsEthereumAddress()
  public address: string;
}
