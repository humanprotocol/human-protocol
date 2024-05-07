import { AutoMap } from '@automapper/classes';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PrepareSignatureType } from '../../../common/enums/global-common.interface';

export class PrepareSignatureDto {
  @AutoMap()
  @IsString()
  @ApiProperty({ example: 'string' })
  address: string;
  @AutoMap()
  @IsString()
  @ApiProperty({ example: 'SIGNUP' })
  type: PrepareSignatureType;
}

export class PrepareSignatureCommand {
  @AutoMap()
  address: string;
  @AutoMap()
  type: PrepareSignatureType;
}

export class PrepareSignatureData {
  @AutoMap()
  address: string;
  @AutoMap()
  type: PrepareSignatureType;
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
