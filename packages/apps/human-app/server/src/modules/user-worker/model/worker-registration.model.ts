import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEthereumAddress, IsString } from 'class-validator';
import { AutoMap } from '@automapper/classes';

export class SignupWorkerDto {
  @AutoMap()
  @ApiProperty({ example: 'string' })
  @IsEmail()
  email: string;

  @AutoMap()
  @ApiProperty({ example: 'string' })
  @IsString()
  password: string;
  @AutoMap()
  @ApiProperty({ example: 'string' })
  @IsString()
  h_captcha_token: string;
}

export class SignupWorkerCommand {
  @AutoMap()
  email: string;
  @AutoMap()
  password: string;
  @AutoMap()
  hCaptchaToken: string;

  constructor(email: string, password: string, token: string) {
    this.email = email;
    this.password = password;
    this.hCaptchaToken = token;
  }
}

export class SignupWorkerData {
  @AutoMap()
  email: string;
  @AutoMap()
  password: string;
  @AutoMap()
  h_captcha_token: string;
}

export class RegisterWorkerDto {
  @AutoMap()
  @ApiProperty({ example: 'string' })
  @IsEthereumAddress()
  oracle_address: string;
}

export class RegisterWorkerCommand {
  @AutoMap()
  oracleAddress: string;

  token: string;

  constructor(oracleAddress: string) {
    this.oracleAddress = oracleAddress;
  }
}

export class RegisterWorkerData {
  @AutoMap()
  oracle_address: string;
}

export class RegisterWorkerResponse {
  email: string;
  wallet_address: string;
}
