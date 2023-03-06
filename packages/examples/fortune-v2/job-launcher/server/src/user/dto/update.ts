import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { UserStatus } from "../../common/decorators";

import { UserCommonDto } from "../../common/dto";
import { IUserUpdateDto } from "../interfaces";

export class UpdateUserDto extends UserCommonDto implements IUserUpdateDto {
  @ApiPropertyOptional({
    enum: UserStatus,
  })
  @IsEnum(UserStatus)
  public status: UserStatus;
}
