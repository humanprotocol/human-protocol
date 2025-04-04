import { AutoMap } from '@automapper/classes';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DisableOperatorDto {
  @AutoMap()
  @IsString()
  @ApiProperty({ example: 'string' })
  signature: string;
}

export class DisableOperatorParams {
  @AutoMap()
  signature: string;
}
export class DisableOperatorCommand {
  @AutoMap()
  data: DisableOperatorParams;
  token: string;
}

export class DisableOperatorData {
  @AutoMap()
  signature: string;
}
