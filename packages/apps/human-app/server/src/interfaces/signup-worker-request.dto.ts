import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export enum WorkerType {
  WORKER = 'WORKER',
}

export class SignupWorkerDto {
  @ApiProperty({ example: 'string' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'string' })
  @IsString()
  password: string;

  @ApiHideProperty()
  type: WorkerType = WorkerType.WORKER;
}
