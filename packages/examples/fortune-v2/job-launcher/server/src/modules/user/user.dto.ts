import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsString } from "class-validator";
import { Transform } from "class-transformer";

import { SearchDto } from "../../common/collection";
import { UserCommonDto } from "../../common/dto";
import { UserStatus, UserType } from "../../common/enums/user";
import { ValidatePasswordDto } from "../auth/auth.dto";

export class UserCreateDto extends ValidatePasswordDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email: string;
  public type: UserType;
  public status: UserStatus;
  public privateKey: string;
  public publicKey: string;
}


export class UserSearchDto extends SearchDto {}


export class UserUpdateDto extends UserCommonDto {
  @ApiPropertyOptional({
    enum: UserStatus,
  })
  @IsEnum(UserStatus)
  public status?: UserStatus;
}

export class UserUpdateTokenAddressDto {
  @ApiProperty()
  @IsString()
  public tokenAddress: string;

  public status?: UserStatus;

  public socketId?: string;
}
