import { AutoMap } from '@automapper/classes';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnableOperatorDto {
  @AutoMap()
  @IsString()
  @ApiProperty({ example: 'string' })
  signature: string;
}

export class EnableOperatorParams {
  @AutoMap()
  signature: string;
}
export class EnableOperatorCommand {
  @AutoMap()
  data: EnableOperatorParams;
  token: string;
}

export class EnableOperatorData {
  @AutoMap()
  signature: string;
}
