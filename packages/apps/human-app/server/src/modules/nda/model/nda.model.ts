import { AutoMap } from '@automapper/classes';
import { IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetNDACommand {
  token: string;
}

export class GetNDAResponse {
  url: string;
}

export class SignNDADto {
  @AutoMap()
  @IsUrl()
  @IsString()
  @ApiProperty({ example: 'string' })
  url: string;
}

export class SignNDACommand {
  @AutoMap()
  url: string;
  token: string;
}

export class SignNDAData {
  @AutoMap()
  url: string;
}

export class SignNDAResponse {
  message: string;
}
