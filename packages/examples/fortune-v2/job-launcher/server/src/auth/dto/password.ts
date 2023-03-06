import { ApiProperty } from "@nestjs/swagger";
import { IValidatePasswordDto } from "../interfaces";
import { IsConfirm, IsPassword } from "../../common/validators";
import { Matches } from "class-validator";

export class ValidatePasswordDto implements IValidatePasswordDto {
  @Matches (/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/, {
    message:
      'Password is not strong enough. Password must be at least eight characters long and contain 1 upper, 1 lowercase, 1 number and 1 special character.',
  })
  @ApiProperty()
  @IsPassword()
  public password: string;

  @ApiProperty()
  @IsConfirm()
  public confirm: string;
}
