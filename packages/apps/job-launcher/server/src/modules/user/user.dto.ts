import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserStatus, UserType } from '../../common/enums/user';
import { ValidatePasswordDto } from '../auth/auth.dto';
import { Currency } from '../../common/enums/payment';

export class UserCreateDto extends ValidatePasswordDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email: string;
}

export class UserDto extends UserCreateDto {
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
  @IsEnum(UserStatus)
  public status?: UserStatus;
}

export class UserBalanceDto {
  @ApiProperty({ description: 'Amount of the user balance', type: Number })
  amount: number;

  @ApiProperty({
    description: 'Currency of the user balance',
    enum: Currency,
  })
  currency: Currency;
}
