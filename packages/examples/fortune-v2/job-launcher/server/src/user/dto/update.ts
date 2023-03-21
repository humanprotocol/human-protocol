import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

import { UserCommonDto } from "../../common/dto";
import { UserStatus } from "../../common/enums/user";
import { IUserUpdateDto } from "../interfaces";

export class UpdateUserDto extends UserCommonDto implements IUserUpdateDto {
  @ApiPropertyOptional({
    enum: UserStatus,
  })
  @IsEnum(UserStatus)
  public status: UserStatus;
}
