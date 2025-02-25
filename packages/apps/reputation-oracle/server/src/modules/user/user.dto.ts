import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsOptional, IsString } from 'class-validator';
import { SignatureType } from '../../common/enums/web3';
import { IsLowercasedEnum } from '../../common/validators';

export class RegisterLabelerResponseDto {
  @ApiProperty({ name: 'site_key' })
  @IsString()
  public siteKey: string;
}

export class RegisterAddressRequestDto {
  @ApiProperty()
  @IsString()
  public address: string;

  @ApiProperty()
  @IsString()
  public signature: string;
}

export class EnableOperatorDto {
  @ApiProperty()
  @IsString()
  public signature: string;
}

export class DisableOperatorDto {
  @ApiProperty()
  @IsString()
  public signature: string;
}

export class SignatureBodyDto {
  @ApiProperty()
  @IsString()
  @IsEthereumAddress()
  public from: string;

  @ApiProperty()
  @IsString()
  @IsEthereumAddress()
  public to: string;

  @ApiProperty()
  @IsString()
  public contents: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  public nonce?: string | undefined;
}

export class PrepareSignatureDto {
  @ApiProperty()
  @IsString()
  @IsEthereumAddress()
  public address: string;

  @ApiProperty({
    enum: SignatureType,
  })
  @IsLowercasedEnum(SignatureType)
  public type: SignatureType;
}

export class RegistrationInExchangeOracleDto {
  @ApiProperty({
    name: 'oracle_address',
    description: 'Ethereum address of the oracle',
  })
  @IsEthereumAddress()
  public oracleAddress: string;

  @ApiProperty({ name: 'h_captcha_token' })
  @IsString()
  public hCaptchaToken: string;
}

export class RegistrationInExchangeOracleResponseDto {
  @ApiProperty({ name: 'oracle_address' })
  public oracleAddress: string;
}

export class RegistrationInExchangeOraclesDto {
  @ApiProperty({ name: 'oracle_addresses' })
  public oracleAddresses: string[];
}
