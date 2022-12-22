import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";
import { Transform } from "class-transformer";
import { IResendEmailVerificationDto } from "../interfaces";

export class ResendEmailVerificationDto implements IResendEmailVerificationDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email: string;
}
