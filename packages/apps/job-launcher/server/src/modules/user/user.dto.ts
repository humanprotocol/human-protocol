import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserStatus, UserType } from '../../common/enums/user';
import { ValidatePasswordDto } from '../auth/auth.dto';
import { Currency } from '../../common/enums/payment';
import { IsEnumCaseInsensitive } from '../../common/utils/enums';

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

export class UserUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email?: string;

  @ApiPropertyOptional({
    enum: UserStatus,
  })
  @IsEnumCaseInsensitive(UserStatus)
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
