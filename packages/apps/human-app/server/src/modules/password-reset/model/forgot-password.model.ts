import { AutoMap } from '@automapper/classes';
import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @AutoMap()
  @IsEmail()
  @ApiProperty({ example: 'string' })
  email: string;
}

export class ForgotPasswordCommand {
  @AutoMap()
  email: string;
}

export class ForgotPasswordData {
  @AutoMap()
  email: string;
}
