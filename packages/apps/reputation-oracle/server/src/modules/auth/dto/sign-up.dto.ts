import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsString } from 'class-validator';
import { ValidPassword } from './password.dto';
import {
  IsLowercasedEmail,
  IsLowercasedEnum,
  IsValidWeb3Signature,
} from '../../../common/validators';
import { Role } from '../../../common/enums/user';

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
    enum: Role,
  })
  @IsLowercasedEnum(Role)
  public type: Role;

  @ApiProperty()
  @IsEthereumAddress()
  public address: string;
}
