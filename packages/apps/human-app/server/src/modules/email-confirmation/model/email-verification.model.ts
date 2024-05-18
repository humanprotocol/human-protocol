import { AutoMap } from '@automapper/classes';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmailVerificationDto {
  @AutoMap()
  @IsString()
  @ApiProperty({ example: 'string' })
  token: string;
}

export class EmailVerificationCommand {
  @AutoMap()
  token: string;
}

export class EmailVerificationData {
  @AutoMap()
  token: string;
}
