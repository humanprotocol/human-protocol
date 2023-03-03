import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";

export interface IUserCommonDto {
  email?: string;
  username?: string;
}

export class UserCommonDto implements IUserCommonDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public username?: string;
}
