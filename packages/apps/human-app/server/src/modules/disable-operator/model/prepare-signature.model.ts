import { AutoMap } from '@automapper/classes';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PrepareSignatureDto {
  @AutoMap()
  @IsString()
  @ApiProperty({ example: 'string' })
  address: string;
  @AutoMap()
  @IsString()
  @ApiProperty({ example: 'SIGNUP' })
  type: string;
}

export class PrepareSignatureCommand {
  @AutoMap()
  address: string;
  @AutoMap()
  type: string;
}

export class PrepareSignatureData {
  @AutoMap()
  address: string;
  @AutoMap()
  type: string;
}

export class PrepareSignatureResponse {
  @IsString()
  @ApiProperty({ example: 'string' })
  from: string;
  @IsString()
  @ApiProperty({ example: 'string' })
  to: string;
  @IsString()
  @ApiProperty({ example: 'string' })
  contents: string;
}
