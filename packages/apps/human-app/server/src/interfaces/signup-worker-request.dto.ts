import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { AutoMap } from '@automapper/classes';

export class SignupWorkerDto {
  @AutoMap()
  @ApiProperty({ example: 'string' })
  @IsEmail()
  email: string;

  @AutoMap()
  @ApiProperty({ example: 'string' })
  @IsString()
  password: string;
}
