import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

import { IUserUpdateDto } from "../interfaces";

export class UserUpdateTokenAddressDto implements IUserUpdateDto {
  @ApiProperty()
  @IsString()
  public tokenAddress: string;
}
