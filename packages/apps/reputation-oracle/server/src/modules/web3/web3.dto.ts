import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsEthereumAddress, IsString } from 'class-validator';
import { SignatureType } from '../../common/enums/web3';

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
}

export class PrepareSignatureDto {
  @ApiProperty()
  @IsString()
  @IsEthereumAddress()
  public address: string;

  @ApiProperty({
    enum: SignatureType,
  })
  @IsEnum(SignatureType)
  public type: SignatureType;
}
