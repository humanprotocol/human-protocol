import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

import { SearchDto } from '../../common/collection';
import { UserStatus, UserType } from '../../common/enums/user';
import { ValidatePasswordDto } from '../auth/auth.dto';
import { v4 } from 'uuid';
import { IUser } from '../../common/decorators';

export class UserCreateDto extends ValidatePasswordDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email: string;
  public type: UserType;
  public status: UserStatus;
}

export class UserSearchDto extends SearchDto {}

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
