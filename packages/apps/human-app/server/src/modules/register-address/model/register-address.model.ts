import { AutoMap } from '@automapper/classes';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterAddressDto {
  @AutoMap()
  @IsString()
  @ApiProperty({ example: 'string' })
  address: string;
  @AutoMap()
  @IsString()
  @ApiProperty({ example: 'string' })
  signature: string;
}
export class RegisterAddressCommand {
  @AutoMap()
  address: string;
  @AutoMap()
  signature: string;
  token: string;
}
export class RegisterAddressData {
  @AutoMap()
  address: string;
  @AutoMap()
  signature: string;
}
export class RegisterAddressResponse {
  signed_address: string;
}
