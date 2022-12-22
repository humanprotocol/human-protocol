import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";
import { Transform } from "class-transformer";
import { IForgotPasswordDto } from "../interfaces";

export class ForgotPasswordDto implements IForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email: string;
}
