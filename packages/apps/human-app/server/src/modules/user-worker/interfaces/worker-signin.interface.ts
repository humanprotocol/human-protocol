import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { AutoMap } from '@automapper/classes';

export class SigninWorkerDto {
  @AutoMap()
  @ApiProperty({ example: 'string' })
  @IsEmail()
  email: string;

  @AutoMap()
  @ApiProperty({ example: 'string' })
  @IsString()
  password: string;
}

export class SigninWorkerCommand {
  @AutoMap()
  email: string;
  @AutoMap()
  password: string;
}

export class SigninWorkerData {
  @AutoMap()
  email: string;
  @AutoMap()
  password: string;
}

export class SigninWorkerResponse {
  refresh_token: string;
  access_token: string;
}
