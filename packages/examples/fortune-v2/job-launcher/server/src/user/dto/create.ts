import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";
import { Transform } from "class-transformer";

import { ValidatePasswordDto } from "../../auth/dto";
import { IUserCreateDto } from "../interfaces";

export class UserCreateDto extends ValidatePasswordDto implements IUserCreateDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email: string;
}
