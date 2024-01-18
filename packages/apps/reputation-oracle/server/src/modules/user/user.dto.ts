import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserStatus, UserType } from '../../common/enums/user';
import { ValidatePasswordDto } from '../auth/auth.dto';

export class UserCreateDto extends ValidatePasswordDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email: string;

  @ApiProperty({
    enum: UserType,
  })
  @IsEnum(UserType)
  public type: UserType;
}

export class UserDto extends UserCreateDto {
  public status: UserStatus;
}

export class Web3UserCreateDto {
  @ApiProperty({ name: 'evm_address' })
  @IsString()
  public evmAddress: string;

  @ApiProperty()
  @IsString()
  public nonce: string;

  @ApiProperty({
    enum: UserType,
  })
  @IsEnum(UserType)
  public type: UserType;
}

export class Web3UserDto extends Web3UserCreateDto {
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
  @IsEnum(UserStatus)
  public status?: UserStatus;
}
