import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserStatus, UserType } from '../../common/enums/user';
import { ValidatePasswordDto } from '../auth/auth.dto';
import { ChainId } from '@human-protocol/sdk';

export class UserCreateDto extends ValidatePasswordDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email: string;

  @ApiProperty({ name: 'h_captcha_token' })
  @IsString()
  public hCaptchaToken: string;
}

export class UserDto extends UserCreateDto {
  public type: UserType;
  public status: UserStatus;
}

export class Web3UserCreateDto {
  @ApiProperty({ name: 'evm_address' })
  @IsString()
  public evmAddress: string;

  @ApiProperty()
  @IsString()
  public nonce: string;
}

export class Web3UserDto extends Web3UserCreateDto {
  public type: UserType;
  public status: UserStatus;
}

export class UserUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email?: string;

  @ApiPropertyOptional({
    enum: UserStatus,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  public status?: UserStatus;
}

export class RegisterAddressRequestDto {
  @ApiProperty({ name: 'chain_id' })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsString()
  public address: string;
}

export class RegisterAddressResponseDto {
  @ApiProperty({ name: 'signed_address' })
  @IsString()
  public signedAddress: string;
}

export class DisableOperatorDto {
  @ApiProperty()
  @IsString()
  public signature: string;
}
