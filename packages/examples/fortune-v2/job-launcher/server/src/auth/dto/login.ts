import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsEmail } from "class-validator";
import { Transform } from "class-transformer";
import { ISignInDto } from "../interfaces";

export class SignInDto implements ISignInDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email: string;

  @ApiProperty()
  @IsString()
  public password: string;
}
