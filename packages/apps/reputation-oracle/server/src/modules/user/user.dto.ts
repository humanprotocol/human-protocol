import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsOptional, IsString } from 'class-validator';

import { SignatureType } from '../../common/enums';
import {
  IsLowercasedEnum,
  IsValidWeb3Signature,
} from '../../common/validators';

export class RegisterLabelerResponseDto {
  @ApiProperty({ name: 'site_key' })
  siteKey: string;
}

export class RegisterAddressRequestDto {
  @ApiProperty()
  @IsEthereumAddress()
  address: string;

  @ApiProperty()
  @IsValidWeb3Signature()
  signature: string;
}

export class EnableOperatorDto {
  @ApiProperty()
  @IsValidWeb3Signature()
  signature: string;
}

export class DisableOperatorDto {
  @ApiProperty()
  @IsValidWeb3Signature()
  signature: string;
}

export class SignatureBodyDto {
  @ApiProperty()
  @IsEthereumAddress()
  from: string;

  @ApiProperty()
  @IsEthereumAddress()
  to: string;

  @ApiProperty()
  @IsString()
  contents: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  nonce?: string | undefined;
}

export class PrepareSignatureDto {
  @ApiProperty()
  @IsEthereumAddress()
  address: string;

  @ApiProperty({
    enum: SignatureType,
  })
  @IsLowercasedEnum(SignatureType)
  type: SignatureType;
}

export class RegistrationInExchangeOracleDto {
  @ApiProperty({
    name: 'oracle_address',
    description: 'Ethereum address of the oracle',
  })
  @IsEthereumAddress({
    message: 'oracle_address must be an Ethereum address',
  })
  oracleAddress: string;

  @ApiProperty({ name: 'h_captcha_token' })
  @IsString()
  hCaptchaToken: string;
}

export class RegistrationInExchangeOracleResponseDto {
  @ApiProperty({ name: 'oracle_address' })
  oracleAddress: string;
}

export class RegistrationInExchangeOraclesResponseDto {
  @ApiProperty({ name: 'oracle_addresses' })
  oracleAddresses: string[];
}
