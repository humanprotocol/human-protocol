import { AutoMap } from '@automapper/classes';
import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendEmailVerificationDto {
  @AutoMap()
  @IsEmail()
  @ApiProperty({ example: 'string' })
  email: string;
}

export class ResendEmailVerificationParams {
  @AutoMap()
  email: string;
}
export class ResendEmailVerificationCommand {
  @AutoMap()
  data: ResendEmailVerificationParams;
  @AutoMap()
  token: string;
}

export class ResendEmailVerificationData {
  @AutoMap()
  email: string;
}
