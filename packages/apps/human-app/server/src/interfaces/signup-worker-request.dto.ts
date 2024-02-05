import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'string' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'string' })
  @IsString()
  password: string;
}
